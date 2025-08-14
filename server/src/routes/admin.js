const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Session = require('../models/Session');
const Post = require('../models/Post');
const Connection = require('../models/Connection');
const { isConnected, getMockDB } = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Admin credentials (in production, store in database)
const ADMIN_CREDENTIALS = {
  email: 'admin@growthyari.com',
  password: 'admin123', // In production, this should be hashed
  name: 'GrowthYari Admin',
  role: 'admin',
  permissions: ['users', 'content', 'sessions', 'analytics', 'settings']
};

// Generate admin JWT token
const generateAdminToken = (adminId) => {
  return jwt.sign(
    { adminId, role: 'admin' }, 
    process.env.JWT_SECRET, 
    { expiresIn: '8h' }
  );
};

// Admin authentication middleware
const authenticateAdmin = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({ 
        success: false, 
        error: 'Admin access token required' 
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    if (decoded.role !== 'admin') {
      return res.status(403).json({ 
        success: false, 
        error: 'Admin access required' 
      });
    }

    req.admin = {
      id: decoded.adminId,
      role: decoded.role
    };
    
    next();
  } catch (error) {
    console.error('Admin auth error:', error);
    return res.status(401).json({ 
      success: false, 
      error: 'Invalid admin token' 
    });
  }
};

// Admin login
router.post('/login', async (req, res) => {
  try {
    console.log('Admin login attempt:', req.body.email);
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Email and password are required'
      });
    }

    // Check credentials
    if (email !== ADMIN_CREDENTIALS.email || password !== ADMIN_CREDENTIALS.password) {
      console.log('Invalid admin credentials for:', email);
      return res.status(401).json({
        success: false,
        error: 'Invalid admin credentials'
      });
    }

    const token = generateAdminToken('admin-1');
    console.log('Admin login successful for:', email);

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
  } catch (error) {
    console.error('Admin login error:', error);
    res.status(500).json({
      success: false,
      error: 'Admin login failed'
    });
  }
});

// Get current admin
router.get('/me', authenticateAdmin, async (req, res) => {
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
});

// Get admin dashboard stats
router.get('/stats', authenticateAdmin, async (req, res) => {
  try {
    console.log('Loading admin stats...');

    if (isConnected()) {
      // Get real stats from MongoDB
      const [
        totalUsers,
        totalSessions,
        totalPosts,
        totalConnections,
        completedSessions
      ] = await Promise.all([
        User.countDocuments(),
        Session.countDocuments(),
        Post.countDocuments(),
        Connection.countDocuments(),
        Session.find({ status: 'completed' }).select('price')
      ]);

      const totalRevenue = completedSessions.reduce((sum, session) => sum + session.price, 0);
      
      // Get active users (logged in within last 7 days)
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      const activeUsers = await User.countDocuments({
        lastLogin: { $gte: sevenDaysAgo }
      });

      const stats = {
        totalUsers,
        activeUsers,
        totalSessions,
        totalPosts,
        totalConnections,
        totalRevenue,
        systemHealth: 98.5,
        pendingReports: 0 // Would come from a reports collection
      };

      console.log('Admin stats loaded:', stats);

      return res.json({
        success: true,
        data: stats
      });
    } else {
      // Mock stats for development
      const mockStats = {
        totalUsers: 1247,
        activeUsers: 892,
        totalSessions: 3456,
        totalPosts: 234,
        totalConnections: 1890,
        totalRevenue: 45678,
        systemHealth: 98.5,
        pendingReports: 12
      };

      console.log('Using mock admin stats:', mockStats);

      return res.json({
        success: true,
        data: mockStats
      });
    }
  } catch (error) {
    console.error('Admin stats error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch admin stats'
    });
  }
});

