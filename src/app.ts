import { env } from './config/env.js'
import cors from 'cors';
import express, { type ErrorRequestHandler } from 'express';
import helmet from 'helmet';
import { z } from 'zod';
import { pool } from './db.js';
import { apiLimiter, authLimiter } from './middleware/rateLimiter.js';
import authRoutes from './routes/authRoutes.js';
import taskRoutes from './routes/tasksRoutes.js';
import { AppError } from './utils/AppError.js';

const app = express();

// Required when deployed behind reverse proxies, so rate-limiting sees real client IPs
app.set( 'trust proxy', 1 );

app.use( helmet() );

app.use(
    cors( {
        origin: env.CORS_ORIGIN,
        methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE'],
        allowedHeaders: ['Content-Type', 'Authorization'],
    } )
);

// Built-in middleware
app.use( express.json() );

// Skip noisy request logs during automated tests
if ( env.NODE_ENV !== 'test' ) {
    app.use( ( req, _res, next ) => {
        console.log( `${req.method} ${req.url}` )
        next();
    } );
}

// Health check endpoint (unauthenticated and exempt from /api rate limiter)
app.get( '/health', async ( _req, res ) => {
    try {
        await pool.query( 'SELECT 1' );
        res.status( 200 ).json( {
            status: 'ok',
            timestamp: new Date().toISOString(),
            uptime: process.uptime(),
        } );
    } catch {
        res.status( 503 ).json( {
            status: 'error',
            error: 'Database unreachable',
        } );
    }
} );

// Rate limiting and API routes
app.use( '/api', apiLimiter );
app.use( '/api/auth', authLimiter, authRoutes );
app.use( '/api/tasks', taskRoutes );

// 404 handler for unmatched routes
app.use( ( _req, _res, next ) => {
    next( new AppError( 'Route not found', 404 ) );
} );

// Centralized Error Handled
const errorHandler: ErrorRequestHandler = ( err, _req, res, _next ) => {
    // zod validation errors
    if ( err instanceof z.ZodError ) {
        const details = err.issues.map( issue => ( {
            field: issue.path.join( '.' ),
            message: issue.message,
        } ) );

        res.status( 400 ).json( {
            status: 'fail',
            error: 'Validation error',
            details,
        } );
        return;
    }

    let error = err;

    // PostgreSQL error normalization
    if ( err.code === '22P02' ) {
        error = new AppError( 'Invalid ID format', 400 );
    } else if ( err.code === '23502' ) {
        error = new AppError( `Missing required field: ${err.column}`, 400 );
    } else if ( err.code === '23505' ) {
        error = new AppError( 'Duplicate value violates unique constraint', 400 );
    }

    const statusCode = error.statusCode || 500;
    const message = error.isOperational ? error.message : 'Internal Server Error';

    if ( !error.isOperational ) {
        console.error( 'UNEXPECTED ERROR:', err );
    }

    res.status( statusCode ).json( {
        status: statusCode >= 500 ? 'error' : 'fail',
        error: message
    } );
};

app.use( errorHandler );

export default app;
