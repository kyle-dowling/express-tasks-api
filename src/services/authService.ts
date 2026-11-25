import bcrypt from 'bcrypt';
import jwt, { type SignOptions } from 'jsonwebtoken';
import { pool } from '../db.js';
import { AppError } from '../utils/AppError.js';
import type { AuthInput } from '../schemas/authSchema.js';

interface UserRow {
    id: string;
    email: string;
    password_hash: string;
    created_at: Date;
}

interface AuthResponse {
    user: {
        id: string;
        email: string;
        created_at: Date;
    };
    token: string;
}

const SALT_ROUNDS = 12;

const signToken = ( userId: string, email: string ): string => {
    const secret = process.env.JWT_SECRET;
    if ( !secret ) {
        throw new Error( 'JWT_SECRET environment varibale is not defined' );
    }

    const options: SignOptions = {
        expiresIn: ( process.env.JWT_EXPIRES_IN as SignOptions['expiresIn'] ) || '1d',
    };

    return jwt.sign( { sub: userId, email }, secret, options );
}

export const registerUser = async ( { email, password }: AuthInput ): Promise<AuthResponse> => {
    const passwordHash = await bcrypt.hash( password, SALT_ROUNDS );

    const { rows } = await pool.query<Omit<UserRow, 'password_hash'>>(
        `INSERT INTO users (email, password_hash)
        VALUES ($1, $2)
        RETURNING id, email, created_at`,
        [email, passwordHash]
    );

    const user = rows[0];
    const token = signToken( user.id, user.email );

    return { user, token };
};

export const loginUser = async ( { email, password }: AuthInput ): Promise<AuthResponse> => {
    const { rows } = await pool.query<UserRow>(
        `SELECT id, email, password_hash, created_at
        FROM users
        WHERE email = $1`,
        [email]
    );

    const user = rows[0];

    if ( !user ) {
        throw new AppError( 'Invalid email or password', 401 );
    }

    const isPasswordValid = await bcrypt.compare( password, user.password_hash );

    if ( !isPasswordValid ) {
        throw new AppError( 'Invalid email or password', 401 );
    }

    const token = signToken( user.id, user.email );

    return {
        user: {
            id: user.id,
            email: user.email,
            created_at: user.created_at,
        },
        token,
    };
};
