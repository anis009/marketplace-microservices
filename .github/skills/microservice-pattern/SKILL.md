---
name: microservice-pattern
description: "Implement, review, or scaffold microservices following the API Gateway + Database-per-Service pattern. Use for: creating new services, adding routes/controllers/models, inter-service communication, Docker configuration, shared packages, API endpoint design, authentication middleware, validation schemas, or any microservice architecture task in this monorepo."
---

# Microservice Pattern Skill

## Architecture Overview

This project follows an **API Gateway + Database-per-Service** architecture:

```
Client → API Gateway (:3000) → User Service (:3001)
                              → Product Service (:3002)
                              → Order Service (:3003)
                              → MongoDB (shared instance, separate DBs)
```

### Core Principles

- **Single Responsibility**: Each service handles one domain (users, products, orders)
- **Database Isolation**: Each service owns its own MongoDB database
- **API Gateway**: Single entry point, routes via `http-proxy-middleware`
- **Inter-Service Communication**: Synchronous HTTP calls for data enrichment
- **Data Denormalization**: Services snapshot data at creation time (e.g., order stores user/product details)

---

## Procedure

### 1. Creating a New Microservice

When adding a new service (e.g., `payment-service`):

#### Step 1: Scaffold the Directory Structure

```
apps/<service-name>/
├── Dockerfile
├── package.json
├── tsconfig.json
└── src/
    ├── server.ts
    ├── controllers/
    │   └── <entity>Controller.ts
    ├── models/
    │   └── <Entity>.ts
    ├── routes/
    │   └── <entity>Routes.ts
    ├── validations/
    │   └── <entity>.validation.ts
    └── shared/
        ├── config.ts
        ├── logger.ts
        ├── middleware/
        │   ├── auth.ts
        │   ├── errorHandler.ts
        │   └── validate.ts
        └── types/
            └── index.ts
```

#### Step 2: Create `package.json`

Use existing services as templates. Key dependencies:

- `express`, `mongoose`, `cors`, `helmet`, `dotenv`, `winston`
- `bcryptjs`, `jsonwebtoken` (if auth needed)
- Dev: `typescript`, `@types/*`, `ts-node-dev`

#### Step 3: Create `server.ts`

Follow this pattern:

```typescript
import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import helmet from 'helmet';
// ... routes, config, logger, errorHandler

const app = express();
app.use(helmet());
app.use(cors());
app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ status: 'OK', service: '<service-name>' });
});

app.use('/api/<entities>', router);
app.use(notFoundHandler);
app.use(errorHandler);

mongoose.connect(`${config.database.url}/<database-name>`)
  .then(() => logger.info('<Service> connected to MongoDB'))
  .catch(err => logger.error('MongoDB connection error:', err));

const PORT = <port>;
app.listen(PORT, () => logger.info(`<Service> running on port ${PORT}`));
```

#### Step 4: Port Assignment

| Service         | Port  |
| --------------- | ----- |
| api-gateway     | 3000  |
| user-service    | 3001  |
| product-service | 3002  |
| order-service   | 3003  |
| New service     | 3004+ |

### 2. Creating Models

Follow Mongoose schema pattern with TypeScript interfaces:

- Define interface in `shared/types/index.ts`
- Create schema in `models/<Entity>.ts`
- Use `timestamps: true`
- Validate with `required`, `min`, `enum`, etc.

### 3. Creating Routes & Controllers

**Routes** (`routes/<entity>Routes.ts`):

- Use `express.Router()`
- Apply `validate()` middleware with Zod schemas
- Apply `protect` middleware for authenticated routes
- Export named router

**Controllers** (`controllers/<entity>Controller.ts`):

- Async handlers with `try/catch`
- Use `AuthRequest` type for protected routes
- Return `ApiResponse` type consistently
- Handle errors with `res.status().json()`

### 4. Authentication & Authorization

- JWT-based via `protect` middleware
- Roles: `user`, `admin`, `seller`, `super-admin`
- Password hashing: bcrypt with salt rounds 12
- Token in `Authorization: Bearer <token>` header

### 5. Inter-Service Communication

For services that need data from other services:

```typescript
// services/userService.ts
import axios from "axios";
import config from "../shared/config";

export const getUserById = async (id: string) => {
  const response = await axios.get(`${config.services.user}/api/users/${id}`);
  return response.data;
};
```

- Use HTTP for synchronous calls
- Denormalize: snapshot data at creation (e.g., order stores user name/email)
- Handle service unavailability gracefully

### 6. Shared Packages

Located in `/packages/`:

- `config/` — Environment configuration
- `logger/` — Winston logger setup
- `middleware/` — Auth, error handling, validation
- `types/` — Shared TypeScript interfaces

### 7. Docker Configuration

Each service needs:

- `Dockerfile` (multi-stage build recommended)
- Entry in `docker-compose.yml`
- Environment variables for config
- Network assignment to `microservices-network`

### 8. API Gateway Updates

When adding a new service:

1. Add proxy middleware in `apps/api-gateway/src/server.ts`
2. Configure `pathRewrite` for URL transformation
3. Add error handler for service unavailability
4. Add route to gateway's route list

---

## Checklist for New Service

- [ ] Directory structure created
- [ ] `package.json` with correct dependencies
- [ ] `tsconfig.json` configured
- [ ] `server.ts` with health check, routes, error handlers
- [ ] Mongoose model with TypeScript interface
- [ ] Routes with validation middleware
- [ ] Controller with async handlers
- [ ] Shared config, logger, middleware
- [ ] `Dockerfile` for containerization
- [ ] Added to `docker-compose.yml`
- [ ] Added to API Gateway proxy (if external-facing)
- [ ] Environment variables documented
- [ ] README updated

---

## References

- [Project README](../../../../README.md)
- [Error Handling Guide](../../../../ERROR_HANDLING_GUIDE.md)
- [Validation Guide](../../../../VALIDATION_GUIDE.md)
- [Docker Guide](../../../../DOCKER.md)
