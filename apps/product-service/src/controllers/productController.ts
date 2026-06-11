import { Response,Request } from 'express';
import Product from '../models/Product';
import {  ApiResponse, PaginatedResponse } from '../shared/types';
import logger from '../shared/logger';

export const getAllProducts = async (req: Request, res: Response): Promise<void> => {
  try {
    const { category, page = 1, limit = 10 } = req.query;
    
    const query: any = { isActive: true };
    if (category) query.category = category;

    const products = await Product.find(query)
      .limit(Number(limit) * 1)
      .skip((Number(page) - 1) * Number(limit))
      .sort({ createdAt: -1 });

    const total = await Product.countDocuments(query);

    res.json({
      status: 'success',
      data: {
        items: products,
        totalPages: Math.ceil(total / Number(limit)),
        currentPage: Number(page),
        total
      }
    } as PaginatedResponse);
  } catch (error) {
    logger.error('Get products error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Internal server error'
    } as ApiResponse);
  }
};

export const getProduct = async (req: Request, res: Response): Promise<void> => {
  try {
    const product = await Product.findById(req.params.id);
    
    if (!product || !product.isActive) {
      res.status(404).json({
        status: 'error',
        message: 'Product not found'
      } as ApiResponse);
      return;
    }

    res.json({
      status: 'success',
      data: { product }
    } as ApiResponse);
  } catch (error) {
    logger.error('Get product error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Internal server error'
    } as ApiResponse);
  }
};

export const createProduct = async (req: Request, res: Response): Promise<void> => {
  try {
    const product = await Product.create(req.body);

    res.status(201).json({
      status: 'success',
      data: { product }
    } as ApiResponse);
  } catch (error) {
    logger.error('Create product error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Internal server error'
    } as ApiResponse);
  }
};

export const updateProduct = async (req: Request, res: Response): Promise<void> => {
  try {
    const product = await Product.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!product) {
      res.status(404).json({
        status: 'error',
        message: 'Product not found'
      } as ApiResponse);
      return;
    }

    res.json({
      status: 'success',
      data: { product }
    } as ApiResponse);
  } catch (error) {
    logger.error('Update product error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Internal server error'
    } as ApiResponse);
  }
};

export const deleteProduct = async (req: Request, res: Response): Promise<void> => {
  try {
    const product = await Product.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    );

    if (!product) {
      res.status(404).json({
        status: 'error',
        message: 'Product not found'
      } as ApiResponse);
      return;
    }

    res.json({
      status: 'success',
      message: 'Product deleted successfully'
    } as ApiResponse);
  } catch (error) {
    logger.error('Delete product error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Internal server error'
    } as ApiResponse);
  }
};