const express = require('express');
const User = require('../models/User');
const Post = require('../models/Post');
const Session = require('../models/Session');
const Connection = require('../models/Connection');
const { isConnected, getMockDB } = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Get dashboard statistics
router.get('/stats', authenticateToken, async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;

    if (isConnected()) {
      // Get user's sessions count
      const sessionsCount = await Session.countDocuments({
        $or: [{ expertId: userId }, { clientId: userId }],
        status: 'completed'
      });

      // Get user's connections count
      const connectionsCount = await Connection.countDocuments({
        $or: [{ user1Id: userId }, { user2Id: userId }]
      });

      // Get user's posts count
      const postsCount = await Post.countDocuments({ userId });

      // Get user's total earnings (as expert)
      const completedSessions = await Session.find({
        expertId: userId,
        status: 'completed'
      }).select('price');

      const totalEarnings = completedSessions.reduce((sum, session) => sum + session.price, 0);

      // Get user's average rating
      const user = await User.findById(userId).select('rating');

      const stats = {
        totalSessions: sessionsCount,
        activeConnections: connectionsCount,
        averageRating: user?.rating || 0,
        totalEarnings: totalEarnings,
        postsCount: postsCount
      };

      return res.json({
        success: true,
        data: { stats }
      });
    } else {
      // Mock stats for development
      const mockStats = {
        totalSessions: 24,
        activeConnections: 156,
        averageRating: 4.8,
        totalEarnings: 1240,
        postsCount: 12
      };

      return res.json({
        success: true,
        data: { stats: mockStats }
      });
    }
  } catch (error) {
    console.error('Dashboard stats error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch dashboard stats'
    });
  }
});

// Get recent activity
router.get('/activity', authenticateToken, async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;

    if (isConnected()) {
      const activities = [];

      // Get recent sessions
      const recentSessions = await Session.find({
        $or: [{ expertId: userId }, { clientId: userId }],
        status: 'completed'
      })
      .populate('expertId', 'name')
      .populate('clientId', 'name')
      .sort({ updatedAt: -1 })
      .limit(5);

      recentSessions.forEach(session => {
        const isExpert = session.expertId._id.toString() === userId.toString();
        const otherUser = isExpert ? session.clientId : session.expertId;
        
        activities.push({
          type: 'session',
          message: `Session ${isExpert ? 'with' : 'by'} ${otherUser.name} completed`,
          time: session.updatedAt,
          data: { sessionId: session._id, title: session.title }
        });
      });

      // Get recent connections
      const recentConnections = await Connection.find({
        $or: [{ user1Id: userId }, { user2Id: userId }]
      })
      .populate('user1Id', 'name')
      .populate('user2Id', 'name')
      .sort({ connectedAt: -1 })
      .limit(3);

      recentConnections.forEach(connection => {
        const otherUser = connection.user1Id._id.toString() === userId.toString() 
          ? connection.user2Id 
          : connection.user1Id;
        
        activities.push({
          type: 'connection',
          message: `Connected with ${otherUser.name}`,
          time: connection.connectedAt,
          data: { userId: otherUser._id, name: otherUser.name }
        });
      });

      // Sort activities by time
      activities.sort((a, b) => new Date(b.time) - new Date(a.time));

      return res.json({
        success: true,
        data: { activities: activities.slice(0, 10) }
      });
    } else {
      // Mock activities for development
      const mockActivities = [
        {
          type: 'session',
          message: 'Session with Sarah Johnson completed',
          time: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
          data: { sessionId: '1', title: 'UX Design Review' }
        },
        {
          type: 'review',
          message: 'Received 5-star review from Mike Chen',
          time: new Date(Date.now() - 4 * 60 * 60 * 1000), // 4 hours ago
          data: { rating: 5, reviewer: 'Mike Chen' }
        },
        {
          type: 'booking',
          message: 'New session booking from Emily Rodriguez',
          time: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
          data: { clientName: 'Emily Rodriguez' }
        },
        {
          type: 'connection',
          message: 'Alex Thompson started following you',
          time: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
          data: { userId: '4', name: 'Alex Thompson' }
        }
      ];

      return res.json({
        success: true,
        data: { activities: mockActivities }
      });
    }
  } catch (error) {
    console.error('Dashboard activity error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch recent activity'
    });
  }
});

module.exports = router;