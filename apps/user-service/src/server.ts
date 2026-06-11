import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import helmet from 'helmet';
import { userRouter } from './routes/userRoutes';
import config from './shared/config';
import logger from './shared/logger';
import { errorHandler, notFoundHandler } from './shared/middleware/errorHandler';

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ status: 'OK', service: 'user-service' });
});
app.use('/api/users', userRouter);
app.get('/', (req, res) => {
  res.json({ status: 'OK', service: 'user-service' });
});


// 404 handler - must be after all routes
app.use(notFoundHandler);

// Global error handler - must be last
app.use(errorHandler);

mongoose.connect(`${config.database.url}/astralbd-users`)
  .then(() => logger.info('User service connected to MongoDB'))
  .catch(err => logger.error('MongoDB connection error:', err));

const PORT = 3001;

app.listen(PORT, () => {
  logger.info(`User service running on port ${PORT}`);
});