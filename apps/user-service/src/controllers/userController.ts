import { Request, Response } from 'express';
import { AuthRequest } from '../types';
import logger from '../utils/logger';
import { sendError, sendSuccess } from '../utils/response';
import {
  UserServiceError,
  registerUser,
  loginUser,
  getUserById,
  getAvailableRoles,
  updateUserRoleById,
  getAllUsers as getAllUsersService,
} from '../services/userService';
import { Role } from '../constants/roles';

const sendControllerError = (res: Response, logMessage: string, error: unknown): void => {
  logger.error(logMessage, error);

  if (error instanceof UserServiceError) {
    sendError(res, {
      statusCode: error.statusCode,
      message: error.message,
    });
    return;
  }

  sendError(res, {
    statusCode: 500,
    message: 'Internal server error',
  });
};

export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, email, password } = req.body;
    const data = await registerUser({
      name,
      email,
      password,
    });

    sendSuccess(res, {
      statusCode: 201,
      message: 'User registered successfully',
      data,
    });
  } catch (error) {
    sendControllerError(res, 'Registration error:', error);
  }
};

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;
    const data = await loginUser({ email, password });

    sendSuccess(res, {
      message: 'Login successful',
      data,
    });
  } catch (error) {
    sendControllerError(res, 'Login error:', error);
  }
};

export const getUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.params.id;
    if (!userId) {
      throw new UserServiceError('User ID is required', 400);
    }

    const user = await getUserById(userId);

    sendSuccess(res, {
      message: 'User fetched successfully',
      data: { user },
    });
  } catch (error) {
    sendControllerError(res, 'Get user error:', error);
  }
};

/**
 * GET /api/users/roles — List all available roles
 */
export const getRoles = async (req: Request, res: Response): Promise<void> => {
  try {
    sendSuccess(res, {
      message: 'Roles fetched successfully',
      data: { roles: getAvailableRoles() },
    });
  } catch (error) {
    sendControllerError(res, 'Get roles error:', error);
  }
};

/**
 * PATCH /api/users/:id/role — Update a user's role (admin / super-admin only)
 * Body: { role: Role }
 */
export const updateUserRole = async (req: Request, res: Response): Promise<void> => {
  try {
    const authReq = req as AuthRequest;
    const targetUserId = req.params.id;
    if (!targetUserId) {
      throw new UserServiceError('User ID is required', 400);
    }

    const user = await updateUserRoleById({
      assignerId: authReq.user?._id?.toString(),
      assignerRole: authReq.user?.role as Role,
      targetUserId,
      newRole: req.body.role as Role,
    });

    sendSuccess(res, {
      message: 'User role updated successfully',
      data: { user },
    });
  } catch (error) {
    sendControllerError(res, 'Update user role error:', error);
  }
};

/**
 * GET /api/users/ — List all users (admin / super-admin only)
 */
export const getAllUsers = async (req: Request, res: Response): Promise<void> => {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 20;
    const data = await getAllUsersService({ page, limit });

    sendSuccess(res, {
      message: 'Users fetched successfully',
      data,
    });
  } catch (error) {
    sendControllerError(res, 'Get all users error:', error);
  }
};
