import mongoose from 'mongoose';

const returnRequestSchema = new mongoose.Schema(
  {
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order',
      required: [true, 'Order ID is required'],
      index: true,
    },
    itemId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: [true, 'Product item ID is required'],
    },
    type: {
      type: String,
      enum: {
        values: ['return', 'exchange'],
        message: '{VALUE} is not a valid return type',
      },
      required: [true, 'Return request type is required'],
    },
    reason: {
      type: String,
      required: [true, 'Reason for return/exchange is required'],
      trim: true,
    },
    status: {
      type: String,
      enum: {
        values: ['requested', 'approved', 'rejected', 'completed'],
        message: '{VALUE} is not a valid return request status',
      },
      default: 'requested',
      required: true,
      index: true,
    },
    evidenceUrls: {
      type: [String],
      default: [],
    },
    resolvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    resolvedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

returnRequestSchema.index({ orderId: 1, status: 1 });

const ReturnRequest = mongoose.model('ReturnRequest', returnRequestSchema);

export default ReturnRequest;
