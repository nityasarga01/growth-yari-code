const express = require('express');
const User = require('../models/User');
const YariConnectSession = require('../models/YariConnectSession');
const { isConnected, getMockDB } = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Get available professionals for YariConnect
router.get('/professionals', authenticateToken, async (req, res) => {
  try {
    const { 
      job_profile, 
      field, 
      location, 
      experience, 
      availability,
      limit = 20 
    } = req.query;

    const userId = req.user._id || req.user.id;

    if (isConnected()) {
      let query = { _id: { $ne: userId } }; // Exclude current user

      // Apply filters
      if (job_profile && job_profile !== 'all') {
        query.profession = { $regex: job_profile, $options: 'i' };
      }

      if (field && field !== 'all') {
        query.field = field;
      }

      if (location && location !== 'all') {
        query.location = { $regex: location, $options: 'i' };
      }

      if (experience && experience !== 'all') {
        query.experience = experience;
      }

      const professionals = await User.find(query)
        .select('name avatar profession bio expertise rating reviewCount isVerified location experience field')
        .limit(parseInt(limit));

      // Shuffle the results for YariConnect
      const shuffled = professionals.sort(() => 0.5 - Math.random());

      const formattedProfessionals = shuffled.map(prof => ({
        id: prof._id,
        name: prof.name,
        avatar: prof.avatar,
        profession: prof.profession,
        bio: prof.bio,
        expertise: prof.expertise,
        rating: prof.rating,
        reviewCount: prof.reviewCount,
        isVerified: prof.isVerified,
        location: prof.location,
        experience: prof.experience,
        field: prof.field
      }));

      return res.json({
        success: true,
        data: { professionals: formattedProfessionals }
      });
    } else {
      // Mock professionals for development
      const mockProfessionals = [
        {
          id: '1',
          name: 'Sarah Johnson',
          avatar: 'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&dpr=1',
          profession: 'UX Designer',
          bio: 'Senior UX Designer with 8+ years experience',
          expertise: ['User Experience', 'Design Systems', 'Prototyping'],
          rating: 4.9,
          reviewCount: 42,
          isVerified: true,
          location: 'San Francisco, CA',
          experience: '8+ years',
          field: 'Design & Creative'
        },
        {
          id: '2',
          name: 'Mike Chen',
          avatar: 'https://images.pexels.com/photos/2379004/pexels-photo-2379004.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&dpr=1',
          profession: 'Product Manager',
          bio: 'Product Manager at tech startup',
          expertise: ['Product Strategy', 'Agile', 'Data Analysis'],
          rating: 4.7,
          reviewCount: 28,
          isVerified: true,
          location: 'New York, NY',
          experience: '6-8 years',
          field: 'Product & Strategy'
        }
      ];

      return res.json({
        success: true,
        data: { professionals: mockProfessionals }
      });
    }
  } catch (error) {
    console.error('YariConnect professionals fetch error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch professionals'
    });
  }
});

// Start YariConnect session
router.post('/sessions/start', authenticateToken, async (req, res) => {
  try {
    const { participant_id } = req.body;
    const userId = req.user._id || req.user.id;

    if (!participant_id) {
      return res.status(400).json({
        success: false,
        error: 'Participant ID is required'
      });
    }

    if (participant_id === userId.toString()) {
      return res.status(400).json({
        success: false,
        error: 'Cannot start session with yourself'
      });
    }

    if (isConnected()) {
      // Check if participant exists
      const participant = await User.findById(participant_id).select('name avatar profession');
      if (!participant) {
        return res.status(404).json({
          success: false,
          error: 'Participant not found'
        });
      }

      const session = new YariConnectSession({
        user1Id: userId,
        user2Id: participant_id,
        status: 'active'
      });

      await session.save();
      await session.populate('user1Id', 'name avatar profession');
      await session.populate('user2Id', 'name avatar profession');

      const formattedSession = {
        id: session._id,
        startedAt: session.startedAt,
        status: session.status,
        user1: {
          id: session.user1Id._id,
          name: session.user1Id.name,
          avatar: session.user1Id.avatar,
          profession: session.user1Id.profession
        },
        user2: {
          id: session.user2Id._id,
          name: session.user2Id.name,
          avatar: session.user2Id.avatar,
          profession: session.user2Id.profession
        }
      };

      return res.status(201).json({
        success: true,
        data: { session: formattedSession }
      });
    } else {
      // Mock session creation for development
      const mockSession = {
        id: 'yari-session-' + Date.now(),
        startedAt: new Date().toISOString(),
        status: 'active',
        user1: req.user,
        user2: {
          id: participant_id,
          name: 'Mock Participant',
          avatar: 'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&dpr=1',
          profession: 'Professional'
        }
      };

      return res.status(201).json({
        success: true,
        data: { session: mockSession }
      });
    }
  } catch (error) {
    console.error('YariConnect session creation error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to start session'
    });
  }
});

