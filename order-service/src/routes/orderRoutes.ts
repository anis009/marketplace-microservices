import { createOrder, getOrder, getUserOrders, updateOrderStatus } from '@/controllers/orderController';
import express, { RequestHandler } from 'express';
import { protect } from '../shared/middleware/auth';
import { validate } from '../shared/middleware/validate';
import { createOrderSchema, updateOrderStatusSchema } from '../validations/order.validation';

const router = express.Router();

router.post('/', protect as unknown as RequestHandler, validate(createOrderSchema), createOrder as unknown as RequestHandler);
router.get('/user', protect as unknown as RequestHandler, getUserOrders as unknown as RequestHandler);
router.get('/:id', protect as unknown as RequestHandler, getOrder as unknown as RequestHandler);
router.put('/:id/status', protect as unknown as RequestHandler, validate(updateOrderStatusSchema), updateOrderStatus as unknown as RequestHandler);

export default router;