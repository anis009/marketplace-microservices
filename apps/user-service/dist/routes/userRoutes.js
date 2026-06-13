"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.userRouter = void 0;
const express_1 = __importDefault(require("express"));
const userController_1 = require("../controllers/userController");
const auth_1 = require("../middleware/auth");
const validate_1 = require("../middleware/validate");
const user_validation_1 = require("../validators/user.validation");
const roles_1 = require("../constants/roles");
const router = express_1.default.Router();
router.post('/register', (0, validate_1.validate)(user_validation_1.registerSchema), userController_1.register);
router.post('/login', (0, validate_1.validate)(user_validation_1.loginSchema), userController_1.login);
router.get('/roles', auth_1.protect, userController_1.getRoles);
router.get('/', auth_1.protect, (0, auth_1.restrictTo)(roles_1.ROLES.ADMIN, roles_1.ROLES.SUPER_ADMIN), (0, validate_1.validate)(user_validation_1.listUsersQuerySchema, 'query'), userController_1.getAllUsers);
router.get('/:id', auth_1.protect, userController_1.getUser);
router.patch('/:id/role', auth_1.protect, (0, auth_1.restrictTo)(roles_1.ROLES.ADMIN, roles_1.ROLES.SUPER_ADMIN), (0, validate_1.validate)(user_validation_1.updateRoleSchema), userController_1.updateUserRole);
exports.userRouter = router;
//# sourceMappingURL=userRoutes.js.map