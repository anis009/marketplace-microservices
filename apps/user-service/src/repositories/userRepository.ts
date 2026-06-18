import { Role } from '../constants/roles';
import User from '../models/User';
import { IUser } from '../types';

interface CreateUserInput {
  name: string;
  email: string;
  password: string;
  avatar?: string | null;
}

interface FindAllUsersInput {
  skip: number;
  limit: number;
}

interface UpdateUserInput {
  name?: string;
  email?: string;
  password?: string;
  avatar?: string | null;
}

export const findUserByEmail = (email: string) => {
  return User.findOne({ email });
};

export const findUserByEmailWithPassword = (email: string) => {
  return User.findOne({ email }).select('+password');
};

export const createUser = ({ name, email, password, avatar }: CreateUserInput) => {
  return User.create({
    name,
    email,
    password,
    avatar,
  });
};

export const findUserById = (id: string) => {
  return User.findById(id);
};

export const findUserByIdWithoutPassword = (id: string) => {
  return User.findById(id).select('-password');
};

export const saveUserRole = async (user: IUser, role: Role) => {
  user.role = role;
  return user.save();
};

export const saveUserLastLogin = async (user: IUser) => {
  user.lastLogin = new Date();
  return user.save();
};

export const updateUserById = async (id: string, updates: UpdateUserInput) => {
  const user = await User.findById(id);
  if (!user) return null;

  if (updates.name !== undefined) user.name = updates.name;
  if (updates.email !== undefined) user.email = updates.email;
  if (updates.password !== undefined) user.password = updates.password;
  if (updates.avatar !== undefined) user.avatar = updates.avatar;

  return user.save();
};

export const findAllUsers = ({ skip, limit }: FindAllUsersInput) => {
  return User.find()
    .select('-password')
    .skip(skip)
    .limit(limit)
    .sort({ createdAt: -1 });
};

export const countUsers = () => {
  return User.countDocuments();
};

// TODO: seller-specific repository functions
export const findSellerByStoreSlug = (storeSlug: string) => {
  return User.findOne({
    role: 'seller',
    'sellerProfile.storeSettings.storeSlug': storeSlug,
  }).select('-password');
};

export const findSellersByVerificationStatus = (
  status: string,
  skip: number,
  limit: number
) => {
  return User.find({
    role: 'seller',
    'sellerProfile.verification.status': status,
  })
    .select('-password')
    .skip(skip)
    .limit(limit)
    .sort({ createdAt: -1 });
};

export const countSellersByVerificationStatus = (status: string) => {
  return User.countDocuments({
    role: 'seller',
    'sellerProfile.verification.status': status,
  });
};

export const findAllSellers = (
  skip: number,
  limit: number,
  filters?: {
    status?: string;
    search?: string;
  }
) => {
  const query: Record<string, any> = { role: 'seller' };

  if (filters?.status) {
    query['sellerProfile.verification.status'] = filters.status;
  }

  if (filters?.search) {
    query.$or = [
      { name: { $regex: filters.search, $options: 'i' } },
      { email: { $regex: filters.search, $options: 'i' } },
      { 'sellerProfile.businessInfo.businessName': { $regex: filters.search, $options: 'i' } },
      { 'sellerProfile.storeSettings.storeName': { $regex: filters.search, $options: 'i' } },
    ];
  }

  return User.find(query)
    .select('-password')
    .skip(skip)
    .limit(limit)
    .sort({ createdAt: -1 });
};

export const countAllSellers = (filters?: { status?: string; search?: string }) => {
  const query: Record<string, any> = { role: 'seller' };

  if (filters?.status) {
    query['sellerProfile.verification.status'] = filters.status;
  }

  if (filters?.search) {
    query.$or = [
      { name: { $regex: filters.search, $options: 'i' } },
      { email: { $regex: filters.search, $options: 'i' } },
      { 'sellerProfile.businessInfo.businessName': { $regex: filters.search, $options: 'i' } },
      { 'sellerProfile.storeSettings.storeName': { $regex: filters.search, $options: 'i' } },
    ];
  }

  return User.countDocuments(query);
};

export const findActiveSellers = (skip: number, limit: number) => {
  return User.find({
    role: 'seller',
    'sellerProfile.verification.status': 'verified',
    'sellerProfile.isSuspended': false,
  })
    .select('-password')
    .skip(skip)
    .limit(limit)
    .sort({ 'sellerProfile.stats.averageRating': -1 });
};

export const countActiveSellers = () => {
  return User.countDocuments({
    role: 'seller',
    'sellerProfile.verification.status': 'verified',
    'sellerProfile.isSuspended': false,
  });
};
