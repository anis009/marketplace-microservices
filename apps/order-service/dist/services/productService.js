"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getProductsByIds = exports.getProductById = void 0;
const axios_1 = __importDefault(require("axios"));
const config_1 = __importDefault(require("../shared/config"));
const logger_1 = __importDefault(require("../shared/logger"));
const getProductById = async (productId) => {
    try {
        const response = await axios_1.default.get(`${config_1.default.services.product}/api/products/${productId}`);
        if (response.data.status === 'success' && response.data.data?.product) {
            return response.data.data.product;
        }
        return null;
    }
    catch (error) {
        logger_1.default.error(`Failed to fetch product ${productId} from product-service:`, error);
        return null;
    }
};
exports.getProductById = getProductById;
const getProductsByIds = async (productIds) => {
    const productsMap = new Map();
    try {
        const productPromises = productIds.map(id => (0, exports.getProductById)(id));
        const products = await Promise.all(productPromises);
        products.forEach((product, index) => {
            if (product && productIds[index]) {
                productsMap.set(productIds[index], product);
            }
        });
        return productsMap;
    }
    catch (error) {
        logger_1.default.error('Failed to fetch products from product-service:', error);
        return productsMap;
    }
};
exports.getProductsByIds = getProductsByIds;
//# sourceMappingURL=productService.js.map