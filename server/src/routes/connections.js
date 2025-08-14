const express = require('express');
const Connection = require('../models/Connection');
const ConnectionRequest = require('../models/ConnectionRequest');
const { isConnected, getMockDB } = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Get user's connections
router.get('/', authenticateToken, async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;

    if (isConnected()) {
      const connections = await Connection.find({
        $or: [{ user1Id: userId }, { user2Id: userId }]
      })
      .populate('user1Id', 'name avatar profession expertise rating reviewCount isVerified')
      .populate('user2Id', 'name avatar profession expertise rating reviewCount isVerified')
      .sort({ connectedAt: -1 });

      const formattedConnections = connections.map(conn => ({
        id: conn._id,
        connectedAt: conn.connectedAt,
        user: conn.user1Id._id.toString() === userId.toString() ? {
          id: conn.user2Id._id,
          name: conn.user2Id.name,
          avatar: conn.user2Id.avatar,
          profession: conn.user2Id.profession,
          expertise: conn.user2Id.expertise,
          rating: conn.user2Id.rating,
          reviewCount: conn.user2Id.reviewCount,
          isVerified: conn.user2Id.isVerified
        } : {
          id: conn.user1Id._id,
          name: conn.user1Id.name,
          avatar: conn.user1Id.avatar,
          profession: conn.user1Id.profession,
          expertise: conn.user1Id.expertise,
          rating: conn.user1Id.rating,
          reviewCount: conn.user1Id.reviewCount,
          isVerified: conn.user1Id.isVerified
        }
      }));

      return res.json({
        success: true,
        data: { connections: formattedConnections }
      });
    } else {
      // Mock connections for development
      const mockConnections = [
        {
          id: '1',
          connectedAt: new Date(Date.now() - 86400000 * 7).toISOString(),
          user: {
            id: '1',
            name: 'Sarah Johnson',
            avatar: 'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&dpr=1',
            profession: 'UX Designer',
            expertise: ['User Experience', 'Design Systems', 'Prototyping'],
            rating: 4.9,
            reviewCount: 42,
            isVerified: true
          }
        }
      ];

      return res.json({
        success: true,
        data: { connections: mockConnections }
      });
    }
  } catch (error) {
    console.error('Connections fetch error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch connections'
    });
  }
});

// Send connection request
router.post('/request', authenticateToken, async (req, res) => {
  try {
    const { user_id, message } = req.body;
    const senderId = req.user._id || req.user.id;

    if (!user_id) {
      return res.status(400).json({
        success: false,
        error: 'User ID is required'
      });
    }

    if (user_id === senderId.toString()) {
      return res.status(400).json({
        success: false,
        error: 'Cannot send connection request to yourself'
      });
    }

    if (isConnected()) {
      // Check if connection already exists
      const existingConnection = await Connection.findOne({
        $or: [
          { user1Id: senderId, user2Id: user_id },
          { user1Id: user_id, user2Id: senderId }
        ]
      });

      if (existingConnection) {
        return res.status(400).json({
          success: false,
          error: 'Connection already exists'
        });
      }

      // Check if request already exists
      const existingRequest = await ConnectionRequest.findOne({
        senderId,
        receiverId: user_id,
        status: 'pending'
      });

      if (existingRequest) {
        return res.status(400).json({
          success: false,
          error: 'Connection request already sent'
        });
      }

      // Create connection request
      const request = new ConnectionRequest({
        senderId,
        receiverId: user_id,
        message: message || ''
      });

      await request.save();
      await request.populate('senderId', 'name avatar profession');
      await request.populate('receiverId', 'name avatar profession');

      // Create notification for the receiver
      const { createNotification } = require('./notifications');
      await createNotification(
        user_id,
        'connection_request',
        'New Connection Request',
        `${req.user.name} wants to connect with you`,
        senderId,
        { requestId: request._id }
      );

      const formattedRequest = {
        id: request._id,
        message: request.message,
        status: request.status,
        createdAt: request.createdAt,
        sender: {
          id: request.senderId._id,
          name: request.senderId.name,
          avatar: request.senderId.avatar,
          profession: request.senderId.profession
        },
        receiver: {
          id: request.receiverId._id,
          name: request.receiverId.name,
          avatar: request.receiverId.avatar,
          profession: request.receiverId.profession
        }
      };

      return res.status(201).json({
        success: true,
        data: { request: formattedRequest }
      });
    } else {
      // Mock connection request for development
      const mockRequest = {
        id: 'request-' + Date.now(),
        message: message || '',
        status: 'pending',
        createdAt: new Date().toISOString(),
        sender: req.user,
        receiver: {
          id: user_id,
          name: 'Target User',
          avatar: 'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&dpr=1',
          profession: 'Professional'
        }
      };

      return res.status(201).json({
        success: true,
        data: { request: mockRequest }
      });
    }
  } catch (error) {
    console.error('Connection request error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to send connection request'
    });
  }
});

