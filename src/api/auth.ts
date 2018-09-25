import { Route } from "../http";
import { API_V0_ROUTES, ERROR_CODES } from "../Constants";
import passport from "passport";
import { RestError } from "../http/util";

export = [{
    opts: {
        path: API_V0_ROUTES.AUTH.LOGIN,
        method: "post"
    },
    handler: (req, res, next) => {
        passport.authenticate("local", (err, user) => {
            if (err instanceof RestError) next(err);
            if (!user) return next(new RestError(ERROR_CODES.INVALID_CREDENTIALS));
            if (err) return next(err);

            if (req.body.keepSignedIn) req.session.maxAge = 1000 * 60 * 60 * 24 * 1;
            req.login(user, async (err) => {
                if (err) return next(err);
                res.json(await user.toInfo(true));
            });
        })(req, res, next);
    }
}] as Route[];