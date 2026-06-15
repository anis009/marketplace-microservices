"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const http_proxy_middleware_1 = require("http-proxy-middleware");
const logger_1 = __importDefault(require("./shared/logger"));
const config_1 = __importDefault(require("./shared/config"));
const errorHandler_1 = require("./shared/middleware/errorHandler");
const app = (0, express_1.default)();
app.use(express_1.default.json());
app.get('/health', (req, res) => {
    res.json({ status: 'OK', service: 'api-gateway' });
});
const userServiceProxy = (0, http_proxy_middleware_1.createProxyMiddleware)({
    target: config_1.default.services.user,
    changeOrigin: true,
    pathRewrite: {
        '^/api/v1/users': '/api/users'
    },
    onError: (err, req, res) => {
        logger_1.default.error('User Service Error:', err);
        res.status(500).json({
            status: 'error',
            message: 'User service unavailable'
        });
    }
});
const productServiceProxy = (0, http_proxy_middleware_1.createProxyMiddleware)({
    target: config_1.default.services.product,
    changeOrigin: true,
    pathRewrite: {
        '^/api/v1/products': '/api/products'
    },
    onError: (err, req, res) => {
        logger_1.default.error('Product Service Error:', err);
        res.status(500).json({
            status: 'error',
            message: 'Product service unavailable'
        });
    }
});
const orderServiceProxy = (0, http_proxy_middleware_1.createProxyMiddleware)({
    target: config_1.default.services.order,
    changeOrigin: true,
    pathRewrite: {
        '^/api/v1/orders': '/api/orders'
    },
    onError: (err, req, res) => {
        logger_1.default.error('Order Service Error:', err);
        res.status(500).json({
            status: 'error',
            message: 'Order service unavailable'
        });
    }
});
app.use('/api/v1/users', userServiceProxy);
app.use('/api/v1/products', productServiceProxy);
app.use('/api/v1/orders', orderServiceProxy);
// 404 handler - must be after all routes
app.use(errorHandler_1.notFoundHandler);
// Global error handler - must be last
app.use(errorHandler_1.errorHandler);
const PORT = 3000;
app.listen(PORT, () => {
    logger_1.default.info('API Gateway running on port 3000');
});
