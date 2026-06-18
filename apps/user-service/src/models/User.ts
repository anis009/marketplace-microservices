import mongoose, { Schema } from "mongoose";
import bcrypt from "bcryptjs";
import { IUser } from "../types";
import { VALID_ROLES } from "../constants/roles";

// TODO: seller sub-schemas
const socialLinksSchema = new mongoose.Schema(
  {
    facebook: { type: String, trim: true, default: null },
    instagram: { type: String, trim: true, default: null },
    twitter: { type: String, trim: true, default: null },
    linkedin: { type: String, trim: true, default: null },
    youtube: { type: String, trim: true, default: null },
  },
  { _id: false },
);

const businessInfoSchema = new mongoose.Schema(
  {
    businessName: { type: String, trim: true, default: "" },
    businessType: {
      type: String,
      enum: [
        "individual",
        "sole_proprietorship",
        "llc",
        "corporation",
        "partnership",
      ],
      default: "individual",
    },
    description: { type: String, trim: true, default: "" },
    logo: { type: String, trim: true, default: null },
    banner: { type: String, trim: true, default: null },
    website: { type: String, trim: true, default: null },
  },
  { _id: false },
);

const sellerContactSchema = new mongoose.Schema(
  {
    phone: { type: String, trim: true, required: true },
    alternatePhone: { type: String, trim: true, default: null },
    supportEmail: { type: String, trim: true, default: null },
    website: { type: String, trim: true, default: null },
    socialLinks: { type: socialLinksSchema, default: () => ({}) },
  },
  { _id: false },
);

const businessAddressSchema = new mongoose.Schema(
  {
    street: { type: String, trim: true, required: true },
    city: { type: String, trim: true, required: true },
    state: { type: String, trim: true, required: true },
    country: { type: String, trim: true, required: true },
    zipCode: { type: String, trim: true, required: true },
  },
  { _id: false },
);

const taxInfoSchema = new mongoose.Schema(
  {
    taxId: { type: String, trim: true, default: null },
    taxIdType: {
      type: String,
      enum: ["gst", "vat", "ein", "other"],
      default: null,
    },
    businessRegNumber: { type: String, trim: true, default: null },
    panNumber: { type: String, trim: true, default: null },
    isGstRegistered: { type: Boolean, default: false },
  },
  { _id: false },
);

const bankDetailsSchema = new mongoose.Schema(
  {
    bankName: { type: String, trim: true, default: null },
    accountHolderName: { type: String, trim: true, default: null },
    accountNumber: { type: String, trim: true, default: null },
    ifscCode: { type: String, trim: true, default: null },
    swiftCode: { type: String, trim: true, default: null },
    routingNumber: { type: String, trim: true, default: null },
    upiId: { type: String, trim: true, default: null },
    paypalEmail: { type: String, trim: true, default: null },
    payoutMethod: {
      type: String,
      enum: ["bank_transfer", "upi", "paypal", "stripe"],
      default: "bank_transfer",
    },
  },
  { _id: false },
);

const verificationDocumentSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: [
        "government_id",
        "business_license",
        "tax_certificate",
        "address_proof",
        "other",
      ],
      required: true,
    },
    url: { type: String, required: true },
    uploadedAt: { type: Date, default: Date.now },
  },
  { _id: false },
);

const sellerVerificationSchema = new mongoose.Schema(
  {
    status: {
      type: String,
      enum: ["unverified", "pending", "verified", "rejected"],
      default: "unverified",
    },
    submittedAt: { type: Date, default: null },
    verifiedAt: { type: Date, default: null },
    rejectionReason: { type: String, trim: true, default: null },
    documents: { type: [verificationDocumentSchema], default: [] },
  },
  { _id: false },
);

const storeSettingsSchema = new mongoose.Schema(
  {
    storeName: { type: String, trim: true, required: true },
    storeSlug: { type: String, trim: true, required: true, unique: true },
    storeDescription: { type: String, trim: true, default: "" },
    storeLogo: { type: String, trim: true, default: null },
    storeBanner: { type: String, trim: true, default: null },
    returnPolicy: { type: String, trim: true, default: "" },
    shippingPolicy: { type: String, trim: true, default: "" },
    privacyPolicy: { type: String, trim: true, default: "" },
    customMessage: { type: String, trim: true, default: "" },
  },
  { _id: false },
);

const sellerStatsSchema = new mongoose.Schema(
  {
    averageRating: { type: Number, default: 0 },
    totalReviews: { type: Number, default: 0 },
    totalSales: { type: Number, default: 0 },
    totalOrders: { type: Number, default: 0 },
    totalProducts: { type: Number, default: 0 },
    totalRevenue: { type: Number, default: 0 },
    responseTime: { type: Number, default: 0 },
    fulfillmentRate: { type: Number, default: 0 },
  },
  { _id: false },
);

const sellerSubscriptionSchema = new mongoose.Schema(
  {
    plan: {
      type: String,
      enum: ["free", "basic", "premium", "enterprise"],
      default: "free",
    },
    startDate: { type: Date, default: null },
    endDate: { type: Date, default: null },
    isActive: { type: Boolean, default: true },
    maxProducts: { type: Number, default: 50 },
  },
  { _id: false },
);

const sellerProfileSchema = new mongoose.Schema(
  {
    businessInfo: { type: businessInfoSchema, required: true },
    contact: { type: sellerContactSchema, required: true },
    businessAddress: { type: businessAddressSchema, required: true },
    taxInfo: { type: taxInfoSchema, default: () => ({}) },
    bankDetails: { type: bankDetailsSchema, default: () => ({}) },
    verification: { type: sellerVerificationSchema, default: () => ({}) },
    storeSettings: { type: storeSettingsSchema, required: true },
    stats: { type: sellerStatsSchema, default: () => ({}) },
    subscription: { type: sellerSubscriptionSchema, default: () => ({}) },
    isSuspended: { type: Boolean, default: false },
    suspensionReason: { type: String, trim: true, default: null },
    suspendedAt: { type: Date, default: null },
  },
  { _id: false },
);

// TODO: main user schema
const userSchema: Schema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
    },
    password: {
      type: String,
      required: true,
      minlength: 6,
    },
    role: {
      type: String,
      enum: VALID_ROLES,
      default: "customer",
    },
    lastLogin: {
      type: Date,
      default: null,
    },
    avatar: {
      type: String,
      trim: true,
      default: null,
    },
    sellerProfile: {
      type: sellerProfileSchema,
      default: null,
    },
  },
  {
    timestamps: true,
  },
);

// Ensure unique store slug across sellers
userSchema.index(
  { "sellerProfile.storeSettings.storeSlug": 1 },
  { unique: true, sparse: true },
);
userSchema.index({ "sellerProfile.verification.status": 1 });

userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  // ensure TypeScript treats password as a string when hashing
  this.password = await bcrypt.hash(this.password as string, 12);
  next();
});

userSchema.methods.correctPassword = async function (
  candidatePassword: string,
  userPassword: string,
): Promise<boolean> {
  return await bcrypt.compare(candidatePassword, userPassword);
};

export default mongoose.model<IUser>("User", userSchema);
