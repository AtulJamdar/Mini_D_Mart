import mongoose from 'mongoose';

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Product name is required'],
      trim: true,
    },
    categoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      required: [true, 'Category reference is required'],
      index: true,
    },
    price: {
      type: Number,
      required: [true, 'Product price is required'],
      min: [0, 'Price cannot be negative'],
    },
    stock: {
      type: Number,
      required: [true, 'Product stock is required'],
      min: [0, 'Stock cannot be negative'],
      default: 0,
    },
    unit: {
      type: String,
      required: [true, 'Product unit is required (e.g., kg, g, l, pcs)'],
      trim: true,
    },
    isReturnable: {
      type: Boolean,
      default: true,
    },
    returnWindowHours: {
      type: Number,
      default: 24,
      min: [0, 'Return window hours cannot be negative'],
    },
    images: {
      type: [String],
      default: [],
    },
    storeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Store',
      required: [true, 'Store reference is required'],
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for category and store queries
productSchema.index({ categoryId: 1, storeId: 1 });
productSchema.index({ storeId: 1, name: 1 });

const Product = mongoose.model('Product', productSchema);

export default Product;
