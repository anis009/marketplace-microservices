# Build stage
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files
COPY user-service/package*.json ./
COPY user-service/tsconfig.json ./

# Install ALL dependencies (including devDependencies for build)
RUN npm ci

# Copy service source code (includes shared folder)
COPY user-service/src ./src

# Build TypeScript
RUN npm run build

# Production stage
FROM node:18-alpine

WORKDIR /app

# Copy package files and install production dependencies only
COPY user-service/package*.json ./
RUN npm ci --only=production

# Copy built files from builder
COPY --from=builder /app/dist ./dist

# Expose port
EXPOSE 3001

# Start the service
CMD ["npm", "start"]
