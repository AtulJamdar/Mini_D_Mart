import mongoose from 'mongoose';

const addressSchema = new mongoose.Schema(
  {
    label: { type: String, trim: true, default: 'Home' },
    addressLine1: { type: String, required: true, trim: true },
    addressLine2: { type: String, trim: true },
    city: { type: String, required: true, trim: true },
    state: { type: String, trim: true, default: 'Maharashtra' },
    pincode: { type: String, required: true, trim: true },
    landmark: { type: String, trim: true },
    phone: { type: String, trim: true },
    isDefault: { type: Boolean, default: false },
  },
  { _id: true }
);

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'User name is required'],
      trim: true,
    },
    email: {
      type: String,
      unique: true,
      sparse: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    passwordHash: {
      type: String,
    },
    role: {
      type: String,
      enum: {
        values: ['customer', 'store_staff', 'store_manager', 'admin'],
        message: '{VALUE} is not a valid role',
      },
      default: 'customer',
      required: true,
      index: true,
    },
    phone: {
      type: String,
      unique: true,
      sparse: true,
      trim: true,
      index: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    mustChangePassword: {
      type: Boolean,
      default: false,
    },
    emailVerified: {
      type: Boolean,
      default: false,
    },
    assignedStoreId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Store',
    },
    preferredLocation: {
      label: { type: String, trim: true },
      pincode: { type: String, trim: true },
      city: { type: String, trim: true },
      lat: { type: Number },
      lng: { type: Number },
    },
    addresses: [addressSchema],
  },
  {
    timestamps: true,
  }
);

const User = mongoose.model('User', userSchema);

export default User;
