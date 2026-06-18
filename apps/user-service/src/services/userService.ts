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
  findSellerByStoreSlug,
  findAllSellers,
  countAllSellers,
  findActiveSellers,
  countActiveSellers,
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
  sellerProfile: user.sellerProfile ?? null,
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

// TODO: seller service functions
interface OnboardSellerInput {
  requesterId: string;
  requesterRole: Role;
  businessInfo: {
    businessName: string;
    businessType?: 'individual' | 'sole_proprietorship' | 'llc' | 'corporation' | 'partnership';
    description?: string;
    logo?: string | null;
    banner?: string | null;
    website?: string | null;
  };
  contact: {
    phone: string;
    alternatePhone?: string;
    supportEmail?: string;
    website?: string | null;
    socialLinks?: {
      facebook?: string | null;
      instagram?: string | null;
      twitter?: string | null;
      linkedin?: string | null;
      youtube?: string | null;
    };
  };
  businessAddress: {
    street: string;
    city: string;
    state: string;
    country: string;
    zipCode: string;
  };
  taxInfo?: {
    taxId?: string;
    taxIdType?: 'gst' | 'vat' | 'ein' | 'other';
    businessRegNumber?: string;
    panNumber?: string;
    isGstRegistered?: boolean;
  };
  bankDetails?: {
    bankName?: string;
    accountHolderName?: string;
    accountNumber?: string;
    ifscCode?: string;
    swiftCode?: string;
    routingNumber?: string;
    upiId?: string;
    paypalEmail?: string;
    payoutMethod?: 'bank_transfer' | 'upi' | 'paypal' | 'stripe';
  };
  storeSettings: {
    storeName: string;
    storeSlug: string;
    storeDescription?: string;
    storeLogo?: string | null;
    storeBanner?: string | null;
    returnPolicy?: string;
    shippingPolicy?: string;
    privacyPolicy?: string;
    customMessage?: string;
  };
}

interface UpdateSellerProfileSectionInput {
  requesterId: string;
  requesterRole: Role;
  targetUserId: string;
  section: string;
  updates: Record<string, any>;
}

interface GetSellerByIdInput {
  requesterId?: string;
  sellerId: string;
}

interface ListSellersInput {
  page: number;
  limit: number;
  status?: string;
  search?: string;
}

interface VerifySellerInput {
  requesterId: string;
  requesterRole: Role;
  sellerId: string;
  status: 'verified' | 'rejected';
  rejectionReason?: string;
}

interface SuspendSellerInput {
  requesterId: string;
  requesterRole: Role;
  sellerId: string;
  suspensionReason: string;
}

/**
 * Onboard a seller: upgrade a customer account to seller with full profile.
 * If already a seller, updates the existing profile.
 */
