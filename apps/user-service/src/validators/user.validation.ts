import { z } from 'zod';
import { VALID_ROLES, Role } from '../constants/roles';

// TODO: reusable base schemas
const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number');

const emailSchema = z
  .string()
  .email('Invalid email address')
  .toLowerCase()
  .trim();

const nameSchema = z
  .string()
  .min(2, 'Name must be at least 2 characters')
  .max(50, 'Name must not exceed 50 characters')
  .trim();

const avatarSchema = z
  .string()
  .url('Avatar must be a valid URL')
  .max(500, 'Avatar URL must not exceed 500 characters')
  .nullable();

const roleEnum = z.enum(VALID_ROLES as [Role, ...Role[]]);

// TODO: auth schemas
export const registerSchema = z.object({
  name: nameSchema,
  email: emailSchema,
  password: passwordSchema,
  avatar: avatarSchema.optional(),
});

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Password is required'),
});

// TODO: user profile schemas
export const updateUserSchema = z.object({
  name: nameSchema.optional(),
  email: emailSchema.optional(),
  password: passwordSchema.optional(),
  avatar: avatarSchema.optional(),
});

export const updateRoleSchema = z.object({
  role: roleEnum,
});

export const mongoIdSchema = z.object({
  id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid user ID'),
});

export const listUsersQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20).optional(),
});

// TODO: seller sub-schemas
const socialLinksSchema = z.object({
  facebook:  z.string().url('Must be a valid URL').nullable().optional(),
  instagram: z.string().url('Must be a valid URL').nullable().optional(),
  twitter:   z.string().url('Must be a valid URL').nullable().optional(),
  linkedin:  z.string().url('Must be a valid URL').nullable().optional(),
  youtube:   z.string().url('Must be a valid URL').nullable().optional(),
}).optional();

const businessInfoSchema = z.object({
  businessName: z
    .string()
    .min(2, 'Business name must be at least 2 characters')
    .max(100, 'Business name must not exceed 100 characters')
    .trim(),
  businessType: z
    .enum(['individual', 'sole_proprietorship', 'llc', 'corporation', 'partnership'])
    .default('individual'),
  description: z
    .string()
    .max(2000, 'Description must not exceed 2000 characters')
    .trim()
    .optional(),
  logo:   z.string().url('Must be a valid URL').max(500).nullable().optional(),
  banner: z.string().url('Must be a valid URL').max(500).nullable().optional(),
  website: z.string().url('Must be a valid URL').max(500).nullable().optional(),
});

const sellerContactSchema = z.object({
  phone: z
    .string()
    .min(8, 'Phone number must be at least 8 characters')
    .max(20, 'Phone number must not exceed 20 characters')
    .trim(),
  alternatePhone: z
    .string()
    .max(20, 'Alternate phone must not exceed 20 characters')
    .trim()
    .nullable()
    .optional(),
  supportEmail: z
    .string()
    .email('Invalid support email')
    .toLowerCase()
    .trim()
    .optional(),
  website: z.string().url('Must be a valid URL').max(500).nullable().optional(),
  socialLinks: socialLinksSchema,
});

const businessAddressSchema = z.object({
  street:  z.string().min(1, 'Street is required').max(200).trim(),
  city:    z.string().min(1, 'City is required').max(100).trim(),
  state:   z.string().min(1, 'State is required').max(100).trim(),
  country: z.string().min(1, 'Country is required').max(100).trim(),
  zipCode: z.string().min(1, 'Zip code is required').max(20).trim(),
});

const taxInfoSchema = z.object({
  taxId: z.string().max(50).trim().nullable().optional(),
  taxIdType: z.enum(['gst', 'vat', 'ein', 'other']).nullable().optional(),
  businessRegNumber: z.string().max(50).trim().nullable().optional(),
  panNumber: z
    .string()
    .regex(/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/, 'Invalid PAN format')
    .max(10)
    .trim()
    .nullable()
    .optional(),
  isGstRegistered: z.boolean().optional(),
}).optional();

const bankDetailsSchema = z.object({
  bankName:          z.string().max(100).trim().nullable().optional(),
  accountHolderName: z.string().max(100).trim().nullable().optional(),
  accountNumber:     z.string().max(20).trim().nullable().optional(),
  ifscCode:          z.string().max(11).trim().nullable().optional(),
  swiftCode:         z.string().max(11).trim().nullable().optional(),
  routingNumber:     z.string().max(20).trim().nullable().optional(),
  upiId:             z.string().max(100).trim().nullable().optional(),
  paypalEmail:       z.string().email('Invalid PayPal email').trim().nullable().optional(),
  payoutMethod: z
    .enum(['bank_transfer', 'upi', 'paypal', 'stripe'])
    .default('bank_transfer'),
}).optional();

const storeSettingsSchema = z.object({
  storeName: z
    .string()
    .min(2, 'Store name must be at least 2 characters')
    .max(100, 'Store name must not exceed 100 characters')
    .trim(),
  storeSlug: z
    .string()
    .min(2, 'Store slug must be at least 2 characters')
    .max(100, 'Store slug must not exceed 100 characters')
    .regex(/^[a-z0-9-]+$/, 'Store slug must only contain lowercase letters, numbers, and hyphens')
    .trim(),
  storeDescription: z
    .string()
    .max(5000, 'Store description must not exceed 5000 characters')
    .trim()
    .optional(),
  storeLogo:   z.string().url('Must be a valid URL').max(500).nullable().optional(),
  storeBanner: z.string().url('Must be a valid URL').max(500).nullable().optional(),
  returnPolicy:    z.string().max(10000).trim().optional(),
  shippingPolicy:  z.string().max(10000).trim().optional(),
  privacyPolicy:   z.string().max(10000).trim().optional(),
  customMessage:   z.string().max(1000).trim().optional(),
});

