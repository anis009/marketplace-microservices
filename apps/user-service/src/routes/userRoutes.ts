import express, { RequestHandler } from 'express';

import {
  getUser,
  login,
  register,
  getRoles,
  updateUser,
  updateUserRole,
  getAllUsers,
  onboardSellerController,
  updateSellerProfileSectionController,
  getSellerProfile,
  getSellerPublicProfileController,
  getSellerBySlugController,
  listSellersController,
  listActiveSellersController,
  listPendingVerificationsController,
  verifySellerController,
  suspendSellerController,
  unsuspendSellerController,
} from '../controllers/userController';
import { protect, restrictTo } from '../middleware/auth';
import { validate } from '../middleware/validate';
import {
  registerSchema,
  loginSchema,
  updateUserSchema,
  updateRoleSchema,
  listUsersQuerySchema,
  sellerOnboardSchema,
  updateSellerBusinessInfoSchema,
  updateSellerContactSchema,
  updateSellerAddressSchema,
  updateSellerTaxInfoSchema,
  updateSellerBankDetailsSchema,
  updateStoreSettingsSchema,
  adminVerifySellerSchema,
  suspendSellerSchema,
  listSellersQuerySchema,
} from '../validators/user.validation';
import { ROLES } from '../constants/roles';

const router = express.Router();


// TODO: public auth routes
router.post('/register', validate(registerSchema), register as unknown as RequestHandler);
router.post('/login', validate(loginSchema), login as unknown as RequestHandler);

// TODO: public seller routes
router.get('/sellers/active', listActiveSellersController as unknown as RequestHandler);

// TODO: public seller storefront by slug
router.get('/sellers/store/:slug', getSellerBySlugController as unknown as RequestHandler);

// TODO: public seller profile by id
router.get('/sellers/public/:id', getSellerPublicProfileController as unknown as RequestHandler);


// TODO: authenticated user routes
router.get('/roles', protect as unknown as RequestHandler, getRoles as unknown as RequestHandler);
router.get('/', protect as unknown as RequestHandler, restrictTo(ROLES.ADMIN, ROLES.SUPER_ADMIN) as unknown as RequestHandler, validate(listUsersQuerySchema, 'query'), getAllUsers as unknown as RequestHandler);
router.get('/:id', protect as unknown as RequestHandler, getUser as unknown as RequestHandler);
router.patch('/:id', protect as unknown as RequestHandler, validate(updateUserSchema), updateUser as unknown as RequestHandler);

// TODO: admin role management
router.patch('/:id/role', protect as unknown as RequestHandler, restrictTo(ROLES.ADMIN, ROLES.SUPER_ADMIN) as unknown as RequestHandler, validate(updateRoleSchema), updateUserRole as unknown as RequestHandler);


// TODO: seller onboarding
router.post(
  '/seller/onboard',
  protect as unknown as RequestHandler,
  validate(sellerOnboardSchema),
  onboardSellerController as unknown as RequestHandler
);

// TODO: seller own profile
router.get(
  '/seller/me',
  protect as unknown as RequestHandler,
  restrictTo(ROLES.SELLER, ROLES.ADMIN, ROLES.SUPER_ADMIN) as unknown as RequestHandler,
  getSellerProfile as unknown as RequestHandler
);

// TODO: seller profile section updates
const sellerSections = ['businessInfo', 'contact', 'businessAddress', 'taxInfo', 'bankDetails', 'storeSettings'];
const sectionValidators: Record<string, any> = {
  businessInfo: updateSellerBusinessInfoSchema,
  contact: updateSellerContactSchema,
  businessAddress: updateSellerAddressSchema,
  taxInfo: updateSellerTaxInfoSchema,
  bankDetails: updateSellerBankDetailsSchema,
  storeSettings: updateStoreSettingsSchema,
};

sellerSections.forEach((section) => {
  const handler: RequestHandler = (req, res) => {
    (req as any).params.section = section;
    return updateSellerProfileSectionController(req, res);
  };

  router.patch(
    `/seller/profile/:id/${section}`,
    protect as unknown as RequestHandler,
    restrictTo(ROLES.SELLER, ROLES.ADMIN, ROLES.SUPER_ADMIN) as unknown as RequestHandler,
    validate(sectionValidators[section]),
    handler
  );
});

// TODO: admin seller management

// TODO: list sellers
router.get(
  '/sellers',
  protect as unknown as RequestHandler,
  restrictTo(ROLES.ADMIN, ROLES.SUPER_ADMIN) as unknown as RequestHandler,
  validate(listSellersQuerySchema, 'query'),
  listSellersController as unknown as RequestHandler
);

// TODO: pending verifications
router.get(
  '/sellers/pending',
  protect as unknown as RequestHandler,
  restrictTo(ROLES.ADMIN, ROLES.SUPER_ADMIN) as unknown as RequestHandler,
  listPendingVerificationsController as unknown as RequestHandler
);

// TODO: verify or reject seller
router.patch(
  '/seller/verify/:id',
  protect as unknown as RequestHandler,
  restrictTo(ROLES.ADMIN, ROLES.SUPER_ADMIN) as unknown as RequestHandler,
  validate(adminVerifySellerSchema),
  verifySellerController as unknown as RequestHandler
);

// TODO: suspend seller
router.patch(
  '/seller/suspend/:id',
  protect as unknown as RequestHandler,
  restrictTo(ROLES.ADMIN, ROLES.SUPER_ADMIN) as unknown as RequestHandler,
  validate(suspendSellerSchema),
  suspendSellerController as unknown as RequestHandler
);

// TODO: unsuspend seller
router.patch(
  '/seller/unsuspend/:id',
  protect as unknown as RequestHandler,
  restrictTo(ROLES.ADMIN, ROLES.SUPER_ADMIN) as unknown as RequestHandler,
  unsuspendSellerController as unknown as RequestHandler
);

export const userRouter = router;
