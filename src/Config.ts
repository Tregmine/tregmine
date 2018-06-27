/**
 * Used as a value extractor for objects, with complex extractions being functions.
 * Strings are treated as object keys.
 * If you need depth or array access, use a function. Strings are not evaluated.
 */
export type Extractor = string | ((user: any) => any)

export class Config {
    static paypalWebhookID: null | string = null;
    static paypalClientID: null | string = null;
    static paypalClientSecret: null | string = null;
    static paypalEnvironment: "sandbox" | "live" = "sandbox";
    
    static corsDomains: string[] = ["*"];
    static port: number = 8080;

    static OAUTH_DATA: {
        [service: string]: {
            params: any,
            extract: {
                /**
                 * You must specify the extractor if it does not match the key name.
                 * Ex: the name field is not "name"
                 * Safe to omit ex: the name field is "name"
                 */
                name?: Extractor,
                email?: Extractor,
                id?: Extractor,
                verified?: Extractor
            },
            package: string,
            use: boolean
        }
    } = {
    }

    static mailgun: null | {
        apiKey: string;
        publicApiKey?: string;
        domain: string;
        mute?: boolean;
        timeout?: number;
        host?: string;
        endpoint?: string;
        protocol?: string;
        port?: number;
        retry?:
            | number
            | {
                  times: number;
                  interval: number;
              };
        proxy?: string;
    } = null;
}