import { Document, ObjectId, Types } from 'mongoose';
import { Role } from '../constants/roles';

//Seller Sub-Interfaces 

export interface IBusinessAddress {
  street: string;
  city: string;
  state: string;
  country: string;
  zipCode: string;
}

export interface IBusinessInfo {
  businessName: string;
  businessType: 'individual' | 'sole_proprietorship' | 'llc' | 'corporation' | 'partnership';
  description?: string;
  logo?: string | null;
  banner?: string | null;
  website?: string | null;
}

export interface ISellerContact {
  phone: string;
  alternatePhone?: string;
  supportEmail?: string;
  website?: string | null;
  socialLinks: {
    facebook?: string | null;
    instagram?: string | null;
    twitter?: string | null;
    linkedin?: string | null;
    youtube?: string | null;
  };
}

export interface ITaxInfo {
  taxId?: string;            // GST / VAT / EIN
  taxIdType?: 'gst' | 'vat' | 'ein' | 'other';
  businessRegNumber?: string; // Company registration number
  panNumber?: string;         // PAN (India specific)
  isGstRegistered?: boolean;
}

export interface IBankDetails {
  bankName?: string;
  accountHolderName?: string;
  accountNumber?: string;
  ifscCode?: string;          // Indian banking
  swiftCode?: string;         // International
  routingNumber?: string;     // US banking
  upiId?: string;             // UPI (India)
  paypalEmail?: string;       // PayPal
  payoutMethod: 'bank_transfer' | 'upi' | 'paypal' | 'stripe';
}

export interface ISellerVerification {
  status: 'unverified' | 'pending' | 'verified' | 'rejected';
  submittedAt?: Date | null;
  verifiedAt?: Date | null;
  rejectionReason?: string;
  documents: {
    type: 'government_id' | 'business_license' | 'tax_certificate' | 'address_proof' | 'other';
    url: string;
    uploadedAt: Date;
  }[];
}

export interface IStoreSettings {
  storeName: string;
  storeSlug: string;
  storeDescription?: string;
  storeLogo?: string | null;
  storeBanner?: string | null;
  returnPolicy?: string;
  shippingPolicy?: string;
  privacyPolicy?: string;
  customMessage?: string;    
}

export interface ISellerStats {
  averageRating: number;
  totalReviews: number;
  totalSales: number;
  totalOrders: number;
  totalProducts: number;
  totalRevenue: number;
  responseTime: number;        // Average response time in hours
  fulfillmentRate: number;     // Percentage of orders shipped on time
}

export interface ISellerSubscription {
  plan: 'free' | 'basic' | 'premium' | 'enterprise';
  startDate?: Date | null;
  endDate?: Date | null;
  isActive: boolean;
  maxProducts: number;         
}

export interface ISellerProfile {
  businessInfo: IBusinessInfo;
  contact: ISellerContact;
  businessAddress: IBusinessAddress;
  taxInfo: ITaxInfo;
  bankDetails: IBankDetails;
  verification: ISellerVerification;
  storeSettings: IStoreSettings;
  stats: ISellerStats;
  subscription: ISellerSubscription;
  isSuspended: boolean;
  suspensionReason?: string;
  suspendedAt?: Date | null;
}

// Core Interfaces

export interface IUser extends Document {
  name: string;
  email: string;
  password: string;
  role: Role;
  lastLogin?: Date | null;
  avatar?: string | null;
  sellerProfile?: ISellerProfile;
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


export interface AuthRequest {
  user?: IUser;
}

export interface ApiResponse<T = any> {
  success: boolean;
  status: 'success' | 'error';
  message: string;
  data?: T;
  error?: {
    statusCode: number;
    details?: unknown;
    stack?: string;
  };
}

export interface PaginatedResponse<T = any> {
  success: boolean;
  status: 'success' | 'error';
  message: string;
  data: {
    items: T[];
    totalPages: number;
    currentPage: number;
    total: number;
  };
}
