"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const userRoutes_1 = require("./routes/userRoutes");
const errorHandler_1 = require("./middleware/errorHandler");
const response_1 = require("./utils/response");
const app = (0, express_1.default)();
app.use((0, helmet_1.default)());
app.use((0, cors_1.default)());
app.use(express_1.default.json());
app.get('/health', (req, res) => {
    (0, response_1.sendSuccess)(res, {
        message: 'User service is healthy',
        data: { service: 'user-service' },
    });
});
app.use('/api/users', userRoutes_1.userRouter);
app.get('/', (req, res) => {
    (0, response_1.sendSuccess)(res, {
        message: 'User service is running',
        data: { service: 'user-service' },
    });
});
app.use(errorHandler_1.notFoundHandler);
app.use(errorHandler_1.errorHandler);
exports.default = app;
//# sourceMappingURL=app.js.map