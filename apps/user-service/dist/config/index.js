"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
const envPath = path_1.default.resolve(__dirname, '../../.env');
console.log('Loading .env from:', envPath);
const result = dotenv_1.default.config({ path: envPath });
if (result.error) {
    console.error('Error loading .env file:', result.error);
    dotenv_1.default.config();
}
else {
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
exports.default = config;
//# sourceMappingURL=index.js.map