export const onboardSeller = async ({
  requesterId,
  requesterRole,
  businessInfo,
  contact,
  businessAddress,
  taxInfo,
  bankDetails,
  storeSettings,
}: OnboardSellerInput) => {
  const user = await findUserById(requesterId);
  if (!user) {
    throw new UserServiceError('User not found', 404);
  }

  // Check if already a seller with a verified profile
  if (user.role === ROLES.SELLER && user.sellerProfile?.verification?.status === 'verified') {
    throw new UserServiceError('Seller profile is already verified. Use update endpoints instead.', 400);
  }

  // Check store slug uniqueness
  const existingSlug = await findSellerByStoreSlug(storeSettings.storeSlug);
  if (existingSlug && existingSlug._id.toString() !== requesterId) {
    throw new UserServiceError('Store slug is already taken. Please choose another.', 400);
  }

  // Build seller profile
  user.sellerProfile = {
    businessInfo: {
      businessName: businessInfo.businessName,
      businessType: businessInfo.businessType || 'individual',
      description: businessInfo.description || '',
      logo: businessInfo.logo || undefined,
      banner: businessInfo.banner || undefined,
      website: businessInfo.website || undefined,
    },
    contact: {
      phone: contact.phone,
      alternatePhone: contact.alternatePhone || undefined,
      supportEmail: contact.supportEmail || undefined,
      website: contact.website || undefined,
      socialLinks: {
        facebook: contact.socialLinks?.facebook || undefined,
        instagram: contact.socialLinks?.instagram || undefined,
        twitter: contact.socialLinks?.twitter || undefined,
        linkedin: contact.socialLinks?.linkedin || undefined,
        youtube: contact.socialLinks?.youtube || undefined,
      },
    },
    businessAddress: {
      street: businessAddress.street,
      city: businessAddress.city,
      state: businessAddress.state,
      country: businessAddress.country,
      zipCode: businessAddress.zipCode,
    },
    taxInfo: {
      taxId: taxInfo?.taxId || undefined,
      taxIdType: taxInfo?.taxIdType || undefined,
      businessRegNumber: taxInfo?.businessRegNumber || undefined,
      panNumber: taxInfo?.panNumber || undefined,
      isGstRegistered: taxInfo?.isGstRegistered ?? false,
    },
    bankDetails: {
      bankName: bankDetails?.bankName || undefined,
      accountHolderName: bankDetails?.accountHolderName || undefined,
      accountNumber: bankDetails?.accountNumber || undefined,
      ifscCode: bankDetails?.ifscCode || undefined,
      swiftCode: bankDetails?.swiftCode || undefined,
      routingNumber: bankDetails?.routingNumber || undefined,
      upiId: bankDetails?.upiId || undefined,
      paypalEmail: bankDetails?.paypalEmail || undefined,
      payoutMethod: bankDetails?.payoutMethod || 'bank_transfer',
    },
    verification: user.sellerProfile?.verification || {
      status: 'pending',
      submittedAt: new Date(),
      verifiedAt: undefined,
      rejectionReason: undefined,
      documents: [],
    },
    storeSettings: {
      storeName: storeSettings.storeName,
      storeSlug: storeSettings.storeSlug,
      storeDescription: storeSettings.storeDescription || '',
      storeLogo: storeSettings.storeLogo || undefined,
      storeBanner: storeSettings.storeBanner || undefined,
      returnPolicy: storeSettings.returnPolicy || '',
      shippingPolicy: storeSettings.shippingPolicy || '',
      privacyPolicy: storeSettings.privacyPolicy || '',
      customMessage: storeSettings.customMessage || '',
    },
    stats: user.sellerProfile?.stats || {
      averageRating: 0,
      totalReviews: 0,
      totalSales: 0,
      totalOrders: 0,
      totalProducts: 0,
      totalRevenue: 0,
      responseTime: 0,
      fulfillmentRate: 0,
    },
    subscription: user.sellerProfile?.subscription || {
      plan: 'free',
      startDate: null,
      endDate: null,
      isActive: true,
      maxProducts: 50,
    },
    isSuspended: false,
    suspensionReason: undefined,
    suspendedAt: undefined,
  };

  // Upgrade role to seller if currently a customer
  if (user.role === ROLES.CUSTOMER) {
    user.role = ROLES.SELLER as Role;
  }

  await user.save();

  logger.info(`Seller onboarded: ${user._id} — Store: ${storeSettings.storeName}`);

  return toAuthUser(user);
};

/**
 * Update a specific section of the seller profile.
 */
