import dotenv from 'dotenv';
import path from 'path';

// Load .env from monorepo root
dotenv.config({ path: path.resolve(__dirname, '../../../..', '.env') });

const config = {
  port: process.env.PRODUCT_SERVICE_PORT || process.env.PORT || 3002,
  database: {
    url: process.env.MONGODB_URL || 'mongodb://localhost:27017'
  },
  jwt: {
    secret: process.env.JWT_SECRET || 'fallback-secret-key',
    expiresIn: '24h'
  },
  services: {
    user: process.env.USER_SERVICE_URL || 'http://localhost:3001',
    product: process.env.PRODUCT_SERVICE_URL || 'http://localhost:3002',
    order: process.env.ORDER_SERVICE_URL || 'http://localhost:3003'
  }
};

export default config;