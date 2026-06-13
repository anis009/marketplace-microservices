import { Role } from '../constants/roles';
import User from '../models/User';
import { IUser } from '../types';

interface CreateUserInput {
  name: string;
  email: string;
  password: string;
}

interface FindAllUsersInput {
  skip: number;
  limit: number;
}

export const findUserByEmail = (email: string) => {
  return User.findOne({ email });
};

export const findUserByEmailWithPassword = (email: string) => {
  return User.findOne({ email }).select('+password');
};

export const createUser = ({ name, email, password }: CreateUserInput) => {
  return User.create({
    name,
    email,
    password,
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
