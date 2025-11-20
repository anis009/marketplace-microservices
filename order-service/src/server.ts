import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import helmet from 'helmet';
import config from '../../shared/config';
import logger from '../../shared/logger';
import orderRoutes from './routes/orderRoutes';

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());

app.use('/api/v1/orders', orderRoutes);

app.get('/health', (req, res) => {
  res.json({ status: 'OK', service: 'order-service' });
});

mongoose.connect(`${config.database.url}/astralbd-orders`)
  .then(() => logger.info('Order service connected to MongoDB'))
  .catch(err => logger.error('MongoDB connection error:', err));

const PORT = 3003;

app.listen(PORT, () => {
  logger.info(`Order service running on port ${PORT}`);
});