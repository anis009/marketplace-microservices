"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.listUsersQuerySchema = exports.mongoIdSchema = exports.updateRoleSchema = exports.updateUserSchema = exports.loginSchema = exports.registerSchema = void 0;
const zod_1 = require("zod");
const roles_1 = require("../constants/roles");
const passwordSchema = zod_1.z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number');
const emailSchema = zod_1.z
    .string()
    .email('Invalid email address')
    .toLowerCase()
    .trim();
const nameSchema = zod_1.z
    .string()
    .min(2, 'Name must be at least 2 characters')
    .max(50, 'Name must not exceed 50 characters')
    .trim();
const roleEnum = zod_1.z.enum(roles_1.VALID_ROLES);
exports.registerSchema = zod_1.z.object({
    name: nameSchema,
    email: emailSchema,
    password: passwordSchema,
});
exports.loginSchema = zod_1.z.object({
    email: emailSchema,
    password: zod_1.z.string().min(1, 'Password is required'),
});
exports.updateUserSchema = zod_1.z.object({
    name: nameSchema.optional(),
    email: emailSchema.optional(),
    password: passwordSchema.optional(),
});
exports.updateRoleSchema = zod_1.z.object({
    role: roleEnum,
});
exports.mongoIdSchema = zod_1.z.object({
    id: zod_1.z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid user ID'),
});
exports.listUsersQuerySchema = zod_1.z.object({
    page: zod_1.z.coerce.number().int().min(1).default(1).optional(),
    limit: zod_1.z.coerce.number().int().min(1).max(100).default(20).optional(),
});
//# sourceMappingURL=user.validation.js.map