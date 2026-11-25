import request from 'supertest';
import { beforeEach, describe, expect, it } from 'vitest';
import app from '../src/app';
import { pool } from '../src/db';

// Helper to register a user via the API and return their JWT + user info
const registerAndGetToken = async ( email: string, password = 'password123' ) => {
    const res = await request( app )
        .post( '/api/auth/register' )
        .send( { email, password } );

    return {
        token: res.body.data.token as string,
        user: res.body.data.user as { id: string, email: string },
    };
}

describe( '/api/tasks', () => {
    let tokenA: string;

    beforeEach( async () => {
        await pool.query( 'TRUNCATE TABLE users, tasks RESTART IDENTITY CASCADE' );
        const authA = await registerAndGetToken( 'usera@example.com' );
        tokenA = authA.token;
    } );

    describe( 'Authentication guards', () => {
        it( 'returns 401 when no Authorization header is provided', async () => {
            const res = await request( app ).get( '/api/tasks' );

            expect( res.status ).toBe( 401 );
            expect( res.body.status ).toBe( 'fail' );
        } );

        it( 'returns 401 when the JWT token is invalid or malformed', async () => {
            const res = await request( app )
                .get( '/api/tasks' )
                .set( 'Authorization', 'Bearer not-a-valid-jwt' );

            expect( res.status ).toBe( 401 );
            expect( res.body.status ).toBe( 'fail' )
        } );
    } );

    describe( 'CRUD operations & validation', () => {
        it( 'Creates a new task and returns 201', async () => {
            const res = await request( app )
                .post( '/api/tasks' )
                .set( 'Authorization', `Bearer ${tokenA}` )
                .send( { title: 'Finish Day 9 tests', description: 'Write crud specs' } );

            expect( res.status ).toBe( 201 );
            expect( res.body.title ).toBe( 'Finish Day 9 tests' );
            expect( res.body.completed ).toBe( false );
        } );

        it( 'returns 400 when creating a task missing a title', async () => {
            const res = await request( app )
                .post( '/api/tasks' )
                .set( 'Authorization', `Bearer ${tokenA}` )
                .send( { title: '' } );

            expect( res.status ).toBe( 400 );
            expect( res.body.status ).toBe( 'fail' );
            expect( res.body.error ).toBe( 'Validation error' );
        } );

        it( 'lists only the authenticated user\'s tasks', async () => {
            await request( app )
                .post( '/api/tasks' )
                .set( 'Authorization', `Bearer ${tokenA}` )
                .send( { title: 'Task 1' } );

            await request( app )
                .post( '/api/tasks' )
                .set( 'Authorization', `Bearer ${tokenA}` )
                .send( { title: 'Task 2' } );

            const res = await request( app )
                .get( '/api/tasks' )
                .set( 'Authorization', `Bearer ${tokenA}` )

            expect( res.status ).toBe( 200 );
            expect( res.body ).toHaveLength( 2 );
        } );

        it( 'fetches, updates, and deletes a task by ID', async () => {
            // Create
            const createRes = await request( app )
                .post( '/api/tasks' )
                .set( 'Authorization', `Bearer ${tokenA}` )
                .send( { title: 'Initial Title' } );

            const taskId = createRes.body.id;

            // Get single task
            const getRes = await request( app )
                .get( `/api/tasks/${taskId}` )
                .set( 'Authorization', `Bearer ${tokenA}` )

            expect( getRes.status ).toBe( 200 );
            expect( getRes.body.id ).toBe( taskId );

            // Update task
            const updateRes = await request( app )
                .patch( `/api/tasks/${taskId}` )
                .set( 'Authorization', `Bearer ${tokenA}` )
                .send( { title: 'Updated Title', completed: true } );

            expect( updateRes.status ).toBe( 200 );
            expect( updateRes.body.title ).toBe( 'Updated Title' );
            expect( updateRes.body.completed ).toBe( true );

            // Delete task
            const deleteRes = await request( app )
                .delete( `/api/tasks/${taskId}` )
                .set( 'Authorization', `Bearer ${tokenA}` );

            expect( [200, 204] ).toContain( deleteRes.status );

            // Verify it no longer exists
            const afterDeleteRes = await request( app )
                .get( `/api/tasks/${taskId}` )
                .set( 'Authorization', `Bearer ${tokenA}` );

            expect( afterDeleteRes.status ).toBe( 404 );
        } );

        it( 'returns 400 when task ID is not a valid integer', async () => {
            const res = await request( app )
                .get( '/api/tasks/not-a-number' )
                .set( 'Authorization', `Bearer ${tokenA}` );

            expect( res.status ).toBe( 400 );
            expect( res.body.status ).toBe( 'fail' );
        } );
    } );

    describe( 'Multi-tenant isolation', () => {
        it( 'prevents User B from listing, viewing, updating, or deleting User A\'s tasks', async () => {
            // User A creates private task
            const createRes = await request( app )
                .post( '/api/tasks' )
                .set( 'Authorization', `Bearer ${tokenA}` )
                .send( { title: 'User A Private Task' } );

            const userATaskId = createRes.body.id;

            // Register User B and get their token
            const authB = await registerAndGetToken( 'userb@example.com' );
            const tokenB = authB.token;

            // User B listing tasks sees an empty array (never User A's tasks)
            const listB = await request( app )
                .get( '/api/tasks' )
                .set( 'Authorization', `Bearer ${tokenB}` );

            expect( listB.status ).toBe( 200 );
            expect( listB.body ).toEqual( [] );

            // User B trying to GET User A's task ID gets 404
            const getB = await request( app )
                .get( `/api/tasks/${userATaskId}` )
                .set( 'Authorization', `Bearer ${tokenB}` );

            expect( getB.status ).toBe( 404 );

            // User B trying to PATCH User A's task gets a 404
            const patchB = await request( app )
                .patch( `/api/tasks/${userATaskId}` )
                .set( 'Authorization', `Bearer ${tokenB}` )
                .send( { title: 'Hacked by User B', completed: true } );

            expect( patchB.status ).toBe( 404 );

            // User B trying to DELETE User A's task gets a 404
            const deleteB = await request( app )
                .delete( `/api/tasks/${userATaskId}` )
                .set( 'Authorization', `Bearer ${tokenB}` );

            expect( deleteB.status ).toBe( 404 );

            // Verify User A's task is still completely intact
            const verifyA = await request( app )
                .get( `/api/tasks/${userATaskId}` )
                .set( 'Authorization', `Bearer ${tokenA}` );

            expect( verifyA.status ).toBe( 200 );
            expect( verifyA.body.title ).toBe( 'User A Private Task' );
            expect( verifyA.body.completed ).toBe( false );
        } );
    } );
} );
