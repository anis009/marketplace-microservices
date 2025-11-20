# Build stage
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files
COPY order-service/package*.json ./
COPY order-service/tsconfig.json ./

# Install ALL dependencies (including devDependencies for build)
RUN npm ci

# Copy shared folder and service source code
COPY shared /app/shared
COPY order-service/src ./src

# Build TypeScript
RUN npm run build

# Production stage
FROM node:18-alpine

WORKDIR /app

# Copy package files and install production dependencies only
COPY order-service/package*.json ./
RUN npm ci --only=production

# Copy built files from builder
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/shared ./shared

# Expose port
EXPOSE 3003

# Start the service
CMD ["npm", "start"]