export const updateSellerProfileSection = async ({
  requesterId,
  requesterRole,
  targetUserId,
  section,
  updates,
}: UpdateSellerProfileSectionInput) => {
  // Only the seller themselves or admin/super-admin can update
  const isSelf = requesterId === targetUserId;
  const canManageUsers = requesterRole === ROLES.ADMIN || requesterRole === ROLES.SUPER_ADMIN;

  if (!isSelf && !canManageUsers) {
    throw new UserServiceError('You do not have permission to update this seller profile', 403);
  }

  const user = await findUserById(targetUserId);
  if (!user) {
    throw new UserServiceError('User not found', 404);
  }

  if (user.role !== ROLES.SELLER) {
    throw new UserServiceError('User is not a seller', 400);
  }

  if (!user.sellerProfile) {
    throw new UserServiceError('Seller profile does not exist. Please onboard first.', 400);
  }

  // Check store slug uniqueness if updating store settings
  if (section === 'storeSettings' && updates.storeSlug) {
    const existingSlug = await findSellerByStoreSlug(updates.storeSlug);
    if (existingSlug && existingSlug._id.toString() !== targetUserId) {
      throw new UserServiceError('Store slug is already taken.', 400);
    }
  }

  const validSections = [
    'businessInfo',
    'contact',
    'businessAddress',
    'taxInfo',
    'bankDetails',
    'storeSettings',
  ];

  if (!validSections.includes(section)) {
    throw new UserServiceError(
      `Invalid section. Valid sections: ${validSections.join(', ')}`,
      400
    );
  }

  const profile = user.sellerProfile as any;
  profile[section] = {
    ...profile[section].toObject(),
    ...updates,
  };

  await user.save();

  logger.info(`Seller profile updated: User ${targetUserId} — Section: ${section}`);

  return toAuthUser(user);
};

/**
 * Get a public seller profile by ID (hides sensitive fields).
 */
export const getSellerPublicProfile = async ({ sellerId }: GetSellerByIdInput) => {
  const user = await findUserByIdWithoutPassword(sellerId);

  if (!user) {
    throw new UserServiceError('Seller not found', 404);
  }

  if (user.role !== ROLES.SELLER) {
    throw new UserServiceError('User is not a seller', 400);
  }

  if (!user.sellerProfile) {
    throw new UserServiceError('Seller profile not found', 404);
  }

  const profile = user.sellerProfile as any;

  // Return only public-facing data, strip sensitive info
  return {
    id: user._id,
    name: user.name,
    avatar: user.avatar,
    businessInfo: profile.businessInfo,
    storeSettings: profile.storeSettings,
    stats: profile.stats,
    verification: {
      status: profile.verification.status,
      verifiedAt: profile.verification.verifiedAt,
    },
    subscription: {
      plan: profile.subscription.plan,
    },
    createdAt: user.createdAt,
  };
};

/**
 * Get a seller's own full profile (includes sensitive data like bank details, tax info).
 */
export const getSellerOwnProfile = async (sellerId: string) => {
  const user = await findUserByIdWithoutPassword(sellerId);

  if (!user) {
    throw new UserServiceError('User not found', 404);
  }

  if (user.role !== ROLES.SELLER) {
    throw new UserServiceError('User is not a seller', 400);
  }

  return user;
};

/**
 * List all sellers with filtering and pagination.
 */
export const listSellers = async ({ page, limit, status, search }: ListSellersInput) => {
  const skip = (page - 1) * limit;

  const sellers = await findAllSellers(skip, limit, { status, search });
  const total = await countAllSellers({ status, search });

  return {
    sellers,
    pagination: {
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      total,
    },
  };
};

/**
 * Admin: List sellers pending verification.
 */
export const listPendingVerifications = async (page: number, limit: number) => {
  const skip = (page - 1) * limit;
  const sellers = await findAllSellers(skip, limit, { status: 'pending' });
  const total = await countAllSellers({ status: 'pending' });

  return {
    sellers,
    pagination: {
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      total,
    },
  };
};

/**
 * Admin: Verify or reject a seller.
 */
