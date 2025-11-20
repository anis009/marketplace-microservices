import { createOrder, getOrder, getUserOrders, updateOrderStatus } from '@/controllers/orderController';
import express, { RequestHandler } from 'express';
import { protect } from '../../../shared/middleware/auth';



const router = express.Router();

router.post('/', protect as unknown as RequestHandler, createOrder as unknown as RequestHandler);
router.get('/user', protect as unknown as RequestHandler, getUserOrders as unknown as RequestHandler);
router.get('/:id', protect as unknown as RequestHandler, getOrder as unknown as RequestHandler);
router.put('/:id/status', protect as unknown as RequestHandler, updateOrderStatus as unknown as RequestHandler);

export default router;