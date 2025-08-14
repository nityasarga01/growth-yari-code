const express = require('express');
const Session = require('../models/Session');
const { isConnected, getMockDB } = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Get user's sessions
router.get('/', authenticateToken, async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;

    if (isConnected()) {
      const sessions = await Session.find({
        $or: [{ expertId: userId }, { clientId: userId }]
      })
      .populate('expertId', 'name avatar profession')
      .populate('clientId', 'name avatar profession')
      .sort({ scheduledAt: -1 });

      const formattedSessions = sessions.map(session => ({
        id: session._id,
        title: session.title,
        description: session.description,
        duration: session.duration,
        price: session.price,
        scheduledAt: session.scheduledAt,
        status: session.status,
        meetingLink: session.meetingLink,
        notes: session.notes,
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
          scheduledAt: new Date(Date.now() + 86400000).toISOString(),
          status: 'confirmed',
          meetingLink: 'https://meet.google.com/abc-defg-hij',
          expert: {
            id: '1',
            name: 'Sarah Johnson',
            avatar: 'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&dpr=1',
            profession: 'UX Designer'
          },
          client: req.user
        }
      ];

      return res.json({
        success: true,
        data: { sessions: mockSessions }
      });
    }
  } catch (error) {
    console.error('Sessions fetch error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch sessions'
    });
  }
});

// Book a session
router.post('/book', authenticateToken, async (req, res) => {
  try {
    const { expert_id, title, description, duration, price, scheduled_at } = req.body;
    const clientId = req.user._id || req.user.id;

    if (!expert_id || !title || !scheduled_at) {
      return res.status(400).json({
        success: false,
        error: 'Expert ID, title, and scheduled time are required'
      });
    }

    if (isConnected()) {
      const session = new Session({
        expertId: expert_id,
        clientId,
        title,
        description,
        duration: duration || 60,
        price: price || 0,
        scheduledAt: new Date(scheduled_at),
        meetingLink: `https://meet.google.com/${Math.random().toString(36).substring(7)}`
      });

      await session.save();
      await session.populate('expertId', 'name avatar profession');
      await session.populate('clientId', 'name avatar profession');

      // Create notification for the expert
      const { createNotification } = require('./notifications');
      await createNotification(
        expert_id,
        'session_booked',
        'New Session Booking',
        `${req.user.name} booked a session with you: ${title}`,
        clientId,
        { sessionId: session._id }
      );

      const formattedSession = {
        id: session._id,
        title: session.title,
        description: session.description,
        duration: session.duration,
        price: session.price,
        scheduledAt: session.scheduledAt,
        status: session.status,
        meetingLink: session.meetingLink || `https://meet.google.com/${session._id.toString().substring(0, 3)}-${session._id.toString().substring(3, 7)}-${session._id.toString().substring(7, 10)}`,
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
      };

      return res.status(201).json({
        success: true,
        data: { session: formattedSession }
      });
    } else {
      // Mock session booking for development
      const mockSession = {
        id: 'session-' + Date.now(),
        title,
        description,
        duration: duration || 60,
        price: price || 0,
        scheduledAt: scheduled_at,
        status: 'pending',
        meetingLink: `https://meet.google.com/${Math.random().toString(36).substring(7)}`,
        expert: {
          id: expert_id,
          name: 'Expert User',
          avatar: 'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&dpr=1',
          profession: 'Professional Expert'
        },
        client: req.user
      };

      return res.status(201).json({
        success: true,
        data: { session: mockSession }
      });
    }
  } catch (error) {
    console.error('Session booking error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to book session'
    });
  }
});

