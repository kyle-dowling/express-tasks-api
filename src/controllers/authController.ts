import type { Request, Response } from 'express';
import { registerUser, loginUser } from '../services/authService.js';
import type { AuthInput } from '../schemas/authSchema.js';

export const register = async (
    req: Request<unknown, unknown, AuthInput>,
    res: Response
): Promise<void> => {
    const result = await registerUser( req.body );
    res.status( 201 ).json( {
        status: 'success',
        data: result,
    } );
};

export const login = async (
    req: Request<unknown, unknown, AuthInput>,
    res: Response
): Promise<void> => {
    const result = await loginUser( req.body );
    res.status( 200 ).json( {
        status: 'success',
        data: result,
    } );
};
