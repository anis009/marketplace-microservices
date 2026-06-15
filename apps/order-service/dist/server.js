"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const mongoose_1 = __importDefault(require("mongoose"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const config_1 = __importDefault(require("./shared/config"));
const logger_1 = __importDefault(require("./shared/logger"));
const orderRoutes_1 = __importDefault(require("./routes/orderRoutes"));
const errorHandler_1 = require("./shared/middleware/errorHandler");
const app = (0, express_1.default)();
app.use((0, helmet_1.default)());
app.use((0, cors_1.default)());
app.use(express_1.default.json());
app.get('/health', (req, res) => {
    res.json({ status: 'OK', service: 'order-service' });
});
app.use('/api/orders', orderRoutes_1.default);
app.use(errorHandler_1.notFoundHandler);
app.use(errorHandler_1.errorHandler);
mongoose_1.default.connect(`${config_1.default.database.url}/astralbd-orders`)
    .then(() => logger_1.default.info('Order service connected to MongoDB'))
    .catch(err => logger_1.default.error('MongoDB connection error:', err));
const PORT = 3003;
app.listen(PORT, () => {
    logger_1.default.info(`Order service running on port ${PORT}`);
});
//# sourceMappingURL=server.js.map