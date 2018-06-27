import { Route } from ".";
import { ERROR_CODES } from "../Constants";

export interface RestErrorFields {
    fields?: {
        [key: string]: Array<{[code: string]: string}>;
    }
}

export type StandardRestError = {
    code: number;
    data?: any;
} & RestErrorFields;

export declare interface RestError<T extends object> {
    constructor(response: T): this;
    constructor(response: string, code: number, fields?: RestErrorFields, data?: any): this;
}

/**
 * Wrapper for errors to be sent to the client
 */
export class RestError<T extends object> {

    private response: T | StandardRestError;

    constructor(code: number, public statusCode?: number, fields?: RestErrorFields, data?: any) {
        this.response = {
            code,
            fields: fields as any,
            data
        }
    }

    public get body(): T | StandardRestError {
        return this.response;
    }

    public get json(): string {
        return JSON.stringify(this.response);
    }

    public static get NOT_FOUND(): RestError<StandardRestError> {
        const err = new RestError(ERROR_CODES.NOT_FOUND);
        err.statusCode = 404;
        return err as any;
    }

    public static get BAD_REQUEST(): RestError<StandardRestError> {
        const err = new RestError(ERROR_CODES.NOT_FOUND);
        err.statusCode = 400;
        return err as any;
    }

    public static get FORBIDDEN(): RestError<StandardRestError> {
        const err = new RestError(ERROR_CODES.FORBIDDEN);
        err.statusCode = 403;
        return err as any;
    }

    public static INTERNAL_ERROR(ref: string): RestError<StandardRestError> {
        const err = new RestError(ERROR_CODES.INTERNAL_ERROR, undefined, undefined, {ref});
        err.statusCode = 500;
        return err as any;
    }

    public static OAUTH_ERROR(service: string): RestError<StandardRestError> {
        const err = new RestError(ERROR_CODES.OAUTH_FAIL, undefined, undefined, {service});
        err.statusCode = 400;
        return err as any;
    }

    public static get MISSING_EMAIL(): RestError<StandardRestError> {
        const err = new RestError(ERROR_CODES.MISSING_EMAIL, 403);
        return err as any;
    }

    public static get EMAIL_IN_USE(): RestError<StandardRestError> {
        const err = new RestError(ERROR_CODES.EMAIL_IN_USE);
        return err as any;
    }
}