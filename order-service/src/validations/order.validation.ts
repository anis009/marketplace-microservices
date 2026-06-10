import { z } from 'zod';

// Shipping address validation
const shippingAddressSchema = z.object({
  street: z.string().min(5, 'Street address must be at least 5 characters').max(200, 'Street address too long').trim(),
  city: z.string().min(2, 'City name must be at least 2 characters').max(100, 'City name too long').trim(),
  state: z.string().min(2, 'State must be at least 2 characters').max(100, 'State name too long').trim(),
  country: z.string().min(2, 'Country must be at least 2 characters').max(100, 'Country name too long').trim(),
  zipCode: z.string().regex(/^[0-9]{4,10}$/, 'Invalid zip code format').trim(),
});

// Order item validation
const orderItemSchema = z.object({
  productId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid product ID'),
  quantity: z.number().int('Quantity must be a whole number').positive('Quantity must be at least 1').max(999, 'Quantity is too high'),
});

// Create order schema
export const createOrderSchema = z.object({
  items: z
    .array(orderItemSchema)
    .min(1, 'Order must contain at least one item')
    .max(50, 'Order cannot contain more than 50 items')
    .refine(
      (items: Array<{ productId: string; quantity: number }>) => {
        const productIds = items.map((item: { productId: string; quantity: number }) => item.productId);
        return productIds.length === new Set(productIds).size;
      },
      { message: 'Duplicate products in order. Please combine quantities.' }
    ),
  shippingAddress: shippingAddressSchema,
});

// Update order status schema
export const updateOrderStatusSchema = z.object({
  status: z.enum(['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'], {
    message: 'Invalid status. Must be one of: pending, confirmed, shipped, delivered, cancelled',
  }),
});

// Update payment status schema
export const updatePaymentStatusSchema = z.object({
  paymentStatus: z.enum(['pending', 'completed', 'failed'], {
    message: 'Invalid payment status. Must be one of: pending, completed, failed',
  }),
});

// Query params validation
export const orderQuerySchema = z.object({
  page: z.string().optional().default('1').transform(Number).pipe(z.number().int().positive()),
  limit: z.string().optional().default('10').transform(Number).pipe(z.number().int().positive().max(100)),
  status: z.enum(['pending', 'confirmed', 'shipped', 'delivered', 'cancelled']).optional(),
  paymentStatus: z.enum(['pending', 'completed', 'failed']).optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
});

// MongoDB ObjectId validation
export const mongoIdSchema = z.object({
  id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid order ID'),
});

// Export types
export type CreateOrderInput = z.infer<typeof createOrderSchema>;
export type UpdateOrderStatusInput = z.infer<typeof updateOrderStatusSchema>;
export type UpdatePaymentStatusInput = z.infer<typeof updatePaymentStatusSchema>;
export type OrderQueryInput = z.infer<typeof orderQuerySchema>;
export type MongoIdInput = z.infer<typeof mongoIdSchema>;
