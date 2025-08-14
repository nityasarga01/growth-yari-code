const express = require('express');
const AvailabilitySettings = require('../models/AvailabilitySettings');
const AvailabilitySlot = require('../models/AvailabilitySlot');
const { isConnected, getMockDB } = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Get availability settings for a user
router.get('/settings/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    console.log('Getting availability settings for user:', userId);

    if (isConnected()) {
      let settings = await AvailabilitySettings.findOne({ userId });
      
      console.log('Settings from DB:', settings);
      
      // Return default settings if none exist
      if (!settings) {
        console.log('No settings found, using defaults');
        settings = {
          offersFreeSessions: true, // Default to true for testing
          freeSessionDuration: 30,
          defaultPaidDuration: 60,
          defaultPaidPrice: 75,
          timezone: 'UTC',
          bufferTime: 15,
          advanceBookingDays: 30
        };
      }

      return res.json({
        success: true,
        data: { settings }
      });
    } else {
      // Mock settings for development
      console.log('Using mock settings for development');
      const mockSettings = {
        offersFreeSessions: true, // Enable free sessions for testing
        freeSessionDuration: 30,
        defaultPaidDuration: 60,
        defaultPaidPrice: 75,
        timezone: 'UTC',
        bufferTime: 15,
        advanceBookingDays: 30
      };

      return res.json({
        success: true,
        data: { settings: mockSettings }
      });
    }
  } catch (error) {
    console.error('Availability settings fetch error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch availability settings'
    });
  }
});

// Update availability settings
router.put('/settings', authenticateToken, async (req, res) => {
  try {
    const {
      offersFreeSessions,
      freeSessionDuration,
      defaultPaidDuration,
      defaultPaidPrice,
      timezone,
      bufferTime,
      advanceBookingDays
    } = req.body;

    const userId = req.user._id || req.user.id;

    if (isConnected()) {
      const settingsData = {
        userId,
        offersFreeSessions,
        freeSessionDuration,
        defaultPaidDuration,
        defaultPaidPrice,
        timezone: timezone || 'UTC',
        bufferTime,
        advanceBookingDays
      };

      // Try to update existing settings or create new ones
      const settings = await AvailabilitySettings.findOneAndUpdate(
        { userId },
        settingsData,
        { new: true, upsert: true }
      );

      return res.json({
        success: true,
        data: { settings }
      });
    } else {
      // Mock response for development
      return res.json({
        success: true,
        data: { 
          settings: {
            userId,
            offersFreeSessions,
            freeSessionDuration,
            defaultPaidDuration,
            defaultPaidPrice,
            timezone: timezone || 'UTC',
            bufferTime,
            advanceBookingDays
          }
        }
      });
    }
  } catch (error) {
    console.error('Availability settings update error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update availability settings'
    });
  }
});

