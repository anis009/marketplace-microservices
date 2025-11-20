import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import helmet from 'helmet';
import config from '../../shared/config';
import logger from '../../shared/logger';
import { productRouter } from './routes/productRoutes';


const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());

app.use('/api/v1/products', productRouter);

app.get('/health', (req, res) => {
  res.json({ status: 'OK', service: 'product-service' });
});

mongoose.connect(`${config.database.url}/astral-products`)
  .then(() => logger.info('Product service connected to MongoDB'))
  .catch(err => logger.error('MongoDB connection error:', err));

const PORT = 3002;

app.listen(PORT, () => {
  logger.info(`Product service running on port ${PORT}`);
});