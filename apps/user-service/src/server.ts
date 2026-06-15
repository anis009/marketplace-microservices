import mongoose from 'mongoose';
import app from './app';
import config from './config';
import logger from './utils/logger';
import colors from "colors";

mongoose.connect(config.database.uri)
  .then(() => logger.info('User service connected to MongoDB'))
  .catch(err => logger.error('MongoDB connection error:', err));

const PORT = config.port || 3001;

app.listen(PORT, () => {
  logger.info(`User service running on port ${PORT}`.green);
});
