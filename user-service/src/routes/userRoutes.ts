import express, { RequestHandler } from 'express';

import { getUser, login, register } from '../controllers/userController';
import { protect } from '../../../shared/middleware/auth';

const router = express.Router();

router.post('/register', register as unknown as RequestHandler);
router.post('/login', login as unknown as RequestHandler);
router.get('/:id', protect as unknown as RequestHandler, getUser as unknown as RequestHandler);

export const userRouter = router;