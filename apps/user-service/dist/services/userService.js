"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAllUsers = exports.updateUserRoleById = exports.updateUserProfileById = exports.getAvailableRoles = exports.getUserById = exports.loginUser = exports.registerUser = exports.UserServiceError = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const config_1 = __importDefault(require("../config"));
const logger_1 = __importDefault(require("../utils/logger"));
const userRepository_1 = require("../repositories/userRepository");
const roles_1 = require("../constants/roles");
class UserServiceError extends Error {
    constructor(message, statusCode) {
        super(message);
        this.statusCode = statusCode;
    }
}
exports.UserServiceError = UserServiceError;
const signAccessToken = (id) => {
    const options = {
        expiresIn: config_1.default.jwt.accessExpiresIn,
    };
    return jsonwebtoken_1.default.sign({ id, type: 'access' }, config_1.default.jwt.accessSecret, {
        ...options,
    });
};
const signRefreshToken = (id) => {
    const options = {
        expiresIn: config_1.default.jwt.refreshExpiresIn,
    };
    return jsonwebtoken_1.default.sign({ id, type: 'refresh' }, config_1.default.jwt.refreshSecret, {
        ...options,
    });
};
const createAuthTokens = (id) => {
    return {
        accessToken: signAccessToken(id),
        refreshToken: signRefreshToken(id),
    };
};
const toAuthUser = (user) => ({
    id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    avatar: user.avatar ?? null,
    lastLogin: user.lastLogin ?? null,
});
const registerUser = async ({ name, email, password, avatar }) => {
    const existingUser = await (0, userRepository_1.findUserByEmail)(email);
    if (existingUser) {
        throw new UserServiceError('User already exists with this email', 400);
    }
    const user = await (0, userRepository_1.createUser)({
        name,
        email,
        password,
        avatar,
    });
    return {
        user: toAuthUser(user),
        ...createAuthTokens(user._id.toString()),
    };
};
exports.registerUser = registerUser;
const loginUser = async ({ email, password }) => {
    if (!email || !password) {
        throw new UserServiceError('Please provide email and password', 400);
    }
    const user = await (0, userRepository_1.findUserByEmailWithPassword)(email);
    if (!user || !(await user.correctPassword(password, user.password))) {
        throw new UserServiceError('Incorrect email or password', 401);
    }
    const updatedUser = await (0, userRepository_1.saveUserLastLogin)(user);
    return {
        user: toAuthUser(updatedUser),
        ...createAuthTokens(updatedUser._id.toString()),
    };
};
exports.loginUser = loginUser;
const getUserById = async (id) => {
    const user = await (0, userRepository_1.findUserByIdWithoutPassword)(id);
    if (!user) {
        throw new UserServiceError('User not found', 404);
    }
    return user;
};
exports.getUserById = getUserById;
const getAvailableRoles = () => roles_1.VALID_ROLES;
exports.getAvailableRoles = getAvailableRoles;
const updateUserProfileById = async ({ requesterId, requesterRole, targetUserId, name, email, password, avatar, }) => {
    if (!requesterId) {
        throw new UserServiceError('Authentication required', 401);
    }
    const isSelf = requesterId === targetUserId;
    const canManageUsers = requesterRole === roles_1.ROLES.ADMIN || requesterRole === roles_1.ROLES.SUPER_ADMIN;
    if (!isSelf && !canManageUsers) {
        throw new UserServiceError('You do not have permission to update this user', 403);
    }
    const hasUpdates = [name, email, password, avatar].some((value) => value !== undefined);
    if (!hasUpdates) {
        throw new UserServiceError('No update fields provided', 400);
    }
    if (email) {
        const existingUser = await (0, userRepository_1.findUserByEmail)(email);
        if (existingUser && existingUser._id.toString() !== targetUserId) {
            throw new UserServiceError('User already exists with this email', 400);
        }
    }
    const updatedUser = await (0, userRepository_1.updateUserById)(targetUserId, {
        name,
        email,
        password,
        avatar,
    });
    if (!updatedUser) {
        throw new UserServiceError('User not found', 404);
    }
    return toAuthUser(updatedUser);
};
exports.updateUserProfileById = updateUserProfileById;
const updateUserRoleById = async ({ assignerId, assignerRole, targetUserId, newRole, }) => {
    if (!newRole || !roles_1.VALID_ROLES.includes(newRole)) {
        throw new UserServiceError(`Invalid role. Valid roles: ${roles_1.VALID_ROLES.join(', ')}`, 400);
    }
    if (assignerId === targetUserId) {
        throw new UserServiceError('You cannot change your own role', 400);
    }
    if (!(0, roles_1.canAssignRole)(assignerRole, newRole)) {
        throw new UserServiceError(`You do not have permission to assign the '${newRole}' role`, 403);
    }
    const targetUser = await (0, userRepository_1.findUserById)(targetUserId);
    if (!targetUser) {
        throw new UserServiceError('Target user not found', 404);
    }
    if (assignerRole !== roles_1.ROLES.SUPER_ADMIN &&
        (0, roles_1.hasHigherPrivilege)(targetUser.role, assignerRole)) {
        throw new UserServiceError('Cannot modify a user with equal or higher privilege', 403);
    }
    const oldRole = targetUser.role;
    const updatedUser = await (0, userRepository_1.saveUserRole)(targetUser, newRole);
    logger_1.default.info(`Role updated: User ${targetUserId} ${oldRole} -> ${newRole} by ${assignerId}`);
    return toAuthUser(updatedUser);
};
exports.updateUserRoleById = updateUserRoleById;
const getAllUsers = async ({ page, limit }) => {
    const skip = (page - 1) * limit;
    const users = await (0, userRepository_1.findAllUsers)({ skip, limit });
    const total = await (0, userRepository_1.countUsers)();
    return {
        users,
        pagination: {
            currentPage: page,
            totalPages: Math.ceil(total / limit),
            total,
        },
    };
};
exports.getAllUsers = getAllUsers;
//# sourceMappingURL=userService.js.map