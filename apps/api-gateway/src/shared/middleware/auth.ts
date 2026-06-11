import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AuthRequest } from '../types';
import config from '../config';
import logger from '../logger';

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
    
    // In a real microservice, you would call the user service to verify the user
    // For now, we'll just attach the user ID to the request
    (req as AuthRequest).user = { _id: decoded.id } as any;
    
    next();
  } catch (error) {
    logger.error('Auth middleware error:', error);
    res.status(401).json({
      status: 'error',
      message: 'Invalid token'
    });
  }
};