// End YariConnect session
router.patch('/sessions/:id/end', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id || req.user.id;

    if (isConnected()) {
      // Get session to verify user is part of it
      const session = await YariConnectSession.findById(id);
      if (!session) {
        return res.status(404).json({
          success: false,
          error: 'Session not found'
        });
      }

      // Check if user is part of this session
      if (session.user1Id.toString() !== userId.toString() && session.user2Id.toString() !== userId.toString()) {
        return res.status(403).json({
          success: false,
          error: 'Not authorized to end this session'
        });
      }

      if (session.status !== 'active') {
        return res.status(400).json({
          success: false,
          error: 'Session is not active'
        });
      }

      // Calculate duration
      const startTime = new Date(session.startedAt);
      const endTime = new Date();
      const duration = Math.floor((endTime.getTime() - startTime.getTime()) / 1000);

      session.endedAt = endTime;
      session.duration = duration;
      session.status = 'ended';
      await session.save();

      return res.json({
        success: true,
        data: { 
          duration,
          message: 'Session ended successfully'
        }
      });
    } else {
      // Mock session end for development
      return res.json({
        success: true,
        data: { 
          duration: 300, // 5 minutes
          message: 'Session ended successfully'
        }
      });
    }
  } catch (error) {
    console.error('YariConnect session end error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to end session'
    });
  }
});

// Get YariConnect session history
router.get('/sessions', authenticateToken, async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const userId = req.user._id || req.user.id;

    if (isConnected()) {
      const sessions = await YariConnectSession.find({
        $or: [{ user1Id: userId }, { user2Id: userId }]
      })
      .populate('user1Id', 'name avatar profession')
      .populate('user2Id', 'name avatar profession')
      .sort({ startedAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

      const formattedSessions = sessions.map(session => ({
        id: session._id,
        startedAt: session.startedAt,
        endedAt: session.endedAt,
        duration: session.duration,
        status: session.status,
        participant: session.user1Id._id.toString() === userId.toString() 
          ? {
              id: session.user2Id._id,
              name: session.user2Id.name,
              avatar: session.user2Id.avatar,
              profession: session.user2Id.profession
            }
          : {
              id: session.user1Id._id,
              name: session.user1Id.name,
              avatar: session.user1Id.avatar,
              profession: session.user1Id.profession
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
          startedAt: new Date(Date.now() - 86400000).toISOString(),
          endedAt: new Date(Date.now() - 86400000 + 1800000).toISOString(),
          duration: 1800,
          status: 'ended',
          participant: {
            id: '1',
            name: 'Sarah Johnson',
            avatar: 'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&dpr=1',
            profession: 'UX Designer'
          }
        }
      ];

      return res.json({
        success: true,
        data: { sessions: mockSessions }
      });
    }
  } catch (error) {
    console.error('YariConnect sessions fetch error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch sessions'
    });
  }
});

// Get YariConnect statistics
router.get('/stats', authenticateToken, async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;

    if (isConnected()) {
      const totalSessions = await YariConnectSession.countDocuments({
        $or: [{ user1Id: userId }, { user2Id: userId }]
      });

      const completedSessions = await YariConnectSession.find({
        $or: [{ user1Id: userId }, { user2Id: userId }],
        status: 'ended'
      }).select('duration');

      const totalMinutes = completedSessions.reduce((sum, session) => sum + (session.duration || 0), 0) / 60;

      const activeSessions = await YariConnectSession.countDocuments({
        $or: [{ user1Id: userId }, { user2Id: userId }],
        status: 'active'
      });

      const stats = {
        total_sessions: totalSessions,
        total_minutes: Math.floor(totalMinutes),
        active_sessions: activeSessions,
        average_session_duration: totalSessions ? Math.floor(totalMinutes / totalSessions) : 0
      };

      return res.json({
        success: true,
        data: stats
      });
    } else {
      // Mock stats for development
      const mockStats = {
        total_sessions: 15,
        total_minutes: 450,
        active_sessions: 0,
        average_session_duration: 30
      };

      return res.json({
        success: true,
        data: mockStats
      });
    }
  } catch (error) {
    console.error('YariConnect stats error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch YariConnect statistics'
    });
  }
});

module.exports = router;