"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.notFoundHandler = exports.errorHandler = exports.AppError = void 0;
const logger_1 = __importDefault(require("../logger"));
// Custom error class
class AppError extends Error {
    constructor(message, statusCode) {
        super(message);
        this.statusCode = statusCode;
        this.isOperational = true;
        Error.captureStackTrace(this, this.constructor);
    }
}
exports.AppError = AppError;
// Send error response in development
const sendErrorDev = (err, res) => {
    const response = {
        success: false,
        error: {
            message: err.message,
            statusCode: err.statusCode || 500,
            stack: err.stack,
        },
    };
    logger_1.default.error('Error:', {
        message: err.message,
        stack: err.stack,
        statusCode: err.statusCode,
    });
    res.status(err.statusCode || 500).json(response);
};
// Send error response in production
const sendErrorProd = (err, res) => {
    // Operational, trusted error: send message to client
    if (err.isOperational) {
        const response = {
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
        logger_1.default.error('UNEXPECTED ERROR:', {
            message: err.message,
            stack: err.stack,
        });
        const response = {
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
const errorHandler = (err, req, res, next) => {
    err.statusCode = err.statusCode || 500;
    err.status = err.status || 'error';
    if (process.env.NODE_ENV === 'development') {
        sendErrorDev(err, res);
    }
    else {
        sendErrorProd(err, res);
    }
};
exports.errorHandler = errorHandler;
// 404 handler for undefined routes
const notFoundHandler = (req, res, next) => {
    const err = new AppError(`Cannot find ${req.originalUrl} on this server`, 404);
    next(err);
};
exports.notFoundHandler = notFoundHandler;
