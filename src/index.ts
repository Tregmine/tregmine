import { connect } from './database';
import { HttpServer } from "./http";
import { Player } from "./database/entities/Player";
import { Config } from "./Config";
import paypal from "paypal-rest-sdk";
import Raven from "raven";
import { Logger, Frontend } from './util';
import * as Constants from "./Constants";
import { readdirSync } from 'fs';
import { join } from 'path';

if (!process.env.NODE_ENV) process.env.NODE_ENV = "development";

if (process.env.NODE_ENV == "development") {
    Logger.info("Disabling Sentry on development build.")
} else {
    Raven.config("https://13f72a1d7a83480cadd2def06130754c@sentry.io/1218516", {
        autoBreadcrumbs: true,
        release: require('git-rev-sync').long(),
        environment: process.env.NODE_ENV,
        // dataCallback: (data) => {
        //     // TODO: Source mappings
        // },
        parseUser: (user) => {
            return {
                id: user.id,
                email: user.email
            }
        }
    }).install();
}

process.on("unhandledRejection", e => {
    console.error(e);
    Raven.captureException(e);
});

connect().then((connection) => {
    const server: HttpServer = new HttpServer(Number.parseInt(process.env.HTTP_PORT as string) || Config.port);
    Frontend.startCompiler();
    const repl = require("repl");
    const replServer = repl.start();
    const entities = {};
    for (let file of readdirSync(join(__dirname, "database", "entities"))) {
        if (!file.endsWith(".js")) continue;
        const entity = require("./database/entities/" + file);
        const key = Object.keys(entity)[0];
        entities[key] = entity[key];
    }
    replServer.context.entities = entities;
    replServer.context.connection = connection;
    replServer.context.Constants = Constants;
});

setInterval(async () => await Player.deleteApplicableUsers(), 30000); // Delete applicable users every 30 seconds

if (!Config.paypalWebhookID || Config.paypalWebhookID.length <= 0 || !Config.paypalClientID || !Config.paypalClientSecret) {
    Logger.warn("PayPal configuration was invalid or insecure. PayPal will not be available.");
    (Constants as any).PAYPAL_ENABLED = false;
} else {
    paypal.configure({
        'mode': Config.paypalEnvironment, //sandbox or live
        'client_id': Config.paypalClientID,
        'client_secret': Config.paypalClientSecret
    });
}