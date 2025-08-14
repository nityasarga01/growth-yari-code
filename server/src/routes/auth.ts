import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { supabaseAdmin } from '../config/database';
import { asyncHandler } from '../middleware/errorHandler';
import { validateUserRegistration, validateUserLogin } from '../middleware/validation';
import { authenticateToken, AuthRequest } from '../middleware/auth';

const router = express.Router();

// Generate JWT token
const generateToken = (userId: string) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET!, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d'
  });
};

// Register user
router.post('/register', validateUserRegistration, asyncHandler(async (req, res) => {
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

  // Check if user already exists
  const { data: existingUser } = await supabaseAdmin
    .from('users')
    .select('id')
    .eq('email', email)
    .single();

  if (existingUser) {
    return res.status(400).json({
      success: false,
      error: 'User already exists with this email'
    });
  }

  // Hash password
  const saltRounds = 12;
  const hashedPassword = await bcrypt.hash(password, saltRounds);

  // Create user
  const userId = uuidv4();
  const { data: user, error } = await supabaseAdmin
    .from('users')
    .insert({
      id: userId,
      name,
      email,
      password: hashedPassword,
      profession: profession || '',
      bio: `${profession || 'Professional'} with expertise in ${(skills || []).slice(0, 3).join(', ')}`,
      expertise: skills || [],
      location: location || '',
      experience: experience || '',
      field: field || '',
      avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=6366f1&color=fff`,
      created_at: new Date().toISOString()
    })
    .select('id, name, email, avatar, profession, bio, expertise, rating, review_count, is_verified, location, experience, field')
    .single();

  if (error) {
    console.error('User creation error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to create user'
    });
  }

  // Generate token
  const token = generateToken(userId);

  res.status(201).json({
    success: true,
    data: {
      user,
      token
    }
  });
}));

// Login user
router.post('/login', validateUserLogin, asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  // Get user with password
  const { data: user, error } = await supabaseAdmin
    .from('users')
    .select('*')
    .eq('email', email)
    .single();

  if (error || !user) {
    return res.status(401).json({
      success: false,
      error: 'Invalid credentials'
    });
  }

  // Check password
  const isPasswordValid = await bcrypt.compare(password, user.password);
  if (!isPasswordValid) {
    return res.status(401).json({
      success: false,
      error: 'Invalid credentials'
    });
  }

  // Update last login
  await supabaseAdmin
    .from('users')
    .update({ last_login: new Date().toISOString() })
    .eq('id', user.id);

  // Generate token
  const token = generateToken(user.id);

  // Remove password from response
  const { password: _, ...userWithoutPassword } = user;

  res.json({
    success: true,
    data: {
      user: userWithoutPassword,
      token
    }
  });
}));

// Get current user
router.get('/me', authenticateToken, asyncHandler(async (req: AuthRequest, res) => {
  const { data: user, error } = await supabaseAdmin
    .from('users')
    .select('id, name, email, avatar, profession, bio, expertise, rating, review_count, is_verified, social_links, created_at')
    .eq('id', req.user!.id)
    .single();

  if (error || !user) {
    return res.status(404).json({
      success: false,
      error: 'User not found'
    });
  }

  res.json({
    success: true,
    data: { user }
  });
}));

// Refresh token
router.post('/refresh', authenticateToken, asyncHandler(async (req: AuthRequest, res) => {
  const token = generateToken(req.user!.id);
  
  res.json({
    success: true,
    data: { token }
  });
}));

// Logout (client-side token removal)
router.post('/logout', authenticateToken, asyncHandler(async (req, res) => {
  res.json({
    success: true,
    message: 'Logged out successfully'
  });
}));

export { router as authRoutes };