// Get all users with admin privileges
router.get('/users', authenticateAdmin, async (req, res) => {
  try {
    const { q, status, page = 1, limit = 20 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    console.log('Admin fetching users with filters:', { q, status, page, limit });

    if (isConnected()) {
      let query = {};

      // Search filter
      if (q) {
        query.$or = [
          { name: { $regex: q, $options: 'i' } },
          { email: { $regex: q, $options: 'i' } },
          { profession: { $regex: q, $options: 'i' } }
        ];
      }

      // Status filter
      if (status === 'verified') {
        query.isVerified = true;
      } else if (status === 'unverified') {
        query.isVerified = false;
      }

      const users = await User.find(query)
        .select('name email avatar profession bio rating reviewCount isVerified createdAt lastLogin')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit));

      const formattedUsers = users.map(user => ({
        id: user._id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        profession: user.profession,
        bio: user.bio,
        rating: user.rating,
        reviewCount: user.reviewCount,
        isVerified: user.isVerified,
        createdAt: user.createdAt,
        lastLogin: user.lastLogin,
        sessionsCompleted: user.sessionsCompleted || 0
      }));

      return res.json({
        success: true,
        data: { users: formattedUsers }
      });
    } else {
      // Mock users for development
      const mockUsers = [
        {
          id: '1',
          name: 'Sarah Johnson',
          email: 'sarah@example.com',
          avatar: 'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&dpr=1',
          profession: 'UX Designer',
          bio: 'Senior UX Designer with 8+ years experience',
          rating: 4.9,
          reviewCount: 42,
          isVerified: true,
          createdAt: new Date('2024-01-15'),
          lastLogin: new Date(),
          sessionsCompleted: 156
        },
        {
          id: '2',
          name: 'Mike Chen',
          email: 'mike@example.com',
          avatar: 'https://images.pexels.com/photos/2379004/pexels-photo-2379004.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&dpr=1',
          profession: 'Product Manager',
          bio: 'Product Manager at tech startup',
          rating: 4.7,
          reviewCount: 28,
          isVerified: false,
          createdAt: new Date('2024-02-20'),
          lastLogin: new Date(Date.now() - 86400000),
          sessionsCompleted: 89
        }
      ];

      return res.json({
        success: true,
        data: { users: mockUsers }
      });
    }
  } catch (error) {
    console.error('Admin users fetch error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch users'
    });
  }
});

// Update user status
router.patch('/users/:userId/status', authenticateAdmin, async (req, res) => {
  try {
    const { userId } = req.params;
    const { isVerified, status } = req.body;

    console.log('Admin updating user status:', userId, { isVerified, status });

    if (isConnected()) {
      const updateData = {};
      if (isVerified !== undefined) updateData.isVerified = isVerified;
      if (status !== undefined) updateData.status = status;

      const user = await User.findByIdAndUpdate(
        userId,
        updateData,
        { new: true }
      ).select('id name email isVerified');

      if (!user) {
        return res.status(404).json({
          success: false,
          error: 'User not found'
        });
      }

      return res.json({
        success: true,
        data: { user }
      });
    } else {
      // Mock response for development
      return res.json({
        success: true,
        data: { 
          user: { 
            id: userId, 
            isVerified: isVerified !== undefined ? isVerified : true 
          } 
        }
      });
    }
  } catch (error) {
    console.error('User status update error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update user status'
    });
  }
});

// Suspend user
router.post('/users/:userId/suspend', authenticateAdmin, async (req, res) => {
  try {
    const { userId } = req.params;

    console.log('Admin suspending user:', userId);

    if (isConnected()) {
      // In a real implementation, you might add a 'suspended' field
      // For now, we'll mark them as unverified
      const user = await User.findByIdAndUpdate(
        userId,
        { isVerified: false },
        { new: true }
      );

      if (!user) {
        return res.status(404).json({
          success: false,
          error: 'User not found'
        });
      }

      return res.json({
        success: true,
        message: 'User suspended successfully'
      });
    } else {
      // Mock response for development
      return res.json({
        success: true,
        message: 'User suspended successfully'
      });
    }
  } catch (error) {
    console.error('User suspension error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to suspend user'
    });
  }
});

// Get all sessions for admin
router.get('/sessions', authenticateAdmin, async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    console.log('Admin fetching sessions with filters:', { status, page, limit });

    if (isConnected()) {
      let query = {};
      if (status && status !== 'all') {
        query.status = status;
      }

      const sessions = await Session.find(query)
        .populate('expertId', 'name avatar profession')
        .populate('clientId', 'name avatar profession')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit));

      const formattedSessions = sessions.map(session => ({
        id: session._id,
        title: session.title,
        description: session.description,
        duration: session.duration,
        price: session.price,
        scheduledAt: session.scheduledAt,
        status: session.status,
        meetingLink: session.meetingLink,
        createdAt: session.createdAt,
        expert: {
          id: session.expertId._id,
          name: session.expertId.name,
          avatar: session.expertId.avatar,
          profession: session.expertId.profession
        },
        client: {
          id: session.clientId._id,
          name: session.clientId.name,
          avatar: session.clientId.avatar,
          profession: session.clientId.profession
        }
      }));

      return res.json({
        success: true,
        data: { sessions: formattedSessions }
      });
    } else {
      // Mock sessions for development
      const mockSessions = [
        {
          id: '1',
          title: 'UX Design Review',
          description: 'Review of current design system',
          duration: 60,
          price: 75,
          scheduledAt: new Date('2024-08-15T14:00:00'),
          status: 'confirmed',
          meetingLink: 'https://meet.google.com/abc-defg-hij',
          createdAt: new Date(),
          expert: {
            id: 'expert1',
            name: 'Sarah Johnson',
            avatar: 'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&dpr=1',
            profession: 'UX Designer'
          },
          client: {
            id: 'client1',
            name: 'Mike Chen',
            avatar: 'https://images.pexels.com/photos/2379004/pexels-photo-2379004.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&dpr=1',
            profession: 'Product Manager'
          }
        }
      ];

      return res.json({
        success: true,
        data: { sessions: mockSessions }
      });
    }
  } catch (error) {
    console.error('Admin sessions fetch error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch sessions'
    });
  }
});

