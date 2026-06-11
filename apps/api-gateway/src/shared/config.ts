import dotenv from 'dotenv';
import path from 'path';

// Load .env file from project root
const envPath = path.resolve(__dirname, '../');
console.log('Loading .env from:', envPath);

const result = dotenv.config({ path: envPath });

if (result.error) {
  console.error('Error loading .env file:', result.error);
 
  dotenv.config();
} else {
  console.log('.env file loaded successfully');
}

console.log('MONGODB_URL:', process.env.MONGODB_URL);
console.log('JWT_SECRET:', process.env.JWT_SECRET ? '***' : 'not set');

const config = {
  port: process.env.PORT || 3000,
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