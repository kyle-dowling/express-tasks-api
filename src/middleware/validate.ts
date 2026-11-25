import type { RequestHandler } from 'express';
import { z } from 'zod';

export const validate = ( schema: z.ZodType ): RequestHandler => {
    return ( req, _res, next ) => {
        const parsed = schema.parse( {
            body: req.body ?? {},
            params: req.params,
            query: req.query,
        } ) as {
            body?: Record<string, unknown>;
            params?: Record<string, string>;
            query?: Record<string, unknown>;
        };

        if ( parsed.body ) {
            req.body = parsed.body;
        }

        if ( parsed.params ) {
            Object.assign( req.params, parsed.params );
        }

        // In Express 5, req.query is only a getter
        if ( parsed.query && req.query ) {
            Object.assign( req.query, parsed.query );
        }

        next();
    };
};
