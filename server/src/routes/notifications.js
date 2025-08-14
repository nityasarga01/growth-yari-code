const express = require('express');
const Notification = require('../models/Notification');
const { isConnected, getMockDB } = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Get user notifications
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { page = 1, limit = 20, unread_only = false } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const userId = req.user._id || req.user.id;

    if (isConnected()) {
      let query = { userId };
      if (unread_only === 'true') {
        query.isRead = false;
      }

      const notifications = await Notification.find(query)
        .populate('senderId', 'name avatar profession')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit));

      const formattedNotifications = notifications.map(notification => ({
        id: notification._id,
        type: notification.type,
        title: notification.title,
        message: notification.message,
        data: notification.data,
        is_read: notification.isRead,
        created_at: notification.createdAt,
        sender: notification.senderId ? {
          id: notification.senderId._id,
          name: notification.senderId.name,
          avatar: notification.senderId.avatar
        } : null
      }));

      return res.json({
        success: true,
        data: { notifications: formattedNotifications }
      });
    } else {
      // Mock notifications for development
      const mockNotifications = [
        {
          id: '1',
          type: 'connection_request',
          title: 'New Connection Request',
          message: 'Mike Chen wants to connect with you',
          data: { userId: '2' },
          is_read: false,
          created_at: new Date(Date.now() - 3600000).toISOString(),
          sender: {
            id: '2',
            name: 'Mike Chen',
            avatar: 'https://images.pexels.com/photos/2379004/pexels-photo-2379004.jpeg?auto=compress&cs=tinysrgb&w=40&h=40&dpr=1'
          }
        },
        {
          id: '2',
          type: 'session_booked',
          title: 'Session Booked',
          message: 'Sarah Johnson booked a session with you',
          data: { sessionId: '1' },
          is_read: false,
          created_at: new Date(Date.now() - 7200000).toISOString(),
          sender: {
            id: '1',
            name: 'Sarah Johnson',
            avatar: 'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=40&h=40&dpr=1'
          }
        }
      ];

      return res.json({
        success: true,
        data: { notifications: mockNotifications }
      });
    }
  } catch (error) {
    console.error('Notifications fetch error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch notifications'
    });
  }
});

// Mark notification as read
router.patch('/:id/read', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id || req.user.id;

    if (isConnected()) {
      const notification = await Notification.findOneAndUpdate(
        { _id: id, userId },
        { isRead: true },
        { new: true }
      );

      if (!notification) {
        return res.status(404).json({
          success: false,
          error: 'Notification not found'
        });
      }

      return res.json({
        success: true,
        message: 'Notification marked as read'
      });
    } else {
      // Mock response for development
      return res.json({
        success: true,
        message: 'Notification marked as read'
      });
    }
  } catch (error) {
    console.error('Notification update error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to mark notification as read'
    });
  }
});

// Mark all notifications as read
router.patch('/read-all', authenticateToken, async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;

    if (isConnected()) {
      await Notification.updateMany(
        { userId, isRead: false },
        { isRead: true }
      );

      return res.json({
        success: true,
        message: 'All notifications marked as read'
      });
    } else {
      // Mock response for development
      return res.json({
        success: true,
        message: 'All notifications marked as read'
      });
    }
  } catch (error) {
    console.error('Notifications update error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to mark notifications as read'
    });
  }
});

// Get unread count
router.get('/unread-count', authenticateToken, async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;

    if (isConnected()) {
      const count = await Notification.countDocuments({
        userId,
        isRead: false
      });

      return res.json({
        success: true,
        data: { unread_count: count }
      });
    } else {
      // Mock unread count for development
      return res.json({
        success: true,
        data: { unread_count: 2 }
      });
    }
  } catch (error) {
    console.error('Unread count error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get unread count'
    });
  }
});

// Delete notification
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id || req.user.id;

    if (isConnected()) {
      const notification = await Notification.findOneAndDelete({
        _id: id,
        userId
      });

      if (!notification) {
        return res.status(404).json({
          success: false,
          error: 'Notification not found'
        });
      }

      return res.json({
        success: true,
        message: 'Notification deleted successfully'
      });
    } else {
      // Mock response for development
      return res.json({
        success: true,
        message: 'Notification deleted successfully'
      });
    }
  } catch (error) {
    console.error('Notification deletion error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete notification'
    });
  }
});

// Helper function to create notification
const createNotification = async (userId, type, title, message, senderId = null, data = {}) => {
  try {
    if (isConnected()) {
      const notification = new Notification({
        userId,
        senderId,
        type,
        title,
        message,
        data
      });
      await notification.save();
      console.log('Notification created:', notification._id);
    } else {
      console.log('Mock notification created:', { userId, type, title, message });
    }
  } catch (error) {
    console.error('Notification creation error:', error);
  }
};

module.exports = { router, createNotification };