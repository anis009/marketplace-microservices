"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.catchAsync = exports.notFoundHandler = exports.errorHandler = exports.AppError = void 0;
const zod_1 = require("zod");
const logger_1 = __importDefault(require("../utils/logger"));
const response_1 = require("../utils/response");
class AppError extends Error {
    constructor(message, statusCode) {
        super(message);
        this.statusCode = statusCode;
        this.isOperational = true;
        Error.captureStackTrace(this, this.constructor);
    }
}
exports.AppError = AppError;
const handleMongooseValidationError = (err) => {
    const errors = Object.values(err.errors).map((el) => el.message);
    const message = `Invalid input data. ${errors.join('. ')}`;
    return new AppError(message, 400);
};
const handleDuplicateKeyError = (err) => {
    const keyValue = err.keyValue || {};
    const field = Object.keys(keyValue)[0];
    const value = field ? keyValue[field] : 'unknown';
    const message = `Duplicate field value: ${field} = "${value}". Please use another value.`;
    return new AppError(message, 409);
};
const handleCastError = (err) => {
    const message = `Invalid ${err.path}: ${err.value}`;
    return new AppError(message, 400);
};
const handleJWTError = () => {
    return new AppError('Invalid token. Please log in again.', 401);
};
const handleJWTExpiredError = () => {
    return new AppError('Your token has expired. Please log in again.', 401);
};
const handleZodError = (err) => {
    const errors = err.issues.map((e) => ({
        field: e.path.join('.'),
        message: e.message,
    }));
    const error = new AppError('Validation failed', 400);
    error.errors = errors;
    return error;
};
const sendErrorDev = (err, res) => {
    logger_1.default.error('Error:', {
        message: err.message,
        stack: err.stack,
        statusCode: err.statusCode,
    });
    (0, response_1.sendError)(res, {
        statusCode: err.statusCode || 500,
        message: err.message,
        details: err.errors || undefined,
        stack: err.stack,
    });
};
const sendErrorProd = (err, res) => {
    if (err.isOperational) {
        (0, response_1.sendError)(res, {
            statusCode: err.statusCode,
            message: err.message,
            details: err.errors || undefined,
        });
    }
    else {
        logger_1.default.error('UNEXPECTED ERROR:', {
            message: err.message,
            stack: err.stack,
        });
        (0, response_1.sendError)(res, {
            statusCode: 500,
            message: 'Something went wrong. Please try again later.',
        });
    }
};
const errorHandler = (err, req, res, next) => {
    err.statusCode = err.statusCode || 500;
    err.status = err.status || 'error';
    if (process.env.NODE_ENV === 'development') {
        sendErrorDev(err, res);
    }
    else {
        let error = { ...err };
        error.message = err.message;
        if (err.name === 'ValidationError')
            error = handleMongooseValidationError(err);
        if (err.code === 11000)
            error = handleDuplicateKeyError(err);
        if (err.name === 'CastError')
            error = handleCastError(err);
        if (err.name === 'JsonWebTokenError')
            error = handleJWTError();
        if (err.name === 'TokenExpiredError')
            error = handleJWTExpiredError();
        if (err instanceof zod_1.ZodError)
            error = handleZodError(err);
        sendErrorProd(error, res);
    }
};
exports.errorHandler = errorHandler;
const notFoundHandler = (req, res, next) => {
    const err = new AppError(`Cannot find ${req.originalUrl} on this server`, 404);
    next(err);
};
exports.notFoundHandler = notFoundHandler;
const catchAsync = (fn) => {
    return (req, res, next) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
};
exports.catchAsync = catchAsync;
//# sourceMappingURL=errorHandler.js.map