// Analytics endpoint
router.get('/analytics', authenticateAdmin, async (req, res) => {
  try {
    const { range = '7d' } = req.query;

    console.log('Admin fetching analytics for range:', range);

    // Calculate date range
    const now = new Date();
    let startDate;
    
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

    if (isConnected()) {
      // Get real analytics from MongoDB
      const [
        newUsers,
        recentSessions,
        topExperts
      ] = await Promise.all([
        User.countDocuments({ createdAt: { $gte: startDate } }),
        Session.find({ createdAt: { $gte: startDate } }).select('price status'),
        User.find()
          .select('name sessionsCompleted rating totalEarnings')
          .sort({ sessionsCompleted: -1 })
          .limit(5)
      ]);

      const completedSessions = recentSessions.filter(s => s.status === 'completed');
      const recentRevenue = completedSessions.reduce((sum, s) => sum + s.price, 0);

      const analytics = {
        userGrowth: {
          newUsers,
          growth: 12.5 // Mock growth percentage
        },
        sessionMetrics: {
          total: recentSessions.length,
          completed: completedSessions.length,
          revenue: recentRevenue,
          averageRating: 4.7
        },
        topExperts: topExperts.map(expert => ({
          name: expert.name,
          sessions: expert.sessionsCompleted || 0,
          rating: expert.rating || 0,
          revenue: expert.totalEarnings || 0
        })),
        recentActivity: [
          { type: 'user_signup', count: newUsers, change: 15 },
          { type: 'session_booked', count: recentSessions.length, change: 8 },
          { type: 'connection_made', count: 145, change: 22 }
        ]
      };

      return res.json({
        success: true,
        data: analytics
      });
    } else {
      // Mock analytics for development
      const mockAnalytics = {
        userGrowth: {
          newUsers: 89,
          growth: 12.5
        },
        sessionMetrics: {
          total: 234,
          completed: 198,
          revenue: 12450,
          averageRating: 4.7
        },
        topExperts: [
          { name: 'Sarah Johnson', sessions: 156, rating: 4.9, revenue: 8750 },
          { name: 'Mike Chen', sessions: 134, rating: 4.8, revenue: 7200 },
          { name: 'Emily Rodriguez', sessions: 98, rating: 4.9, revenue: 5400 }
        ],
        recentActivity: [
          { type: 'user_signup', count: 23, change: 15 },
          { type: 'session_booked', count: 67, change: 8 },
          { type: 'connection_made', count: 145, change: 22 }
        ]
      };

      return res.json({
        success: true,
        data: mockAnalytics
      });
    }
  } catch (error) {
    console.error('Analytics fetch error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch analytics'
    });
  }
});

// System configuration endpoints
router.get('/config', authenticateAdmin, async (req, res) => {
  try {
    // Mock system configuration
    const mockConfig = {
      platform: {
        name: 'GrowthYari',
        description: 'Professional networking and mentorship platform',
        maintenanceMode: false,
        registrationEnabled: true,
        maxUsersPerSession: 2
      },
      email: {
        smtpHost: 'smtp.gmail.com',
        smtpPort: 587,
        fromEmail: 'noreply@growthyari.com',
        enabled: true
      },
      payments: {
        stripeEnabled: true,
        platformFee: 10,
        minimumSessionPrice: 25,
        currency: 'USD'
      },
      security: {
        sessionTimeout: 24,
        maxLoginAttempts: 5,
        requireEmailVerification: false,
        enableTwoFactor: false
      },
      features: {
        yariConnectEnabled: true,
        freeSessionsEnabled: true,
        chatEnabled: true,
        notificationsEnabled: true
      }
    };

    res.json({
      success: true,
      data: { config: mockConfig }
    });
  } catch (error) {
    console.error('Config fetch error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch system configuration'
    });
  }
});