// Get availability slots for an expert
router.get('/slots/:expertId', async (req, res) => {
  try {
    const { expertId } = req.params;
    const { start_date, end_date } = req.query;
    
    console.log('Getting availability slots for expert:', expertId);
    console.log('Query params:', { start_date, end_date });

    const startDate = start_date ? new Date(start_date) : new Date();
    const endDate = end_date ? new Date(end_date) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    
    console.log('Date range:', startDate, 'to', endDate);

    if (isConnected()) {
      console.log('MongoDB connected, querying slots...');
      
      // Query with more flexible date range to catch all slots
      const query = {
        userId: expertId,
        date: {
          $gte: new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate()),
          $lte: endDate
        }
      };
      
      console.log('MongoDB query:', JSON.stringify(query, null, 2));
      
      const slots = await AvailabilitySlot.find(query)
      .populate('bookedBy', 'name avatar')
      .sort({ date: 1, startTime: 1 });

      console.log('Found slots from DB:', slots.length);
      
      if (slots.length > 0) {
        console.log('Raw slots data:', slots.map(s => ({
          id: s._id,
          date: s.date,
          startTime: s.startTime,
          endTime: s.endTime,
          slotType: s.slotType,
          price: s.price,
          duration: s.duration,
          isBooked: s.isBooked
        })));
      } else {
        console.log('No slots found in database for query:', query);
        // Let's also check if there are any slots for this user at all
        const allUserSlots = await AvailabilitySlot.find({ userId: expertId });
        console.log('All slots for this user:', allUserSlots.length);
        if (allUserSlots.length > 0) {
          console.log('User has slots but none match date range:', allUserSlots.map(s => ({
            date: s.date,
            startTime: s.startTime,
            slotType: s.slotType
          })));
        }
      }

      const formattedSlots = slots.map(slot => ({
        id: slot._id,
        date: slot.date.toISOString().split('T')[0],
        start_time: slot.startTime || slot.start_time,
        end_time: slot.endTime || slot.end_time,
        slot_type: slot.slotType || slot.slot_type,
        price: slot.price,
        duration: slot.duration,
        is_booked: slot.isBooked || slot.is_booked,
        booked_by: slot.bookedBy,
        session_id: slot.sessionId,
        is_recurring: slot.isRecurring || slot.is_recurring,
        recurring_pattern: slot.recurringPattern || slot.recurring_pattern,
        notes: slot.notes,
        created_at: slot.createdAt
      }));

      console.log('Formatted slots:', formattedSlots);

      return res.json({
        success: true,
        data: { slots: formattedSlots }
      });
    } else {
      // Mock slots for development
      console.log('Using mock slots for development');
      // Generate mock slots with future dates
      const today = new Date();
      const tomorrow = new Date(today.getTime() + 86400000);
      const dayAfter = new Date(today.getTime() + 2 * 86400000);
      
      const mockSlots = [
        {
          id: '1',
          date: tomorrow.toISOString().split('T')[0],
          start_time: '09:00',
          end_time: '09:30',
          slot_type: 'free',
          price: 0,
          duration: 30,
          is_booked: false,
          is_recurring: false
        },
        {
          id: '2',
          date: tomorrow.toISOString().split('T')[0],
          start_time: '10:00',
          end_time: '11:00',
          slot_type: 'paid',
          price: 75,
          duration: 60,
          is_booked: false,
          is_recurring: false
        },
        {
          id: '3',
          date: dayAfter.toISOString().split('T')[0],
          start_time: '14:00',
          end_time: '15:00',
          slot_type: 'paid',
          price: 100,
          duration: 60,
          is_booked: false,
          is_recurring: false
        }
      ];

      console.log('Returning mock slots:', mockSlots);

      return res.json({
        success: true,
        data: { slots: mockSlots }
      });
    }
  } catch (error) {
    console.error('Availability slots fetch error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch availability slots'
    });
  }
});

// Create availability slot
router.post('/slots', authenticateToken, async (req, res) => {
  try {
    const {
      date,
      start_time,
      end_time,
      slot_type,
      price,
      duration,
      is_recurring,
      recurring_pattern,
      recurring_until,
      notes
    } = req.body;

    const userId = req.user._id || req.user.id;

    if (!date || !start_time || !end_time || !slot_type) {
      return res.status(400).json({
        success: false,
        error: 'Date, start time, end time, and slot type are required'
      });
    }

    console.log('Creating slot for user:', userId, 'with data:', req.body);
    if (isConnected()) {
      // Check for overlapping slots
      const slotDate = new Date(date);
      console.log('Checking for overlapping slots on date:', slotDate);
      console.log('Looking for overlaps with time range:', start_time, 'to', end_time);
      
      const overlappingSlots = await AvailabilitySlot.find({
        userId,
        date: slotDate,
        $or: [
          {
            startTime: { $lte: start_time }, // Existing slot starts before or at new start time
            endTime: { $gt: start_time }     // Existing slot ends after new start time
          },
          {
            startTime: { $lt: end_time },    // Existing slot starts before new end time
            endTime: { $gte: end_time }      // Existing slot ends at or after new end time
          },
          {
            startTime: { $gte: start_time }, // Existing slot starts within new slot
            endTime: { $lte: end_time }      // Existing slot ends within new slot
          }
        ]
      });

      console.log('Found overlapping slots:', overlappingSlots.length);
      if (overlappingSlots.length > 0) {
        return res.status(400).json({
          success: false,
          error: 'This time slot overlaps with an existing slot'
        });
      }

      const slot = new AvailabilitySlot({
        userId,
        date: slotDate,
        startTime: start_time, // MongoDB uses camelCase
        endTime: end_time,
        slotType: slot_type,
        price: slot_type === 'free' ? 0 : price,
        duration,
        isRecurring: is_recurring || false,
        recurringPattern: recurring_pattern,
        recurringUntil: recurring_until ? new Date(recurring_until) : undefined,
        notes
      });

      await slot.save();
      console.log('Slot saved to DB:', slot._id);

      const formattedSlot = {
        id: slot._id,
        date: slot.date.toISOString().split('T')[0],
        start_time: slot.startTime,
        end_time: slot.endTime,
        slot_type: slot.slotType,
        price: slot.price,
        duration: slot.duration,
        is_booked: slot.isBooked,
        is_recurring: slot.isRecurring,
        recurring_pattern: slot.recurringPattern,
        notes: slot.notes,
        created_at: slot.createdAt
      };

      console.log('Returning formatted slot:', formattedSlot);
      return res.status(201).json({
        success: true,
        data: { slot: formattedSlot }
      });
    } else {
      // Mock slot creation for development
      console.log('Creating mock slot for development');
      const mockSlot = {
        id: 'slot-' + Date.now(),
        date,
        start_time,
        end_time,
        slot_type,
        price: slot_type === 'free' ? 0 : price,
        duration,
        is_booked: false,
        is_recurring: is_recurring || false,
        recurring_pattern,
        notes,
        created_at: new Date().toISOString()
      };

      return res.status(201).json({
        success: true,
        data: { slot: mockSlot }
      });
    }
  } catch (error) {
    console.error('Availability slot creation error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create availability slot'
    });
  }
});

