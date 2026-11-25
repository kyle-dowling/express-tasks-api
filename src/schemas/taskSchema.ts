import { z } from 'zod';

export const createTaskSchema = z.object( {
    body: z.object( {
        title: z.string( { message: 'Title is required and must be a string' } ).trim().min( 1, 'Title cannont be empty' ),
        completed: z.boolean().optional().default( false ),
    } ),
} );

export const updateTaskSchema = z.object( {
    params: z.object( {
        id: z.string().regex( /^\d+$/, 'Task ID must be a positive integer' ),
    } ),
    body: z.object( {
        title: z.string( { message: 'Title must be a string ' } )
            .trim()
            .min( 1, 'Title cannot be empty' )
            .optional(),
        completed: z.boolean( { message: 'Completed must be a boolean' } ).optional(),
    } )
        .refine( data => data.title !== undefined || data.completed !== undefined, {
            message: 'At least one field (title or completed) must be provided',
        } )
} );

export const taskIdParamSchema = z.object( {
    params: z.object( {
        id: z.string().regex( /^\d+$/, 'Task ID must be a positive integer' ),
    } ),
} );

// Automatically inferred TypeScript types
export type CreateTaskInput = z.infer<typeof createTaskSchema>['body'];
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>['body'];
