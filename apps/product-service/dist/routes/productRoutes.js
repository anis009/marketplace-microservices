"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.productRouter = void 0;
const express_1 = __importDefault(require("express"));
const productController_1 = require("../controllers/productController");
const auth_1 = require("../shared/middleware/auth");
const validate_1 = require("../shared/middleware/validate");
const product_validation_1 = require("../validations/product.validation");
const router = express_1.default.Router();
router.get('/', (0, validate_1.validate)(product_validation_1.productQuerySchema, 'query'), productController_1.getAllProducts);
router.get('/:id', productController_1.getProduct);
router.post('/', auth_1.protect, (0, validate_1.validate)(product_validation_1.createProductSchema), productController_1.createProduct);
router.put('/:id', auth_1.protect, (0, validate_1.validate)(product_validation_1.updateProductSchema), productController_1.updateProduct);
router.delete('/:id', auth_1.protect, productController_1.deleteProduct);
exports.productRouter = router;
//# sourceMappingURL=productRoutes.js.map