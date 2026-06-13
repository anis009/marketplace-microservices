"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendError = exports.sendSuccess = void 0;
const sendSuccess = (res, { statusCode = 200, message = 'Success', data, } = {}) => {
    return res.status(statusCode).json({
        success: true,
        status: 'success',
        message,
        data,
    });
};
exports.sendSuccess = sendSuccess;
const sendError = (res, { statusCode = 500, message, details, stack, }) => {
    return res.status(statusCode).json({
        success: false,
        status: 'error',
        message,
        error: {
            statusCode,
            details,
            stack,
        },
    });
};
exports.sendError = sendError;
//# sourceMappingURL=response.js.map