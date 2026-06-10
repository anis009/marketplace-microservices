FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY api-gateway/package*.json ./

# Install production dependencies
RUN npm ci --only=production

# Copy service code (includes shared folder)
COPY api-gateway/src ./src

# Expose port
EXPOSE 3000

# Start the service
CMD ["node", "src/server.js"]
