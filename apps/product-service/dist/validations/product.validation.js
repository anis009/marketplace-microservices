"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.mongoIdSchema = exports.productQuerySchema = exports.updateProductSchema = exports.createProductSchema = void 0;
const zod_1 = require("zod");
const productNameSchema = zod_1.z
    .string()
    .min(3, 'Product name must be at least 3 characters')
    .max(100, 'Product name must not exceed 100 characters')
    .trim();
const priceSchema = zod_1.z
    .number()
    .positive('Price must be greater than 0')
    .max(999999.99, 'Price is too high')
    .multipleOf(0.01, 'Price must have at most 2 decimal places');
const stockSchema = zod_1.z
    .number()
    .int('Stock must be a whole number')
    .nonnegative('Stock cannot be negative')
    .max(999999, 'Stock quantity is too high');
const categorySchema = zod_1.z
    .string()
    .min(2, 'Category must be at least 2 characters')
    .max(50, 'Category must not exceed 50 characters')
    .trim();
const descriptionSchema = zod_1.z
    .string()
    .min(10, 'Description must be at least 10 characters')
    .max(1000, 'Description must not exceed 1000 characters')
    .trim();
const imageUrlSchema = zod_1.z
    .string()
    .url('Invalid image URL')
    .regex(/\.(jpg|jpeg|png|gif|webp)$/i, 'Image must be jpg, jpeg, png, gif, or webp');
exports.createProductSchema = zod_1.z.object({
    name: productNameSchema,
    description: descriptionSchema,
    price: priceSchema,
    category: categorySchema,
    stock: stockSchema,
    images: zod_1.z.array(imageUrlSchema).min(1, 'At least one image is required').max(10, 'Maximum 10 images allowed'),
    isActive: zod_1.z.boolean().optional().default(true),
});
exports.updateProductSchema = zod_1.z.object({
    name: productNameSchema.optional(),
    description: descriptionSchema.optional(),
    price: priceSchema.optional(),
    category: categorySchema.optional(),
    stock: stockSchema.optional(),
    images: zod_1.z.array(imageUrlSchema).min(1).max(10).optional(),
    isActive: zod_1.z.boolean().optional(),
}).refine((data) => Object.keys(data).length > 0, { message: 'At least one field must be provided for update' });
exports.productQuerySchema = zod_1.z.object({
    page: zod_1.z.string().optional().default('1').transform(Number).pipe(zod_1.z.number().int().positive()),
    limit: zod_1.z.string().optional().default('10').transform(Number).pipe(zod_1.z.number().int().positive().max(100)),
    category: zod_1.z.string().trim().optional(),
    minPrice: zod_1.z.string().optional().transform((val) => val ? Number(val) : undefined).pipe(zod_1.z.number().nonnegative().optional()),
    maxPrice: zod_1.z.string().optional().transform((val) => val ? Number(val) : undefined).pipe(zod_1.z.number().positive().optional()),
    search: zod_1.z.string().trim().min(1).optional(),
}).refine((data) => {
    if (data.minPrice && data.maxPrice) {
        return data.minPrice <= data.maxPrice;
    }
    return true;
}, { message: 'minPrice must be less than or equal to maxPrice' });
exports.mongoIdSchema = zod_1.z.object({
    id: zod_1.z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid product ID'),
});
//# sourceMappingURL=product.validation.js.map