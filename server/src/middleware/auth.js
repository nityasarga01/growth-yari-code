const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { isConnected, getMockDB } = require('../config/database');

const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({ 
        success: false, 
        error: 'Access token required' 
      });
    }

    // Verify JWT token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    if (isConnected()) {
      // Get user from MongoDB
      const user = await User.findById(decoded.userId).select('-password');
      if (!user) {
        return res.status(401).json({ 
          success: false, 
          error: 'Invalid token' 
        });
      }
      req.user = user;
    } else {
      // Mock user for development
      const mockDB = getMockDB();
      const user = mockDB.users.get(decoded.userId);
      if (!user) {
        return res.status(401).json({ 
          success: false, 
          error: 'Invalid token' 
        });
      }
      req.user = user;
    }

    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    return res.status(401).json({ 
      success: false, 
      error: 'Invalid token' 
    });
  }
};

const requireRole = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    if (!roles.includes(req.user.role || 'user')) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    next();
  };
};

module.exports = { authenticateToken, requireRole };