import mongoose from 'mongoose';
import app from './app';
import config from './config';
import logger from './utils/logger';

mongoose.connect(`${config.database.url}/astralbd-users`)
  .then(() => logger.info('User service connected to MongoDB'))
  .catch(err => logger.error('MongoDB connection error:', err));

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  logger.info(`User service running on port ${PORT}`);
});
