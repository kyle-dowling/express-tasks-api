import { Router } from 'express';
import { register, login } from '../controllers/authController.js';
import { validate } from '../middleware/validate.js';
import { authSchema } from '../schemas/authSchema.js';

const router = Router();

router.post( '/register', validate( authSchema ), register );
router.post( '/login', validate( authSchema ), login );

export default router;