// Update availability slot
router.put('/slots/:slotId', authenticateToken, async (req, res) => {
  try {
    const { slotId } = req.params;
    const userId = req.user._id || req.user.id;

    if (isConnected()) {
      // Check if user owns this slot and it's not booked
      const existingSlot = await AvailabilitySlot.findById(slotId);
      
      if (!existingSlot || existingSlot.userId.toString() !== userId.toString()) {
        return res.status(403).json({
          success: false,
          error: 'Not authorized to update this slot'
        });
      }

      if (existingSlot.isBooked) {
        return res.status(400).json({
          success: false,
          error: 'Cannot update a booked slot'
        });
      }

      const updatedSlot = await AvailabilitySlot.findByIdAndUpdate(
        slotId,
        req.body,
        { new: true }
      );

      const formattedSlot = {
        id: updatedSlot._id,
        date: updatedSlot.date.toISOString().split('T')[0],
        start_time: updatedSlot.startTime,
        end_time: updatedSlot.endTime,
        slot_type: updatedSlot.slotType,
        price: updatedSlot.price,
        duration: updatedSlot.duration,
        is_booked: updatedSlot.isBooked,
        is_recurring: updatedSlot.isRecurring,
        recurring_pattern: updatedSlot.recurringPattern,
        notes: updatedSlot.notes
      };

      return res.json({
        success: true,
        data: { slot: formattedSlot }
      });
    } else {
      // Mock response for development
      return res.json({
        success: true,
        data: { slot: { ...req.body, id: slotId } }
      });
    }
  } catch (error) {
    console.error('Availability slot update error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update availability slot'
    });
  }
});

// Delete availability slot
router.delete('/slots/:slotId', authenticateToken, async (req, res) => {
  try {
    const { slotId } = req.params;
    const userId = req.user._id || req.user.id;

    if (isConnected()) {
      // Check if user owns this slot and it's not booked
      const existingSlot = await AvailabilitySlot.findById(slotId);
      
      if (!existingSlot || existingSlot.userId.toString() !== userId.toString()) {
        return res.status(403).json({
          success: false,
          error: 'Not authorized to delete this slot'
        });
      }

      if (existingSlot.isBooked) {
        return res.status(400).json({
          success: false,
          error: 'Cannot delete a booked slot'
        });
      }

      await AvailabilitySlot.findByIdAndDelete(slotId);

      return res.json({
        success: true,
        message: 'Availability slot deleted successfully'
      });
    } else {
      // Mock response for development
      return res.json({
        success: true,
        message: 'Availability slot deleted successfully'
      });
    }
  } catch (error) {
    console.error('Availability slot deletion error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete availability slot'
    });
  }
});

module.exports = router;