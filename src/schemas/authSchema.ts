import { z } from 'zod';

export const authSchema = z.object( {
    body: z.object( {
        email: z.string().trim().toLowerCase().pipe( z.email() ),
        password: z.string().min( 8, 'Password must be at least 8 characters' ),
    } ),
} );

export type AuthInput = z.infer<typeof authSchema>['body'];
