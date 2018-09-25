import { RouteHandler, Routes } from "../http";
import { Player } from "../database/entities/Player";
import { RestError } from "../http/util";
import { Rank } from "../types";
import { API_V0_ROUTES, ERROR_CODES } from "../Constants";
import { authenticatedGuard } from "../http/guards/authenticated";

const userPrepGuard: RouteHandler = async (req, res, next) => {
    const playerId = req.params.id;
    if (playerId === "@me") {
        if (!req.user) {
            return next(new RestError(ERROR_CODES.UNAUTHORIZED));
        }
        req.data.user = req.user!;
        return next();
    }
    if (Rank.GUARDIAN > req.user!.rank) {
        return next(RestError.FORBIDDEN);
    }
    const player = await Player.findOne({uuid: playerId}, {cache: 5000});
    if (!player) {
        return next(RestError.BAD_REQUEST);
    }
    req.data.user = player;
    next();
}

export = {
    opts: {
        guards: [
            userPrepGuard
        ]
    },
    routes: [
        /**
         * Query string includes "full" to get the full user response
         */
        {
            opts: {
                method: "get",
                path: API_V0_ROUTES.USER.BASE
            },
            handler: async (req, res) => {
                const {full} = req.query;
                res.json(await req.data.user.toInfo((full as any) == 1))
            }
        }
    ]
} as Routes;