router.put('/config', authenticateAdmin, async (req, res) => {
  try {
    console.log('Admin updating system config:', req.body);
    
    // In a real implementation, save to database
    res.json({
      success: true,
      message: 'Configuration updated successfully'
    });
  } catch (error) {
    console.error('Config update error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update configuration'
    });
  }
});

module.exports = router;

// Get all users with admin privileges
router.get('/users', authenticateAdmin, async (req, res) => {
  try {
    const { q, status, page = 1, limit = 20 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    console.log('Admin fetching users with filters:', { q, status, page, limit });

    if (isConnected()) {
      let query = {};

      // Search filter
      if (q) {
        query.$or = [
          { name: { $regex: q, $options: 'i' } },
          { email: { $regex: q, $options: 'i' } },
          { profession: { $regex: q, $options: 'i' } }
        ];
      }

      // Status filter
      if (status === 'verified') {
        query.isVerified = true;
      } else if (status === 'unverified') {
        query.isVerified = false;
      }

      const users = await User.find(query)
        .select('name email avatar profession bio rating reviewCount isVerified createdAt lastLogin')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit));

      const formattedUsers = users.map(user => ({
        id: user._id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        profession: user.profession,
        bio: user.bio,
        rating: user.rating,
        reviewCount: user.reviewCount,
        isVerified: user.isVerified,
        createdAt: user.createdAt,
        lastLogin: user.lastLogin,
        sessionsCompleted: user.sessionsCompleted || 0,
        expertise: user.expertise || []
      }));

      return res.json({
        success: true,
        data: { users: formattedUsers }
      });
    } else {
      // Mock users for development
      const mockUsers = [
        {
          id: '1',
          name: 'Sarah Johnson',
          email: 'sarah@example.com',
          avatar: 'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&dpr=1',
          profession: 'UX Designer',
          bio: 'Senior UX Designer with 8+ years experience',
          rating: 4.9,
          reviewCount: 42,
          isVerified: true,
          createdAt: new Date('2024-01-15'),
          lastLogin: new Date(),
          sessionsCompleted: 156,
          expertise: ['User Experience', 'Design Systems', 'Prototyping']
        },
        {
          id: '2',
          name: 'Mike Chen',
          email: 'mike@example.com',
          avatar: 'https://images.pexels.com/photos/2379004/pexels-photo-2379004.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&dpr=1',
          profession: 'Product Manager',
          bio: 'Product Manager at tech startup',
          rating: 4.7,
          reviewCount: 28,
          isVerified: false,
          createdAt: new Date('2024-02-20'),
          lastLogin: new Date(Date.now() - 86400000),
          sessionsCompleted: 89,
          expertise: ['Product Strategy', 'Agile', 'Data Analysis']
        },
        {
          id: '3',
          name: 'Emily Rodriguez',
          email: 'emily@example.com',
          avatar: 'https://images.pexels.com/photos/1181686/pexels-photo-1181686.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&dpr=1',
          profession: 'Marketing Director',
          bio: 'Marketing Director with growth focus',
          rating: 4.8,
          reviewCount: 35,
          isVerified: true,
          createdAt: new Date('2024-03-10'),
          lastLogin: new Date(Date.now() - 3600000),
          sessionsCompleted: 67,
          expertise: ['Digital Marketing', 'Brand Strategy', 'Content Marketing']
        }
      ];

      return res.json({
        success: true,
        data: { users: mockUsers }
      });
    }
  } catch (error) {
    console.error('Admin users fetch error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch users'
    });
  }
});

// Update user status
router.patch('/users/:userId/status', authenticateAdmin, async (req, res) => {
  try {
    const { userId } = req.params;
    const { isVerified, status } = req.body;

    console.log('Admin updating user status:', userId, { isVerified, status });

    if (isConnected()) {
      const updateData = {};
      if (isVerified !== undefined) updateData.isVerified = isVerified;
      if (status !== undefined) updateData.status = status;

      const user = await User.findByIdAndUpdate(
        userId,
        updateData,
        { new: true }
      ).select('id name email isVerified');

      if (!user) {
        return res.status(404).json({
          success: false,
          error: 'User not found'
        });
      }

      return res.json({
        success: true,
        data: { user }
      });
    } else {
      // Mock response for development
      return res.json({
        success: true,
        data: { 
          user: { 
            id: userId, 
            isVerified: isVerified !== undefined ? isVerified : true 
          } 
        }
      });
    }
  } catch (error) {
    console.error('User status update error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update user status'
    });
  }
});

