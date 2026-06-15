"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.mongoIdSchema = exports.orderQuerySchema = exports.updatePaymentStatusSchema = exports.updateOrderStatusSchema = exports.createOrderSchema = void 0;
const zod_1 = require("zod");
const shippingAddressSchema = zod_1.z.object({
    street: zod_1.z.string().min(5, 'Street address must be at least 5 characters').max(200, 'Street address too long').trim(),
    city: zod_1.z.string().min(2, 'City name must be at least 2 characters').max(100, 'City name too long').trim(),
    state: zod_1.z.string().min(2, 'State must be at least 2 characters').max(100, 'State name too long').trim(),
    country: zod_1.z.string().min(2, 'Country must be at least 2 characters').max(100, 'Country name too long').trim(),
    zipCode: zod_1.z.string().regex(/^[0-9]{4,10}$/, 'Invalid zip code format').trim(),
});
const orderItemSchema = zod_1.z.object({
    productId: zod_1.z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid product ID'),
    quantity: zod_1.z.number().int('Quantity must be a whole number').positive('Quantity must be at least 1').max(999, 'Quantity is too high'),
});
exports.createOrderSchema = zod_1.z.object({
    items: zod_1.z
        .array(orderItemSchema)
        .min(1, 'Order must contain at least one item')
        .max(50, 'Order cannot contain more than 50 items')
        .refine((items) => {
        const productIds = items.map((item) => item.productId);
        return productIds.length === new Set(productIds).size;
    }, { message: 'Duplicate products in order. Please combine quantities.' }),
    shippingAddress: shippingAddressSchema,
});
exports.updateOrderStatusSchema = zod_1.z.object({
    status: zod_1.z.enum(['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'], {
        message: 'Invalid status. Must be one of: pending, confirmed, shipped, delivered, cancelled',
    }),
});
exports.updatePaymentStatusSchema = zod_1.z.object({
    paymentStatus: zod_1.z.enum(['pending', 'completed', 'failed'], {
        message: 'Invalid payment status. Must be one of: pending, completed, failed',
    }),
});
exports.orderQuerySchema = zod_1.z.object({
    page: zod_1.z.string().optional().default('1').transform(Number).pipe(zod_1.z.number().int().positive()),
    limit: zod_1.z.string().optional().default('10').transform(Number).pipe(zod_1.z.number().int().positive().max(100)),
    status: zod_1.z.enum(['pending', 'confirmed', 'shipped', 'delivered', 'cancelled']).optional(),
    paymentStatus: zod_1.z.enum(['pending', 'completed', 'failed']).optional(),
    startDate: zod_1.z.string().datetime().optional(),
    endDate: zod_1.z.string().datetime().optional(),
});
exports.mongoIdSchema = zod_1.z.object({
    id: zod_1.z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid order ID'),
});
//# sourceMappingURL=order.validation.js.map