"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAllUsers = exports.updateUserRole = exports.getRoles = exports.getUser = exports.login = exports.register = void 0;
const logger_1 = __importDefault(require("../utils/logger"));
const response_1 = require("../utils/response");
const userService_1 = require("../services/userService");
const sendControllerError = (res, logMessage, error) => {
    logger_1.default.error(logMessage, error);
    if (error instanceof userService_1.UserServiceError) {
        (0, response_1.sendError)(res, {
            statusCode: error.statusCode,
            message: error.message,
        });
        return;
    }
    (0, response_1.sendError)(res, {
        statusCode: 500,
        message: 'Internal server error',
    });
};
const register = async (req, res) => {
    try {
        const { name, email, password } = req.body;
        const data = await (0, userService_1.registerUser)({
            name,
            email,
            password,
        });
        (0, response_1.sendSuccess)(res, {
            statusCode: 201,
            message: 'User registered successfully',
            data,
        });
    }
    catch (error) {
        sendControllerError(res, 'Registration error:', error);
    }
};
exports.register = register;
const login = async (req, res) => {
    try {
        const { email, password } = req.body;
        const data = await (0, userService_1.loginUser)({ email, password });
        (0, response_1.sendSuccess)(res, {
            message: 'Login successful',
            data,
        });
    }
    catch (error) {
        sendControllerError(res, 'Login error:', error);
    }
};
exports.login = login;
const getUser = async (req, res) => {
    try {
        const userId = req.params.id;
        if (!userId) {
            throw new userService_1.UserServiceError('User ID is required', 400);
        }
        const user = await (0, userService_1.getUserById)(userId);
        (0, response_1.sendSuccess)(res, {
            message: 'User fetched successfully',
            data: { user },
        });
    }
    catch (error) {
        sendControllerError(res, 'Get user error:', error);
    }
};
exports.getUser = getUser;
const getRoles = async (req, res) => {
    try {
        (0, response_1.sendSuccess)(res, {
            message: 'Roles fetched successfully',
            data: { roles: (0, userService_1.getAvailableRoles)() },
        });
    }
    catch (error) {
        sendControllerError(res, 'Get roles error:', error);
    }
};
exports.getRoles = getRoles;
const updateUserRole = async (req, res) => {
    try {
        const authReq = req;
        const targetUserId = req.params.id;
        if (!targetUserId) {
            throw new userService_1.UserServiceError('User ID is required', 400);
        }
        const user = await (0, userService_1.updateUserRoleById)({
            assignerId: authReq.user?._id?.toString(),
            assignerRole: authReq.user?.role,
            targetUserId,
            newRole: req.body.role,
        });
        (0, response_1.sendSuccess)(res, {
            message: 'User role updated successfully',
            data: { user },
        });
    }
    catch (error) {
        sendControllerError(res, 'Update user role error:', error);
    }
};
exports.updateUserRole = updateUserRole;
const getAllUsers = async (req, res) => {
    try {
        const page = Number(req.query.page) || 1;
        const limit = Number(req.query.limit) || 20;
        const data = await (0, userService_1.getAllUsers)({ page, limit });
        (0, response_1.sendSuccess)(res, {
            message: 'Users fetched successfully',
            data,
        });
    }
    catch (error) {
        sendControllerError(res, 'Get all users error:', error);
    }
};
exports.getAllUsers = getAllUsers;
//# sourceMappingURL=userController.js.map