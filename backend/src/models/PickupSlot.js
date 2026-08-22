import mongoose from 'mongoose';

const pickupSlotSchema = new mongoose.Schema(
  {
    storeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Store',
      required: [true, 'Store ID is required for pickup slot'],
      index: true,
    },
    startTime: {
      type: Date,
      required: [true, 'Slot start time is required'],
    },
    endTime: {
      type: Date,
      required: [true, 'Slot end time is required'],
    },
    maxOrders: {
      type: Number,
      required: [true, 'Max orders allowed in this slot is required'],
      min: [1, 'Max orders must be at least 1'],
    },
    bookedCount: {
      type: Number,
      default: 0,
      min: [0, 'Booked count cannot be negative'],
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for finding available slots by store and time window
pickupSlotSchema.index({ storeId: 1, startTime: 1 });

const PickupSlot = mongoose.model('PickupSlot', pickupSlotSchema);

export default PickupSlot;
