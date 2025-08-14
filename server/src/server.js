const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { connectDB } = require('./config/database');

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

console.log('🚀 Starting GrowthYari Backend Server...');
console.log('📊 Environment:', process.env.NODE_ENV || 'development');
console.log('🔗 Frontend URL:', process.env.FRONTEND_URL || 'http://localhost:5173');

// Connect to MongoDB
connectDB();

// Middleware
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:3000', 'http://localhost:5173','http://127.0.0.1:5173','https://dravedigitals.in'],
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'GrowthYari Backend Server is running!',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// API Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/users'));
app.use('/api/posts', require('./routes/posts'));
app.use('/api/sessions', require('./routes/sessions'));
app.use('/api/connections', require('./routes/connections'));
app.use('/api/search', require('./routes/search'));
app.use('/api/dashboard', require('./routes/dashboard'));
app.use('/api/yari-connect', require('./routes/yariConnect'));

// Add notification, chat, and calendar routes
app.use('/api/notifications', require('./routes/notifications').router);
app.use('/api/chat', require('./routes/chat'));
app.use('/api/calendar', require('./routes/calendar'));

// Add upload route
try {
  app.use('/api/upload', require('./routes/upload'));
  console.log('✅ Upload routes loaded');
} catch (error) {
  console.log('⚠️  Upload routes not available:', error.message);
}

// Add availability route
try {
  app.use('/api/availability', require('./routes/availability'));
  console.log('✅ Availability routes loaded');
} catch (error) {
  console.log('⚠️  Availability routes not available:', error.message);
}

// Add admin routes
try {
  app.use('/api/admin', require('./routes/admin'));
  console.log('✅ Admin routes loaded');
} catch (error) {
  console.log('⚠️  Admin routes not available:', error.message);
}

// 404 handler
app.use('*', (req, res) => {
  console.log('404 - Route not found:', req.originalUrl);
  res.status(404).json({
    success: false,
    error: `Route ${req.originalUrl} not found`
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({
    success: false,
    error: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
  });
});

app.listen(PORT, () => {
  console.log(`🚀 GrowthYari Backend Server running on port ${PORT}`);
  console.log(`📱 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🌐 Frontend URL: ${process.env.FRONTEND_URL || 'http://localhost:5173'}`);
  console.log(`🔗 Health check: http://localhost:${PORT}/health`);
  console.log(`📊 API Base: http://localhost:${PORT}/api`);
  console.log('✅ Server is ready to accept connections!');
});