// Get connection requests
router.get('/requests', authenticateToken, async (req, res) => {
  try {
    const { type = 'received' } = req.query;
    const userId = req.user._id || req.user.id;

    if (isConnected()) {
      let query = {};
      if (type === 'received') {
        query.receiverId = userId;
      } else if (type === 'sent') {
        query.senderId = userId;
      }

      const requests = await ConnectionRequest.find(query)
        .populate('senderId', 'name avatar profession expertise rating reviewCount isVerified')
        .populate('receiverId', 'name avatar profession')
        .sort({ createdAt: -1 });

      const formattedRequests = requests.map(request => ({
        id: request._id,
        message: request.message,
        status: request.status,
        createdAt: request.createdAt,
        sender: {
          id: request.senderId._id,
          name: request.senderId.name,
          avatar: request.senderId.avatar,
          profession: request.senderId.profession,
          expertise: request.senderId.expertise,
          rating: request.senderId.rating,
          reviewCount: request.senderId.reviewCount,
          isVerified: request.senderId.isVerified
        },
        receiver: {
          id: request.receiverId._id,
          name: request.receiverId.name,
          avatar: request.receiverId.avatar,
          profession: request.receiverId.profession
        }
      }));

      return res.json({
        success: true,
        data: { requests: formattedRequests }
      });
    } else {
      // Mock connection requests for development
      const mockRequests = type === 'received' ? [
        {
          id: '1',
          message: 'Hi! I\'d love to connect and learn from your expertise in UX design.',
          status: 'pending',
          createdAt: new Date(Date.now() - 86400000).toISOString(),
          sender: {
            id: '2',
            name: 'Mike Chen',
            avatar: 'https://images.pexels.com/photos/2379004/pexels-photo-2379004.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&dpr=1',
            profession: 'Product Manager',
            expertise: ['Product Strategy', 'Agile', 'Data Analysis'],
            rating: 4.7,
            reviewCount: 28,
            isVerified: true
          }
        }
      ] : [];

      return res.json({
        success: true,
        data: { requests: mockRequests }
      });
    }
  } catch (error) {
    console.error('Connection requests fetch error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch connection requests'
    });
  }
});

// Respond to connection request
router.patch('/requests/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { action } = req.body;
    const userId = req.user._id || req.user.id;

    if (!['accept', 'decline'].includes(action)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid action. Must be "accept" or "decline"'
      });
    }

    if (isConnected()) {
      // Get the request
      const request = await ConnectionRequest.findById(id);
      if (!request) {
        return res.status(404).json({
          success: false,
          error: 'Connection request not found'
        });
      }

      // Check if user is the receiver
      if (request.receiverId.toString() !== userId.toString()) {
        return res.status(403).json({
          success: false,
          error: 'Not authorized to respond to this request'
        });
      }

      // Check if request is still pending
      if (request.status !== 'pending') {
        return res.status(400).json({
          success: false,
          error: 'Request has already been responded to'
        });
      }

      const newStatus = action === 'accept' ? 'accepted' : 'declined';

      // Update request status
      request.status = newStatus;
      await request.save();

      // If accepted, create connection
      if (action === 'accept') {
        const connection = new Connection({
          user1Id: request.senderId,
          user2Id: request.receiverId
        });
        await connection.save();
      }

      return res.json({
        success: true,
        data: { 
          status: newStatus,
          message: `Connection request ${action}ed successfully`
        }
      });
    } else {
      // Mock response for development
      return res.json({
        success: true,
        data: { 
          status: action === 'accept' ? 'accepted' : 'declined',
          message: `Connection request ${action}ed successfully`
        }
      });
    }
  } catch (error) {
    console.error('Connection request response error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to respond to connection request'
    });
  }
});

module.exports = router;