export const verifySeller = async ({
  requesterId,
  requesterRole,
  sellerId,
  status,
  rejectionReason,
}: VerifySellerInput) => {
  const canManageUsers =
    requesterRole === ROLES.ADMIN || requesterRole === ROLES.SUPER_ADMIN;

  if (!canManageUsers) {
    throw new UserServiceError('Only admin or super-admin can verify sellers', 403);
  }

  if (requesterId === sellerId) {
    throw new UserServiceError('You cannot verify your own seller account', 400);
  }

  const user = await findUserById(sellerId);
  if (!user) {
    throw new UserServiceError('Seller not found', 404);
  }

  if (user.role !== ROLES.SELLER || !user.sellerProfile) {
    throw new UserServiceError('User is not a seller with a profile', 400);
  }

  const profile = user.sellerProfile as any;

  if (status === 'rejected' && !rejectionReason) {
    throw new UserServiceError('Rejection reason is required when rejecting a seller', 400);
  }

  profile.verification.status = status;
  profile.verification.verifiedAt = status === 'verified' ? new Date() : null;
  profile.verification.rejectionReason = status === 'rejected' ? rejectionReason : null;

  await user.save();

  logger.info(
    `Seller ${status}: User ${sellerId} — By: ${requesterId}${
      rejectionReason ? ` — Reason: ${rejectionReason}` : ''
    }`
  );

  return toAuthUser(user);
};

/**
 * Admin: Suspend or unsuspend a seller.
 */
export const suspendSeller = async ({
  requesterId,
  requesterRole,
  sellerId,
  suspensionReason,
}: SuspendSellerInput) => {
  const canManageUsers =
    requesterRole === ROLES.ADMIN || requesterRole === ROLES.SUPER_ADMIN;

  if (!canManageUsers) {
    throw new UserServiceError('Only admin or super-admin can suspend sellers', 403);
  }

  if (requesterId === sellerId) {
    throw new UserServiceError('You cannot suspend your own account', 400);
  }

  const user = await findUserById(sellerId);
  if (!user) {
    throw new UserServiceError('Seller not found', 404);
  }

  if (user.role !== ROLES.SELLER || !user.sellerProfile) {
    throw new UserServiceError('User is not a seller with a profile', 400);
  }

  const profile = user.sellerProfile as any;

  profile.isSuspended = true;
  profile.suspensionReason = suspensionReason;
  profile.suspendedAt = new Date();

  await user.save();

  logger.info(`Seller suspended: User ${sellerId} — By: ${requesterId} — Reason: ${suspensionReason}`);

  return toAuthUser(user);
};

/**
 * Admin: Unsuspend a seller.
 */
export const unsuspendSeller = async (
  requesterId: string,
  requesterRole: Role,
  sellerId: string
) => {
  const canManageUsers =
    requesterRole === ROLES.ADMIN || requesterRole === ROLES.SUPER_ADMIN;

  if (!canManageUsers) {
    throw new UserServiceError('Only admin or super-admin can unsuspend sellers', 403);
  }

  const user = await findUserById(sellerId);
  if (!user) {
    throw new UserServiceError('Seller not found', 404);
  }

  if (user.role !== ROLES.SELLER || !user.sellerProfile) {
    throw new UserServiceError('User is not a seller with a profile', 400);
  }

  const profile = user.sellerProfile as any;

  profile.isSuspended = false;
  profile.suspensionReason = null;
  profile.suspendedAt = null;

  await user.save();

  logger.info(`Seller unsuspended: User ${sellerId} — By: ${requesterId}`);

  return toAuthUser(user);
};

/**
 * Public: List verified, active sellers (marketplace storefront listing).
 */
export const listActiveSellers = async (page: number, limit: number) => {
  const skip = (page - 1) * limit;

  const sellers = await findActiveSellers(skip, limit);
  const total = await countActiveSellers();

  return {
    sellers,
    pagination: {
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      total,
    },
  };
};

/**
 * Get a seller's public profile by store slug (for storefront URL resolution).
 */
export const getSellerByStoreSlug = async (storeSlug: string) => {
  const user = await findSellerByStoreSlug(storeSlug);

  if (!user) {
    throw new UserServiceError('Store not found', 404);
  }

  const profile = (user as any).sellerProfile;

  return {
    id: user._id,
    name: user.name,
    avatar: user.avatar,
    businessInfo: profile.businessInfo,
    storeSettings: profile.storeSettings,
    stats: profile.stats,
    verification: {
      status: profile.verification.status,
      verifiedAt: profile.verification.verifiedAt,
    },
    createdAt: user.createdAt,
  };
};
