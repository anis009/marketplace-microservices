import express, { Request, Response } from 'express';
import { createProxyMiddleware } from 'http-proxy-middleware';
import logger from '../../shared/logger';
import config from '../../shared/config';

const app = express();

app.use(express.json());

const userServiceProxy = createProxyMiddleware({
  target: config.services.user,
  changeOrigin: true,
  pathRewrite: {
    '^/api/v1/users': '/api/users'
  },
  onError: (err, req: Request, res: Response) => {
    logger.error('User Service Error:', err);
    res.status(500).json({
      status: 'error',
      message: 'User service unavailable'
    });
  }
});

const productServiceProxy = createProxyMiddleware({
  target: config.services.product,
  changeOrigin: true,
  pathRewrite: {
    '^/api/v1/products': '/api/products'
  },
  onError: (err, req:Request, res:Response) => {
    logger.error('Product Service Error:', err);
    res.status(500).json({
      status: 'error',
      message: 'Product service unavailable'
    });
  }
});

const orderServiceProxy = createProxyMiddleware({
  target: config.services.order,
  changeOrigin: true,
  pathRewrite: {
    '^/api/v1/orders': '/api/orders'
  },
  onError: (err, req:Request, res:Response) => {
    logger.error('Order Service Error:', err);
    res.status(500).json({
      status: 'error',
      message: 'Order service unavailable'
    });
  }
});

app.use('/api/v1/users', userServiceProxy);
app.use('/api/v1/products', productServiceProxy);
app.use('/api/v1/orders', orderServiceProxy);

app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    service: 'api-gateway',
    timestamp: new Date().toISOString()
  });
});

const PORT = 3000;

app.listen(PORT, () => {
  logger.info('API Gateway running on port 3000');
});