import crypto from "crypto";
import flake from "flake-idgen";
import * as winston from "winston";
import child_process, { ChildProcess } from "child_process";
import { EventEmitter } from "events";
import Raven from "raven";
import uintformat from "biguint-format";
import { pwnedPasswordRange } from "hibp";
import Parcel from "parcel";
import path from "path";
import { DEBUG } from "./Constants";

const flaker = new flake({id: Number.parseInt(process.env.SERVER_ID as string) || 0, epoch: 1514764800000});

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
    autoinstall: true
}

const parcelLogger = require("parcel/src/Logger");
parcelLogger.clear = () => undefined;
parcelLogger.writeLine = (_,msg) => console.log(msg);
const oldStatus = parcelLogger.status.bind(parcelLogger);
parcelLogger.status = (emoji, message, color) => {
    if (emoji.includes("⏳") && !message.includes("Building...")) return;
    oldStatus(emoji, message, color);
}

export namespace Frontend {
    export async function startCompiler() {
        const bundler = new Parcel([path.join(__dirname, "..", "src", "frontend", "index.html")], parcelOptions);
        bundler.bundle();
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