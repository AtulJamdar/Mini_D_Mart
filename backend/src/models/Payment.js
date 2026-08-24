import mongoose from 'mongoose';

const checkoutItemSchema = new mongoose.Schema(
  {
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
    },
    name: { type: String, required: true },
    qty: { type: Number, required: true, min: 1 },
    price: { type: Number, required: true, min: 0 },
  },
  { _id: false }
);

const checkoutDetailsSchema = new mongoose.Schema(
  {
    fulfillmentType: {
      type: String,
      enum: ['pickup', 'delivery'],
      required: true,
    },
    storeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Store',
      required: true,
    },
    pickupSlotId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'PickupSlot',
    },
    address: {
      street: String,
      city: String,
      state: String,
      pincode: String,
    },
    items: [checkoutItemSchema],
    subtotal: { type: Number, required: true },
    taxAmount: { type: Number, required: true },
    deliveryFee: { type: Number, default: 0 },
    totalAmount: { type: Number, required: true },
  },
  { _id: false }
);

const refundDetailsSchema = new mongoose.Schema(
  {
    refundId: { type: String },
    amount: { type: Number },
    reason: { type: String },
    timestamp: { type: Date, default: Date.now },
  },
  { _id: false }
);

const paymentSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
      index: true,
    },
    razorpayOrderId: {
      type: String,
      required: [true, 'Razorpay Order ID is required'],
      unique: true,
      index: true,
      trim: true,
    },
    razorpayPaymentId: {
      type: String,
      unique: true,
      sparse: true,
      index: true,
      trim: true,
    },
    razorpaySignature: {
      type: String,
      trim: true,
    },
    amount: {
      type: Number, // Amount in paise
      required: [true, 'Payment amount in paise is required'],
      min: [100, 'Minimum payment amount is ₹1 (100 paise)'],
    },
    currency: {
      type: String,
      default: 'INR',
      trim: true,
    },
    status: {
      type: String,
      enum: {
        values: [
          'created',
          'processing',
          'paid',
          'failed',
          'refunded_insufficient_stock',
          'refunded',
        ],
        message: '{VALUE} is not a valid payment status',
      },
      default: 'created',
      required: true,
      index: true,
    },
    checkoutDetails: {
      type: checkoutDetailsSchema,
      required: true,
    },
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order',
      index: true,
    },
    refundDetails: {
      type: refundDetailsSchema,
    },
  },
  {
    timestamps: true,
  }
);

const Payment = mongoose.model('Payment', paymentSchema);

export default Payment;
