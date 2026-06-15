"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateOrderStatus = exports.getOrder = exports.getUserOrders = exports.createOrder = void 0;
const Order_1 = __importDefault(require("../models/Order"));
const logger_1 = __importDefault(require("../shared/logger"));
const productService_1 = require("../services/productService");
const userService_1 = require("../services/userService");
const createOrder = async (req, res) => {
    try {
        const authReq = req;
        const { items, shippingAddress } = req.body;
        if (!authReq?.user?._id) {
            res.status(401).json({
                status: 'error',
                message: 'User not authenticated'
            });
            return;
        }
        const productIds = items.map((item) => item.productId);
        const productsMap = await (0, productService_1.getProductsByIds)(productIds);
        const orderItems = items.map((item) => {
            const product = productsMap.get(item.productId);
            if (!product) {
                throw new Error(`Product ${item.productId} not found`);
            }
            if (!product.isActive) {
                throw new Error(`Product ${product.name} is not available`);
            }
            if (product.stock < item.quantity) {
                throw new Error(`Insufficient stock for product ${product.name}`);
            }
            return {
                productId: item.productId,
                quantity: item.quantity,
                price: product.price,
                name: product.name
            };
        });
        const user = await (0, userService_1.getUserById)(authReq.user._id.toString());
        if (!user) {
            res.status(401).json({
                status: 'error',
                message: 'User not found'
            });
            return;
        }
        const order = await Order_1.default.create({
            userId: authReq.user._id.toString(),
            userDetails: {
                name: user.name,
                email: user.email
            },
            items: orderItems,
            shippingAddress
        });
        res.status(201).json({
            status: 'success',
            data: { order }
        });
    }
    catch (error) {
        logger_1.default.error('Create order error:', error);
        res.status(error.message?.includes('not found') || error.message?.includes('not available') ? 400 : 500).json({
            status: 'error',
            message: error.message || 'Internal server error'
        });
    }
};
exports.createOrder = createOrder;
const getUserOrders = async (req, res) => {
    try {
        const authReq = req;
        const orders = await Order_1.default.find({ userId: authReq.user?._id.toString() })
            .sort({ createdAt: -1 });
        res.json({
            status: 'success',
            data: { orders }
        });
    }
    catch (error) {
        logger_1.default.error('Get user orders error:', error);
        res.status(500).json({
            status: 'error',
            message: 'Internal server error'
        });
    }
};
exports.getUserOrders = getUserOrders;
const getOrder = async (req, res) => {
    try {
        const order = await Order_1.default.findById(req.params.id);
        if (!order) {
            res.status(404).json({
                status: 'error',
                message: 'Order not found'
            });
            return;
        }
        res.json({
            status: 'success',
            data: { order }
        });
    }
    catch (error) {
        logger_1.default.error('Get order error:', error);
        res.status(500).json({
            status: 'error',
            message: 'Internal server error'
        });
    }
};
exports.getOrder = getOrder;
const updateOrderStatus = async (req, res) => {
    try {
        const { status } = req.body;
        const order = await Order_1.default.findByIdAndUpdate(req.params.id, { status }, { new: true, runValidators: true });
        if (!order) {
            res.status(404).json({
                status: 'error',
                message: 'Order not found'
            });
            return;
        }
        res.json({
            status: 'success',
            data: { order }
        });
    }
    catch (error) {
        logger_1.default.error('Update order status error:', error);
        res.status(500).json({
            status: 'error',
            message: 'Internal server error'
        });
    }
};
exports.updateOrderStatus = updateOrderStatus;
//# sourceMappingURL=orderController.js.map