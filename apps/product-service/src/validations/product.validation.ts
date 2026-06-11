import { z } from 'zod';

// Product name validation
const productNameSchema = z
  .string()
  .min(3, 'Product name must be at least 3 characters')
  .max(100, 'Product name must not exceed 100 characters')
  .trim();

// Price validation
const priceSchema = z
  .number()
  .positive('Price must be greater than 0')
  .max(999999.99, 'Price is too high')
  .multipleOf(0.01, 'Price must have at most 2 decimal places');

// Stock validation
const stockSchema = z
  .number()
  .int('Stock must be a whole number')
  .nonnegative('Stock cannot be negative')
  .max(999999, 'Stock quantity is too high');

// Category validation
const categorySchema = z
  .string()
  .min(2, 'Category must be at least 2 characters')
  .max(50, 'Category must not exceed 50 characters')
  .trim();

// Description validation
const descriptionSchema = z
  .string()
  .min(10, 'Description must be at least 10 characters')
  .max(1000, 'Description must not exceed 1000 characters')
  .trim();

// Image URL validation
const imageUrlSchema = z
  .string()
  .url('Invalid image URL')
  .regex(/\.(jpg|jpeg|png|gif|webp)$/i, 'Image must be jpg, jpeg, png, gif, or webp');

// Create product schema
export const createProductSchema = z.object({
  name: productNameSchema,
  description: descriptionSchema,
  price: priceSchema,
  category: categorySchema,
  stock: stockSchema,
  images: z.array(imageUrlSchema).min(1, 'At least one image is required').max(10, 'Maximum 10 images allowed'),
  isActive: z.boolean().optional().default(true),
});

// Update product schema (all fields optional)
export const updateProductSchema = z.object({
  name: productNameSchema.optional(),
  description: descriptionSchema.optional(),
  price: priceSchema.optional(),
  category: categorySchema.optional(),
  stock: stockSchema.optional(),
  images: z.array(imageUrlSchema).min(1).max(10).optional(),
  isActive: z.boolean().optional(),
}).refine(
  (data: Record<string, unknown>) => Object.keys(data).length > 0,
  { message: 'At least one field must be provided for update' }
);

// Query params validation
export const productQuerySchema = z.object({
  page: z.string().optional().default('1').transform(Number).pipe(z.number().int().positive()),
  limit: z.string().optional().default('10').transform(Number).pipe(z.number().int().positive().max(100)),
  category: z.string().trim().optional(),
  minPrice: z.string().optional().transform((val) => val ? Number(val) : undefined).pipe(z.number().nonnegative().optional()),
  maxPrice: z.string().optional().transform((val) => val ? Number(val) : undefined).pipe(z.number().positive().optional()),
  search: z.string().trim().min(1).optional(),
}).refine(
  (data: { minPrice?: number; maxPrice?: number }) => {
    if (data.minPrice && data.maxPrice) {
      return data.minPrice <= data.maxPrice;
    }
    return true;
  },
  { message: 'minPrice must be less than or equal to maxPrice' }
);

// MongoDB ObjectId validation
export const mongoIdSchema = z.object({
  id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid product ID'),
});

// Export types
export type CreateProductInput = z.infer<typeof createProductSchema>;
export type UpdateProductInput = z.infer<typeof updateProductSchema>;
export type ProductQueryInput = z.infer<typeof productQuerySchema>;
export type MongoIdInput = z.infer<typeof mongoIdSchema>;
