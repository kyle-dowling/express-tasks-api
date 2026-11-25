import request from 'supertest';
import { describe, expect, it } from 'vitest';
import app from '../src/app.js';

describe( ' GET /health', () => {
    it( 'returns 200 OK when the server and database are reachable', async () => {
        const res = await request( app ).get( '/health' );

        expect( res.status ).toBe( 200 );
        expect( res.body.status ).toBe( 'ok' );
        expect( typeof res.body.timestamp ).toBe( 'string' );
        expect( typeof res.body.uptime ).toBe( 'number' );
    } );

    it( 'returns 404 JSON for an unknown route', async () => {
        const res = await request( app ).get( '/api/does-not-exist' );

        expect( res.status ).toBe( 404 );
        expect( res.body ).toEqual( {
            status: 'fail',
            error: 'Route not found'
        } );
    } );
} );
