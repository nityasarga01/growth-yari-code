import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { supabaseAdmin } from '../config/database';
import { asyncHandler } from '../middleware/errorHandler';
import { authenticateToken, AuthRequest, requireRole } from '../middleware/auth';

const router = express.Router();

// Admin credentials (in production, store in database)
const ADMIN_CREDENTIALS = {
  email: 'admin@growthyari.com',
  password: '$2a$12$LQv3c1yqBwdeHaeSAFOCF.9wQ.H.9wQ.H.9wQ.H.9wQ.H.9wQ.H.9wQ', // 'admin123'
  name: 'GrowthYari Admin',
  role: 'admin',
  permissions: ['users', 'content', 'sessions', 'analytics', 'settings']
};

// Generate admin JWT token
const generateAdminToken = (adminId: string) => {
  return jwt.sign(
    { adminId, role: 'admin' }, 
    process.env.JWT_SECRET!, 
    { expiresIn: '8h' }
  );
};

// Admin login
router.post('/login', asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({
      success: false,
      error: 'Email and password are required'
    });
  }

  // Check credentials
  if (email !== ADMIN_CREDENTIALS.email) {
    return res.status(401).json({
      success: false,
      error: 'Invalid admin credentials'
    });
  }

  // For demo purposes, accept 'admin123' as password
  const isValidPassword = password === 'admin123' || await bcrypt.compare(password, ADMIN_CREDENTIALS.password);
  
  if (!isValidPassword) {
    return res.status(401).json({
      success: false,
      error: 'Invalid admin credentials'
    });
  }

  const token = generateAdminToken('admin-1');

  res.json({
    success: true,
    data: {
      admin: {
        id: 'admin-1',
        name: ADMIN_CREDENTIALS.name,
        email: ADMIN_CREDENTIALS.email,
        role: ADMIN_CREDENTIALS.role,
        permissions: ADMIN_CREDENTIALS.permissions
      },
      token
    }
  });
}));

// Get current admin
router.get('/me', authenticateToken, requireRole(['admin']), asyncHandler(async (req: AuthRequest, res) => {
  res.json({
    success: true,
    data: {
      admin: {
        id: 'admin-1',
        name: ADMIN_CREDENTIALS.name,
        email: ADMIN_CREDENTIALS.email,
        role: ADMIN_CREDENTIALS.role,
        permissions: ADMIN_CREDENTIALS.permissions
      }
    }
  });
}));

// Get admin dashboard stats
router.get('/stats', authenticateToken, requireRole(['admin']), asyncHandler(async (req: AuthRequest, res) => {
  try {
    const [
      { count: totalUsers },
      { count: totalSessions },
      { count: totalPosts },
      { count: totalConnections }
    ] = await Promise.all([
      supabaseAdmin.from('users').select('*', { count: 'exact', head: true }),
      supabaseAdmin.from('sessions').select('*', { count: 'exact', head: true }),
      supabaseAdmin.from('posts').select('*', { count: 'exact', head: true }),
      supabaseAdmin.from('connections').select('*', { count: 'exact', head: true })
    ]);

    // Get revenue from completed sessions
    const { data: completedSessions } = await supabaseAdmin
      .from('sessions')
      .select('price')
      .eq('status', 'completed');

    const totalRevenue = completedSessions?.reduce((sum, session) => sum + session.price, 0) || 0;

    // Get active users (logged in within last 7 days)
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const { count: activeUsers } = await supabaseAdmin
      .from('users')
      .select('*', { count: 'exact', head: true })
      .gte('last_login', sevenDaysAgo.toISOString());

    res.json({
      success: true,
      data: {
        totalUsers: totalUsers || 0,
        activeUsers: activeUsers || 0,
        totalSessions: totalSessions || 0,
        totalPosts: totalPosts || 0,
        totalConnections: totalConnections || 0,
        totalRevenue,
        systemHealth: 98.5,
        pendingReports: 0
      }
    });
  } catch (error) {
    console.error('Admin stats error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch admin stats'
    });
  }
}));

