import { Request, Response } from 'express';
import { AuthRequest } from '../types';
import logger from '../utils/logger';
import { sendError, sendSuccess } from '../utils/response';
import {
  UserServiceError,
  registerUser,
  loginUser,
  getUserById,
  getAvailableRoles,
  updateUserProfileById,
  updateUserRoleById,
  getAllUsers as getAllUsersService,
  onboardSeller,
  updateSellerProfileSection,
  getSellerPublicProfile,
  getSellerOwnProfile,
  listSellers,
  listPendingVerifications,
  verifySeller,
  suspendSeller,
  unsuspendSeller,
  listActiveSellers,
  getSellerByStoreSlug,
} from '../services/userService';
import { Role } from '../constants/roles';

const sendControllerError = (res: Response, logMessage: string, error: unknown): void => {
  logger.error(logMessage, error);

  if (error instanceof UserServiceError) {
    sendError(res, {
      statusCode: error.statusCode,
      message: error.message,
    });
    return;
  }

  sendError(res, {
    statusCode: 500,
    message: 'Internal server error',
  });
};

export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, email, password, avatar } = req.body;
    const data = await registerUser({
      name,
      email,
      password,
      avatar,
    });

    sendSuccess(res, {
      statusCode: 201,
      message: 'User registered successfully',
      data,
    });
  } catch (error) {
    sendControllerError(res, 'Registration error:', error);
  }
};

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;
    const data = await loginUser({ email, password });

    sendSuccess(res, {
      message: 'Login successful',
      data,
    });
  } catch (error) {
    sendControllerError(res, 'Login error:', error);
  }
};

export const getUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.params.id;
    if (!userId) {
      throw new UserServiceError('User ID is required', 400);
    }

    const user = await getUserById(userId);

    sendSuccess(res, {
      message: 'User fetched successfully',
      data: { user },
    });
  } catch (error) {
    sendControllerError(res, 'Get user error:', error);
  }
};

export const updateUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const authReq = req as AuthRequest;
    const targetUserId = req.params.id;
    if (!targetUserId) {
      throw new UserServiceError('User ID is required', 400);
    }

    const user = await updateUserProfileById({
      requesterId: authReq.user?._id?.toString(),
      requesterRole: authReq.user?.role as Role | undefined,
      targetUserId,
      name: req.body.name,
      email: req.body.email,
      password: req.body.password,
      avatar: req.body.avatar,
    });

    sendSuccess(res, {
      message: 'User updated successfully',
      data: { user },
    });
  } catch (error) {
    sendControllerError(res, 'Update user error:', error);
  }
};

/**
 * GET /api/users/roles — List all available roles
 */
export const getRoles = async (req: Request, res: Response): Promise<void> => {
  try {
    sendSuccess(res, {
      message: 'Roles fetched successfully',
      data: { roles: getAvailableRoles() },
    });
  } catch (error) {
    sendControllerError(res, 'Get roles error:', error);
  }
};

/**
 * PATCH /api/users/:id/role — Update a user's role (admin / super-admin only)
 * Body: { role: Role }
 */
export const updateUserRole = async (req: Request, res: Response): Promise<void> => {
  try {
    const authReq = req as AuthRequest;
    const targetUserId = req.params.id;
    if (!targetUserId) {
      throw new UserServiceError('User ID is required', 400);
    }

    const user = await updateUserRoleById({
      assignerId: authReq.user?._id?.toString(),
      assignerRole: authReq.user?.role as Role,
      targetUserId,
      newRole: req.body.role as Role,
    });

    sendSuccess(res, {
      message: 'User role updated successfully',
      data: { user },
    });
  } catch (error) {
    sendControllerError(res, 'Update user role error:', error);
  }
};

/**
 * GET /api/users/ — List all users (admin / super-admin only)
 */
export const getAllUsers = async (req: Request, res: Response): Promise<void> => {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 20;
    const data = await getAllUsersService({ page, limit });

    sendSuccess(res, {
      message: 'Users fetched successfully',
      data,
    });
  } catch (error) {
    sendControllerError(res, 'Get all users error:', error);
  }
};

// ─── Seller Controller Functions ───────────────────────────────────────

/**
 * POST /api/users/seller/onboard — Onboard as a seller
 */
export const onboardSellerController = async (req: Request, res: Response): Promise<void> => {
  try {
    const authReq = req as AuthRequest;
    const data = await onboardSeller({
      requesterId: authReq.user!._id.toString(),
      requesterRole: authReq.user!.role as Role,
      businessInfo: req.body.businessInfo,
      contact: req.body.contact,
      businessAddress: req.body.businessAddress,
      taxInfo: req.body.taxInfo,
      bankDetails: req.body.bankDetails,
      storeSettings: req.body.storeSettings,
    });

    sendSuccess(res, {
      statusCode: 201,
      message: 'Seller profile created successfully',
      data,
    });
  } catch (error) {
    sendControllerError(res, 'Onboard seller error:', error);
  }
};

/**
 * PATCH /api/users/seller/profile/:section — Update a seller profile section
 */
export const updateSellerProfileSectionController = async (req: Request, res: Response): Promise<void> => {
  try {
    const authReq = req as AuthRequest;
    const targetUserId = req.params.id!;
    const section = req.params.section!;

    if (!targetUserId || !section) {
      throw new UserServiceError('User ID and section are required', 400);
    }

    const user = await updateSellerProfileSection({
      requesterId: authReq.user!._id.toString(),
      requesterRole: authReq.user!.role as Role,
      targetUserId,
      section,
      updates: req.body,
    });

    sendSuccess(res, {
      message: `Seller ${section} updated successfully`,
      data: { user },
    });
  } catch (error) {
    sendControllerError(res, 'Update seller profile error:', error);
  }
};

