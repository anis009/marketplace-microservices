# Microservices Backend - Zod Validation Guide

## Overview

This project implements comprehensive request validation using [Zod](https://zod.dev) - a TypeScript-first schema validation library. Each microservice has its own validation schemas and middleware.

## Architecture

### Validation Structure
```
[service]/
├── src/
│   ├── shared/
│   │   └── middleware/
│   │       └── validate.ts         # Generic validation middleware
│   └── validations/
│       └── [service].validation.ts # Service-specific schemas
```

### Validation Middleware

The generic `validate` middleware supports validation of:
- **Request Body** (default)
- **Query Parameters**
- **URL Parameters**

```typescript
validate(schema, source?: 'body' | 'query' | 'params')
```

## User Service Validations

### Registration Schema
```typescript
POST /api/v1/users/register
```

**Validation Rules:**
- **name**: 2-50 characters, only letters and spaces
- **email**: Valid email format, normalized (lowercase, trimmed)
- **password**: 
  - Minimum 8 characters
  - At least one uppercase letter
  - At least one lowercase letter
  - At least one number

**Example Request:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "SecurePass123"
}
```

**Error Response:**
```json
{
  "success": false,
  "errors": {
    "password": ["Password must contain at least one uppercase letter"]
  }
}
```

### Login Schema
```typescript
POST /api/v1/users/login
```

**Validation Rules:**
- **email**: Valid email, normalized
- **password**: Required string

**Example Request:**
```json
{
  "email": "john@example.com",
  "password": "SecurePass123"
}
```

## Product Service Validations

### Create Product Schema
```typescript
POST /api/v1/products
Headers: Authorization: Bearer <token>
```

**Validation Rules:**
- **name**: 2-100 characters
- **description**: Optional, max 1000 characters
- **price**: Positive number, max 2 decimal places
- **category**: Electronics, Clothing, Books, Home, Sports, Toys
- **stock**: Non-negative integer
- **images**: Array of valid URLs, 1-10 items
- **isActive**: Boolean (default: true)

**Example Request:**
```json
{
  "name": "MacBook Pro M3",
  "description": "Latest Apple laptop with M3 chip",
  "price": 1999.99,
  "category": "Electronics",
  "stock": 50,
  "images": [
    "https://example.com/macbook1.jpg",
    "https://example.com/macbook2.jpg"
  ],
  "isActive": true
}
```

### Update Product Schema
```typescript
PUT /api/v1/products/:id
Headers: Authorization: Bearer <token>
```

**Validation Rules:**
- All fields optional
- Same rules as create schema
- Must provide at least one field

**Example Request:**
```json
{
  "price": 1899.99,
  "stock": 45
}
```

### Product Query Schema
```typescript
GET /api/v1/products?page=1&limit=10&category=Electronics
```

**Validation Rules:**
- **page**: Positive integer (default: 1)
- **limit**: Positive integer, max 100 (default: 10)
- **category**: Valid category enum
- **minPrice**: Non-negative number
- **maxPrice**: Positive number
- **search**: String, min 1 character
- **Custom Rule**: `minPrice <= maxPrice`

**Example Query:**
```
GET /api/v1/products?page=2&limit=20&category=Electronics&minPrice=100&maxPrice=2000&search=laptop
```

**Error Response:**
```json
{
  "success": false,
  "errors": {
    "minPrice": ["minPrice must be less than or equal to maxPrice"]
  }
}
```

## Order Service Validations

### Create Order Schema
```typescript
POST /api/v1/orders
Headers: Authorization: Bearer <token>
```

**Validation Rules:**

**items[]:**
- **productId**: 24-character hex MongoDB ObjectId
- **quantity**: Integer between 1-1000
- Array must contain 1-50 items
- **Custom Rule**: No duplicate products (combine quantities instead)

**shippingAddress:**
- **street**: 5-200 characters
- **city**: 2-100 characters
- **state**: 2-100 characters
- **country**: 2-100 characters
- **zipCode**: 5-10 characters (digits/hyphens)

**notes:** Optional, max 500 characters

**Example Request:**
```json
{
  "items": [
    {
      "productId": "507f1f77bcf86cd799439011",
      "quantity": 2
    },
    {
      "productId": "507f1f77bcf86cd799439012",
      "quantity": 1
    }
  ],
  "shippingAddress": {
    "street": "123 Main Street",
    "city": "San Francisco",
    "state": "California",
    "country": "USA",
    "zipCode": "94102"
  },
  "notes": "Please deliver before 5 PM"
}
```

**Error Response (Duplicates):**
```json
{
  "success": false,
  "errors": {
    "items": ["Duplicate products in order. Please combine quantities."]
  }
}
```

### Update Order Status Schema
```typescript
PUT /api/v1/orders/:id/status
Headers: Authorization: Bearer <token>
```

**Validation Rules:**
- **status**: Must be one of:
  - pending
  - confirmed
  - shipped
  - delivered
  - cancelled

**Example Request:**
```json
{
  "status": "shipped"
}
```

## Advanced Features

### 1. Type Inference

All schemas export TypeScript types for use in controllers:

```typescript
import { RegisterInput, LoginInput } from '../validations/user.validation';

export const register = async (req: Request, res: Response) => {
  // req.body is already typed as RegisterInput
  const { name, email, password } = req.body;
};
```

### 2. Custom Refinements

Complex validation logic using `.refine()`:

```typescript
// Price range validation
productQuerySchema.refine(
  (data) => {
    if (data.minPrice && data.maxPrice) {
      return data.minPrice <= data.maxPrice;
    }
    return true;
  },
  { message: 'minPrice must be less than or equal to maxPrice' }
);

