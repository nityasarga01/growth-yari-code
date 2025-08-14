const express = require('express');
const ChatMessage = require('../models/ChatMessage');
const { isConnected, getMockDB } = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Send chat message
router.post('/send', authenticateToken, async (req, res) => {
  try {
    const { recipient_id, message, session_id } = req.body;
    const senderId = req.user._id || req.user.id;

    if (!recipient_id || !message) {
      return res.status(400).json({
        success: false,
        error: 'Recipient ID and message are required'
      });
    }

    if (recipient_id === senderId.toString()) {
      return res.status(400).json({
        success: false,
        error: 'Cannot send message to yourself'
      });
    }

    if (isConnected()) {
      const chatMessage = new ChatMessage({
        senderId,
        recipientId: recipient_id,
        sessionId: session_id,
        message: message.trim()
      });

      await chatMessage.save();
      await chatMessage.populate('senderId', 'name avatar profession');

      const formattedMessage = {
        id: chatMessage._id,
        sender_id: chatMessage.senderId._id,
        recipient_id: chatMessage.recipientId,
        session_id: chatMessage.sessionId,
        message: chatMessage.message,
        is_read: chatMessage.isRead,
        created_at: chatMessage.createdAt,
        sender: {
          id: chatMessage.senderId._id,
          name: chatMessage.senderId.name,
          avatar: chatMessage.senderId.avatar,
          profession: chatMessage.senderId.profession
        }
      };

      return res.status(201).json({
        success: true,
        data: { message: formattedMessage }
      });
    } else {
      // Mock message for development
      const mockMessage = {
        id: 'msg-' + Date.now(),
        sender_id: senderId,
        recipient_id,
        session_id,
        message: message.trim(),
        is_read: false,
        created_at: new Date().toISOString(),
        sender: req.user
      };

      return res.status(201).json({
        success: true,
        data: { message: mockMessage }
      });
    }
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to send message'
    });
  }
});

// Get chat messages between two users
router.get('/messages/:recipientId', authenticateToken, async (req, res) => {
  try {
    const { recipientId } = req.params;
    const { page = 1, limit = 50 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const userId = req.user._id || req.user.id;

    if (isConnected()) {
      const messages = await ChatMessage.find({
        $or: [
          { senderId: userId, recipientId },
          { senderId: recipientId, recipientId: userId }
        ]
      })
      .populate('senderId', 'name avatar profession')
      .sort({ createdAt: 1 })
      .skip(skip)
      .limit(parseInt(limit));

      const formattedMessages = messages.map(msg => ({
        id: msg._id,
        sender_id: msg.senderId._id,
        recipient_id: msg.recipientId,
        session_id: msg.sessionId,
        message: msg.message,
        is_read: msg.isRead,
        created_at: msg.createdAt,
        sender: {
          id: msg.senderId._id,
          name: msg.senderId.name,
          avatar: msg.senderId.avatar,
          profession: msg.senderId.profession
        }
      }));

      return res.json({
        success: true,
        data: { messages: formattedMessages }
      });
    } else {
      // Mock messages for development
      const mockMessages = [
        {
          id: '1',
          sender_id: recipientId,
          recipient_id: userId,
          message: 'Hi! Thanks for connecting. How can I help you today?',
          is_read: true,
          created_at: new Date(Date.now() - 3600000).toISOString(),
          sender: {
            id: recipientId,
            name: 'Professional User',
            avatar: 'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=40&h=40&dpr=1',
            profession: 'Expert'
          }
        }
      ];

      return res.json({
        success: true,
        data: { messages: mockMessages }
      });
    }
  } catch (error) {
    console.error('Messages fetch error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch messages'
    });
  }
});

// Mark messages as read
router.patch('/messages/:senderId/read', authenticateToken, async (req, res) => {
  try {
    const { senderId } = req.params;
    const userId = req.user._id || req.user.id;

    if (isConnected()) {
      await ChatMessage.updateMany(
        {
          senderId,
          recipientId: userId,
          isRead: false
        },
        { isRead: true }
      );

      return res.json({
        success: true,
        message: 'Messages marked as read'
      });
    } else {
      // Mock response for development
      return res.json({
        success: true,
        message: 'Messages marked as read'
      });
    }
  } catch (error) {
    console.error('Mark messages read error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to mark messages as read'
    });
  }
});

// Get chat conversations list
router.get('/conversations', authenticateToken, async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;

    if (isConnected()) {
      // Get latest message for each conversation
      const conversations = await ChatMessage.aggregate([
        {
          $match: {
            $or: [
              { senderId: userId },
              { recipientId: userId }
            ]
          }
        },
        {
          $sort: { createdAt: -1 }
        },
        {
          $group: {
            _id: {
              $cond: [
                { $eq: ['$senderId', userId] },
                '$recipientId',
                '$senderId'
              ]
            },
            lastMessage: { $first: '$$ROOT' },
            unreadCount: {
              $sum: {
                $cond: [
                  {
                    $and: [
                      { $eq: ['$recipientId', userId] },
                      { $eq: ['$isRead', false] }
                    ]
                  },
                  1,
                  0
                ]
              }
            }
          }
        },
        {
          $lookup: {
            from: 'users',
            localField: '_id',
            foreignField: '_id',
            as: 'user'
          }
        },
        {
          $unwind: '$user'
        },
        {
          $sort: { 'lastMessage.createdAt': -1 }
        }
      ]);

      const formattedConversations = conversations.map(conv => ({
        user: {
          id: conv.user._id,
          name: conv.user.name,
          avatar: conv.user.avatar,
          profession: conv.user.profession
        },
        last_message: {
          message: conv.lastMessage.message,
          created_at: conv.lastMessage.createdAt,
          is_from_me: conv.lastMessage.senderId.toString() === userId.toString()
        },
        unread_count: conv.unreadCount
      }));

      return res.json({
        success: true,
        data: { conversations: formattedConversations }
      });
    } else {
      // Mock conversations for development
      const mockConversations = [
        {
          user: {
            id: '1',
            name: 'Sarah Johnson',
            avatar: 'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=40&h=40&dpr=1',
            profession: 'UX Designer'
          },
          last_message: {
            message: 'Thanks for the session!',
            created_at: new Date(Date.now() - 1800000).toISOString(),
            is_from_me: false
          },
          unread_count: 1
        }
      ];

      return res.json({
        success: true,
        data: { conversations: mockConversations }
      });
    }
  } catch (error) {
    console.error('Conversations fetch error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch conversations'
    });
  }
});

module.exports = router;