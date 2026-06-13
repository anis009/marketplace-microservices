"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.restrictTo = exports.protect = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const config_1 = __importDefault(require("../config"));
const logger_1 = __importDefault(require("../utils/logger"));
const roles_1 = require("../constants/roles");
const userRepository_1 = require("../repositories/userRepository");
const response_1 = require("../utils/response");
const protect = async (req, res, next) => {
    try {
        let token;
        if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
            token = req.headers.authorization.split(' ')[1];
        }
        if (!token) {
            (0, response_1.sendError)(res, {
                statusCode: 401,
                message: 'You are not logged in',
            });
            return;
        }
        const decoded = jsonwebtoken_1.default.verify(token, config_1.default.jwt.secret);
        const user = await (0, userRepository_1.findUserByIdWithoutPassword)(decoded.id);
        if (!user) {
            (0, response_1.sendError)(res, {
                statusCode: 401,
                message: 'User no longer exists',
            });
            return;
        }
        req.user = user;
        next();
    }
    catch (error) {
        logger_1.default.error('Auth middleware error:', error);
        (0, response_1.sendError)(res, {
            statusCode: 401,
            message: 'Invalid token',
        });
    }
};
exports.protect = protect;
const restrictTo = (...allowedRoles) => {
    return async (req, res, next) => {
        const authReq = req;
        if (!authReq.user) {
            (0, response_1.sendError)(res, {
                statusCode: 401,
                message: 'Authentication required',
            });
            return;
        }
        const userRole = authReq.user.role;
        const isAllowed = allowedRoles.some((allowed) => {
            return userRole === allowed || (0, roles_1.hasHigherPrivilege)(userRole, allowed);
        });
        if (!isAllowed) {
            (0, response_1.sendError)(res, {
                statusCode: 403,
                message: `Access denied. Required role: ${allowedRoles.join(' or ')}`,
            });
            return;
        }
        next();
    };
};
exports.restrictTo = restrictTo;
//# sourceMappingURL=auth.js.map