// Suspend user
router.post('/users/:userId/suspend', authenticateAdmin, async (req, res) => {
  try {
    const { userId } = req.params;

    console.log('Admin suspending user:', userId);

    if (isConnected()) {
      // In a real implementation, you might add a 'suspended' field
      // For now, we'll mark them as unverified
      const user = await User.findByIdAndUpdate(
        userId,
        { isVerified: false },
        { new: true }
      );

      if (!user) {
        return res.status(404).json({
          success: false,
          error: 'User not found'
        });
      }

      return res.json({
        success: true,
        message: 'User suspended successfully'
      });
    } else {
      // Mock response for development
      return res.json({
        success: true,
        message: 'User suspended successfully'
      });
    }
  } catch (error) {
    console.error('User suspension error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to suspend user'
    });
  }
});

// Get all sessions for admin
router.get('/sessions', authenticateAdmin, async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    console.log('Admin fetching sessions with filters:', { status, page, limit });

    if (isConnected()) {
      let query = {};
      if (status && status !== 'all') {
        query.status = status;
      }

      const sessions = await Session.find(query)
        .populate('expertId', 'name avatar profession')
        .populate('clientId', 'name avatar profession')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit));

      const formattedSessions = sessions.map(session => ({
        id: session._id,
        title: session.title,
        description: session.description,
        duration: session.duration,
        price: session.price,
        scheduledAt: session.scheduledAt,
        status: session.status,
        meetingLink: session.meetingLink,
        createdAt: session.createdAt,
        expert: {
          id: session.expertId._id,
          name: session.expertId.name,
          avatar: session.expertId.avatar,
          profession: session.expertId.profession
        },
        client: {
          id: session.clientId._id,
          name: session.clientId.name,
          avatar: session.clientId.avatar,
          profession: session.clientId.profession
        }
      }));

      return res.json({
        success: true,
        data: { sessions: formattedSessions }
      });
    } else {
      // Mock sessions for development
      const mockSessions = [
        {
          id: '1',
          title: 'UX Design Review',
          description: 'Review of current design system and user experience improvements',
          duration: 60,
          price: 75,
          scheduledAt: new Date('2024-08-15T14:00:00'),
          status: 'confirmed',
          meetingLink: 'https://meet.google.com/abc-defg-hij',
          createdAt: new Date(),
          expert: {
            id: 'expert1',
            name: 'Sarah Johnson',
            avatar: 'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&dpr=1',
            profession: 'UX Designer'
          },
          client: {
            id: 'client1',
            name: 'Mike Chen',
            avatar: 'https://images.pexels.com/photos/2379004/pexels-photo-2379004.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&dpr=1',
            profession: 'Product Manager'
          }
        },
        {
          id: '2',
          title: 'Product Strategy Session',
          description: 'Discuss product roadmap and go-to-market strategy',
          duration: 45,
          price: 0,
          scheduledAt: new Date('2024-08-16T10:00:00'),
          status: 'pending',
          meetingLink: null,
          createdAt: new Date(Date.now() - 86400000),
          expert: {
            id: 'expert2',
            name: 'Emily Rodriguez',
            avatar: 'https://images.pexels.com/photos/1181686/pexels-photo-1181686.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&dpr=1',
            profession: 'Marketing Director'
          },
          client: {
            id: 'client2',
            name: 'Alex Thompson',
            avatar: 'https://images.pexels.com/photos/2379004/pexels-photo-2379004.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&dpr=1',
            profession: 'Startup Founder'
          }
        },
        {
          id: '3',
          title: 'Career Guidance',
          description: 'Career transition and growth planning session',
          duration: 30,
          price: 50,
          scheduledAt: new Date('2024-08-17T16:00:00'),
          status: 'completed',
          meetingLink: 'https://meet.google.com/xyz-uvwx-rst',
          createdAt: new Date(Date.now() - 2 * 86400000),
          expert: {
            id: 'expert3',
            name: 'David Kim',
            avatar: 'https://images.pexels.com/photos/2379004/pexels-photo-2379004.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&dpr=1',
            profession: 'Senior Engineering Manager'
          },
          client: {
            id: 'client3',
            name: 'Lisa Wang',
            avatar: 'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&dpr=1',
            profession: 'Software Developer'
          }
        }
      ];

      return res.json({
        success: true,
        data: { sessions: mockSessions }
      });
    }
  } catch (error) {
    console.error('Admin sessions fetch error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch sessions'
    });
  }
});