// Duplicate detection
createOrderSchema.refine(
  (items) => {
    const productIds = items.map(item => item.productId);
    return productIds.length === new Set(productIds).size;
  },
  { message: 'Duplicate products in order' }
);
```

### 3. Data Transformation

Automatic type conversion and normalization:

```typescript
// String to number conversion
page: z.string().optional().default('1')
  .transform(Number)
  .pipe(z.number().int().positive())

// Email normalization
email: z.string().email().toLowerCase().trim()
```

### 4. Regex Patterns

Format validation using regex:

```typescript
// Password strength
password: z.string()
  .regex(/[A-Z]/, 'Must contain uppercase')
  .regex(/[a-z]/, 'Must contain lowercase')
  .regex(/[0-9]/, 'Must contain number')

// Zip code format
zipCode: z.string().regex(/^[0-9-]{5,10}$/)

// MongoDB ObjectId
productId: z.string().regex(/^[0-9a-fA-F]{24}$/)
```

## Error Response Format

All validation errors return a consistent structure:

```json
{
  "success": false,
  "errors": {
    "fieldName": ["Error message 1", "Error message 2"],
    "nestedField": ["Error message"]
  }
}
```

**HTTP Status Code:** 400 Bad Request

## Integration Example

### Adding Validation to Routes

```typescript
import { validate } from '../shared/middleware/validate';
import { createProductSchema } from '../validations/product.validation';

router.post(
  '/',
  protect,                           // Authentication
  validate(createProductSchema),     // Validation
  createProduct                      // Controller
);

router.get(
  '/',
  validate(productQuerySchema, 'query'),  // Query param validation
  getAllProducts
);
```

### Controller Usage

```typescript
import { CreateProductInput } from '../validations/product.validation';

export const createProduct = async (req: Request, res: Response) => {
  // req.body is already validated and typed
  const productData: CreateProductInput = req.body;
  
  // No need for manual validation checks
  const product = await Product.create(productData);
  
  res.status(201).json({ success: true, data: product });
};
```

## Testing Validation

### Using cURL

```bash
# Valid request
curl -X POST http://localhost:3001/api/users/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "password": "SecurePass123"
  }'

# Invalid password (no uppercase)
curl -X POST http://localhost:3001/api/users/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "password": "weakpass123"
  }'

# Response:
# {
#   "success": false,
#   "errors": {
#     "password": ["Password must contain at least one uppercase letter"]
#   }
# }
```

### Using Postman

1. Create requests with both valid and invalid data
2. Check for 200/201 on success
3. Check for 400 on validation errors
4. Verify error response structure

## Best Practices

### 1. Schema Composition

Reuse common schemas:

```typescript
const emailSchema = z.string().email().toLowerCase().trim();
const passwordSchema = z.string().min(8);

export const loginSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
});

export const registerSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  name: z.string().min(2),
});
```

### 2. Early Returns

Validate at the route level, not in controllers:

```typescript
// ✅ Good: Validation in route
router.post('/', validate(schema), controller);

// ❌ Bad: Validation in controller
export const controller = (req, res) => {
  const result = schema.safeParse(req.body);
  if (!result.success) return res.status(400).json(...);
};
```

### 3. Meaningful Error Messages

Provide clear, actionable errors:

```typescript
// ✅ Good
password: z.string().min(8, 'Password must be at least 8 characters')

// ❌ Bad
password: z.string().min(8)
```

### 4. Type Safety

Always export and use inferred types:

```typescript
export const registerSchema = z.object({
  name: z.string(),
  email: z.string().email(),
  password: z.string().min(8),
});

export type RegisterInput = z.infer<typeof registerSchema>;
```

## Performance Considerations

- Validation runs **synchronously** on every request
- Schemas are compiled once at startup (fast)
- Regex validation is optimized by V8
- Average overhead: **< 1ms** per request

## Migration Guide

### Adding Validation to Existing Route

1. Create validation schema:
```typescript
// src/validations/myResource.validation.ts
export const createSchema = z.object({
  field: z.string(),
});
```

2. Import and apply middleware:
```typescript
// src/routes/myResource.routes.ts
import { validate } from '../shared/middleware/validate';
import { createSchema } from '../validations/myResource.validation';

router.post('/', validate(createSchema), controller);
```

3. Update controller types:
```typescript
import { CreateInput } from '../validations/myResource.validation';

export const controller = async (req: Request, res: Response) => {
  const data: CreateInput = req.body; // Already validated
};
```

## Troubleshooting

### Common Issues

**Issue:** "Cannot find module 'zod'"
```bash
Solution: npm install zod
```

**Issue:** "Implicit any type" in refine callbacks
```typescript
Solution: Add explicit types
.refine((data: { field: string }) => ...)
```

**Issue:** "No overload matches" with default values
```typescript
Problem: .optional().default('1')
Solution: .optional().default('1').transform(Number)
```

## Resources

- [Zod Documentation](https://zod.dev)
- [Zod GitHub](https://github.com/colinhacks/zod)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/handbook/intro.html)

## Summary

✅ **Comprehensive validation** across all microservices
✅ **Type safety** with TypeScript inference
✅ **Clear error messages** for client developers
✅ **Consistent API** with 400 status codes
✅ **Production-ready** with regex, refinements, and transforms
