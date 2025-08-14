const express = require('express');
require('dotenv').config();
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const { isConnected, getMockDB } = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Generate JWT token
const generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d'
  });
};

// Validation middleware
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      details: errors.array()
    });
  }
  next();
};

// Register user
router.post('/register', [
  body('name').trim().isLength({ min: 2, max: 50 }).withMessage('Name must be between 2 and 50 characters'),
  body('email').isEmail().normalizeEmail().withMessage('Please provide a valid email'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters long'),
  body('profession').optional().trim().isLength({ max: 100 }).withMessage('Profession must be less than 100 characters'),
  body('industry').optional().trim().isLength({ max: 100 }).withMessage('Industry must be less than 100 characters'),
  body('experience').optional().trim().isLength({ max: 100 }).withMessage('Experience must be less than 100 characters'),
  body('skills').optional().isArray().withMessage('Skills must be an array'),
  body('objectives').optional().isArray().withMessage('Objectives must be an array'),
  handleValidationErrors
], async (req, res) => {
  try {
    console.log('Register request received:', req.body);
    const { 
      name, 
      email, 
      password, 
      profession, 
      industry, 
      experience, 
      skills, 
      objectives,
      location,
      field,
      mentorshipGoals,
      availabilityStatus 
    } = req.body;

    if (isConnected()) {
      // Check if user already exists
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        console.log('User already exists:', email);
        return res.status(400).json({
          success: false,
          error: 'User already exists with this email'
        });
      }

      // Create user
      const user = new User({
        name,
        email,
        password,
        profession: profession || '',
        industry: industry || '',
        experience: experience || '',
        location: location || '',
        field: field || '',
        expertise: skills || [],
        objectives: objectives || [],
        bio: `${profession || 'Professional'} with expertise in ${(skills || []).slice(0, 3).join(', ')}`
      });

      await user.save();
      console.log('User created successfully:', user._id);

      // Generate token
      const token = generateToken(user._id);

      res.status(201).json({
        success: true,
        data: {
          user: {
            id: user._id,
            name: user.name,
            email: user.email,
            avatar: user.avatar,
            profession: user.profession,
            bio: user.bio,
            expertise: user.expertise,
            industry: user.industry,
            experience: user.experience,
            objectives: user.objectives,
            rating: user.rating,
            reviewCount: user.reviewCount,
            isVerified: user.isVerified
          },
          token
        }
      });
    } else {
      // Mock registration for development
      console.log('Using mock registration for:', email);
      const mockDB = getMockDB();
      const userId = 'mock-user-' + Date.now();
      
      // Check if user already exists in mock DB
      for (const [id, user] of mockDB.users) {
        if (user.email === email) {
          return res.status(400).json({
            success: false,
            error: 'User already exists with this email'
          });
        }
      }
      
      const mockUser = {
        id: userId,
        name,
        email,
        avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=6366f1&color=fff`,
        profession: profession || 'Professional',
        industry: industry || '',
        experience: experience || '',
        bio: null,
        expertise: skills || [],
        objectives: objectives || [],
        rating: 0,
        reviewCount: 0,
        isVerified: false,
        role: 'user'
      };
      
      mockDB.users.set(userId, mockUser);
      const token = generateToken(userId);
      
      console.log('Mock user created:', mockUser);
      
      return res.status(201).json({
        success: true,
        data: {
          user: mockUser,
          token
        }
      });
    }
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      error: 'Registration failed'
    });
  }
});

// Login user
router.post('/login', [
  body('email').isEmail().normalizeEmail().withMessage('Please provide a valid email'),
  body('password').notEmpty().withMessage('Password is required'),
  handleValidationErrors
], async (req, res) => {
  try {
    console.log('Login request received:', req.body.email);
    const { email, password } = req.body;

    if (isConnected()) {
      // Get user with password
      const user = await User.findOne({ email }).select('+password');
      if (!user) {
        console.log('User not found:', email);
        return res.status(401).json({
          success: false,
          error: 'Invalid credentials'
        });
      }

      // Check password
      const isPasswordValid = await user.comparePassword(password);
      if (!isPasswordValid) {
        console.log('Invalid password for user:', email);
        return res.status(401).json({
          success: false,
          error: 'Invalid credentials'
        });
      }

      // Update last login
      user.lastLogin = new Date();
      await user.save();
      
      console.log('User logged in successfully:', user._id);

      // Generate token
      const token = generateToken(user._id);

      res.json({
        success: true,
        data: {
          user: {
            id: user._id,
            name: user.name,
            email: user.email,
            avatar: user.avatar,
            profession: user.profession,
            bio: user.bio,
            expertise: user.expertise,
            rating: user.rating,
            reviewCount: user.reviewCount,
            isVerified: user.isVerified
          },
          token
        }
      });
    } else {
      // Mock login for development
      console.log('Using mock login for:', email);
      const userId = 'mock-user-' + Date.now();
      const token = generateToken(userId);
      
      const mockUser = {
        id: userId,
        name: 'Test User',
        email,
        avatar: `https://ui-avatars.com/api/?name=Test%20User&background=6366f1&color=fff`,
        profession: 'Software Developer',
        bio: 'Passionate about technology and innovation',
        expertise: ['JavaScript', 'React', 'Node.js'],
        rating: 4.8,
        reviewCount: 25,
        isVerified: true,
        role: 'user'
      };
      
      const mockDB = getMockDB();
      mockDB.users.set(userId, mockUser);
      
      console.log('Mock user logged in:', mockUser);
      
      return res.json({
        success: true,
        data: {
          user: mockUser,
          token
        }
      });
    }
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      error: 'Login failed'
    });
  }
});

// Get current user
router.get('/me', authenticateToken, async (req, res) => {
  try {
    if (isConnected()) {
      const user = await User.findById(req.user._id || req.user.id);
      if (!user) {
        return res.status(404).json({
          success: false,
          error: 'User not found'
        });
      }

      res.json({
        success: true,
        data: { 
          user: {
            id: user._id,
            name: user.name,
            email: user.email,
            avatar: user.avatar,
            profession: user.profession,
            bio: user.bio,
            expertise: user.expertise,
            rating: user.rating,
            reviewCount: user.reviewCount,
            isVerified: user.isVerified
          }
        }
      });
    } else {
      // Mock user data for development
      return res.json({
        success: true,
        data: {
          user: req.user
        }
      });
    }
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get user'
    });
  }
});

module.exports = router;