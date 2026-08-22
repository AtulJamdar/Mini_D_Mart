import Product from '../models/Product.js';
import Category from '../models/Category.js';
import Store from '../models/Store.js';
import PickupSlot from '../models/PickupSlot.js';
import { sendSuccess, sendError } from '../utils/responseHelper.js';

/**
 * Get all products with category and stock info
 * GET /api/products
 */
export const getProducts = async (req, res) => {
  try {
    const { category, search, storeId } = req.query;
    const filter = {};

    if (category) filter.categoryId = category;
    if (storeId) filter.storeId = storeId;
    if (search) filter.name = { $regex: search, $options: 'i' };

    const products = await Product.find(filter)
      .populate('categoryId', 'name')
      .populate('storeId', 'name address')
      .sort({ createdAt: -1 });

    return sendSuccess(res, {
      statusCode: 200,
      data: products,
      message: 'Products retrieved successfully',
    });
  } catch (error) {
    return sendError(res, {
      statusCode: 500,
      message: 'Failed to retrieve products',
      error: error.message,
    });
  }
};

/**
 * Seed initial sample catalog data for test driving the app
 * POST /api/products/seed
 */
export const seedSampleData = async (req, res) => {
  try {
    // 1. Create or get default Store
    let store = await Store.findOne({ name: 'Mini D-Mart Flagship Store' });
    if (!store) {
      store = await Store.create({
        name: 'Mini D-Mart Flagship Store',
        address: {
          street: '101 Market Lane, Downtown',
          city: 'Mumbai',
          state: 'Maharashtra',
          pincode: '400001',
        },
        geo: {
          type: 'Point',
          coordinates: [72.8777, 19.076],
        },
        isActive: true,
      });
    }

    // 2. Create sample Categories
    const categoriesData = [
      { name: 'Daily Essentials', description: 'Milk, bread, eggs, and staples' },
      { name: 'Fresh Fruits & Veggies', description: 'Farm fresh produce' },
      { name: 'Snacks & Beverages', description: 'Biscuits, chips, tea, and coffee' },
      { name: 'Household & Cleaning', description: 'Detergents, soaps, and cleaners' },
    ];

    const categoryMap = {};
    for (const cat of categoriesData) {
      let createdCat = await Category.findOne({ name: cat.name });
      if (!createdCat) {
        createdCat = await Category.create(cat);
      }
      categoryMap[cat.name] = createdCat._id;
    }

    // 3. Create sample Products
    const sampleProducts = [
      {
        name: 'Farm Fresh Whole Milk (1L)',
        categoryId: categoryMap['Daily Essentials'],
        price: 64.0,
        stock: 50,
        unit: '1L Pouch',
        images: ['https://images.unsplash.com/photo-1550583724-b2692b85b150?w=500&auto=format&fit=crop&q=60'],
        storeId: store._id,
      },
      {
        name: 'Premium Basmati Rice (5kg)',
        categoryId: categoryMap['Daily Essentials'],
        price: 499.0,
        stock: 25,
        unit: '5kg Bag',
        images: ['https://images.unsplash.com/photo-1586201375761-83865001e31c?w=500&auto=format&fit=crop&q=60'],
        storeId: store._id,
      },
      {
        name: 'Organic Cavendish Bananas (1 Dozen)',
        categoryId: categoryMap['Fresh Fruits & Veggies'],
        price: 55.0,
        stock: 30,
        unit: '12 pcs',
        images: ['https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?w=500&auto=format&fit=crop&q=60'],
        storeId: store._id,
      },
      {
        name: 'Farm Fresh Tomatoes (1kg)',
        categoryId: categoryMap['Fresh Fruits & Veggies'],
        price: 38.0,
        stock: 40,
        unit: '1kg',
        images: ['https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=500&auto=format&fit=crop&q=60'],
        storeId: store._id,
      },
      {
        name: 'Masala Potato Chips (150g)',
        categoryId: categoryMap['Snacks & Beverages'],
        price: 45.0,
        stock: 100,
        unit: '150g Pack',
        images: ['https://images.unsplash.com/photo-1566478989037-eec170784d0b?w=500&auto=format&fit=crop&q=60'],
        storeId: store._id,
      },
      {
        name: 'Eco Dishwash Gel Lemon (750ml)',
        categoryId: categoryMap['Household & Cleaning'],
        price: 135.0,
        stock: 20,
        unit: '750ml Bottle',
        images: ['https://images.unsplash.com/photo-1585670210693-e7fdd16b142e?w=500&auto=format&fit=crop&q=60'],
        storeId: store._id,
      },
    ];

    for (const prod of sampleProducts) {
      const exists = await Product.findOne({ name: prod.name, storeId: store._id });
      if (!exists) {
        await Product.create(prod);
      }
    }

    // 4. Create Pickup Slots (including one full slot to test capacity rejection!)
    const today = new Date();
    const slotTimes = [
      { startHour: 10, endHour: 12, maxOrders: 5, bookedCount: 1 },
      { startHour: 13, endHour: 15, maxOrders: 4, bookedCount: 4 }, // FULL SLOT to test frontend disable / backend rejection
      { startHour: 16, endHour: 18, maxOrders: 6, bookedCount: 2 },
      { startHour: 19, endHour: 21, maxOrders: 5, bookedCount: 0 },
    ];

    for (const s of slotTimes) {
      const startTime = new Date(today);
      startTime.setHours(s.startHour, 0, 0, 0);
      const endTime = new Date(today);
      endTime.setHours(s.endHour, 0, 0, 0);

      const slotExists = await PickupSlot.findOne({
        storeId: store._id,
        startTime,
      });

      if (!slotExists) {
        await PickupSlot.create({
          storeId: store._id,
          startTime,
          endTime,
          maxOrders: s.maxOrders,
          bookedCount: s.bookedCount,
        });
      }
    }

    return sendSuccess(res, {
      statusCode: 201,
      message: 'Sample catalog, store, and pickup slots successfully seeded',
    });
  } catch (error) {
    return sendError(res, {
      statusCode: 500,
      message: 'Failed to seed sample data',
      error: error.message,
    });
  }
};
