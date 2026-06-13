import express, { RequestHandler } from 'express';

import {
  getUser,
  login,
  register,
  getRoles,
  updateUserRole,
  getAllUsers,
} from '../controllers/userController';
import { protect, restrictTo } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { registerSchema, loginSchema, updateRoleSchema, listUsersQuerySchema } from '../validators/user.validation';
import { ROLES } from '../constants/roles';

const router = express.Router();

// Public routes
router.post('/register', validate(registerSchema), register as unknown as RequestHandler);
router.post('/login', validate(loginSchema), login as unknown as RequestHandler);

// Authenticated routes
router.get('/roles', protect as unknown as RequestHandler, getRoles as unknown as RequestHandler);
router.get('/', protect as unknown as RequestHandler, restrictTo(ROLES.ADMIN, ROLES.SUPER_ADMIN) as unknown as RequestHandler, validate(listUsersQuerySchema, 'query'), getAllUsers as unknown as RequestHandler);
router.get('/:id', protect as unknown as RequestHandler, getUser as unknown as RequestHandler);

// Role management (admin / super-admin only)
router.patch('/:id/role', protect as unknown as RequestHandler, restrictTo(ROLES.ADMIN, ROLES.SUPER_ADMIN) as unknown as RequestHandler, validate(updateRoleSchema), updateUserRole as unknown as RequestHandler);

export const userRouter = router;
