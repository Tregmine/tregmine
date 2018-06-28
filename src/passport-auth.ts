import { PassportStatic } from "passport";
import { Strategy } from "passport-local";

import { Player } from "./database/entities/Player";

export default (passport: PassportStatic) => {
    /* Serialising etc */

    passport.serializeUser((user: Player, cb) => {
        cb(null, user.id);
    });

    passport.deserializeUser((id: string, cb) => {
        Player.findOne({ id: id }).then(user => cb(null, user)).catch(cb);
    });

    /* Local Auth Strategy */

    passport.use("local", new Strategy(
        { usernameField: "username" },
        (name, password, done) => {
            Player.findOne({ name }).then(async user => {
                if (!user) {
                    return done(null, false);
                }
                if (!user.password || !await user.passwordMatches(password)) return done(null, false);
                done(null, user);
            }).catch(err => done(err, null));
        }
    ));
}
