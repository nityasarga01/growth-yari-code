import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import { supabaseAdmin } from '../config/database';
import { asyncHandler } from '../middleware/errorHandler';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import { body } from 'express-validator';
import { handleValidationErrors } from '../middleware/validation';

const router = express.Router();

// Get availability settings for a user
router.get('/settings/:userId', asyncHandler(async (req, res) => {
  const { userId } = req.params;

  const { data: settings, error } = await supabaseAdmin
    .from('availability_settings')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
    console.error('Availability settings fetch error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch availability settings'
    });
  }

  // Return default settings if none exist
  const defaultSettings = {
    offers_free_sessions: false,
    free_session_duration: 30,
    default_paid_duration: 60,
    default_paid_price: 75,
    timezone: 'UTC',
    buffer_time: 15,
    advance_booking_days: 30
  };

  res.json({
    success: true,
    data: { settings: settings || defaultSettings }
  });
}));

// Update availability settings
router.put('/settings', 
  authenticateToken,
  [
    body('offers_free_sessions').isBoolean(),
    body('free_session_duration').isInt({ min: 15, max: 60 }),
    body('default_paid_duration').isInt({ min: 30, max: 180 }),
    body('default_paid_price').isFloat({ min: 0 }),
    body('buffer_time').isInt({ min: 0, max: 60 }),
    body('advance_booking_days').isInt({ min: 1, max: 90 }),
    handleValidationErrors
  ],
  asyncHandler(async (req: AuthRequest, res) => {
    const {
      offers_free_sessions,
      free_session_duration,
      default_paid_duration,
      default_paid_price,
      timezone,
      buffer_time,
      advance_booking_days
    } = req.body;

    const settingsData = {
      user_id: req.user!.id,
      offers_free_sessions,
      free_session_duration,
      default_paid_duration,
      default_paid_price,
      timezone: timezone || 'UTC',
      buffer_time,
      advance_booking_days,
      updated_at: new Date().toISOString()
    };

    // Try to update existing settings first
    const { data: updatedSettings, error: updateError } = await supabaseAdmin
      .from('availability_settings')
      .update(settingsData)
      .eq('user_id', req.user!.id)
      .select('*')
      .single();

    if (updateError && updateError.code === 'PGRST116') {
      // No existing settings, create new ones
      const { data: newSettings, error: insertError } = await supabaseAdmin
        .from('availability_settings')
        .insert({
          ...settingsData,
          id: uuidv4(),
          created_at: new Date().toISOString()
        })
        .select('*')
        .single();

      if (insertError) {
        console.error('Availability settings creation error:', insertError);
        return res.status(500).json({
          success: false,
          error: 'Failed to create availability settings'
        });
      }

      return res.json({
        success: true,
        data: { settings: newSettings }
      });
    }

    if (updateError) {
      console.error('Availability settings update error:', updateError);
      return res.status(500).json({
        success: false,
        error: 'Failed to update availability settings'
      });
    }

    res.json({
      success: true,
      data: { settings: updatedSettings }
    });
  })
);

// Get availability slots for an expert
router.get('/slots/:expertId', asyncHandler(async (req, res) => {
  const { expertId } = req.params;
  const { start_date, end_date } = req.query;

  const startDate = start_date ? new Date(start_date as string) : new Date();
  const endDate = end_date ? new Date(end_date as string) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

  const { data: slots, error } = await supabaseAdmin
    .rpc('get_expert_available_slots', {
      expert_id: expertId,
      start_date: startDate.toISOString().split('T')[0],
      end_date: endDate.toISOString().split('T')[0]
    });

  if (error) {
    console.error('Availability slots fetch error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch availability slots'
    });
  }

  res.json({
    success: true,
    data: { slots: slots || [] }
  });
}));

