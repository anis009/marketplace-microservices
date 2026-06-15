"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const orderController_1 = require("@/controllers/orderController");
const express_1 = __importDefault(require("express"));
const auth_1 = require("../shared/middleware/auth");
const validate_1 = require("../shared/middleware/validate");
const order_validation_1 = require("../validations/order.validation");
const router = express_1.default.Router();
router.post('/', auth_1.protect, (0, validate_1.validate)(order_validation_1.createOrderSchema), orderController_1.createOrder);
router.get('/user', auth_1.protect, orderController_1.getUserOrders);
router.get('/:id', auth_1.protect, orderController_1.getOrder);
router.put('/:id/status', auth_1.protect, (0, validate_1.validate)(order_validation_1.updateOrderStatusSchema), orderController_1.updateOrderStatus);
exports.default = router;
//# sourceMappingURL=orderRoutes.js.map