import keymirror = require("keymirror");

const prefix: <T>(routes: T, prefixStr: string) => T = <T>(routes: T, prefixStr: string) => {
    var val = Object.assign({}, val);
    for (const key in routes) {
        var value = routes[key];
        if (typeof value == "object") val[key] = prefix(value, prefixStr);
        else val[key] = `${prefixStr}${routes[key]}` as any;
    }
    return val;
}

const unprefix: <T>(routes: T, prefixStr: string) => T = <T>(routes: T, prefixStr: string) => {
    const newRoutes: {[key: string]: any} = {};
    for (const key in routes) {
        const value = routes[key];
        if (typeof value == "object") newRoutes[key] = unprefix(value, prefixStr);
        else newRoutes[key] = (routes[key] as any as string).substring(prefixStr.length);
    }
    return newRoutes as any;
}

const join: <T, U>(obj1: T, obj2: U) => T & U = (obj1, obj2) => {
    const newObj: {[key: string]: any} = {};
    for (let key in obj1) {
        newObj[key] = obj1[key];
    }
    for (let key in obj2) {
        newObj[key] = obj2[key];
    }
    return newObj as any;
}

export const DEBUG = process.env.NODE_ENV === "development";

export const API_V0_ROUTES = prefix({
    AUTH: prefix({
        SOCIAL: "/social"
    }, "/auth")
}, "/v0");

export const PAYPAL_ENABLED = true;

export const ERROR_CODES = {
    RATE_LIMITED: 429,
    NOT_FOUND: 404,
    FORBIDDEN: 403,
    UNAUTHORIZED: 401,
    INTERNAL_ERROR: 500,
    OAUTH_FAIL: 2001,
    MISSING_EMAIL: 1001,
    EMAIL_IN_USE: 1002,
    INVALID_SESSION_TOKEN: 1003
}

export const FRONTEND_URL = "";
export const BACKEND_URL = "";
export const SIGNED_IN_REDIRECT = `${FRONTEND_URL}/?signedin=1`;
export const FAILED_LINK_REDIRECT = `${FRONTEND_URL}/?link_error=`;
export const PASSPORT_REDIRECTS = {
    successRedirect: SIGNED_IN_REDIRECT,
    failureRedirect: FAILED_LINK_REDIRECT
}

export const computeCallbackURL = (service: string): string => `${BACKEND_URL}${API_V0_ROUTES.AUTH.SOCIAL}/${service}/callback`;

export const ALLOW_PASSWORD_IF_HIBP_FAILS = true;

export const DEBUG_TREE: {[key: string]: any} = (global as any || window as any).DEBUG_TREE = {};

export const EVENTS = keymirror({
    USER_UPDATE: null,
    REDIRECT_TO_LOGIN: null
});