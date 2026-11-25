import request from 'supertest';
import { beforeEach, describe, expect, it } from 'vitest';
import app from '../src/app.js';
import { pool } from '../src/db.js';

describe( '/api/auth', () => {
    beforeEach( async () => {
        await pool.query( 'TRUNCATE TABLE users, tasks RESTART IDENTITY CASCADE' );
    } );

    describe( 'POST /api/auth/register', () => {
        it( 'registers a new user and returns 201 with user data and a JWT token', async () => {
            const res = await request( app )
                .post( '/api/auth/register' )
                .send( { email: 'Alice@Example.com ', password: 'password123' } ); // keep trailing space in email string

            expect( res.status ).toBe( 201 );
            expect( res.body.status ).toBe( 'success' );
            expect( res.body.data.user.email ).toBe( 'alice@example.com' );
            expect( res.body.data.user.id ).toBeDefined();
            expect( res.body.data.user ).not.toHaveProperty( 'password_hash' );
            expect( typeof res.body.data.token ).toBe( 'string' );
        } );

        it( 'returns 400/409 when registering a duplcate email', async () => {
            await request( app )
                .post( '/api/auth/register' )
                .send( { email: 'duplcate@example.com', password: 'password123' } );

            const res = await request( app )
                .post( '/api/auth/register' )
                .send( { email: 'duplcate@example.com', password: 'password123' } );

            expect( [400, 409] ).toContain( res.status );
        } );
    } );

    describe( 'POST /api/auth/login', () => {
        beforeEach( async () => {
            await request( app )
                .post( '/api/auth/register' )
                .send( { email: 'bob@example.com', password: 'password123' } );
        } );

        it( 'logs in with valid credentials and returns 200 with a JWT token', async () => {
            const res = await request( app )
                .post( '/api/auth/login' )
                .send( { email: 'bob@example.com', password: 'password123' } );

            expect( res.status ).toBe( 200 );
            expect( res.body.status ).toBe( 'success' );
            expect( res.body.data.user.email ).toBe( 'bob@example.com' );
            expect( typeof res.body.data.token ).toBe( 'string' );
        } );

        it( 'returns 401 when password is incorrect', async () => {
            const res = await request( app )
                .post( '/api/auth/login' )
                .send( { email: 'bob@example.com', password: 'wrongpassword' } );

            expect( res.status ).toBe( 401 );
            expect( res.body.error ).toBe( 'Invalid email or password' );
        } );

        it( 'returns 401 when email does not exist', async () => {
            const res = await request( app )
                .post( '/api/auth/login' )
                .send( { email: 'nobody@example.com', password: 'password123' } );

            expect( res.status ).toBe( 401 );
            expect( res.body.error ).toBe( 'Invalid email or password' );
        } );
    } );
} );
