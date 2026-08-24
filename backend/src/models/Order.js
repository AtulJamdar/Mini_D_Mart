import mongoose from 'mongoose';

const orderItemSchema = new mongoose.Schema(
  {
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: [true, 'Product ID is required'],
    },
    qty: {
      type: Number,
      required: [true, 'Quantity is required'],
      min: [1, 'Quantity must be at least 1'],
    },
    priceAtOrder: {
      type: Number,
      required: [true, 'Price at order time is required'],
      min: [0, 'Price cannot be negative'],
    },
  },
  { _id: true }
);

const deliveryAddressSchema = new mongoose.Schema(
  {
    street: { type: String, required: true, trim: true },
    city: { type: String, required: true, trim: true },
    state: { type: String, required: true, trim: true },
    pincode: { type: String, required: true, trim: true },
  },
  { _id: false }
);

const statusHistorySchema = new mongoose.Schema(
  {
    status: {
      type: String,
      required: true,
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
    note: {
      type: String,
      trim: true,
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required for order'],
      index: true,
    },
    items: {
      type: [orderItemSchema],
      validate: {
        validator: (items) => Array.isArray(items) && items.length > 0,
        message: 'Order must contain at least one item',
      },
    },
    status: {
      type: String,
      enum: {
        values: [
          'placed',
          'confirmed',
          'preparing',
          'ready_for_pickup',
          'out_for_delivery',
          'completed',
          'cancelled',
        ],
        message: '{VALUE} is not a valid order status',
      },
      default: 'placed',
      required: true,
      index: true,
    },
    fulfillmentType: {
      type: String,
      enum: {
        values: ['pickup', 'delivery'],
        message: '{VALUE} is not a valid fulfillment type',
      },
      required: [true, 'Fulfillment type is required'],
    },
    storeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Store',
      required: [true, 'Store ID is required'],
      index: true,
    },
    pickupSlotId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'PickupSlot',
    },
    address: {
      type: deliveryAddressSchema,
    },
    subtotal: {
      type: Number,
      default: 0,
    },
    taxAmount: {
      type: Number,
      default: 0,
    },
    deliveryFee: {
      type: Number,
      default: 0,
    },
    totalAmount: {
      type: Number,
      required: [true, 'Total order amount is required'],
      min: [0, 'Total amount cannot be negative'],
    },
    paymentDetails: {
      razorpayOrderId: { type: String, index: true },
      razorpayPaymentId: { type: String, index: true },
      razorpaySignature: { type: String },
      status: {
        type: String,
        enum: ['pending', 'paid', 'refunded', 'failed'],
        default: 'paid',
      },
      refundId: { type: String },
    },
    statusHistory: [statusHistorySchema],
  },
  {
    timestamps: true,
  }
);

// Compound indexes
orderSchema.index({ userId: 1, status: 1 });
orderSchema.index({ storeId: 1, status: 1 });
orderSchema.index({ createdAt: -1 });

const Order = mongoose.model('Order', orderSchema);

export default Order;
