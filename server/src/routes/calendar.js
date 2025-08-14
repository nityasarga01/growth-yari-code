const express = require('express');
const Session = require('../models/Session');
const { isConnected, getMockDB } = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Get calendar events (sessions) for a date range
router.get('/events', authenticateToken, async (req, res) => {
  try {
    const { start_date, end_date, view = 'month' } = req.query;
    const userId = req.user._id || req.user.id;

    // Default date range if not provided
    const startDate = start_date ? new Date(start_date) : new Date();
    const endDate = end_date ? new Date(end_date) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days from now

    if (isConnected()) {
      const sessions = await Session.find({
        $or: [{ expertId: userId }, { clientId: userId }],
        scheduledAt: {
          $gte: startDate,
          $lte: endDate
        }
      })
      .populate('expertId', 'name avatar profession')
      .populate('clientId', 'name avatar profession')
      .sort({ scheduledAt: 1 });

      const events = sessions.map(session => ({
        id: session._id,
        title: session.title,
        description: session.description,
        start: session.scheduledAt,
        end: new Date(session.scheduledAt.getTime() + session.duration * 60000),
        duration: session.duration,
        price: session.price,
        status: session.status,
        meeting_link: session.meetingLink,
        type: 'session',
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
        },
        is_expert: session.expertId._id.toString() === userId.toString()
      }));

      return res.json({
        success: true,
        data: { events }
      });
    } else {
      // Mock calendar events for development
      const mockEvents = [
        {
          id: '1',
          title: 'UX Design Review',
          description: 'Review of current design system',
          start: new Date(Date.now() + 86400000).toISOString(), // Tomorrow
          end: new Date(Date.now() + 86400000 + 3600000).toISOString(), // Tomorrow + 1 hour
          duration: 60,
          price: 75,
          status: 'confirmed',
          meeting_link: 'https://meet.google.com/abc-defg-hij',
          type: 'session',
          expert: {
            id: '1',
            name: 'Sarah Johnson',
            avatar: 'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=40&h=40&dpr=1',
            profession: 'UX Designer'
          },
          client: req.user,
          is_expert: false
        },
        {
          id: '2',
          title: 'Product Strategy Session',
          description: 'Discuss product roadmap and strategy',
          start: new Date(Date.now() + 2 * 86400000).toISOString(), // Day after tomorrow
          end: new Date(Date.now() + 2 * 86400000 + 1800000).toISOString(), // + 30 minutes
          duration: 30,
          price: 0,
          status: 'pending',
          meeting_link: null,
          type: 'session',
          expert: {
            id: '2',
            name: 'Mike Chen',
            avatar: 'https://images.pexels.com/photos/2379004/pexels-photo-2379004.jpeg?auto=compress&cs=tinysrgb&w=40&h=40&dpr=1',
            profession: 'Product Manager'
          },
          client: req.user,
          is_expert: false
        }
      ];

      return res.json({
        success: true,
        data: { events: mockEvents }
      });
    }
  } catch (error) {
    console.error('Calendar events fetch error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch calendar events'
    });
  }
});

// Get available time slots for an expert
router.get('/availability/:expertId', async (req, res) => {
  try {
    const { expertId } = req.params;
    const { date } = req.query;

    // This would typically come from an availability table
    // For now, we'll generate mock available slots
    const selectedDate = date ? new Date(date) : new Date();
    const dayOfWeek = selectedDate.getDay();

    // Skip weekends for this example
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      return res.json({
        success: true,
        data: { slots: [] }
      });
    }

    if (isConnected()) {
      // Get existing bookings for the date
      const existingBookings = await Session.find({
        expertId,
        scheduledAt: {
          $gte: new Date(selectedDate.setHours(0, 0, 0, 0)),
          $lt: new Date(selectedDate.setHours(23, 59, 59, 999))
        }
      }).select('scheduledAt duration');

      // Generate time slots (9 AM to 5 PM, 1-hour intervals)
      const slots = [];
      for (let hour = 9; hour < 17; hour++) {
        const slotTime = new Date(selectedDate);
        slotTime.setHours(hour, 0, 0, 0);

        // Check if slot is already booked
        const isBooked = existingBookings.some(booking => {
          const bookingStart = new Date(booking.scheduledAt);
          const bookingEnd = new Date(bookingStart.getTime() + booking.duration * 60000);
          return slotTime >= bookingStart && slotTime < bookingEnd;
        });

        slots.push({
          id: `${expertId}-${slotTime.getTime()}`,
          time: slotTime.toTimeString().slice(0, 5),
          datetime: slotTime.toISOString(),
          available: !isBooked,
          price: hour < 12 ? 0 : 75 // Free morning slots, paid afternoon
        });
      }

      return res.json({
        success: true,
        data: { slots }
      });
    } else {
      // Mock availability slots
      const mockSlots = [
        { id: '1', time: '09:00', datetime: new Date().toISOString(), available: true, price: 0 },
        { id: '2', time: '10:00', datetime: new Date().toISOString(), available: true, price: 75 },
        { id: '3', time: '11:00', datetime: new Date().toISOString(), available: false, price: 75 },
        { id: '4', time: '14:00', datetime: new Date().toISOString(), available: true, price: 50 },
        { id: '5', time: '15:00', datetime: new Date().toISOString(), available: true, price: 50 },
        { id: '6', time: '16:00', datetime: new Date().toISOString(), available: true, price: 0 }
      ];

      return res.json({
        success: true,
        data: { slots: mockSlots }
      });
    }
  } catch (error) {
    console.error('Availability fetch error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch availability'
    });
  }
});

// Create calendar event (for experts to set availability)
router.post('/availability', authenticateToken, async (req, res) => {
  try {
    const { date, start_time, end_time, price = 0, recurring = false } = req.body;
    const expertId = req.user._id || req.user.id;

    if (!date || !start_time || !end_time) {
      return res.status(400).json({
        success: false,
        error: 'Date, start time, and end time are required'
      });
    }

    // This would typically create availability slots in an availability table
    // For now, we'll just return success
    return res.status(201).json({
      success: true,
      message: 'Availability created successfully',
      data: {
        expert_id: expertId,
        date,
        start_time,
        end_time,
        price,
        recurring
      }
    });
  } catch (error) {
    console.error('Create availability error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create availability'
    });
  }
});

module.exports = router;