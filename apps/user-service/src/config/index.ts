import dotenv from 'dotenv';
import path from 'path';

// Load .env from monorepo root
dotenv.config({ path: path.resolve(__dirname, '../../../../.env') });

const defaultDatabaseName = 'astralbd-users';

const buildMongoUri = (baseUrl: string, databaseName: string): string => {
  try {
    const url = new URL(baseUrl);
    url.pathname = `/${databaseName}`;
    return url.toString();
  } catch {
    throw new Error('Invalid MONGODB_URL. Check the value in your .env file.');
  }
};

const mongoBaseUrl = process.env.MONGODB_URL || 'mongodb://localhost:27017';
const mongoDatabaseName = process.env.MONGODB_DATABASE || defaultDatabaseName;
const accessTokenSecret = process.env.JWT_ACCESS_SECRET || process.env.JWT_SECRET || 'fallback-secret-key';

const config = {
  port: process.env.USER_SERVICE_PORT || process.env.PORT || 3001,
  database: {
    url: mongoBaseUrl,
    name: mongoDatabaseName,
    uri: buildMongoUri(mongoBaseUrl, mongoDatabaseName)
  },
  jwt: {
    secret: accessTokenSecret,
    accessSecret: accessTokenSecret,
    refreshSecret: process.env.JWT_REFRESH_SECRET || 'fallback-refresh-secret-key',
    accessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN || process.env.JWT_EXPIRES_IN || process.env.expiresIn || '15m',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  },
  services: {
    user: process.env.USER_SERVICE_URL || 'http://localhost:3001',
    product: process.env.PRODUCT_SERVICE_URL || 'http://localhost:3002',
    order: process.env.ORDER_SERVICE_URL || 'http://localhost:3003'
  }
};

export default config;
