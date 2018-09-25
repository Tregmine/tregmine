import crypto from "crypto";
import flake from "flake-idgen";
import fs from "fs-extra";
import * as winston from "winston";
import child_process, { ChildProcess } from "child_process";
import { EventEmitter } from "events";
import Raven from "raven";
import uintformat from "biguint-format";
import { pwnedPasswordRange } from "hibp";
import Parcel from "parcel";
import path from "path";
import { DEBUG } from "./Constants";
import { Application } from "./database/entities/Application";
import { ObjectType } from "typeorm";
import { inspect } from "util";
const nobi = require("nobi");
require("./util.internal.js");
import git from "git-rev";
import mojangAPI = require("mojang-api");

const flaker = new flake({id: Number.parseInt(process.env.SERVER_ID as string) || 0, epoch: 1514764800000});

export namespace Frontend {
    interface ParcelOptions {
        production?: boolean;
        publicURL?: string;
        publicUrl?: string;
        watch?: boolean;
        target?: "browser" | "node";
        hmr?: boolean;
        scopeHoist?: boolean;
        outDir?: string;
        outFile?: string;
        cache?: boolean;
        cacheDir?: string;
        killWorkers?: boolean;
        minify?: boolean;
        https?: boolean;
        logLevel?: number;
        hmrPort?: number;
        sourceMaps?: boolean;
        hmrHostname?: string;
        detailedReport?: boolean;
        global?: boolean;
        autoinstall?: boolean;
        contentHash?: boolean;
    }
    
    const parcelOptions: ParcelOptions = {
        production: !DEBUG,
        watch: true,
        target: "browser",
        hmr: false,
        outDir: path.join(__dirname, "..", "out", "public"),
        cache: DEBUG,
        cacheDir: path.join(__dirname, "..", ".cache"),
        minify: !DEBUG,
        sourceMaps: true,
        detailedReport: false,
        autoinstall: true,
        contentHash: false
    }

    export async function startCompiler() {
        const bundler = new Parcel([path.join(__dirname, "..", "src", "frontend", "index.html")], parcelOptions);
        bundler.bundle();
    }

    export async function cleanup() {
        const PUB_DIR = path.join(__dirname, "public");
        if (await fs.pathExists(PUB_DIR)) {
            await fs.rmdir(PUB_DIR);
            return;
        }
    }
}

function promisify<T>(f: (cb: (res: T) => any) => any): Promise<T> {
    return new Promise((resolve) => f(res => resolve(res)));
}

/**
 * A promisified and typed wrapper around git versioning utilities
 */
export namespace Git {
    export const short = () => promisify(git.short);

    export const long = () => promisify(git.long);

    export const branch = () => promisify(git.branch);

    export const tag = () => promisify(git.tag);
}

/**
 * Promisified utilities for interacting with the Minecraft API
 */
export namespace Minecraft {
    /**
     * Gets the Mojang UUID of the username provided
     * @param username the username
     */
    export function getUUID(username: string): Promise<string | null> {
        return new Promise((resolve) => {
            mojangAPI.nameToUuid(username, (err, res) => resolve(err ? null : res[0].name));
        });
    }

    export interface Profile {
        name: string;
        id: string;
        properties: Array<{
            name: string;
            value: string;
            signature?: string;
        }>;
        textures: {
            skin: string | null;
            cape: string | null;
        } | null;
    }

    /**
     * Gets the Mojang profile of the UUID provided
     * @param uuid the account uuid
     */
    export function getProfile(uuid: string): Promise<Profile | null> {
        return new Promise((resolve) => {
            mojangAPI.profile(uuid, (err, res) => {
                if (err) {
                    return resolve(null);
                }
                const profile: Profile = {
                    name: res.name,
                    id: res.id,
                    properties: res.properties,
                    textures: null
                };
                for (let prop of res.properties) {
                    if (prop.name !== "textures") {
                        continue;
                    }
                    profile.textures = {skin: null, cape: null};
                    const texturesData = JSON.parse(Buffer.from(prop.value, "base64").toString());
                    if (texturesData.textures.SKIN) {
                        profile.textures.skin = texturesData.textures.SKIN.url;
                    }
                    if (texturesData.textures.CAPE) {
                        profile.textures.cape = texturesData.textures.CAPE.url;
                    }
                }
                resolve(profile);
            });
        });
    }

