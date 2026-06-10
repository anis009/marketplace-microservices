import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import helmet from 'helmet';
import config from './shared/config';
import logger from './shared/logger';
import { productRouter } from './routes/productRoutes';
import { errorHandler, notFoundHandler } from './shared/middleware/errorHandler';

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ status: 'OK', service: 'product-service' });
});

app.use('/api/products', productRouter);

// 404 handler - must be after all routes
app.use(notFoundHandler);

// Global error handler - must be last
app.use(errorHandler);

mongoose.connect(`${config.database.url}/astral-products`)
  .then(() => logger.info('Product service connected to MongoDB'))
  .catch(err => logger.error('MongoDB connection error:', err));

const PORT = 3002;

app.listen(PORT, () => {
  logger.info(`Product service running on port ${PORT}`);
});