import { Response, Request } from 'express';
import Order from '../models/Order';
import { ApiResponse, AuthRequest } from '../shared/types';
import logger from '../shared/logger';
import { getProductsByIds } from '../services/productService';
import { getUserById } from '../services/userService';

export const createOrder = async (req: Request, res: Response): Promise<void> => {
  try {
      const authReq = req as AuthRequest;
      const { items, shippingAddress } = req.body;
      
      if(!authReq?.user?._id){
          res.status(401).json({
              status: 'error',
              message: 'User not authenticated'
          } as ApiResponse);
          return;
      }

      // Validate products exist and get their details
      const productIds = items.map((item: any) => item.productId);
      const productsMap = await getProductsByIds(productIds);

      // Validate all products exist
      const orderItems = items.map((item: any) => {
        const product = productsMap.get(item.productId);
        if (!product) {
          throw new Error(`Product ${item.productId} not found`);
        }
        if (!product.isActive) {
          throw new Error(`Product ${product.name} is not available`);
        }
        if (product.stock < item.quantity) {
          throw new Error(`Insufficient stock for product ${product.name}`);
        }
        
        return {
          productId: item.productId,
          quantity: item.quantity,
          price: product.price,
          name: product.name
        };
      });
    
      // Fetch user details from User Service
      const user = await getUserById(authReq.user._id.toString());
      
      if (!user) {
        res.status(401).json({
          status: 'error',
          message: 'User not found'
        } as ApiResponse);
        return;
      }

      const order = await Order.create({
        userId: authReq.user._id.toString(),
        userDetails: {
          name: user.name,
          email: user.email
        },
        items: orderItems,
        shippingAddress
      });

      res.status(201).json({
        status: 'success',
        data: { order }
      } as ApiResponse);
  } catch (error: any) {
    logger.error('Create order error:', error);
    res.status(error.message?.includes('not found') || error.message?.includes('not available') ? 400 : 500).json({
      status: 'error',
      message: error.message || 'Internal server error'
    } as ApiResponse);
  }
};

export const getUserOrders = async (req: Request, res: Response): Promise<void> => {
  try {
    const authReq = req as AuthRequest;
    const orders = await Order.find({ userId: authReq.user?._id.toString() })
      .sort({ createdAt: -1 });

    // Note: Items already have product name and price stored
    // If you need full product details, you can optionally fetch them here

    res.json({
      status: 'success',
      data: { orders }
    } as ApiResponse);
  } catch (error) {
    logger.error('Get user orders error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Internal server error'
    } as ApiResponse);
  }
};

export const getOrder = async (req: Request, res: Response): Promise<void> => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      res.status(404).json({
        status: 'error',
        message: 'Order not found'
      } as ApiResponse);
      return;
    }

    // All data is stored in the order - no need to call other services!
    // User details are in order.userDetails
    // Product details (name, price) are in order.items

    res.json({
      status: 'success',
      data: { order }
    } as ApiResponse);
  } catch (error) {
    logger.error('Get order error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Internal server error'
    } as ApiResponse);
  }
};

export const updateOrderStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const { status } = req.body;
    
    const order = await Order.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true, runValidators: true }
    );

    if (!order) {
      res.status(404).json({
        status: 'error',
        message: 'Order not found'
      } as ApiResponse);
      return;
    }

    res.json({
      status: 'success',
      data: { order }
    } as ApiResponse);
  } catch (error) {
    logger.error('Update order status error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Internal server error'
    } as ApiResponse);
  }
};