    /**
     * Gets the username history for a given UUID
     * @param uuid the UUID to look up
     */
    export function getNameHistory(uuid: string): Promise<string[] | null> {
        return new Promise((resolve) => mojangAPI.nameHistory(uuid, (err, res) => resolve(err ? null : res)));
    }
}

export namespace Security {
    /**
     * Creates a secure random string of a given length
     * @param length the length
     */
    export function random(length: number): Promise<string> {
        return new Promise((resolve, reject) => {
            crypto.randomBytes(length / 2, function(err, buffer) {
                err ? reject(err) : resolve(buffer.toString("hex"));
            });
        })
    }
    /**
     * Creates a unique snowflake
     */
    export function snowflake(): Promise<string> {
        return new Promise((resolve, reject) => {
            flaker.next((err, id) => {
                err ? reject(err) : resolve(uintformat(id, 'dec'));
            });
        });
    }

    /**
     * Returns the pwn count of a password.
     */
    export async function pwnCount(password: string): Promise<number> {
        const hashedPassword = await crypto.createHash("sha1").update(password).digest('hex').toUpperCase();
        const prefix = hashedPassword.substring(0, 5);
        const suffix = hashedPassword.substring(5);

        let results = await pwnedPasswordRange(prefix);
        results = results.filter(row => row.suffix === suffix);
        return results[0] ? results[0].count : 0
    }

    /**
     * Utilities related to token management
     */
    export namespace Token {
        const decodeBase64 = (data: string) => Buffer.from(data, "base64").toString("ascii");
        const encodeBase64 = (data: string) => Buffer.from(data).toString("base64");

        export interface DecodedToken {
            snowflake: string;
            timestamp: Date;
            hmac: string;
            application: Application;
        }

        /**
         * Decodes and validates a signed token
         *
         * @param token the token to decode
         */
        export async function decodeToken(token: string): Promise<DecodedToken | null> {
            const chunks: string[] = token.split(".");
            if (chunks.length !== 3) {
                return null;
            }
            const [snowflakeBase64, timestampBase64] = chunks;
            const snowflake = decodeBase64(snowflakeBase64);
            const timestampEpoch = (decodeBase64(timestampBase64) as any) * 1;
            if (isNaN(timestampEpoch)) {
                return null;
            }
            const timestamp = new Date();
            timestamp.setTime(timestampEpoch);
            if (isNaN(timestamp.getTime())) {
                return null;
            }
            const application = await Application.findOne({id: snowflake});
            if (!application) {
                return null;
            }
            const signer = nobi(application.secretSalt);
            let hmacData: string;
            try {
                hmacData = signer.unsign(token);
            } catch (e) {
                Logger.warn(`Failed to decode HMAC data from token:`);
                console.warn(e);
                return null;
            }
            if (hmacData !== `${snowflakeBase64}.${timestampBase64}`) {
                return null;
            }
            return {
                snowflake,
                timestamp,
                hmac: hmacData,
                application,
            };
        }

        /**
         * Validates a token and then gets the application it belongs to
         * @param token the token to validate
         * @returns undefined if the token is invalid
         */
        export async function getApplication(token: string): Promise<Application | null> {
            const parsedToken = await decodeToken(token);
            return parsedToken && parsedToken.application;
        }

