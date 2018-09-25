import { RouteHandler } from "..";
import { RestError } from "../util";
import { ERROR_CODES } from "../../Constants";

export const authenticatedGuard: RouteHandler = (req, res, next) => {
    if (!req.user) next(new RestError(ERROR_CODES.UNAUTHORIZED));
    else next();
}