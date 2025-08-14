import express from 'express';
import { supabaseAdmin } from '../config/database';
import { asyncHandler } from '../middleware/errorHandler';
import { authenticateToken, AuthRequest } from '../middleware/auth';

const router = express.Router();

// Get calendar events (sessions) for a date range
router.get('/events', authenticateToken, asyncHandler(async (req: AuthRequest, res) => {
  const { start_date, end_date, view = 'month' } = req.query;

  // Default date range if not provided
  const startDate = start_date ? new Date(start_date as string) : new Date();
  const endDate = end_date ? new Date(end_date as string) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days from now

  const { data: sessions, error } = await supabaseAdmin
    .from('sessions')
    .select(`
      id, title, description, duration, price, scheduled_at, status, meeting_link,
      expert:expert_id(id, name, avatar, profession),
      client:client_id(id, name, avatar, profession)
    `)
    .or(`expert_id.eq.${req.user!.id},client_id.eq.${req.user!.id}`)
    .gte('scheduled_at', startDate.toISOString())
    .lte('scheduled_at', endDate.toISOString())
    .order('scheduled_at', { ascending: true });

  if (error) {
    console.error('Calendar events fetch error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch calendar events'
    });
  }

  const events = sessions?.map(session => ({
    id: session.id,
    title: session.title,
    description: session.description,
    start: session.scheduled_at,
    end: new Date(new Date(session.scheduled_at).getTime() + session.duration * 60000).toISOString(),
    duration: session.duration,
    price: session.price,
    status: session.status,
    meeting_link: session.meeting_link,
    type: 'session',
    expert: session.expert,
    client: session.client,
    is_expert: session.expert.id === req.user!.id
  })) || [];

  res.json({
    success: true,
    data: { events }
  });
}));

// Get available time slots for an expert
router.get('/availability/:expertId', asyncHandler(async (req, res) => {
  const { expertId } = req.params;
  const { date } = req.query;

  const selectedDate = date ? new Date(date as string) : new Date();
  const dayOfWeek = selectedDate.getDay();

  // Skip weekends for this example
  if (dayOfWeek === 0 || dayOfWeek === 6) {
    return res.json({
      success: true,
      data: { slots: [] }
    });
  }

  // Get existing bookings for the date
  const startOfDay = new Date(selectedDate);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(selectedDate);
  endOfDay.setHours(23, 59, 59, 999);

  const { data: existingBookings } = await supabaseAdmin
    .from('sessions')
    .select('scheduled_at, duration')
    .eq('expert_id', expertId)
    .gte('scheduled_at', startOfDay.toISOString())
    .lte('scheduled_at', endOfDay.toISOString());

  // Generate time slots (9 AM to 5 PM, 1-hour intervals)
  const slots = [];
  for (let hour = 9; hour < 17; hour++) {
    const slotTime = new Date(selectedDate);
    slotTime.setHours(hour, 0, 0, 0);

    // Check if slot is already booked
    const isBooked = existingBookings?.some(booking => {
      const bookingStart = new Date(booking.scheduled_at);
      const bookingEnd = new Date(bookingStart.getTime() + booking.duration * 60000);
      return slotTime >= bookingStart && slotTime < bookingEnd;
    }) || false;

    slots.push({
      id: `${expertId}-${slotTime.getTime()}`,
      time: slotTime.toTimeString().slice(0, 5),
      datetime: slotTime.toISOString(),
      available: !isBooked,
      price: hour < 12 ? 0 : 75 // Free morning slots, paid afternoon
    });
  }

  res.json({
    success: true,
    data: { slots }
  });
}));

// Create calendar event (for experts to set availability)
router.post('/availability', authenticateToken, asyncHandler(async (req: AuthRequest, res) => {
  const { date, start_time, end_time, price = 0, recurring = false } = req.body;

  if (!date || !start_time || !end_time) {
    return res.status(400).json({
      success: false,
      error: 'Date, start time, and end time are required'
    });
  }

  // This would typically create availability slots in an availability table
  // For now, we'll just return success as this is a placeholder for future implementation
  res.status(201).json({
    success: true,
    message: 'Availability created successfully',
    data: {
      expert_id: req.user!.id,
      date,
      start_time,
      end_time,
      price,
      recurring
    }
  });
}));

export { router as calendarRoutes };