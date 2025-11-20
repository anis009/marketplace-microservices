# Docker Setup for Microservices Backend

## 🚀 Quick Start

### Prerequisites
- Docker installed (v20.10+)
- Docker Compose installed (v2.0+)

### Running All Services

```bash
# Build and start all services
docker-compose up --build

# Run in detached mode (background)
docker-compose up -d --build

# View logs
docker-compose logs -f

# Stop all services
docker-compose down

# Stop and remove volumes (clears database)
docker-compose down -v
```

## 📦 Services

| Service | Port | Description |
|---------|------|-------------|
| **API Gateway** | 3000 | Main entry point - `/api/v1/*` |
| **User Service** | 3001 | User authentication & management |
| **Product Service** | 3002 | Product catalog management |
| **Order Service** | 3003 | Order processing |
| **MongoDB** | 27017 | Database |

## 🔧 Environment Variables

Create a `.env` file in the root directory:

```env
JWT_SECRET=your-super-secret-jwt-key-change-this
MONGODB_URL=mongodb://admin:admin123@mongodb:27017/microservices?authSource=admin
```

## 📡 API Endpoints

### Base URL: `http://localhost:3000`

#### User Service
- `POST /api/v1/users/register` - Register new user
- `POST /api/v1/users/login` - User login
- `GET /api/v1/users/:id` - Get user (protected)

#### Product Service
- `GET /api/v1/products` - List products
- `GET /api/v1/products/:id` - Get product
- `POST /api/v1/products` - Create product (protected)
- `PUT /api/v1/products/:id` - Update product (protected)

#### Order Service
- `POST /api/v1/orders` - Create order (protected)
- `GET /api/v1/orders/user` - Get user orders (protected)
- `GET /api/v1/orders/:id` - Get order (protected)
- `PUT /api/v1/orders/:id/status` - Update status (protected)

### Health Check
- `GET http://localhost:3000/health` - API Gateway health

## 🐳 Individual Service Commands

```bash
# Build specific service
docker-compose build user-service

# Start specific service
docker-compose up user-service

# View service logs
docker-compose logs -f user-service

# Restart service
docker-compose restart user-service

# Execute command in running container
docker-compose exec user-service sh
```

## 🔍 Troubleshooting

### Check service status
```bash
docker-compose ps
```

### View all logs
```bash
docker-compose logs
```

### Rebuild from scratch
```bash
docker-compose down -v
docker-compose build --no-cache
docker-compose up
```

### Access MongoDB
```bash
docker-compose exec mongodb mongosh -u admin -p admin123
```

## 🏗️ Architecture

```
┌─────────────┐
│   Client    │
└──────┬──────┘
       │
       ▼
┌─────────────────────┐
│   API Gateway       │
│   (Port 3000)       │
└──────┬──────────────┘
       │
       ├─────────────────┬─────────────────┐
       ▼                 ▼                 ▼
┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│ User Service │  │Product Service│ │Order Service │
│  (Port 3001) │  │  (Port 3002)  │ │  (Port 3003) │
└──────┬───────┘  └──────┬────────┘ └──────┬───────┘
       │                 │                 │
       └─────────────────┴─────────────────┘
                         │
                    ┌────▼─────┐
                    │ MongoDB  │
                    │(Port 27017)│
                    └──────────┘
```

## 📝 Notes

- All services communicate via Docker's internal network
- MongoDB data persists in a Docker volume
- Services auto-restart on failure
- Use `.dockerignore` to optimize build times
