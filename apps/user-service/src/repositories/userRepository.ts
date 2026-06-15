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
