import RateLimit from "express-rate-limit";
import { RestError } from "./util";
import { ERROR_CODES } from "../Constants";

const baseOptions = {
    handler: (req, res, next) => next(new RestError(ERROR_CODES.RATE_LIMITED)),
    skipFailedRequests: true,
    skip: (req, res): boolean => {
        // Skip ratelimiting on dev
        return process.env.NODE_ENV === "development";
    }
}

/**
 * Allows three GDPR data downloads every 15 minutes.
 */
export const gdprDownloadRatelimit = new RateLimit({
    windowMs: 15 * 60 * 1000,
    max: 3,
    ...baseOptions
});

/**
 * Allows two signups every 30 minutes.
 */
export const registerRatelimit = new RateLimit({
    windowMs: 30 * 60 * 1000,
    max: 2,
    ...baseOptions
});

/**
 * Allows two password resets every 30 minutes.
 */
export const passwordResetRatelimit = new RateLimit({
    windowMs: 30 * 60 * 1000,
    max: 2,
    ...baseOptions
});

/**
 * Allows two email changes every hour.
 */
export const emailChangeRatelimit = new RateLimit({
    windowMs: 60 * 60 * 1000,
    max: 2,
    ...baseOptions
});

/**
 * Allows two verification email resends every 30 minutes.
 */
export const verificationEmailResendRatelimit = new RateLimit({
    windowMs: 30 * 60 * 1000,
    max: 2,
    ...baseOptions
});