// TODO: seller onboarding schema
export const sellerOnboardSchema = z.object({
  businessInfo:    businessInfoSchema,
  contact:         sellerContactSchema,
  businessAddress: businessAddressSchema,
  taxInfo:         taxInfoSchema,
  bankDetails:     bankDetailsSchema,
  storeSettings:   storeSettingsSchema,
});

// TODO: seller profile partial updates
export const updateSellerBusinessInfoSchema = z.object({
  businessInfo: businessInfoSchema.partial().refine(
    (data) => Object.keys(data).length > 0,
    { message: 'At least one business info field must be provided' }
  ),
});

export const updateSellerContactSchema = z.object({
  contact: sellerContactSchema.partial().refine(
    (data) => Object.keys(data).length > 0,
    { message: 'At least one contact field must be provided' }
  ),
});

export const updateSellerAddressSchema = z.object({
  businessAddress: businessAddressSchema.partial().refine(
    (data) => Object.keys(data).length > 0,
    { message: 'At least one address field must be provided' }
  ),
});

export const updateSellerTaxInfoSchema = z.object({
  taxInfo: z.object({
    taxId: z.string().max(50).trim().nullable().optional(),
    taxIdType: z.enum(['gst', 'vat', 'ein', 'other']).nullable().optional(),
    businessRegNumber: z.string().max(50).trim().nullable().optional(),
    panNumber: z
      .string()
      .regex(/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/, 'Invalid PAN format')
      .max(10)
      .trim()
      .nullable()
      .optional(),
    isGstRegistered: z.boolean().optional(),
  }).partial().refine(
    (data) => Object.keys(data).length > 0,
    { message: 'At least one tax info field must be provided' }
  ),
});

export const updateSellerBankDetailsSchema = z.object({
  bankDetails: z.object({
    bankName:          z.string().max(100).trim().nullable().optional(),
    accountHolderName: z.string().max(100).trim().nullable().optional(),
    accountNumber:     z.string().max(20).trim().nullable().optional(),
    ifscCode:          z.string().max(11).trim().nullable().optional(),
    swiftCode:         z.string().max(11).trim().nullable().optional(),
    routingNumber:     z.string().max(20).trim().nullable().optional(),
    upiId:             z.string().max(100).trim().nullable().optional(),
    paypalEmail:       z.string().email('Invalid PayPal email').trim().nullable().optional(),
    payoutMethod: z
      .enum(['bank_transfer', 'upi', 'paypal', 'stripe'])
      .default('bank_transfer'),
  }).partial().refine(
    (data) => Object.keys(data).length > 0,
    { message: 'At least one bank detail must be provided' }
  ),
});

export const updateStoreSettingsSchema = z.object({
  storeSettings: storeSettingsSchema.partial().refine(
    (data) => Object.keys(data).length > 0,
    { message: 'At least one store setting must be provided' }
  ),
});

// TODO: seller verification schema
export const submitVerificationSchema = z.object({
  documents: z
    .array(
      z.object({
        type: z.enum(['government_id', 'business_license', 'tax_certificate', 'address_proof', 'other']),
        url: z.string().url('Must be a valid URL'),
      })
    )
    .min(1, 'At least one verification document is required')
    .max(10, 'Cannot upload more than 10 documents'),
});

export const adminVerifySellerSchema = z
  .object({
    status: z.enum(['verified', 'rejected']),
    rejectionReason: z.string().max(500).trim().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.status === 'rejected' && (!data.rejectionReason || data.rejectionReason.length === 0)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Rejection reason is required when rejecting a seller',
        path: ['rejectionReason'],
      });
    }
  });

// TODO: seller suspension schema
export const suspendSellerSchema = z.object({
  suspensionReason: z
    .string()
    .min(10, 'Suspension reason must be at least 10 characters')
    .max(500, 'Suspension reason must not exceed 500 characters')
    .trim(),
});

// TODO: seller query schemas
export const listSellersQuerySchema = z.object({
  page:   z.coerce.number().int().min(1).default(1).optional(),
  limit:  z.coerce.number().int().min(1).max(100).default(20).optional(),
  status: z.enum(['unverified', 'pending', 'verified', 'rejected']).optional(),
  search: z.string().max(100).optional(),
});

// TODO: export types
export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
export type UpdateRoleInput = z.infer<typeof updateRoleSchema>;
export type MongoIdInput = z.infer<typeof mongoIdSchema>;
export type SellerOnboardInput = z.infer<typeof sellerOnboardSchema>;
export type UpdateSellerBusinessInfoInput = z.infer<typeof updateSellerBusinessInfoSchema>;
export type UpdateSellerContactInput = z.infer<typeof updateSellerContactSchema>;
export type UpdateSellerAddressInput = z.infer<typeof updateSellerAddressSchema>;
export type UpdateSellerTaxInfoInput = z.infer<typeof updateSellerTaxInfoSchema>;
export type UpdateSellerBankDetailsInput = z.infer<typeof updateSellerBankDetailsSchema>;
export type UpdateStoreSettingsInput = z.infer<typeof updateStoreSettingsSchema>;
export type SubmitVerificationInput = z.infer<typeof submitVerificationSchema>;
export type AdminVerifySellerInput = z.infer<typeof adminVerifySellerSchema>;
export type SuspendSellerInput = z.infer<typeof suspendSellerSchema>;
export type ListSellersQueryInput = z.infer<typeof listSellersQuerySchema>;
