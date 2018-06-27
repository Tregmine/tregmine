import "reflect-metadata";
import {createConnection} from "typeorm";
import { join } from "path";

const entityDir = join(__dirname, "entities", "*.js");

export function connect() {
    return createConnection({
        type: process.env.DATABASE_ENGINE as any || "postgres",
        host: process.env.DATABASE_HOST || "localhost",
        port: Number.parseInt(process.env.DATABASE_PORT as any) || 5432,
        username: process.env.DATABASE_USERNAME,
        password: process.env.DATABASE_PASSWORD,
        database: process.env.DATABASE_NAME as any || "DynasticAccounts",
        entities: [entityDir],
        logging: false,
        synchronize: true
        // synchronize: process.env.NODE_ENV == "debug" ? true : false,  // Disable on production
    });
}