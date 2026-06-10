# Global Error Handler Documentation

## Overview

A comprehensive global error handling system has been implemented across all microservices to provide consistent, secure, and informative error responses. The system handles validation errors, authentication errors, database errors, and unexpected exceptions.

## Features

### ✅ Centralized Error Handling
- Single source of truth for error responses
- Consistent error format across all services
- Environment-aware error details (dev vs production)

### ✅ Automatic Error Type Detection
- **Mongoose Validation Errors** - Invalid data format
- **Duplicate Key Errors** - Unique constraint violations
- **Cast Errors** - Invalid ObjectId or type conversion
- **JWT Errors** - Invalid or expired tokens
- **Zod Validation Errors** - Request validation failures
- **Custom Application Errors** - Business logic errors

### ✅ Security Features
- Stack traces only in development mode
- Sanitized error messages in production
- Prevents leaking sensitive information

### ✅ Logging Integration
- All errors logged with Winston
- Includes stack traces and context
- Different log levels for different error types

## Architecture

```
┌─────────────────────────────────────────────┐
│           Request Middleware                │
├─────────────────────────────────────────────┤
│ 1. Helmet (Security Headers)                │
│ 2. CORS                                     │
│ 3. Body Parser                              │
│ 4. Routes (with validation)                 │
│ 5. 404 Handler (notFoundHandler)            │
│ 6. Global Error Handler (errorHandler)      │
└─────────────────────────────────────────────┘
```

## Error Response Format

### Development Mode
```json
{
  "success": false,
  "error": {
    "message": "Detailed error message",
    "statusCode": 400,
    "errors": {
      "field": "Additional error details"
    },
    "stack": "Error: ...\n    at ..."
  }
}
```

### Production Mode
```json
{
  "success": false,
  "error": {
    "message": "User-friendly error message",
    "statusCode": 400,
    "errors": {
      "field": "Additional error details (for operational errors only)"
    }
  }
}
```

## Error Types and Handling

### 1. Mongoose Validation Errors
**Trigger:** Invalid data according to Mongoose schema
```javascript
// Example: Missing required field
{
  "success": false,
  "error": {
    "message": "Invalid input data. Path `name` is required.",
    "statusCode": 400
  }
}
```

### 2. Duplicate Key Errors (Code 11000)
**Trigger:** Unique constraint violation
```javascript
// Example: Duplicate email
{
  "success": false,
  "error": {
    "message": "Duplicate field value: email = \"john@example.com\". Please use another value.",
    "statusCode": 409
  }
}
```

### 3. Cast Errors
**Trigger:** Invalid ObjectId or type conversion
```javascript
// Example: Invalid product ID
{
  "success": false,
  "error": {
    "message": "Invalid _id: invalid-id-format",
    "statusCode": 400
  }
}
```

### 4. JWT Errors
**Trigger:** Invalid or expired authentication token
```javascript
// JsonWebTokenError
{
  "success": false,
  "error": {
    "message": "Invalid token. Please log in again.",
    "statusCode": 401
  }
}

// TokenExpiredError
{
  "success": false,
  "error": {
    "message": "Your token has expired. Please log in again.",
    "statusCode": 401
  }
}
```

### 5. Zod Validation Errors
**Trigger:** Request validation failure
```javascript
{
  "success": false,
  "error": {
    "message": "Validation failed",
    "statusCode": 400,
    "errors": [
      {
        "field": "email",
        "message": "Invalid email format"
      },
      {
        "field": "password",
        "message": "Password must be at least 8 characters"
      }
    ]
  }
}
```

### 6. Custom Application Errors
**Trigger:** Business logic errors using AppError class
```javascript
throw new AppError('User not found', 404);

// Response:
{
  "success": false,
  "error": {
    "message": "User not found",
    "statusCode": 404
  }
}
```

### 7. 404 Not Found
**Trigger:** Request to undefined route
```javascript
GET /api/invalid-route

// Response:
{
  "success": false,
  "error": {
    "message": "Cannot find /api/invalid-route on this server",
    "statusCode": 404
  }
}
```

### 8. Unexpected Errors
**Trigger:** Programming errors or unknown exceptions
```javascript
// Development:
{
  "success": false,
  "error": {
    "message": "Actual error message",
    "statusCode": 500,
    "stack": "Full stack trace..."
  }
}

// Production:
{
  "success": false,
  "error": {
    "message": "Something went wrong. Please try again later.",
    "statusCode": 500
  }
}
```

## Usage

### 1. Creating Custom Errors

```typescript
import { AppError } from '../shared/middleware/errorHandler';

// In controller
export const getProduct = async (req: Request, res: Response, next: NextFunction) => {
  const product = await Product.findById(req.params.id);
  
  if (!product) {
    return next(new AppError('Product not found', 404));
  }
  
  res.json({ success: true, data: product });
};
```

### 2. Using Async Error Wrapper

```typescript
import { catchAsync } from '../shared/middleware/errorHandler';

// Automatically catches async errors
export const createProduct = catchAsync(async (req: Request, res: Response) => {
  const product = await Product.create(req.body);
  res.status(201).json({ success: true, data: product });
});
```

### 3. Manual Error Forwarding

```typescript
export const updateProduct = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const product = await Product.findByIdAndUpdate(req.params.id, req.body);
    res.json({ success: true, data: product });
  } catch (error) {
    next(error); // Forward to error handler
  }
};
```

## HTTP Status Codes

