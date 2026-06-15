"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.protect = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const config_1 = __importDefault(require("../config"));
const logger_1 = __importDefault(require("../logger"));
const protect = async (req, res, next) => {
    try {
        let token;
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
        const decoded = jsonwebtoken_1.default.verify(token, config_1.default.jwt.secret);
        if (decoded.type === 'refresh') {
            res.status(401).json({
                status: 'error',
                message: 'Invalid token'
            });
            return;
        }
        // In a real microservice, you would call the user service to verify the user
        // For now, we'll just attach the user ID to the request
        req.user = { _id: decoded.id };
        next();
    }
    catch (error) {
        logger_1.default.error('Auth middleware error:', error);
        res.status(401).json({
            status: 'error',
            message: 'Invalid token'
        });
    }
};
exports.protect = protect;
