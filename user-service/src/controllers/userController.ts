import { Request, Response, NextFunction, RequestHandler } from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User';
import { AuthRequest, ApiResponse } from '../shared/types';
import config from '../shared/config';
import logger from '../shared/logger';

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