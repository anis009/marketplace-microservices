import { Request, Response, NextFunction } from 'express';
import logger from '../logger';

// Custom error class
export class AppError extends Error {
  statusCode: number;
  isOperational: boolean;

  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

// Error response interface
interface ErrorResponse {
  success: false;
  error: {
    message: string;
    statusCode: number;
    stack?: string;
  };
}

// Send error response in development
const sendErrorDev = (err: any, res: Response): void => {
  const response: ErrorResponse = {
    success: false,
    error: {
      message: err.message,
      statusCode: err.statusCode || 500,
      stack: err.stack,
    },
  };

  logger.error('Error:', {
    message: err.message,
    stack: err.stack,
    statusCode: err.statusCode,
  });

  res.status(err.statusCode || 500).json(response);
};

// Send error response in production
const sendErrorProd = (err: any, res: Response): void => {
  // Operational, trusted error: send message to client
  if (err.isOperational) {
    const response: ErrorResponse = {
      success: false,
      error: {
        message: err.message,
        statusCode: err.statusCode,
      },
    };

    res.status(err.statusCode).json(response);
  } 
  // Programming or unknown error: don't leak error details
  else {
    logger.error('UNEXPECTED ERROR:', {
      message: err.message,
      stack: err.stack,
    });

    const response: ErrorResponse = {
      success: false,
      error: {
        message: 'Something went wrong. Please try again later.',
        statusCode: 500,
      },
    };

    res.status(500).json(response);
  }
};

// Global error handler middleware
export const errorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  if (process.env.NODE_ENV === 'development') {
    sendErrorDev(err, res);
  } else {
    sendErrorProd(err, res);
  }
};

// 404 handler for undefined routes
export const notFoundHandler = (req: Request, res: Response, next: NextFunction): void => {
  const err = new AppError(`Cannot find ${req.originalUrl} on this server`, 404);
  next(err);
};
