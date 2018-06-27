import { DEBUG } from "../../Constants";

export type ReportEffect = "bold" | "italic" | "strike" | "underline";

export type BasicReport = string | {[key: string]: any} | Array<string | {[key: string]: any}>;

export interface ReportStyling {
    styles?: {
        [key: string]: string
    }
    emphasis?: number,
    color?: string,
    font?: string,
    effects?: ReportEffect[];
}

export interface CustomReport extends ReportStyling {
    content: BasicReport;
}

export type Report = BasicReport | CustomReport;

const createStyling = (styling: ReportStyling) => {
    const {styles, emphasis, color, font, effects} = styling;
    let style: string = "";
    if (typeof emphasis === "number") style += `font-size:${12 + emphasis}`;
    if (color) style += `color:${color}`;
    if (font) style += `font-family:${font}`;
    if (effects) {
        for (let effect of effects) {
            switch (effect) {
                case "bold":
                style += `font-weight:bold;`;
                break;
                case "italic":
                style += `font-style:italic;`;
                break;
                case "strike":
                style += `text-decoration:line-through;`;
                break;
                case "underline":
                style += `text-decoration:underline;`;
                break;
            }
        }
    }
    if (styles) {
        for (let key in styles) {
            const value = styles[key];
            key = key.replace(/([a-zA-Z])(?=[A-Z])/g, '$1-').toLowerCase();
            style += `${key}:${value};`;
        }
    }
    return style;
}

const levelStyles: {[key: string]: ReportStyling} = {
    log: {},
    warn: {color: "#c47900", effects: ["italic"]},
    error: {color: "red", effects: ["bold"]},
    debug: {color: "green", effects: ["italic"]}
}

const compile: (report: CustomReport) => Promise<Array<[BasicReport, string]>> = async report => {
    const {content} = report;
    const style = createStyling(report as any);
    if (Array.isArray(content)) {
        return content.map(c => {
            if (typeof c === "string") {
                return [`%c${c}`, style] as any;
            } else {
                return [c, undefined as any as string] as any;
            }
        });
    } else {
        return [[content, style]];
    }
};

function isArray(value: any, type: string): value is Array<any> {
    if (!value || !Array.isArray(value)) {
        return false;
    }
    for (let entry of value) {
        if (typeof entry !== type) {
            return false;
        }
    }
    return true;
}

export const isCustomReport = (report: Report): report is CustomReport => {
    return typeof report === "object"
        && !Array.isArray(report)
        && !(report instanceof Error)
        && (typeof report["content"] === "string" || report["content"] instanceof Error)
        && (typeof report["emphasis"] === "undefined" || typeof report["emphasis"] === "number")
        && (typeof report["color"] === "undefined" || typeof report["color"] === "string")
        && (typeof report["font"] === "undefined" || typeof report["font"] === "string")
        && (typeof report["effects"] === "undefined" || isArray(report["effects"], "string"));
}

export default class Logger {
    static async print(level: "warn" | "error" | "debug" | "log", report: Report) {
        if (!DEBUG) {
            return;
        }
        const executions: Array<Promise<void>> = [];
        const push = content => executions.push(Logger.print(level, {content, ...levelStyles[level]}));
        if (isCustomReport(report)) {
            const logs = await compile(report);
            for (let log of logs) {
                console[level](...log);
            }
        } else if (Array.isArray(report)) {
            for (let content of report) {
                push(content);
            }
        } else {
            push(report);
        }
    }

    static log(report: Report) {
        return this.print("log", report);
    }

    static warn(report: Report) {
        return this.print("warn", report);
    }

    static error(report: Report) {
        return this.print("error", report);
    }

    static debug(report: Report) {
        return this.print("debug", report);
    }
}