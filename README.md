# 🛒 Marketplace Microservices

A production-ready microservices backend built with **Node.js**, **Express**, **TypeScript**, and **MongoDB (Mongoose)**. This project implements a scalable e-commerce platform with separate services for users, products, and orders, all fronted by an API Gateway.

## 📋 Table of Contents

- [Architecture](#-architecture)
- [Tech Stack](#-tech-stack)
- [Services Overview](#-services-overview)
- [Getting Started](#-getting-started)
- [API Endpoints](#-api-endpoints)
- [Authentication & Authorization](#-authentication--authorization)
- [Validation](#-validation)
- [Error Handling](#-error-handling)
- [Docker Setup](#-docker-setup)
- [Development Scripts](#-development-scripts)
- [Project Structure](#-project-structure)

---

## 🏛️ Architecture

```
┌─────────────┐     ┌──────────────┐     ┌────────────┐
│   Client    │────▶│ API Gateway  │────▶│   MongoDB   │
└─────────────┘     │   (3000)     │     └────────────┘
                    └──┬───┬───┬───┘
                       │   │   │
              ┌────────┘   │   └────────┐
              ▼            ▼            ▼
       ┌──────────┐ ┌──────────┐ ┌──────────┐
       │   User   │ │ Product  │ │  Order   │
       │ Service  │ │ Service  │ │ Service  │
       │  (3001)  │ │  (3002)  │ │  (3003)  │
       └──────────┘ └──────────┘ └──────────┘
              │            │            │
              └────────────┼────────────┘
                           ▼
                    ┌──────────────┐
                    │   MongoDB    │
                    │   (27017)    │
                    └──────────────┘
```

### Architecture Decisions

- **API Gateway Pattern** — Single entry point routes requests to appropriate microservices via HTTP proxy
- **Database per Service** — Each service has its own MongoDB collection, promoting loose coupling
- **Inter-Service Communication** — Order Service fetches data from User & Product services via HTTP (synchronous)
- **Data Denormalization** — Order snapshots include product and user details at time of order creation
- **Monorepo with pnpm Workspaces** — Shared packages for config, types, middleware, and logger

---

## 🛠️ Tech Stack

| Category        | Technology                                                    |
| --------------- | ------------------------------------------------------------- |
| **Runtime**     | Node.js 18+                                                   |
| **Framework**   | Express 4.18 / 5.1                                            |
| **Language**    | TypeScript 5.9                                                |
| **Database**    | MongoDB 7.0 + Mongoose 7.5 / 8.20                             |
| **Validation**  | Zod 4.x                                                       |
| **Auth**        | JSON Web Tokens (jsonwebtoken) + bcryptjs                     |
| **Logging**     | Winston                                                       |
| **Security**    | Helmet, CORS                                                  |
| **Dev Tools**   | nodemon, ts-node, concurrently                                |
| **Container**   | Docker + Docker Compose                                       |
| **Package Mgr** | pnpm (workspaces)                                             |

---

## 📦 Services Overview

### API Gateway — `apps/api-gateway` (Port **3000**)

The central entry point that proxies all client requests to the appropriate backend service.

- **Pattern:** HTTP reverse proxy using `http-proxy-middleware`
- **Route Rewriting:** `/api/v1/users/*` → `/api/users/*`, `/api/v1/products/*` → `/api/products/*`, etc.
- **Error Handling:** Returns 503 when a downstream service is unavailable
- **Health Check:** `GET /health`

### User Service — `apps/user-service` (Port **3001**)

Manages user registration, authentication, and profiles.

| Feature              | Details                                        |
| -------------------- | ---------------------------------------------- |
| **Model**            | name, email, hashed password, role             |
| **Auth**             | JWT tokens with 24h expiry                     |
| **Password Hashing** | bcryptjs with 12 salt rounds (pre-save hook)   |
| **Roles**            | `user`, `admin`, `seller`, `super-admin`       |

**Endpoints:**

| Method | Path                | Auth | Description          |
| ------ | ------------------- | ---- | -------------------- |
| POST   | `/api/users/register` | ❌ | Register a new user  |
| POST   | `/api/users/login`    | ❌ | Login & get JWT token |
| GET    | `/api/users/:id`      | ✅ | Get user profile     |

### Product Service — `apps/product-service` (Port **3002**)

Manages the product catalog with CRUD operations and search/filter capabilities.

| Feature          | Details                                          |
| ---------------- | ------------------------------------------------ |
| **Model**        | name, description, price, category, stock, images |
| **Soft Delete**  | Products are marked `isActive: false`, not removed |
| **Pagination**   | All list endpoints support page & limit params    |
| **Filtering**    | By category, price range, and text search         |

**Endpoints:**

| Method | Path                    | Auth | Description               |
| ------ | ----------------------- | ---- | ------------------------- |
| GET    | `/api/products`         | ❌ | List products (paginated) |
| GET    | `/api/products/:id`     | ❌ | Get single product        |
| POST   | `/api/products`         | ✅ | Create a product          |
| PUT    | `/api/products/:id`     | ✅ | Update a product          |
| DELETE | `/api/products/:id`     | ✅ | Soft-delete a product     |

### Order Service — `apps/order-service` (Port **3003**)

Handles order creation, retrieval, and status management with inter-service communication.

| Feature              | Details                                                      |
| -------------------- | ------------------------------------------------------------ |
| **Model**            | userId, items (snapshot), totalAmount, status, shippingAddress |
| **Status Flow**      | `pending` → `confirmed` → `shipped` → `delivered` / `cancelled` |
| **Auto-calculation** | `totalAmount` computed from items (price × quantity)         |
| **Data Snapshot**    | Products and user details stored at time of order creation   |

**Endpoints:**

| Method | Path                       | Auth | Description           |
| ------ | -------------------------- | ---- | --------------------- |
| POST   | `/api/orders`              | ✅ | Create a new order    |
| GET    | `/api/orders/user`         | ✅ | Get current user's orders |
| GET    | `/api/orders/:id`          | ✅ | Get order details     |
| PUT    | `/api/orders/:id/status`   | ✅ | Update order status   |

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** 18+
- **pnpm** 8+
- **MongoDB** 7.0 (local or Docker)
- **Docker** (optional, for containerized setup)

### Local Development

```bash
# 1. Install dependencies
pnpm install

# 2. Set up environment variables
cp .env.example .env
# Edit .env with your MongoDB connection string and JWT secret

# 3. Start individual services (each in a separate terminal)
pnpm run dev:user       # User Service on port 3001
pnpm run dev:product    # Product Service on port 3002
pnpm run dev:order      # Order Service on port 3003
pnpm run dev:gateway    # API Gateway on port 3000

# Or start all services at once
pnpm run dev:all
```

### Environment Variables

| Variable              | Default                                    | Description                     |
| --------------------- | ------------------------------------------ | ------------------------------- |
| `PORT`                | `3000` (varies per service)                | Service port                    |
| `MONGODB_URL`         | `mongodb://localhost:27017`                | MongoDB connection string       |
| `JWT_SECRET`          | `fallback-secret-key`                      | JWT signing secret              |
| `USER_SERVICE_URL`    | `http://localhost:3001`                    | Internal user service URL       |
| `PRODUCT_SERVICE_URL` | `http://localhost:3002`                    | Internal product service URL    |
| `ORDER_SERVICE_URL`   | `http://localhost:3003`                    | Internal order service URL      |

---

## 🔑 Authentication & Authorization

This project uses **JWT (JSON Web Tokens)** for authentication.

### How it works

1. User registers or logs in via `POST /api/users/register` or `POST /api/users/login`
2. Server returns a JWT token (24h expiry) along with user details
3. Client includes the token in the `Authorization` header: `Bearer <token>`
4. Protected routes validate the token and attach user info to `req.user`

### Auth Middleware

The `protect` middleware in `apps/*/shared/middleware/auth.ts`:
- Extracts the Bearer token from the `Authorization` header
- Verifies the token with the JWT secret
- Attaches decoded user ID to `req.user`
- Returns `401 Unauthorized` if token is missing, invalid, or expired

---

## ✅ Validation

All input validation is handled by **Zod** schemas with a generic middleware.

### Validation Middleware

Located at `apps/*/shared/middleware/validate.ts`, supports validating `body`, `query`, or `params`:

```typescript
// Example usage in routes:
import { validate } from '../shared/middleware/validate';
import { registerSchema } from '../validations/user.validation';

router.post('/register', validate(registerSchema), register);
```

### Key Validation Rules

| Service     | Field       | Rules                                                       |
| ----------- | ----------- | ----------------------------------------------------------- |
| **User**    | name        | 2–50 characters, letters & spaces only                      |
|             | email       | Valid email format, normalized (lowercase, trimmed)          |
|             | password    | Min 8 chars, must include uppercase, lowercase, and number  |
| **Product** | name        | 3–100 characters                                            |
|             | price       | Positive number, max 2 decimals, max 999,999.99             |
|             | stock       | Non-negative integer, max 999,999                           |
|             | images      | Array of valid image URLs (jpg, png, gif, webp), 1–10 items |
| **Order**   | items       | 1–50 items, no duplicates, valid ObjectId                   |
|             | quantity    | Positive integer, max 999                                   |
|             | shipping    | All address fields required with length constraints         |

---

## ⚠️ Error Handling

A centralized, environment-aware error handler in each service (`apps/*/shared/middleware/errorHandler.ts`).

### Error Types & Responses

| Error Type                      | Status | Description                                   |
| ------------------------------- | ------ | --------------------------------------------- |
| Mongoose Validation Error       | 400    | Schema validation failed at database level    |
| Zod Validation Error            | 400    | Input validation failed                       |
| Mongoose Cast Error             | 400    | Invalid ObjectId format                       |
| Duplicate Key (code 11000)      | 409    | Unique field constraint violation (e.g., email) |
| JWT Error                       | 401    | Invalid or malformed token                    |
| JWT Expired Error               | 401    | Token has expired                             |
| Custom AppError                 | Custom | Application-specific errors                   |
| 404 Not Found                   | 404    | Route not found                               |
| Unhandled Error                 | 500    | Unexpected server errors                      |

### Response Format

```json
// Development (includes stack trace):
{
  "success": false,
  "error": {
    "message": "Validation failed",
    "statusCode": 400,
    "errors": { "email": "Invalid email format" },
    "stack": "Error: ..."
  }
}

// Production (sanitized):
{
  "success": false,
  "error": {
    "message": "Validation failed",
    "statusCode": 400,
    "errors": { "email": "Invalid email format" }
  }
}
```

---

## 🐳 Docker Setup

### Run with Docker Compose

```bash
# Build and start all services
docker-compose up --build

# Run in detached mode
docker-compose up -d --build

# View logs
docker-compose logs -f

# Stop all services
docker-compose down

# Stop and remove volumes (clears database)
docker-compose down -v
```

### Docker Services

| Service         | Port  | Dockerfile                          |
| --------------- | ----- | ----------------------------------- |
| API Gateway     | 3000  | `apps/api-gateway/Dockerfile`       |
| User Service    | 3001  | `apps/user-service/Dockerfile`      |
| Product Service | 3002  | `apps/product-service/Dockerfile`   |
| Order Service   | 3003  | `apps/order-service/Dockerfile`     |
| MongoDB         | 27017 | Official `mongo:7.0` image          |

---

## 📜 Development Scripts

| Script            | Description                                           |
| ----------------- | ----------------------------------------------------- |
| `dev:gateway`     | Start API Gateway with hot-reload                     |
| `dev:user`        | Start User Service with hot-reload                    |
| `dev:product`     | Start Product Service with hot-reload                 |
| `dev:order`       | Start Order Service with hot-reload                   |
| `dev:all`         | Start all four services concurrently                  |
| `build:all`       | Compile all TypeScript services to JavaScript         |
| `start:all`       | Run all compiled services in production mode          |

---

## 📁 Project Structure

```
marketplace-microservices/
├── apps/
│   ├── api-gateway/              # API Gateway (port 3000)
│   │   ├── src/
│   │   │   ├── server.ts
│   │   │   └── shared/
│   │   │       ├── config.ts
│   │   │       ├── logger.ts
│   │   │       ├── middleware/
│   │   │       │   ├── auth.ts
│   │   │       │   └── errorHandler.ts
│   │   │       └── types/
│   │   │           └── index.ts
│   │   ├── Dockerfile
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   ├── user-service/              # User Management (port 3001)
│   │   ├── src/
│   │   │   ├── server.ts
│   │   │   ├── controllers/
│   │   │   │   └── userController.ts
│   │   │   ├── models/
│   │   │   │   └── User.ts
│   │   │   ├── routes/
│   │   │   │   └── userRoutes.ts
│   │   │   ├── validations/
│   │   │   │   └── user.validation.ts
│   │   │   └── shared/
│   │   │       ├── config.ts
│   │   │       ├── logger.ts
│   │   │       ├── middleware/
│   │   │       │   ├── auth.ts
│   │   │       │   ├── errorHandler.ts
│   │   │       │   └── validate.ts
│   │   │       └── types/
│   │   │           └── index.ts
│   │   ├── Dockerfile
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   ├── product-service/           # Product Catalog (port 3002)
│   │   ├── src/
│   │   │   ├── server.ts
│   │   │   ├── controllers/
│   │   │   │   └── productController.ts
│   │   │   ├── models/
│   │   │   │   └── Product.ts
│   │   │   ├── routes/
│   │   │   │   └── productRoutes.ts
│   │   │   ├── validations/
│   │   │   │   └── product.validation.ts
│   │   │   └── shared/
│   │   │       ├── config.ts
│   │   │       ├── logger.ts
│   │   │       ├── middleware/
│   │   │       │   ├── auth.ts
│   │   │       │   ├── errorHandler.ts
│   │   │       │   └── validate.ts
│   │   │       └── types/
│   │   │           └── index.ts
│   │   ├── Dockerfile
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   └── order-service/             # Order Processing (port 3003)
│       ├── src/
│       │   ├── server.ts
│       │   ├── controllers/
│       │   │   └── orderController.ts
│       │   ├── models/
│       │   │   └── Order.ts
│       │   ├── routes/
│       │   │   └── orderRoutes.ts
│       │   ├── services/
│       │   │   ├── productService.ts
│       │   │   └── userService.ts
│       │   ├── validations/
│       │   │   └── order.validation.ts
│       │   └── shared/
│       │       ├── config.ts
│       │       ├── logger.ts
│       │       ├── middleware/
│       │       │   ├── auth.ts
│       │       │   ├── errorHandler.ts
│       │       │   └── validate.ts
│       │       └── types/
│       │           └── index.ts
│       ├── Dockerfile
│       ├── package.json
│       └── tsconfig.json
│
├── packages/                      # Shared workspace packages
│   ├── config/
│   │   └── config.ts
│   ├── logger/
│   │   └── logger.ts
│   ├── middleware/
│   │   └── auth.ts
│   └── types/
│       └── index.ts
│
├── infrastructure/                # Infrastructure configs
├── docker-compose.yml             # Docker Compose configuration
├── docker.sh                      # Docker helper script
├── pnpm-workspace.yaml            # pnpm workspace definition
├── package.json                   # Root package.json
└── tsconfig.json                  # Root TypeScript config
```

---

## 🔗 Inter-Service Communication

The **Order Service** communicates with other services via HTTP:

### Product Service Client (`apps/order-service/src/services/productService.ts`)

- **`getProductsByIds(ids)`** — Fetches product details and validates stock availability
- Returns a `Map<productId, ProductData>` for efficient lookups
- Throws on insufficient stock or missing products

### User Service Client (`apps/order-service/src/services/userService.ts`)

- **`getUserById(id)`** — Fetches user profile to snapshot name and email in the order

---

## 📄 License

ISC — [MD. Anis Molla](https://github.com/anis009)

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request
