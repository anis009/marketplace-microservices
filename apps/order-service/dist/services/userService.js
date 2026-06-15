"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getUserById = void 0;
const axios_1 = __importDefault(require("axios"));
const config_1 = __importDefault(require("../shared/config"));
const logger_1 = __importDefault(require("../shared/logger"));
const getUserById = async (userId) => {
    try {
        const response = await axios_1.default.get(`${config_1.default.services.user}/api/users/${userId}`);
        if (response.data.status === 'success' && response.data.data?.user) {
            return response.data.data.user;
        }
        return null;
    }
    catch (error) {
        logger_1.default.error(`Failed to fetch user ${userId} from user-service:`, error);
        return null;
    }
};
exports.getUserById = getUserById;
//# sourceMappingURL=userService.js.map