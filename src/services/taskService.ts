import { pool } from '../db.js';
import { AppError } from '../utils/AppError.js';
import type { Task } from '../types/task.js';
import type { CreateTaskInput, UpdateTaskInput } from '../schemas/taskSchema.js';

export const getAllTasks = async ( userId: string ): Promise<Task[]> => {
    const { rows } = await pool.query<Task>( 'SELECT * FROM tasks WHERE user_id = $1 ORDER BY id ASC', [userId] );
    return rows;
};

export const getTaskById = async ( id: string, userId: string ): Promise<Task> => {
    const { rows } = await pool.query<Task>( 'SELECT * FROM tasks WHERE id = $1 and user_id = $2', [id, userId] );
    if ( rows.length === 0 ) {
        throw new AppError( `Task with ID ${id} not found`, 404 );
    }
    return rows[0];
};

export const createTask = async ( { title, completed = false }: CreateTaskInput, userId: string ): Promise<Task> => {
    const { rows } = await pool.query<Task>(
        'INSERT INTO tasks (title, completed, user_id) VALUES ($1, $2, $3) RETURNING *',
        [title, completed, userId]
    );
    return rows[0];
};

export const updateTask = async ( id: string, { title, completed }: UpdateTaskInput, userId: string ) => {
    // COALESCE keeps the existing column value if undefined/null is passed
    const { rows } = await pool.query<Task>(
        `UPDATE tasks 
         SET title = COALESCE($1, title),
             completed = COALESCE($2, completed)
        WHERE id = $3 and user_id = $4
        RETURNING *`,
        [title ?? null, completed ?? null, id, userId]
    );

    if ( rows.length === 0 ) {
        throw new AppError( `Task with ID ${id} not found`, 404 );
    }
    return rows[0];
};

export const deleteTask = async ( id: string, userId: string ): Promise<Task> => {
    const { rows } = await pool.query<Task>( 'DELETE FROM tasks WHERE id = $1 and user_id = $2 RETURNING *', [id, userId] );

    if ( rows.length === 0 ) {
        throw new AppError( `Task with ID ${id} not found`, 404 );
    }
    return rows[0];
};