// Get all users with admin privileges
router.get('/users', authenticateToken, requireRole(['admin']), asyncHandler(async (req: AuthRequest, res) => {
  const { q, status, page = 1, limit = 20 } = req.query;
  const offset = (parseInt(page as string) - 1) * parseInt(limit as string);

  let query = supabaseAdmin
    .from('users')
    .select('id, name, email, avatar, profession, bio, rating, review_count, is_verified, created_at, last_login');

  // Search filter
  if (q) {
    query = query.or(`name.ilike.%${q}%,email.ilike.%${q}%,profession.ilike.%${q}%`);
  }

  // Status filter
  if (status === 'verified') {
    query = query.eq('is_verified', true);
  } else if (status === 'unverified') {
    query = query.eq('is_verified', false);
  }

  query = query
    .order('created_at', { ascending: false })
    .range(offset, offset + parseInt(limit as string) - 1);

  const { data: users, error } = await query;

  if (error) {
    console.error('Admin users fetch error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch users'
    });
  }

  res.json({
    success: true,
    data: { users: users || [] }
  });
}));

// Update user status
router.patch('/users/:userId/status', authenticateToken, requireRole(['admin']), asyncHandler(async (req: AuthRequest, res) => {
  const { userId } = req.params;
  const { isVerified, status } = req.body;

  const updateData: any = {};
  if (isVerified !== undefined) updateData.is_verified = isVerified;
  if (status !== undefined) updateData.status = status;

  const { data: user, error } = await supabaseAdmin
    .from('users')
    .update(updateData)
    .eq('id', userId)
    .select('id, name, email, is_verified')
    .single();

  if (error) {
    console.error('User status update error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to update user status'
    });
  }

  res.json({
    success: true,
    data: { user }
  });
}));

// Suspend user
router.post('/users/:userId/suspend', authenticateToken, requireRole(['admin']), asyncHandler(async (req: AuthRequest, res) => {
  const { userId } = req.params;

  // In a real implementation, you might add a 'suspended' field to users table
  // For now, we'll just mark them as unverified
  const { error } = await supabaseAdmin
    .from('users')
    .update({ is_verified: false })
    .eq('id', userId);

  if (error) {
    console.error('User suspension error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to suspend user'
    });
  }

  res.json({
    success: true,
    message: 'User suspended successfully'
  });
}));

// Get all sessions for admin
router.get('/sessions', authenticateToken, requireRole(['admin']), asyncHandler(async (req: AuthRequest, res) => {
  const { status, page = 1, limit = 20 } = req.query;
  const offset = (parseInt(page as string) - 1) * parseInt(limit as string);

  let query = supabaseAdmin
    .from('sessions')
    .select(`
      id, title, description, duration, price, scheduled_at, status, created_at,
      expert:expert_id(id, name, avatar, profession),
      client:client_id(id, name, avatar, profession)
    `);

  if (status && status !== 'all') {
    query = query.eq('status', status);
  }

  query = query
    .order('created_at', { ascending: false })
    .range(offset, offset + parseInt(limit as string) - 1);

  const { data: sessions, error } = await query;

  if (error) {
    console.error('Admin sessions fetch error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch sessions'
    });
  }

  res.json({
    success: true,
    data: { sessions: sessions || [] }
  });
}));

// Analytics endpoint
router.get('/analytics', authenticateToken, requireRole(['admin']), asyncHandler(async (req: AuthRequest, res) => {
  const { range = '7d' } = req.query;

  // Calculate date range
  const now = new Date();
  let startDate: Date;
  
  switch (range) {
    case '24h':
      startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      break;
    case '30d':
      startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      break;
    case '90d':
      startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
      break;
    default: // 7d
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  }

  try {
    // Get user growth
    const { count: newUsers } = await supabaseAdmin
      .from('users')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', startDate.toISOString());

    // Get session metrics
    const { data: recentSessions } = await supabaseAdmin
      .from('sessions')
      .select('price, status')
      .gte('created_at', startDate.toISOString());

    const completedSessions = recentSessions?.filter(s => s.status === 'completed') || [];
    const recentRevenue = completedSessions.reduce((sum, s) => sum + s.price, 0);

    // Get top experts
    const { data: topExperts } = await supabaseAdmin
      .from('users')
      .select('id, name, sessions_completed, rating, total_earnings')
      .order('sessions_completed', { ascending: false })
      .limit(5);

    res.json({
      success: true,
      data: {
        userGrowth: {
          newUsers: newUsers || 0,
          growth: 12.5 // Mock growth percentage
        },
        sessionMetrics: {
          total: recentSessions?.length || 0,
          completed: completedSessions.length,
          revenue: recentRevenue,
          averageRating: 4.7
        },
        topExperts: topExperts?.map(expert => ({
          name: expert.name,
          sessions: expert.sessions_completed || 0,
          rating: expert.rating || 0,
          revenue: expert.total_earnings || 0
        })) || []
      }
    });
  } catch (error) {
    console.error('Analytics fetch error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch analytics'
    });
  }
}));

export { router as adminRoutes };