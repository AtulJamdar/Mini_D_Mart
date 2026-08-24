import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

let mongoServer;

export const connectTestDB = async () => {
  const localUri = process.env.MONGO_URI_TEST || 'mongodb://127.0.0.1:27017/mini_dmart_test_suite';
  try {
    // Try connecting to local MongoDB first with 1.5s timeout for instant speed
    await mongoose.connect(localUri, { serverSelectionTimeoutMS: 1500 });
  } catch (localErr) {
    // If local instance is not running, spin up MongoMemoryServer
    mongoServer = await MongoMemoryServer.create();
    const memoryUri = mongoServer.getUri();
    await mongoose.connect(memoryUri);
  }
};

export const closeTestDB = async () => {
  try {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.dropDatabase().catch(() => {});
      await mongoose.disconnect().catch(() => {});
    }
    if (mongoServer) {
      await mongoServer.stop().catch(() => {});
    }
  } catch (err) {
    // ignore teardown errors
  }
};

export const clearTestDB = async () => {
  try {
    const collections = mongoose.connection.collections;
    for (const key in collections) {
      await collections[key].deleteMany({}).catch(() => {});
    }
  } catch (err) {
    // ignore clear errors
  }
};
