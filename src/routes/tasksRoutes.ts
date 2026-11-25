import { Router } from 'express';
import { getTask, getTasks, createTask, updateTask, deleteTask } from '../controllers/taskController.js';
import { validate } from '../middleware/validate.js';
import { createTaskSchema, updateTaskSchema, taskIdParamSchema } from '../schemas/taskSchema.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

router.use( authenticate );

router.get( '/', getTasks );
router.get( '/:id', validate( taskIdParamSchema ), getTask );
router.post( '/', validate( createTaskSchema ), createTask );
router.patch( '/:id', validate( updateTaskSchema ), updateTask );
router.delete( '/:id', validate( taskIdParamSchema ), deleteTask );

export default router;