// Update session status
router.patch('/:id/status', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const userId = req.user._id || req.user.id;

    if (!['pending', 'confirmed', 'completed', 'cancelled'].includes(status)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid status'
      });
    }

    if (isConnected()) {
      // Get session to check permissions
      const session = await Session.findById(id)
        .populate('expertId', 'name email')
        .populate('clientId', 'name email');

      if (!session) {
        return res.status(404).json({
          success: false,
          error: 'Session not found'
        });
      }

      // Check permissions
      const isExpert = session.expertId._id.toString() === userId.toString();
      const isClient = session.clientId._id.toString() === userId.toString();

      if (!isExpert && !isClient) {
        return res.status(403).json({
          success: false,
          error: 'Not authorized to update this session'
        });
      }

      // Business logic for status changes
      if (status === 'confirmed' && !isExpert) {
        return res.status(403).json({
          success: false,
          error: 'Only expert can confirm sessions'
        });
      }

      // Generate Google Meet link when session is confirmed
      if (status === 'confirmed') {
        // Generate a proper meeting room ID using timestamp and random string
        const timestamp = Date.now().toString(36);
        const randomStr = Math.random().toString(36).substring(2, 8);
        const meetingId = `${timestamp}-${randomStr}-${session._id.toString().substring(0, 6)}`;
        session.meetingLink = `https://meet.google.com/${meetingId}`;
        console.log('Generated meeting link for confirmed session:', session.meetingLink);
      }

      session.status = status;
      await session.save();

      // Send notification to the other participant
      const otherUserId = isExpert ? session.clientId._id : session.expertId._id;
      const { createNotification } = require('./notifications');
      
      if (status === 'confirmed') {
        console.log('Sending confirmation notification to:', otherUserId);
        await createNotification(
          otherUserId,
          'session_confirmed',
          'Session Confirmed',
          `Your session "${session.title}" has been confirmed and is ready to join.`,
          userId,
          { sessionId: id, meetingLink: session.meetingLink }
        );
      } else if (status === 'cancelled') {
        console.log('Sending cancellation notification to:', otherUserId);
        await createNotification(
          otherUserId,
          'session_cancelled',
          'Session Cancelled',
          `Your session "${session.title}" has been cancelled.`,
          userId,
          { sessionId: id }
        );
      }

      const formattedSession = {
        id: session._id,
        title: session.title,
        status: session.status,
        meeting_link: session.meetingLink,
        expert: {
          id: session.expertId._id,
          name: session.expertId.name
        },
        client: {
          id: session.clientId._id,
          name: session.clientId.name
        }
      };

      return res.json({
        success: true,
        data: { session: formattedSession }
      });
    } else {
      // Mock response for development
      const mockSession = {
        id: id,
        title: 'Mock Session',
        status: status,
        meeting_link: status === 'confirmed' ? `https://meet.google.com/${id.substring(0, 3)}-${id.substring(3, 7)}-${id.substring(7, 10)}` : null
      };

      return res.json({
        success: true,
        data: { session: mockSession }
      });
    }
  } catch (error) {
    console.error('Session status update error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update session status'
    });
  }
});

// Get session details
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id || req.user.id;

    if (isConnected()) {
      const session = await Session.findById(id)
        .populate('expertId', 'name avatar profession bio expertise rating reviewCount')
        .populate('clientId', 'name avatar profession bio');

      if (!session) {
        return res.status(404).json({
          success: false,
          error: 'Session not found'
        });
      }

      // Check if user is part of this session
      const isExpert = session.expertId._id.toString() === userId.toString();
      const isClient = session.clientId._id.toString() === userId.toString();

      if (!isExpert && !isClient) {
        return res.status(403).json({
          success: false,
          error: 'Not authorized to view this session'
        });
      }

      const formattedSession = {
        id: session._id,
        title: session.title,
        description: session.description,
        duration: session.duration,
        price: session.price,
        scheduledAt: session.scheduledAt,
        status: session.status,
        meetingLink: session.meetingLink,
        notes: session.notes,
        expert: {
          id: session.expertId._id,
          name: session.expertId.name,
          avatar: session.expertId.avatar,
          profession: session.expertId.profession,
          bio: session.expertId.bio,
          expertise: session.expertId.expertise,
          rating: session.expertId.rating,
          reviewCount: session.expertId.reviewCount
        },
        client: {
          id: session.clientId._id,
          name: session.clientId.name,
          avatar: session.clientId.avatar,
          profession: session.clientId.profession,
          bio: session.clientId.bio
        }
      };

      return res.json({
        success: true,
        data: { session: formattedSession }
      });
    } else {
      // Mock session for development
      const mockSession = {
        id: id,
        title: 'Mock Session',
        description: 'Mock session description',
        duration: 60,
        price: 75,
        scheduledAt: new Date(),
        status: 'pending',
        meetingLink: null,
        expert: {
          id: 'expert1',
          name: 'Expert User',
          avatar: 'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&dpr=1',
          profession: 'Professional'
        },
        client: req.user
      };

      return res.json({
        success: true,
        data: { session: mockSession }
      });
    }
  } catch (error) {
    console.error('Session fetch error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch session'
    });
  }
});
module.exports = router;