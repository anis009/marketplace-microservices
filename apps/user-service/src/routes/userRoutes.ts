import express, { RequestHandler } from 'express';

import { getUser, login, register } from '../controllers/userController';
import { protect } from '../shared/middleware/auth';
import { validate } from '../shared/middleware/validate';
import { registerSchema, loginSchema } from '../validations/user.validation';

const router = express.Router();

router.post('/register', validate(registerSchema), register as unknown as RequestHandler);
router.post('/login', validate(loginSchema), login as unknown as RequestHandler);
router.get('/:id', protect as unknown as RequestHandler, getUser as unknown as RequestHandler);

export const userRouter = router;