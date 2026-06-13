import { Response } from 'express';
import { ApiResponse } from '../types';

interface SuccessResponseOptions<T> {
  statusCode?: number;
  message?: string;
  data?: T;
}

interface ErrorResponseOptions {
  statusCode?: number;
  message: string;
  details?: unknown;
  stack?: string;
}

export const sendSuccess = <T>(
  res: Response,
  {
    statusCode = 200,
    message = 'Success',
    data,
  }: SuccessResponseOptions<T> = {}
): Response<ApiResponse<T>> => {
  return res.status(statusCode).json({
    success: true,
    status: 'success',
    message,
    data,
  } as ApiResponse<T>);
};

export const sendError = (
  res: Response,
  {
    statusCode = 500,
    message,
    details,
    stack,
  }: ErrorResponseOptions
): Response<ApiResponse> => {
  return res.status(statusCode).json({
    success: false,
    status: 'error',
    message,
    error: {
      statusCode,
      details,
      stack,
    },
  } as ApiResponse);
};
