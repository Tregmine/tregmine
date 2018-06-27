import { PassportStatic } from "passport";
import { Strategy } from "passport-local";

import { User } from "./database/entities/User";

export default (passport: PassportStatic) => {
    /* Serialising etc */

    passport.serializeUser((user: User, cb) => {
        cb(null, user.id);
    });

    passport.deserializeUser((id: string, cb) => {
        User.findOne({ id: id }).then(user => cb(null, user)).catch(cb);
    });

    /* Local Auth Strategy */

    passport.use("local", new Strategy(
        { usernameField: "username" },
        (name, password, done) => {
            User.findOne({ name }).then(async user => {
                if (!user) {
                    return done(null, false);
                }
                if (!user.password || !await user.passwordMatches(password)) return done(null, false);
                done(null, user);
            }).catch(err => done(err, null));
        }
    ));
}
