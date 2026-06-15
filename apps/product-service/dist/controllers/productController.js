"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteProduct = exports.updateProduct = exports.createProduct = exports.getProduct = exports.getAllProducts = void 0;
const Product_1 = __importDefault(require("../models/Product"));
const logger_1 = __importDefault(require("../shared/logger"));
const getAllProducts = async (req, res) => {
    try {
        const { category, page = 1, limit = 10 } = req.query;
        const query = { isActive: true };
        if (category)
            query.category = category;
        const products = await Product_1.default.find(query)
            .limit(Number(limit) * 1)
            .skip((Number(page) - 1) * Number(limit))
            .sort({ createdAt: -1 });
        const total = await Product_1.default.countDocuments(query);
        res.json({
            status: 'success',
            data: {
                items: products,
                totalPages: Math.ceil(total / Number(limit)),
                currentPage: Number(page),
                total
            }
        });
    }
    catch (error) {
        logger_1.default.error('Get products error:', error);
        res.status(500).json({
            status: 'error',
            message: 'Internal server error'
        });
    }
};
exports.getAllProducts = getAllProducts;
const getProduct = async (req, res) => {
    try {
        const product = await Product_1.default.findById(req.params.id);
        if (!product || !product.isActive) {
            res.status(404).json({
                status: 'error',
                message: 'Product not found'
            });
            return;
        }
        res.json({
            status: 'success',
            data: { product }
        });
    }
    catch (error) {
        logger_1.default.error('Get product error:', error);
        res.status(500).json({
            status: 'error',
            message: 'Internal server error'
        });
    }
};
exports.getProduct = getProduct;
const createProduct = async (req, res) => {
    try {
        const product = await Product_1.default.create(req.body);
        res.status(201).json({
            status: 'success',
            data: { product }
        });
    }
    catch (error) {
        logger_1.default.error('Create product error:', error);
        res.status(500).json({
            status: 'error',
            message: 'Internal server error'
        });
    }
};
exports.createProduct = createProduct;
const updateProduct = async (req, res) => {
    try {
        const product = await Product_1.default.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
        if (!product) {
            res.status(404).json({
                status: 'error',
                message: 'Product not found'
            });
            return;
        }
        res.json({
            status: 'success',
            data: { product }
        });
    }
    catch (error) {
        logger_1.default.error('Update product error:', error);
        res.status(500).json({
            status: 'error',
            message: 'Internal server error'
        });
    }
};
exports.updateProduct = updateProduct;
const deleteProduct = async (req, res) => {
    try {
        const product = await Product_1.default.findByIdAndUpdate(req.params.id, { isActive: false }, { new: true });
        if (!product) {
            res.status(404).json({
                status: 'error',
                message: 'Product not found'
            });
            return;
        }
        res.json({
            status: 'success',
            message: 'Product deleted successfully'
        });
    }
    catch (error) {
        logger_1.default.error('Delete product error:', error);
        res.status(500).json({
            status: 'error',
            message: 'Internal server error'
        });
    }
};
exports.deleteProduct = deleteProduct;
//# sourceMappingURL=productController.js.map