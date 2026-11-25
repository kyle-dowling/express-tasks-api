import rateLimit from 'express-rate-limit';
import { env } from '../config/env.js';

// General limit for all /api routes
export const apiLimiter = rateLimit( {
    windowMs: 15 * 60 * 1000,
    limit: 100,
    standardHeaders: 'draft-8', // sends standard RateLimit headers
    legacyHeaders: false,
    skip: () => env.NODE_ENV === 'test',
    message: {
        status: 'fail',
        error: 'Too many requests, please try again later.',
    },
} );

// Strict limiter for /api/auth routes
export const authLimiter = rateLimit( {
    windowMs: 15 * 60 * 1000,
    limit: 10,
    standardHeaders: 'draft-8', // sends standard RateLimit headers
    legacyHeaders: false,
    skip: () => env.NODE_ENV === 'test',
    message: {
        status: 'fail',
        error: 'Too many authentication attempts, please try again in 15 minutes.',
    },
} );