| Code | Type | Description |
|------|------|-------------|
| 400 | Bad Request | Validation errors, invalid input |
| 401 | Unauthorized | Invalid/expired JWT token |
| 404 | Not Found | Resource or route not found |
| 409 | Conflict | Duplicate unique field (email, etc.) |
| 500 | Internal Server Error | Unexpected errors |

## Environment Configuration

Set `NODE_ENV` in your `.env` file:

```bash
# Development - includes stack traces
NODE_ENV=development

# Production - sanitized errors
NODE_ENV=production
```

## Error Handler Components

### AppError Class
Custom error class for operational errors:
```typescript
export class AppError extends Error {
  statusCode: number;
  isOperational: boolean;
  
  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
  }
}
```

### notFoundHandler
Catches requests to undefined routes:
```typescript
export const notFoundHandler = (req, res, next) => {
  const err = new AppError(`Cannot find ${req.originalUrl}`, 404);
  next(err);
};
```

### errorHandler
Main error processing middleware:
```typescript
export const errorHandler = (err, req, res, next) => {
  // Detects error type
  // Formats response
  // Logs error
  // Sends appropriate response
};
```

### catchAsync
Wrapper for async route handlers:
```typescript
export const catchAsync = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};
```

## Integration in Services

All services follow this pattern in `server.ts`:

```typescript
import { errorHandler, notFoundHandler } from './shared/middleware/errorHandler';

// ... middleware setup ...
// ... routes ...

// 404 handler - must be after all routes
app.use(notFoundHandler);

// Global error handler - must be last
app.use(errorHandler);
```

## Best Practices

### 1. Use AppError for Business Logic Errors
```typescript
// ✅ Good
if (!user) {
  return next(new AppError('User not found', 404));
}

// ❌ Bad
if (!user) {
  return res.status(404).json({ error: 'User not found' });
}
```

### 2. Use catchAsync for Async Controllers
```typescript
// ✅ Good
export const getUsers = catchAsync(async (req, res) => {
  const users = await User.find();
  res.json({ success: true, data: users });
});

// ❌ Bad
export const getUsers = async (req, res) => {
  try {
    const users = await User.find();
    res.json({ success: true, data: users });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
```

### 3. Don't Send Headers After Error
```typescript
// ✅ Good
if (!product) {
  return next(new AppError('Product not found', 404));
}

// ❌ Bad
if (!product) {
  next(new AppError('Product not found', 404));
  // Don't continue execution
}
res.json({ data: product }); // This will cause "headers already sent" error
```

### 4. Let Mongoose Errors Bubble Up
```typescript
// ✅ Good - Mongoose validation errors automatically handled
export const createUser = catchAsync(async (req, res) => {
  const user = await User.create(req.body);
  res.status(201).json({ success: true, data: user });
});

// ❌ Bad - Manual handling not needed
export const createUser = catchAsync(async (req, res) => {
  try {
    const user = await User.create(req.body);
    res.status(201).json({ success: true, data: user });
  } catch (error) {
    if (error.name === 'ValidationError') {
      // Unnecessary - already handled globally
    }
  }
});
```

## Testing Error Handling

### Test 404 Error
```bash
curl http://localhost:3001/api/users/invalid-route
```

### Test Validation Error
```bash
curl -X POST http://localhost:3001/api/users/register \
  -H "Content-Type: application/json" \
  -d '{"email": "invalid", "password": "weak"}'
```

### Test Duplicate Key Error
```bash
# Register user first
curl -X POST http://localhost:3001/api/users/register \
  -H "Content-Type: application/json" \
  -d '{"name": "John", "email": "john@example.com", "password": "Test1234"}'

# Try again with same email
curl -X POST http://localhost:3001/api/users/register \
  -H "Content-Type: application/json" \
  -d '{"name": "Jane", "email": "john@example.com", "password": "Test5678"}'
```

### Test JWT Error
```bash
curl http://localhost:3001/api/users/123 \
  -H "Authorization: Bearer invalid-token"
```

### Test Cast Error
```bash
curl http://localhost:3002/api/products/invalid-id
```

## Logging

All errors are logged with Winston:

```javascript
// Development logs
{
  level: 'error',
  message: 'Error:',
  metadata: {
    message: 'User not found',
    stack: 'Error: User not found\n    at ...',
    statusCode: 404
  }
}

// Production logs (unexpected errors only)
{
  level: 'error',
  message: 'UNEXPECTED ERROR:',
  metadata: {
    message: 'Cannot read property of undefined',
    stack: 'Error: Cannot read property...'
  }
}
```

## Security Considerations

### ✅ Implemented
- No stack traces in production
- Sanitized error messages for programming errors
- Consistent error format (no information leakage)
- Environment-aware error details

### ⚠️ Additional Recommendations
- Rate limiting for error-prone endpoints
- Error monitoring (Sentry, LogRocket, etc.)
- Alerting for high error rates
- Regular error log analysis

## Performance Impact

- **Minimal overhead** - Error handlers only execute on errors
- **No performance impact** on successful requests
- **Logging is async** - doesn't block response

## Summary

✅ **Centralized error handling** across all microservices
✅ **Automatic error type detection** and formatting
✅ **Environment-aware** error responses
✅ **Security-focused** - no sensitive data leakage
✅ **Logging integration** with Winston
✅ **Consistent API** for all services
✅ **Production-ready** error handling

The global error handler provides a robust, secure, and maintainable error handling solution for the entire microservices architecture! 🚀
