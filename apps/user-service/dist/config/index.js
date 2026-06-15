"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
const rootEnvPath = path_1.default.resolve(__dirname, '../../../..', '.env');
const serviceEnvPath = path_1.default.resolve(__dirname, '../..', '.env');
dotenv_1.default.config({ path: rootEnvPath });
dotenv_1.default.config({ path: serviceEnvPath });
const defaultDatabaseName = 'astralbd-users';
const buildMongoUri = (baseUrl, databaseName) => {
    try {
        const url = new URL(baseUrl);
        url.pathname = `/${databaseName}`;
        return url.toString();
    }
    catch {
        throw new Error('Invalid MONGODB_URL. Check the value in your .env file.');
    }
};
const mongoBaseUrl = process.env.MONGODB_URL || 'mongodb://localhost:27017';
const mongoDatabaseName = process.env.MONGODB_DATABASE || defaultDatabaseName;
const accessTokenSecret = process.env.JWT_ACCESS_SECRET || process.env.JWT_SECRET || 'fallback-secret-key';
const config = {
    port: process.env.PORT || 3000,
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
exports.default = config;
//# sourceMappingURL=index.js.map