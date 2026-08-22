import mongoose from 'mongoose';

const storeAddressSchema = new mongoose.Schema(
  {
    street: { type: String, required: true, trim: true },
    city: { type: String, required: true, trim: true },
    state: { type: String, required: true, trim: true },
    pincode: { type: String, required: true, trim: true },
  },
  { _id: false }
);

const geoSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point',
      required: true,
    },
    coordinates: {
      type: [Number], // [longitude, latitude]
      required: true,
    },
  },
  { _id: false }
);

const storeSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Store name is required'],
      trim: true,
    },
    address: {
      type: storeAddressSchema,
      required: [true, 'Store address is required'],
    },
    geo: {
      type: geoSchema,
      required: [true, 'Store geographic location is required'],
    },
    slots: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'PickupSlot',
      },
    ],
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

storeSchema.index({ geo: '2dsphere' });

const Store = mongoose.model('Store', storeSchema);

export default Store;
