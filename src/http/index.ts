import express, {Request as ExpressRequest, Response as ExpressResponse, NextFunction } from "express";
import passport from "passport";
import session from "cookie-session";
import { Server } from "http";
import fs from "fs-extra";
import path from "path";
import bodyParser from "body-parser";
import OAuthError from "oauth2-server/lib/errors/oauth-error";
import { isMatch } from "micromatch";
import Raven from "raven";
import csurf from "csurf";

import configurePassport from "../passport-auth";
import { Logger, Security, breadcrumber } from "../util";
import { RestError } from "./util";
import { Config } from "../Config";
import { ERROR_CODES, DEBUG } from "../Constants";
import { Player } from "../database/entities/Player";

const cors = require("cors")({
    origin: function (origin, callback) {
        // This check has to be first, because `isMatch` expects a string
        if (!origin) return callback(null, true);
        if (Config.corsDomains.includes("*") || Config.corsDomains.some(permittedOrigin => isMatch(origin, permittedOrigin))) return callback(null, true);
        callback(new RestError(ERROR_CODES.UNAUTHORIZED, undefined, undefined, {cors: true}));
    },
    credentials: true,
    exposedHeaders: ["X-Use-CSRF-Token"]
});

/**
 * Validates a raw route object
 * @param route the route to validate
 */
const isRoute = (route: any): route is Route => {
    return typeof route === "object"
        && typeof route.opts === "object"
        && typeof route.opts.path === "string"
        && typeof route.opts.method === "string"
        && (
            route.opts.method === "get"
            || route.opts.method === "post"
            || route.opts.method === "options"
            || route.opts.method === "patch"
            || route.opts.method === "put"
            || route.opts.method === "delete"
            || route.opts.method === "use"
            || route.opts.method === "all"
        )
        && typeof route.handler === "function";
};

const isRoutes = (routes: any): routes is Routes => {
    return typeof routes === "object"
        && (typeof routes.opts === "undefined" || typeof routes.opts === "object")
        && (routes.opts ? (typeof routes.opts.guards === "undefined" || (typeof routes.opts.guards === "object" && Array.isArray(routes.opts.guards))) : true)
        && typeof routes.routes === "object"
        && Array.isArray(routes.routes);
}

const trail = breadcrumber("http");

export class HttpServer {

    private server: express.Express;
    private httpServer: Server;

    public constructor(port: number) {
        this.server = express();

        this.loadServer().then(() => {
            this.httpServer = this.server.listen(port);
        });
    }

    /**
     * Adds middleware to routers and adds routers to the main server
     */
    private async loadServer(): Promise<void> {
        // Prints the request information to Winston
        this.server.use((req, _, next) => {
            (req as any).data = {};
            Logger.debug(req.url, "http", "req", req.method);
            trail("debug", `${req.method} ${req.url}`);
            next();
        });

        // For the API, JSON body.
        this.server.use(cors);
        this.server.options("*", cors);
        this.server.use(bodyParser.text({
            type: "application/pkcs7-signature"
        }));
        this.server.use(bodyParser.json({
            verify: (req, res, buffer, encoding) => req["rawBody"] = buffer.toString(encoding)
        }));
        this.server.use(bodyParser.urlencoded({
            extended: false
        }));

        // Add cookie parsing
        const COOKIE_SECRET = process.env.COOKIE_SECRET || await Security.random(32);
        this.server.use(require('cookie-parser')(COOKIE_SECRET));
        
        this.server.use(session({
            name: "session",
            secret: COOKIE_SECRET
        }));
        
        this.server.use(passport.initialize());
        this.server.use(passport.session());
        configurePassport(passport);
        this.server.use(async (req, res, next) => {
            if (req.user && req.user.deactivated) await req.user.reactivate();
            next();
        });

        // Configure session length
        this.server.use((req, res, next) => {
            req.sessionOptions.maxAge = req.session.maxAge || req.sessionOptions.maxAge;
            if (req.session.maxAge) req.session.random = Math.random() * 1000; // Force new cookie
            next();
        });

        const API_DIR = path.join(__dirname, "..", "api");
        if (!(await fs.pathExists(API_DIR))) {
            await fs.mkdir(API_DIR);
        }

        await this.loadDirectory(API_DIR);

        // Expose the frontend
        this.server.use(express.static(path.join(__dirname, "..", "public"), {
            etag: !DEBUG,
            setHeaders: DEBUG ? function (res, path) {
                function unsetCacheHeaders(this: any) {
                    this.removeHeader('Etag')
                    this.removeHeader('Last-Modified')
                }
                // no etag or last-modified for index.html files
                if (path.substr(10) === 'index.html') {
                    require("on-headers")(res, unsetCacheHeaders)
                }
            } : undefined
        }));

        const index = await fs.readFile(path.join(__dirname, "..", "public", "index.html"));
        // All other requets are sent to the SPA
        this.server.use(async (req, res, next) => {
            if (!DEBUG) {
                res.contentType('html').send(index);
            } else {
                res.contentType('html').send(await fs.readFile(path.join(__dirname, "..", "public", "index.html")));
            }
        });

        await this.load();

        // used for error reporting
        this.server.use(async (err: any, req: express.Request, res: any, next: any) => {
            const transmit = (error: RestError<any>) => res.status(typeof error.statusCode === "number" ? error.statusCode : 400).json({error: error.body});
            if (err instanceof RestError) {
                transmit(err);
                return;
            }

            if (err instanceof OAuthError && err.name != "server_error") {
                const redirectURI = req.query.redirect_uri || req.body.redirect_uri
                if (redirectURI) return res.redirect(`${redirectURI}?error=${err.name}&error_description=${err.message}`);
                else return res.status(err.code).json({ error: { message: err.message, code: err.name }});
            }

            const tracking = await Security.random(16);
            Raven.captureException(err, { extra: {
                request: req,
                user: req.user,
                tracking_ref: tracking
            }});
            transmit(RestError.INTERNAL_ERROR(tracking));
            Logger.error(`------- error reported`);
            Logger.error(`tracking ref: ${tracking}`);
            Logger.error(err);
            Logger.error(`------- eof`);
        });
    }