// Create availability slot
router.post('/slots',
  authenticateToken,
  [
    body('date').isISO8601().toDate(),
    body('start_time').matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
    body('end_time').matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
    body('slot_type').isIn(['free', 'paid', 'blocked']),
    body('price').isFloat({ min: 0 }),
    body('duration').isInt({ min: 15, max: 180 }),
    handleValidationErrors
  ],
  asyncHandler(async (req: AuthRequest, res) => {
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

    // Validate that end time is after start time
    const startDateTime = new Date(`${date} ${start_time}`);
    const endDateTime = new Date(`${date} ${end_time}`);
    
    if (endDateTime <= startDateTime) {
      return res.status(400).json({
        success: false,
        error: 'End time must be after start time'
      });
    }

    // Check for overlapping slots
    const { data: overlappingSlots } = await supabaseAdmin
      .from('availability_slots')
      .select('id')
      .eq('user_id', req.user!.id)
      .eq('date', date)
      .or(`and(start_time.lte.${start_time},end_time.gt.${start_time}),and(start_time.lt.${end_time},end_time.gte.${end_time})`)
      .limit(1);

    if (overlappingSlots && overlappingSlots.length > 0) {
      return res.status(400).json({
        success: false,
        error: 'This time slot overlaps with an existing slot'
      });
    }

    const slotId = uuidv4();
    const slotData = {
      id: slotId,
      user_id: req.user!.id,
      date,
      start_time,
      end_time,
      slot_type,
      price: slot_type === 'free' ? 0 : price,
      duration,
      is_booked: false,
      is_recurring: is_recurring || false,
      recurring_pattern,
      recurring_until,
      notes,
      created_at: new Date().toISOString()
    };

    const { data: slot, error } = await supabaseAdmin
      .from('availability_slots')
      .insert(slotData)
      .select('*')
      .single();

    if (error) {
      console.error('Availability slot creation error:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to create availability slot'
      });
    }

    res.status(201).json({
      success: true,
      data: { slot }
    });
  })
);

// Update availability slot
router.put('/slots/:slotId',
  authenticateToken,
  asyncHandler(async (req: AuthRequest, res) => {
    const { slotId } = req.params;
    const updateData = {
      ...req.body,
      updated_at: new Date().toISOString()
    };

    // Check if user owns this slot
    const { data: existingSlot } = await supabaseAdmin
      .from('availability_slots')
      .select('user_id, is_booked')
      .eq('id', slotId)
      .single();

    if (!existingSlot || existingSlot.user_id !== req.user!.id) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to update this slot'
      });
    }

    if (existingSlot.is_booked) {
      return res.status(400).json({
        success: false,
        error: 'Cannot update a booked slot'
      });
    }

    const { data: slot, error } = await supabaseAdmin
      .from('availability_slots')
      .update(updateData)
      .eq('id', slotId)
      .select('*')
      .single();

    if (error) {
      console.error('Availability slot update error:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to update availability slot'
      });
    }

    res.json({
      success: true,
      data: { slot }
    });
  })
);

// Delete availability slot
router.delete('/slots/:slotId',
  authenticateToken,
  asyncHandler(async (req: AuthRequest, res) => {
    const { slotId } = req.params;

    // Check if user owns this slot and it's not booked
    const { data: existingSlot } = await supabaseAdmin
      .from('availability_slots')
      .select('user_id, is_booked')
      .eq('id', slotId)
      .single();

    if (!existingSlot || existingSlot.user_id !== req.user!.id) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to delete this slot'
      });
    }

    if (existingSlot.is_booked) {
      return res.status(400).json({
        success: false,
        error: 'Cannot delete a booked slot'
      });
    }

    const { error } = await supabaseAdmin
      .from('availability_slots')
      .delete()
      .eq('id', slotId);

    if (error) {
      console.error('Availability slot deletion error:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to delete availability slot'
      });
    }

    res.json({
      success: true,
      message: 'Availability slot deleted successfully'
    });
  })
);

export { router as availabilityRoutes };