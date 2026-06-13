import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import logger from '../utils/logger';
import { sendError } from '../utils/response';

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

// Handle Mongoose validation errors
const handleMongooseValidationError = (err: any): AppError => {
  const errors = Object.values(err.errors).map((el: any) => el.message);
  const message = `Invalid input data. ${errors.join('. ')}`;
  return new AppError(message, 400);
};

// Handle Mongoose duplicate key errors
const handleDuplicateKeyError = (err: any): AppError => {
  const keyValue = err.keyValue || {};
  const field = Object.keys(keyValue)[0];
  const value = field ? keyValue[field] : 'unknown';
  const message = `Duplicate field value: ${field} = "${value}". Please use another value.`;
  return new AppError(message, 409);
};

// Handle Mongoose cast errors (invalid ObjectId, etc.)
const handleCastError = (err: any): AppError => {
  const message = `Invalid ${err.path}: ${err.value}`;
  return new AppError(message, 400);
};

// Handle JWT errors
const handleJWTError = (): AppError => {
  return new AppError('Invalid token. Please log in again.', 401);
};

const handleJWTExpiredError = (): AppError => {
  return new AppError('Your token has expired. Please log in again.', 401);
};

// Handle Zod validation errors
const handleZodError = (err: ZodError): AppError => {
  const errors = err.issues.map((e: any) => ({
    field: e.path.join('.'),
    message: e.message,
  }));
  
  const error = new AppError('Validation failed', 400);
  (error as any).errors = errors;
  return error;
};

// Send error response in development
const sendErrorDev = (err: any, res: Response): void => {
  logger.error('Error:', {
    message: err.message,
    stack: err.stack,
    statusCode: err.statusCode,
  });

  sendError(res, {
    statusCode: err.statusCode || 500,
    message: err.message,
    details: err.errors || undefined,
    stack: err.stack,
  });
};

// Send error response in production
const sendErrorProd = (err: any, res: Response): void => {
  // Operational, trusted error: send message to client
  if (err.isOperational) {
    sendError(res, {
      statusCode: err.statusCode,
      message: err.message,
      details: err.errors || undefined,
    });
  } 
  // Programming or unknown error: don't leak error details
  else {
    logger.error('UNEXPECTED ERROR:', {
      message: err.message,
      stack: err.stack,
    });

    sendError(res, {
      statusCode: 500,
      message: 'Something went wrong. Please try again later.',
    });
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
    let error = { ...err };
    error.message = err.message;

    // Handle specific error types
    if (err.name === 'ValidationError') error = handleMongooseValidationError(err);
    if (err.code === 11000) error = handleDuplicateKeyError(err);
    if (err.name === 'CastError') error = handleCastError(err);
    if (err.name === 'JsonWebTokenError') error = handleJWTError();
    if (err.name === 'TokenExpiredError') error = handleJWTExpiredError();
    if (err instanceof ZodError) error = handleZodError(err);

    sendErrorProd(error, res);
  }
};

// 404 handler for undefined routes
export const notFoundHandler = (req: Request, res: Response, next: NextFunction): void => {
  const err = new AppError(`Cannot find ${req.originalUrl} on this server`, 404);
  next(err);
};

// Async error wrapper to catch errors in async route handlers
export const catchAsync = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};
