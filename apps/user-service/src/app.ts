import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { userRouter } from './routes/userRoutes';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import { sendSuccess } from './utils/response';

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());

app.get('/health', (req, res) => {
  sendSuccess(res, {
    message: 'User service is healthy',
    data: { service: 'user-service' },
  });
});

app.use('/api/users', userRouter);

app.get('/', (req, res) => {
  sendSuccess(res, {
    message: 'User service is running',
    data: { service: 'user-service' },
  });
});

app.use(notFoundHandler);
app.use(errorHandler);

export default app;
