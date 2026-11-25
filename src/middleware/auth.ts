import type { Request, Response, NextFunction } from 'express';
import jwt, { type JwtPayload } from 'jsonwebtoken';
import { AppError } from '../utils/AppError.js';

export const authenticate = ( req: Request, _res: Response, next: NextFunction ) => {
    const authHeader = req.headers.authorization;

    if ( !authHeader?.startsWith( 'Bearer ' ) ) {
        return next( new AppError( 'Missing or invalid authorization header', 401 ) );
    }

    const token = authHeader.split( ' ' )[1];

    try {
        const decoded = jwt.verify( token, process.env.JWT_SECRET! ) as JwtPayload;
        if ( !decoded.sub || typeof decoded.email !== 'string' ) {
            return next( new AppError( 'Invalid token payload', 401 ) );
        }

        req.user = { id: decoded.sub, email: decoded.email };
        next();
    } catch {
        next( new AppError( 'Invalid or expired token', 401 ) );
    }
};
