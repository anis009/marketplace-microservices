import { Document, ObjectId, Types } from 'mongoose';

export interface IUser extends Document {
  name: string;
  email: string;
  password: string;
  role: 'user' | 'admin';
  correctPassword(candidatePassword: string, userPassword: string): Promise<boolean>;
  createdAt: Date;
  updatedAt: Date;
}

export interface IProduct extends Document {
  name: string;
  description: string;
  price: number;
  category: string;
  stock: number;
  images: string[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface IOrderItem {
  productId: string;
  quantity: number;
  price: number;
  name: string;
}

export interface IShippingAddress {
  street: string;
  city: string;
  state: string;
  country: string;
  zipCode: string;
}

export interface IUserDetails {
  name: string;
  email: string;
}

export interface IOrder extends Document {
  userId: string;
  userDetails: IUserDetails;
  items: IOrderItem[];
  totalAmount: number;
  status: 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled';
  shippingAddress: IShippingAddress;
  paymentStatus: 'pending' | 'completed' | 'failed';
  createdAt: Date;
  updatedAt: Date;
}

// Fix: Use declaration merging to extend Express Request
// This avoids type conflicts between Express versions
export interface AuthRequest {
  user?: IUser;
}

export interface ApiResponse<T = any> {
  status: 'success' | 'error';
  message?: string;
  data?: T;
}

export interface PaginatedResponse<T = any> {
  status: 'success' | 'error';
  message?: string;
  data: {
    items: T[];
    totalPages: number;
    currentPage: number;
    total: number;
  };
}