/**
 * GET /api/users/seller/me — Get own seller profile (full, includes sensitive data)
 */
export const getSellerProfile = async (req: Request, res: Response): Promise<void> => {
  try {
    const authReq = req as AuthRequest;
    const user = await getSellerOwnProfile(authReq.user!._id.toString());

    sendSuccess(res, {
      message: 'Seller profile fetched successfully',
      data: { seller: user },
    });
  } catch (error) {
    sendControllerError(res, 'Get seller profile error:', error);
  }
};

/**
 * GET /api/users/seller/public/:id — Get a seller's public profile
 */
export const getSellerPublicProfileController = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = req.params.id;
    if (!id) {
      throw new UserServiceError('Seller ID is required', 400);
    }
    const seller = await getSellerPublicProfile({ sellerId: id });

    sendSuccess(res, {
      message: 'Seller public profile fetched successfully',
      data: { seller },
    });
  } catch (error) {
    sendControllerError(res, 'Get seller public profile error:', error);
  }
};

/**
 * GET /api/users/seller/store/:slug — Get a seller's storefront by slug
 */
export const getSellerBySlugController = async (req: Request, res: Response): Promise<void> => {
  try {
    const slug = req.params.slug;
    if (!slug) {
      throw new UserServiceError('Store slug is required', 400);
    }
    const seller = await getSellerByStoreSlug(slug);

    sendSuccess(res, {
      message: 'Store fetched successfully',
      data: { seller },
    });
  } catch (error) {
    sendControllerError(res, 'Get seller by slug error:', error);
  }
};

/**
 * GET /api/users/sellers — List all sellers (admin/super-admin)
 */
export const listSellersController = async (req: Request, res: Response): Promise<void> => {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 20;
    const status = req.query.status as string | undefined;
    const search = req.query.search as string | undefined;

    const data = await listSellers({ page, limit, status, search });

    sendSuccess(res, {
      message: 'Sellers fetched successfully',
      data,
    });
  } catch (error) {
    sendControllerError(res, 'List sellers error:', error);
  }
};

/**
 * GET /api/users/sellers/active — List active verified sellers (public)
 */
export const listActiveSellersController = async (req: Request, res: Response): Promise<void> => {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 20;

    const data = await listActiveSellers(page, limit);

    sendSuccess(res, {
      message: 'Active sellers fetched successfully',
      data,
    });
  } catch (error) {
    sendControllerError(res, 'List active sellers error:', error);
  }
};

/**
 * GET /api/users/sellers/pending — List pending verification sellers (admin)
 */
export const listPendingVerificationsController = async (req: Request, res: Response): Promise<void> => {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 20;

    const data = await listPendingVerifications(page, limit);

    sendSuccess(res, {
      message: 'Pending seller verifications fetched successfully',
      data,
    });
  } catch (error) {
    sendControllerError(res, 'List pending verifications error:', error);
  }
};

/**
 * PATCH /api/users/seller/verify/:id — Verify or reject a seller (admin)
 */
export const verifySellerController = async (req: Request, res: Response): Promise<void> => {
  try {
    const authReq = req as AuthRequest;
    const sellerId = req.params.id;
    if (!sellerId) {
      throw new UserServiceError('Seller ID is required', 400);
    }

    const user = await verifySeller({
      requesterId: authReq.user!._id.toString(),
      requesterRole: authReq.user!.role as Role,
      sellerId,
      status: req.body.status,
      rejectionReason: req.body.rejectionReason,
    });

    sendSuccess(res, {
      message: `Seller ${req.body.status} successfully`,
      data: { user },
    });
  } catch (error) {
    sendControllerError(res, 'Verify seller error:', error);
  }
};

/**
 * PATCH /api/users/seller/suspend/:id — Suspend a seller (admin)
 */
export const suspendSellerController = async (req: Request, res: Response): Promise<void> => {
  try {
    const authReq = req as AuthRequest;
    const sellerId = req.params.id;
    if (!sellerId) {
      throw new UserServiceError('Seller ID is required', 400);
    }

    const user = await suspendSeller({
      requesterId: authReq.user!._id.toString(),
      requesterRole: authReq.user!.role as Role,
      sellerId,
      suspensionReason: req.body.suspensionReason,
    });

    sendSuccess(res, {
      message: 'Seller suspended successfully',
      data: { user },
    });
  } catch (error) {
    sendControllerError(res, 'Suspend seller error:', error);
  }
};

/**
 * PATCH /api/users/seller/unsuspend/:id — Unsuspend a seller (admin)
 */
export const unsuspendSellerController = async (req: Request, res: Response): Promise<void> => {
  try {
    const authReq = req as AuthRequest;
    const sellerId = req.params.id;
    if (!sellerId) {
      throw new UserServiceError('Seller ID is required', 400);
    }

    const user = await unsuspendSeller(
      authReq.user!._id.toString(),
      authReq.user!.role as Role,
      sellerId
    );

    sendSuccess(res, {
      message: 'Seller unsuspended successfully',
      data: { user },
    });
  } catch (error) {
    sendControllerError(res, 'Unsuspend seller error:', error);
  }
};
