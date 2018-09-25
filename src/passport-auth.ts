import { PassportStatic } from "passport";
import { Strategy } from "passport-local";

import { Player } from "./database/entities/Player";

export default (passport: PassportStatic) => {
    /* Serialising etc */

    passport.serializeUser((user: Player, cb) => {
        cb(null, user.uuid);
    });

    passport.deserializeUser(async (uuid: string, cb) => {
        try {
            const user = await Player.findOne({uuid});
            cb(null, user);
        } catch (e) {
            cb(e);
        }
    });

    /* Local Auth Strategy */

    passport.use("local", new Strategy(
        { usernameField: "username" },
        async (name, password, done) => {
            try {
                const user = await Player.findOne({ name });
                if (!user) {
                    return done(null, false);
                }
                if (!user.password || !await user.passwordMatches(password)) return done(null, false);
                done(null, user);
            } catch (e) {
                done(e);
            }
        }
    ));
}
