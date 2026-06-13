import jwt from 'jsonwebtoken';
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
  saveUserRole,
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

interface GetAllUsersInput {
  page: number;
  limit: number;
}

const signToken = (id: string): string => {
  return jwt.sign({ id }, config.jwt.secret, {
    expiresIn: '24h',
  });
};

const toAuthUser = (user: any) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  role: user.role,
});

export const registerUser = async ({ name, email, password }: RegisterUserInput) => {
  const existingUser = await findUserByEmail(email);
  if (existingUser) {
    throw new UserServiceError('User already exists with this email', 400);
  }

  const user = await createUser({
    name,
    email,
    password,
  });

  return {
    user: toAuthUser(user),
    token: signToken(user._id.toString()),
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

  return {
    user: toAuthUser(user),
    token: signToken(user._id.toString()),
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
