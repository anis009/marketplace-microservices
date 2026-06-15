import jwt, { SignOptions } from 'jsonwebtoken';
import config from '../config';
import logger from '../utils/logger';
import {
  countUsers,
  createUser,
  findAllUsers,
  findUserByEmail,
  findUserByEmailWithPassword,
  findUserById,
  findUserByIdWithoutPassword,
  saveUserLastLogin,
  saveUserRole,
  updateUserById,
} from '../repositories/userRepository';
import {
  Role,
  ROLES,
  VALID_ROLES,
  canAssignRole,
  hasHigherPrivilege,
} from '../constants/roles';

export class UserServiceError extends Error {
  statusCode: number;

  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
  }
}

interface RegisterUserInput {
  name: string;
  email: string;
  password: string;
  avatar?: string | null;
}

interface LoginUserInput {
  email: string;
  password: string;
}

interface UpdateUserRoleInput {
  assignerId?: string;
  assignerRole: Role;
  targetUserId: string;
  newRole: Role;
}

interface UpdateUserInput {
  requesterId?: string;
  requesterRole?: Role;
  targetUserId: string;
  name?: string;
  email?: string;
  password?: string;
  avatar?: string | null;
}

interface GetAllUsersInput {
  page: number;
  limit: number;
}

const signAccessToken = (id: string): string => {
  const options: SignOptions = {
    expiresIn: config.jwt.accessExpiresIn as SignOptions['expiresIn'],
  };

  return jwt.sign({ id, type: 'access' }, config.jwt.accessSecret, {
    ...options,
  });
};

const signRefreshToken = (id: string): string => {
  const options: SignOptions = {
    expiresIn: config.jwt.refreshExpiresIn as SignOptions['expiresIn'],
  };

  return jwt.sign({ id, type: 'refresh' }, config.jwt.refreshSecret, {
    ...options,
  });
};

const createAuthTokens = (id: string) => {
  return {
    accessToken: signAccessToken(id),
    refreshToken: signRefreshToken(id),
  };
};

const toAuthUser = (user: any) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  role: user.role,
  avatar: user.avatar ?? null,
  lastLogin: user.lastLogin ?? null,
});

export const registerUser = async ({ name, email, password, avatar }: RegisterUserInput) => {
  const existingUser = await findUserByEmail(email);
  if (existingUser) {
    throw new UserServiceError('User already exists with this email', 400);
  }

  const user = await createUser({
    name,
    email,
    password,
    avatar,
  });

  return {
    user: toAuthUser(user),
    ...createAuthTokens(user._id.toString()),
  };
};

export const loginUser = async ({ email, password }: LoginUserInput) => {
  if (!email || !password) {
    throw new UserServiceError('Please provide email and password', 400);
  }

  const user = await findUserByEmailWithPassword(email);

  if (!user || !(await user.correctPassword(password, user.password))) {
    throw new UserServiceError('Incorrect email or password', 401);
  }

  const updatedUser = await saveUserLastLogin(user);

  return {
    user: toAuthUser(updatedUser),
    ...createAuthTokens(updatedUser._id.toString()),
  };
};

export const getUserById = async (id: string) => {
  const user = await findUserByIdWithoutPassword(id);

  if (!user) {
    throw new UserServiceError('User not found', 404);
  }

  return user;
};

export const getAvailableRoles = () => VALID_ROLES;

export const updateUserProfileById = async ({
  requesterId,
  requesterRole,
  targetUserId,
  name,
  email,
  password,
  avatar,
}: UpdateUserInput) => {
  if (!requesterId) {
    throw new UserServiceError('Authentication required', 401);
  }

  const isSelf = requesterId === targetUserId;
  const canManageUsers = requesterRole === ROLES.ADMIN || requesterRole === ROLES.SUPER_ADMIN;

  if (!isSelf && !canManageUsers) {
    throw new UserServiceError('You do not have permission to update this user', 403);
  }

  const hasUpdates = [name, email, password, avatar].some((value) => value !== undefined);
  if (!hasUpdates) {
    throw new UserServiceError('No update fields provided', 400);
  }

  if (email) {
    const existingUser = await findUserByEmail(email);
    if (existingUser && existingUser._id.toString() !== targetUserId) {
      throw new UserServiceError('User already exists with this email', 400);
    }
  }

  const updatedUser = await updateUserById(targetUserId, {
    name,
    email,
    password,
    avatar,
  });

  if (!updatedUser) {
    throw new UserServiceError('User not found', 404);
  }

  return toAuthUser(updatedUser);
};

export const updateUserRoleById = async ({
  assignerId,
  assignerRole,
  targetUserId,
  newRole,
}: UpdateUserRoleInput) => {
  if (!newRole || !VALID_ROLES.includes(newRole)) {
    throw new UserServiceError(`Invalid role. Valid roles: ${VALID_ROLES.join(', ')}`, 400);
  }

  if (assignerId === targetUserId) {
    throw new UserServiceError('You cannot change your own role', 400);
  }

  if (!canAssignRole(assignerRole, newRole)) {
    throw new UserServiceError(`You do not have permission to assign the '${newRole}' role`, 403);
  }

  const targetUser = await findUserById(targetUserId);
  if (!targetUser) {
    throw new UserServiceError('Target user not found', 404);
  }

  if (
    assignerRole !== ROLES.SUPER_ADMIN &&
    hasHigherPrivilege(targetUser.role as Role, assignerRole)
  ) {
    throw new UserServiceError('Cannot modify a user with equal or higher privilege', 403);
  }

  const oldRole = targetUser.role;
  const updatedUser = await saveUserRole(targetUser, newRole);

  logger.info(`Role updated: User ${targetUserId} ${oldRole} -> ${newRole} by ${assignerId}`);

  return toAuthUser(updatedUser);
};

export const getAllUsers = async ({ page, limit }: GetAllUsersInput) => {
  const skip = (page - 1) * limit;

  const users = await findAllUsers({ skip, limit });
  const total = await countUsers();

  return {
    users,
    pagination: {
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      total,
    },
  };
};