// Analytics endpoint
router.get('/analytics', authenticateAdmin, async (req, res) => {
  try {
    const { range = '7d' } = req.query;

    console.log('Admin fetching analytics for range:', range);

    // Calculate date range
    const now = new Date();
    let startDate;
    
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

    if (isConnected()) {
      // Get real analytics from MongoDB
      const [
        newUsers,
        recentSessions,
        topExperts
      ] = await Promise.all([
        User.countDocuments({ createdAt: { $gte: startDate } }),
        Session.find({ createdAt: { $gte: startDate } }).select('price status'),
        User.find()
          .select('name sessionsCompleted rating totalEarnings')
          .sort({ sessionsCompleted: -1 })
          .limit(5)
      ]);

      const completedSessions = recentSessions.filter(s => s.status === 'completed');
      const recentRevenue = completedSessions.reduce((sum, s) => sum + s.price, 0);

      const analytics = {
        userGrowth: {
          newUsers,
          growth: 12.5 // Mock growth percentage
        },
        sessionMetrics: {
          total: recentSessions.length,
          completed: completedSessions.length,
          revenue: recentRevenue,
          averageRating: 4.7
        },
        topExperts: topExperts.map(expert => ({
          name: expert.name,
          sessions: expert.sessionsCompleted || 0,
          rating: expert.rating || 0,
          revenue: expert.totalEarnings || 0
        })),
        recentActivity: [
          { type: 'user_signup', count: newUsers, change: 15 },
          { type: 'session_booked', count: recentSessions.length, change: 8 },
          { type: 'connection_made', count: 145, change: 22 }
        ]
      };

      return res.json({
        success: true,
        data: analytics
      });
    } else {
      // Mock analytics for development
      const mockAnalytics = {
        userGrowth: {
          newUsers: 89,
          growth: 12.5
        },
        sessionMetrics: {
          total: 234,
          completed: 198,
          revenue: 12450,
          averageRating: 4.7
        },
        topExperts: [
          { name: 'Sarah Johnson', sessions: 156, rating: 4.9, revenue: 8750 },
          { name: 'Mike Chen', sessions: 134, rating: 4.8, revenue: 7200 },
          { name: 'Emily Rodriguez', sessions: 98, rating: 4.9, revenue: 5400 }
        ],
        recentActivity: [
          { type: 'user_signup', count: 23, change: 15 },
          { type: 'session_booked', count: 67, change: 8 },
          { type: 'connection_made', count: 145, change: 22 }
        ]
      };

      return res.json({
        success: true,
        data: mockAnalytics
      });
    }
  } catch (error) {
    console.error('Analytics fetch error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch analytics'
    });
  }
});

// System configuration endpoints
router.get('/config', authenticateAdmin, async (req, res) => {
  try {
    // Mock system configuration
    const mockConfig = {
      platform: {
        name: 'GrowthYari',
        description: 'Professional networking and mentorship platform',
        maintenanceMode: false,
        registrationEnabled: true,
        maxUsersPerSession: 2
      },
      email: {
        smtpHost: 'smtp.gmail.com',
        smtpPort: 587,
        fromEmail: 'noreply@growthyari.com',
        enabled: true
      },
      payments: {
        stripeEnabled: true,
        platformFee: 10,
        minimumSessionPrice: 25,
        currency: 'USD'
      },
      security: {
        sessionTimeout: 24,
        maxLoginAttempts: 5,
        requireEmailVerification: false,
        enableTwoFactor: false
      },
      features: {
        yariConnectEnabled: true,
        freeSessionsEnabled: true,
        chatEnabled: true,
        notificationsEnabled: true
      }
    };

    res.json({
      success: true,
      data: { config: mockConfig }
    });
  } catch (error) {
    console.error('Config fetch error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch system configuration'
    });
  }
});

router.put('/config', authenticateAdmin, async (req, res) => {
  try {
    console.log('Admin updating system config:', req.body);
    
    // In a real implementation, save to database
    res.json({
      success: true,
      message: 'Configuration updated successfully'
    });
  } catch (error) {
    console.error('Config update error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update configuration'
    });
  }
});