    /** A load function you can implement if you want to */
    protected async load(): Promise<void> {

    }

    /**
     * Takes in route classes and parses them. They are injected directly into Express namespace.
     * @param route the route to load
     */
    private loadRoute(route: Route | Routes): void {
        if (isRoutes(route)) {
            const globalGuards = route.opts && route.opts.guards || [];
            for (let i = 0; i < route.routes.length; i++) {
                const subroute = route.routes[i];
                // help me
                ((subroute.opts && subroute.opts.guards) || (subroute.opts ? subroute.opts.guards = [] : ((subroute.opts = {}) && (subroute.opts.guards = [])))).unshift(...globalGuards);
                this.loadRoute(subroute);
            }
            return;
        }
        if (!isRoute(route)) {
            Logger.warn("Not loading an invalid route in express");
            return;
        }
        Logger.debug(`[EXPRESS ROUTE] [${route.opts.method.toUpperCase()}] PATH: "${route.opts.path}"`);
        // Determine whether this route is for the api or for the public
        var middleware: any[] = (route.opts.guards || []);
        // Setup CSRF protection
        if (!route.opts.bypassesCSRF && !DEBUG) {
            middleware.push((req, res, next) => {
                if ((req as any).usedOAuth === true) return next();
                csurf()(req, res, next);
            });
            middleware.push((req, res, next) => {
                if (req.csrfToken) res.append("X-Use-CSRF-Token", req.csrfToken());
                next();
            });
            middleware.push((err, req, res, next) => {
                if (process.env.NODE_ENV !== 'production') {
                    next(err);
                    return;
                }
                if (err.code !== 'EBADCSRFTOKEN') return next(err);
                // Handle csrf token errors on our own
                if (req.csrfToken) res.append("X-Use-CSRF-Token", req.csrfToken());
                next(new RestError(ERROR_CODES.INVALID_SESSION_TOKEN));
            });
        }
        this.server[route.opts.method](route.opts.path, ...middleware, async (req, res, next) => {
            try {
                await (route.handler as any)(req, res, next);
            } catch (e) {
                next(e);
            }
        });
        return;
    }

    /**
     * Takes a **file** path and loads it, passing it to loadRoute.
     *
     * This method checks whether the file contains an array of routes or a single route.
     * @param filePath the file path
     */
    private async loadFile(filePath: string): Promise<void> {
        let rawFile: any;
        try {
            rawFile = require(filePath);
        } catch (e) {
            Logger.warn(`Couldn't load route(s) from ${filePath}`);
            console.warn(e);
            Raven.captureException(e);
            return;
        }
        if (typeof rawFile === "object" && rawFile.default) {
            rawFile = rawFile.default;
        }
        if (Array.isArray(rawFile)) {
            for (let i = 0; i < rawFile.length; i++) {
                this.loadRoute(rawFile[i]);
            }
        } else {
            this.loadRoute(rawFile);
        }
    }

    /**
     * Recursively loops over a directory and loads all files in it.
     * Any file/folder including the name "util" will be ignored.
     * @param directory the directory to load
     */
    private async loadDirectory(directory: string): Promise<void> {
        const contents = await fs.readdir(directory);
        const recursivePromises: Array<Promise<void>> = [];
        for (let i = 0; i < contents.length; i++) {
            const item = contents[i];
            const itemPath = path.join(directory, item);
            if (item.includes("util")) continue;
            let isFile: boolean = false;
            try {
                const itemStats = await fs.stat(itemPath);
                isFile = itemStats.isFile();
            } catch (e) {
                Logger.warn(`Couldn't load route(s) from ${itemPath}`);
                console.warn(e);
                Raven.captureException(e);
                continue;
            }
            if (!isFile) {
                recursivePromises.push(this.loadDirectory(itemPath));
            } else if (itemPath.endsWith(".js")) {
                recursivePromises.push(this.loadFile(itemPath));
            }
        }
        await Promise.all(recursivePromises);
    }
}

export interface RequestDataStore {
    user: Player;
    [key: string]: any;
}

export interface Request extends ExpressRequest {
    data: RequestDataStore;
    body: {
        [key: string]: any;
    };
    params: any;
    user?: Player; // fill this in with your user model
    query: {[key: string]: string | undefined};
}

export interface Response extends ExpressResponse {
    reject(code: number): Promise<void>;
}

export type RouteHandler = (req: Request, res: Response, next: NextFunction) => void;
export type ErrorRouteHandler = (error: any, req: Request, res: Response, next: () => void) => void;

/**
 * Structure for API routes - API routes are streamed into express and are integrated as efficiently as possible.
 */
export interface Route {
    opts: {
        /**
         * The publicly accessible path
         */
        path: string;
        /**
         * The request method
         */
        method: "get" | "post" | "options" | "patch" | "put" | "delete" | "all";
        /**
         * The guards, if any, for this route
         */
        guards?: RouteHandler[];
        /**
         * Whether or not calls to this route will bypass CSRF protection.
         */
        bypassesCSRF?: boolean;
    };
    /**
     * The actual handler for this route
     */
    handler: RouteHandler;
}

export interface Routes {
    opts?: {
        guards?: RouteHandler[];
    }
    routes: (Route | Routes)[];
}