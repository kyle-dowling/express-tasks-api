import type { Request, Response } from 'express';
import type { Task } from '../types/task.js';
import type { CreateTaskInput, UpdateTaskInput } from '../schemas/taskSchema.js';
import * as taskService from '../services/taskService.js';

export const getTasks = async ( req: Request, res: Response<Task[]> ) => {
    const tasks = await taskService.getAllTasks( req.user!.id );
    res.json( tasks );
};

export const getTask = async ( req: Request, res: Response<Task> ) => {
    const task = await taskService.getTaskById( req.params.id as string, req.user!.id );
    res.json( task );
};

export const createTask = async ( req: Request<Record<string, string>, Task, CreateTaskInput>, res: Response<Task> ) => {
    const newTask = await taskService.createTask( req.body, req.user!.id );
    res.status( 201 ).json( newTask );
};

export const updateTask = async ( req: Request<Record<string, string>, Task, UpdateTaskInput>, res: Response<Task> ) => {
    const updatedTask = await taskService.updateTask( req.params.id as string, req.body, req.user!.id );
    res.json( updatedTask );
};

export const deleteTask = async ( req: Request, res: Response ) => {
    await taskService.deleteTask( req.params.id as string, req.user!.id );
    res.status( 204 ).send();
};
