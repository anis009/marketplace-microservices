import { Request, Response, NextFunction, RequestHandler } from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User';
import { AuthRequest, ApiResponse } from '../shared/types';
import config from '../shared/config';
import logger from '../shared/logger';
import {
  Role,
  ROLES,
  VALID_ROLES,
  canAssignRole,
  hasHigherPrivilege,
} from '../shared/config/roles.config';

const signToken = (id: string): string => {
  return jwt.sign({ id }, config.jwt.secret, {
    expiresIn: '24h'
  });
};

// Fix: Use RequestHandler type for all controllers
export const register = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name, email, password } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      res.status(400).json({
        status: 'error',
        message: 'User already exists with this email'
      } as ApiResponse);
      return;
    }
  

    const user = await User.create({
      name,
      email,
      password
    });

    const token = signToken(user._id.toString());

    res.status(201).json({
      status: 'success',
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role
        },
        token
      }
    } as ApiResponse);
  } catch (error) {
    logger.error('Registration error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Internal server error'
    } as ApiResponse);
  }
};

export const login = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({
        status: 'error',
        message: 'Please provide email and password'
      } as ApiResponse);
      return;
    }

    const user = await User.findOne({ email }).select('+password');
    
    if (!user || !(await user.correctPassword(password, user.password))) {
      res.status(401).json({
        status: 'error',
        message: 'Incorrect email or password'
      } as ApiResponse);
      return;
    }

   

    const token = signToken(user._id.toString());

    res.json({
      status: 'success',
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role
        },
        token
      }
    } as ApiResponse);
  } catch (error) {
    logger.error('Login error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Internal server error'
    } as ApiResponse);
  }
};

export const getUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authReq = req as AuthRequest;
    const user = await User.findById(req.params.id).select('-password');
    
    if (!user) {
      res.status(404).json({
        status: 'error',
        message: 'User not found'
      } as ApiResponse);
      return;
    }

    res.json({
      status: 'success',
      data: { user }
    } as ApiResponse);
  } catch (error) {
    logger.error('Get user error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Internal server error'
    } as ApiResponse);
  }
};


/**
 * GET /api/users/roles — List all available roles
 */
export const getRoles = async (req: Request, res: Response): Promise<void> => {
  try {
    res.json({
      status: 'success',
      data: { roles: VALID_ROLES },
    } as ApiResponse);
  } catch (error) {
    logger.error('Get roles error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Internal server error',
    } as ApiResponse);
  }
};

/**
 * PATCH /api/users/:id/role — Update a user's role (admin / super-admin only)
 * Body: { role: Role }
 */
export const updateUserRole = async (req: Request, res: Response): Promise<void> => {
  try {
    const authReq = req as AuthRequest;
    const assignerRole = authReq.user?.role as Role;
    const targetUserId = req.params.id;
    const { role: newRole } = req.body;

    // Validate the target role
    if (!newRole || !VALID_ROLES.includes(newRole)) {
      res.status(400).json({
        status: 'error',
        message: `Invalid role. Valid roles: ${VALID_ROLES.join(', ')}`,
      } as ApiResponse);
      return;
    }

    // Prevent self role change
    if (authReq.user?._id?.toString() === targetUserId) {
      res.status(400).json({
        status: 'error',
        message: 'You cannot change your own role',
      } as ApiResponse);
      return;
    }

    // Check if the assigner has permission to assign this role
    if (!canAssignRole(assignerRole, newRole)) {
      res.status(403).json({
        status: 'error',
        message: `You do not have permission to assign the '${newRole}' role`,
      } as ApiResponse);
      return;
    }

    // Find the target user
    const targetUser = await User.findById(targetUserId);
    if (!targetUser) {
      res.status(404).json({
        status: 'error',
        message: 'Target user not found',
      } as ApiResponse);
      return;
    }

    //TODO: Prevent assigning a role equal or higher than your own (unless super-admin)
    if (
      assignerRole !== ROLES.SUPER_ADMIN &&
      hasHigherPrivilege(targetUser.role as Role, assignerRole)
    ) {
      res.status(403).json({
        status: 'error',
        message: 'Cannot modify a user with equal or higher privilege',
      } as ApiResponse);
      return;
    }

    const oldRole = targetUser.role;
    targetUser.role = newRole;
    await targetUser.save();

    logger.info(`Role updated: User ${targetUserId} ${oldRole} → ${newRole} by ${authReq.user?._id}`);

    res.json({
      status: 'success',
      data: {
        user: {
          id: targetUser._id,
          name: targetUser.name,
          email: targetUser.email,
          role: targetUser.role,
        },
      },
    } as ApiResponse);
  } catch (error) {
    logger.error('Update user role error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Internal server error',
    } as ApiResponse);
  }
};

/**
 * GET /api/users/ — List all users (admin / super-admin only)
 */
export const getAllUsers = async (req: Request, res: Response): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;

    const users = await User.find()
      .select('-password')
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });

    const total = await User.countDocuments();

    res.json({
      status: 'success',
      data: {
        users,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(total / limit),
          total,
        },
      },
    } as ApiResponse);
  } catch (error) {
    logger.error('Get all users error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Internal server error',
    } as ApiResponse);
  }
};