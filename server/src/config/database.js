const mongoose = require('mongoose');

let isConnected = false;

const connectDB = async () => {
  if (isConnected) {
    console.log('✅ MongoDB already connected');
    return;
  }

  try {
    if (!process.env.MONGODB_URI) {
      console.log('⚠️  MongoDB not configured - using mock database');
      isConnected = false;
      return;
    }

    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    isConnected = true;
    console.log(`✅ MongoDB connected: ${conn.connection.host}`);
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    isConnected = false;
  }
};

// Mock database for development when MongoDB is not configured
const mockDB = {
  users: new Map(),
  posts: new Map(),
  sessions: new Map(),
  connections: new Map(),
  connectionRequests: new Map(),
  notifications: new Map(),
};

const getMockDB = () => mockDB;

module.exports = { connectDB, isConnected: () => isConnected, getMockDB };