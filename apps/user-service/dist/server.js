"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const app_1 = __importDefault(require("./app"));
const config_1 = __importDefault(require("./config"));
const logger_1 = __importDefault(require("./utils/logger"));
mongoose_1.default.connect(config_1.default.database.uri)
    .then(() => logger_1.default.info('User service connected to MongoDB'))
    .catch(err => logger_1.default.error('MongoDB connection error:', err));
const PORT = config_1.default.port || 3001;
app_1.default.listen(PORT, () => {
    logger_1.default.info(`User service running on port ${PORT}`.green);
});
//# sourceMappingURL=server.js.map