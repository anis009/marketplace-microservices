import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import User from '../../models/User';
import { AuthRequest } from '../types';
import config from '../config';
import logger from '../logger';
import { Role, hasHigherPrivilege } from '../config/roles.config';

// JWT-based auth: verifies token → fetches full user → attaches to request
export const protect = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    let token: string | undefined;
    
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      res.status(401).json({
        status: 'error',
        message: 'You are not logged in'
      });
      return;
    }

    const decoded = jwt.verify(token, config.jwt.secret) as { id: string };
    
    // Fetch the full user from DB to get current role (handles role changes after login)
    const user = await User.findById(decoded.id).select('-password');
    if (!user) {
      res.status(401).json({
        status: 'error',
        message: 'User no longer exists'
      });
      return;
    }

    (req as AuthRequest).user = user as any;
    
    next();
  } catch (error) {
    logger.error('Auth middleware error:', error);
    res.status(401).json({
      status: 'error',
      message: 'Invalid token'
    });
  }
};

/**
 * Role-based access control middleware.
 * Must be used AFTER `protect` middleware.
 * 
 * Usage:
 *   router.get('/admin-only', protect, restrictTo('admin'), handler)
 *   router.delete('/users/:id', protect, restrictTo('super-admin'), handler)
 *   router.put('/manage', protect, restrictTo('admin', 'super-admin'), handler)
 */
export const restrictTo = (...allowedRoles: Role[]) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const authReq = req as AuthRequest;

    if (!authReq.user) {
      res.status(401).json({
        status: 'error',
        message: 'Authentication required'
      });
      return;
    }

    const userRole = authReq.user.role as Role;

    // Check if user's role is in the allowed list, or if they have higher privilege
    const isAllowed = allowedRoles.some((allowed) => {
      return userRole === allowed || hasHigherPrivilege(userRole, allowed);
    });

    if (!isAllowed) {
      res.status(403).json({
        status: 'error',
        message: `Access denied. Required role: ${allowedRoles.join(' or ')}`
      });
      return;
    }

    next();
  };
};