        /**
         * Creates and signs a token for the given user
         *
         * @param application the user to create a token for
         */
        export async function createToken(application: Application | string): Promise<string> {
            if (typeof application === "string") {
                const _application = await Application.findOne(application)
                if (!_application) {
                    throw new Error("Unknown application.");
                }
                application = _application;
            }
            const snowflakeBase64 = encodeBase64(application.id);
            const timestampBase64 = encodeBase64(Date.now() + "");
            const signer = nobi(application.secretSalt);
            const partialToken: string = `${snowflakeBase64}.${timestampBase64}`;
            const hmac: string = signer.sign(partialToken);
            return hmac;
        }
    }
}

export namespace StringUtils {
    /**
     * Repeats the given string the given amount of times
     * @param char string to repeat
     * @param amount number of repetitions
     */
    export async function repeatChar(char: string, amount: number): Promise<string> {
        let str: string = "";
        for (let i = 0; i < amount; i++) str += char;
        return str;
    }
}

export namespace ArrayUtils {
    /**
     * Takes a possibly innaccessible variable and wraps it in an array
     */
    export function optional<T>(item: T | undefined | null): T[] {
        if (item) {
            return [item];
        }
        return [];
    }

    /**
     * Takes a representative sample of the items in the array
     * @param array array
     * @param fn callback for array values
     */
    export async function sample<T>(array: T[], fn: (val: T) => any): Promise<void> {
        if (array.length <= 10) {
            for (let i = 0; i < array.length; i++) {
                fn(array[i]);
            }
        } else {
            const increment = parseInt((array.length * 0.1).toFixed(0));
            for (let i = 0; i < array.length; i += increment) {
                fn(array[i])
            }
        }
    }
}

export interface LogMessage {
    content: string;
    timestamp: number;
    stream: "stdout" | "stderr";
}

/**
 * Wrapper class for ChildProcess
 */
export class Process extends EventEmitter {

    /**
     * Process log
     */
    public log: LogMessage[] = [];
    public process!: ChildProcess;

    public constructor(private command: string, private options: {
        cwd: string,
        env: {
            [key: string]: string
        }
    }) {
        super();
    }

    /**
     * Execute and return the exit code
     */
    public exec(): Promise<number> {
        return new Promise((resolve, reject) => {
            const argv = this.command.split(" ");
            this.process = child_process.spawn(argv[0], argv.slice(1), this.options);
            const watcher = (type: "stdout" | "stderr") => (data: string | Buffer) => {
                data = data.toString();
                if (data.length === 0 || data === "\n") {
                    return;
                }
                if (data.endsWith("\n")) {
                    data = data.substring(0, data.length - 2);
                }
                const packet = {
                    content: data,
                    timestamp: Date.now(),
                    stream: type
                };
                this.log.push(packet);
                this.emit("data", packet);
            };
            this.process.stdout.on("data", watcher("stdout"));
            this.process.stderr.on("data", watcher("stderr"));
            this.process.on("close", code => resolve(code));
            this.process.on("error", reject);
        });
    }
}

export namespace Convenience {
    export function sleep(ms: number): Promise<void> {
        return new Promise((resolve) => setTimeout(resolve, ms));
    }
}

export const Logger = new winston.Logger({
    transports: [
        new winston.transports.Console({
            level: "debug",
            handleExceptions: false,
            json: false,
            colorize: true,
        }),
    ],
    exitOnError: false,
});

export interface Breadcrumb {
    message: string;
    category: string;
    level: "error" | "warning" | "info" | "debug";
    data?: {
        [key: string]: string;
    };
}

export function breadcrumb(category: string | Breadcrumb, level?: "error" | "warning" | "info" | "debug", message?: string, data?: {[key: string]: string}) {
    if (typeof category === "string") {
        Raven.captureBreadcrumb({
            message,
            category,
            level,
            data
        });
        return;
    }
    Raven.captureBreadcrumb(category);
}

export function breadcrumber(category: string): (level: "error" | "warning" | "info" | "debug", message: string, data?: {[key: string]: string}) => void {
    return breadcrumb.bind(null, category);
}