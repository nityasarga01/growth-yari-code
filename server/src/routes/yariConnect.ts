import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import { supabaseAdmin } from '../config/database';
import { asyncHandler } from '../middleware/errorHandler';
import { authenticateToken, AuthRequest } from '../middleware/auth';

const router = express.Router();

// Get available professionals for YariConnect
router.get('/professionals', authenticateToken, asyncHandler(async (req: AuthRequest, res) => {
  const { 
    job_profile, 
    field, 
    location, 
    experience, 
    availability,
    limit = 20 
  } = req.query;

  let query = supabaseAdmin
    .from('users')
    .select('id, name, avatar, profession, bio, expertise, rating, review_count, is_verified')
    .neq('id', req.user!.id); // Exclude current user

  // Apply filters
  if (job_profile && job_profile !== 'all') {
    query = query.ilike('profession', `%${job_profile}%`);
  }

  if (field && field !== 'all') {
    // This would need a field column in the users table
    query = query.eq('field', field);
  }

  if (location && location !== 'all') {
    // This would need a location column in the users table
    query = query.ilike('location', `%${location}%`);
  }

  if (experience && experience !== 'all') {
    // This would need an experience column in the users table
    query = query.eq('experience', experience);
  }

  // Randomize results for YariConnect
  query = query.limit(parseInt(limit as string));

  const { data: professionals, error } = await query;

  if (error) {
    console.error('Professionals fetch error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch professionals'
    });
  }

  // Shuffle the results
  const shuffled = professionals?.sort(() => 0.5 - Math.random()) || [];

  res.json({
    success: true,
    data: { professionals: shuffled }
  });
}));

// Start YariConnect session
router.post('/sessions/start', authenticateToken, asyncHandler(async (req: AuthRequest, res) => {
  const { participant_id } = req.body;

  if (!participant_id) {
    return res.status(400).json({
      success: false,
      error: 'Participant ID is required'
    });
  }

  if (participant_id === req.user!.id) {
    return res.status(400).json({
      success: false,
      error: 'Cannot start session with yourself'
    });
  }

  // Check if participant exists
  const { data: participant } = await supabaseAdmin
    .from('users')
    .select('id, name')
    .eq('id', participant_id)
    .single();

  if (!participant) {
    return res.status(404).json({
      success: false,
      error: 'Participant not found'
    });
  }

  const sessionId = uuidv4();
  const { data: session, error } = await supabaseAdmin
    .from('yari_connect_sessions')
    .insert({
      id: sessionId,
      user1_id: req.user!.id,
      user2_id: participant_id,
      started_at: new Date().toISOString(),
      status: 'active'
    })
    .select(`
      id, started_at, status,
      user1:user1_id(id, name, avatar, profession),
      user2:user2_id(id, name, avatar, profession)
    `)
    .single();

  if (error) {
    console.error('YariConnect session creation error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to start session'
    });
  }

  res.status(201).json({
    success: true,
    data: { session }
  });
}));

// End YariConnect session
router.patch('/sessions/:id/end', authenticateToken, asyncHandler(async (req: AuthRequest, res) => {
  const { id } = req.params;

  // Get session to verify user is part of it
  const { data: session } = await supabaseAdmin
    .from('yari_connect_sessions')
    .select('user1_id, user2_id, started_at, status')
    .eq('id', id)
    .single();

  if (!session) {
    return res.status(404).json({
      success: false,
      error: 'Session not found'
    });
  }

  // Check if user is part of this session
  if (session.user1_id !== req.user!.id && session.user2_id !== req.user!.id) {
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
  const startTime = new Date(session.started_at);
  const endTime = new Date();
  const duration = Math.floor((endTime.getTime() - startTime.getTime()) / 1000);

  const { error } = await supabaseAdmin
    .from('yari_connect_sessions')
    .update({
      ended_at: endTime.toISOString(),
      duration,
      status: 'ended'
    })
    .eq('id', id);

  if (error) {
    console.error('YariConnect session end error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to end session'
    });
  }

  res.json({
    success: true,
    data: { 
      duration,
      message: 'Session ended successfully'
    }
  });
}));

// Get YariConnect session history
router.get('/sessions', authenticateToken, asyncHandler(async (req: AuthRequest, res) => {
  const { page = 1, limit = 20 } = req.query;
  const offset = (parseInt(page as string) - 1) * parseInt(limit as string);

  const { data: sessions, error } = await supabaseAdmin
    .from('yari_connect_sessions')
    .select(`
      id, started_at, ended_at, duration, status,
      user1:user1_id(id, name, avatar, profession),
      user2:user2_id(id, name, avatar, profession)
    `)
    .or(`user1_id.eq.${req.user!.id},user2_id.eq.${req.user!.id}`)
    .order('started_at', { ascending: false })
    .range(offset, offset + parseInt(limit as string) - 1);

  if (error) {
    console.error('YariConnect sessions fetch error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch sessions'
    });
  }

  // Transform sessions to show the other user
  const transformedSessions = sessions?.map(session => ({
    id: session.id,
    started_at: session.started_at,
    ended_at: session.ended_at,
    duration: session.duration,
    status: session.status,
    participant: session.user1.id === req.user!.id ? session.user2 : session.user1
  })) || [];

  res.json({
    success: true,
    data: { sessions: transformedSessions }
  });
}));

// Get YariConnect statistics
router.get('/stats', authenticateToken, asyncHandler(async (req: AuthRequest, res) => {
  const [
    { count: totalSessions },
    { data: totalDuration },
    { count: activeSessions }
  ] = await Promise.all([
    supabaseAdmin
      .from('yari_connect_sessions')
      .select('*', { count: 'exact', head: true })
      .or(`user1_id.eq.${req.user!.id},user2_id.eq.${req.user!.id}`),
    supabaseAdmin
      .from('yari_connect_sessions')
      .select('duration')
      .or(`user1_id.eq.${req.user!.id},user2_id.eq.${req.user!.id}`)
      .eq('status', 'ended'),
    supabaseAdmin
      .from('yari_connect_sessions')
      .select('*', { count: 'exact', head: true })
      .or(`user1_id.eq.${req.user!.id},user2_id.eq.${req.user!.id}`)
      .eq('status', 'active')
  ]);

  const totalMinutes = totalDuration?.reduce((sum, session) => sum + (session.duration || 0), 0) || 0;

  res.json({
    success: true,
    data: {
      total_sessions: totalSessions || 0,
      total_minutes: Math.floor(totalMinutes / 60),
      active_sessions: activeSessions || 0,
      average_session_duration: totalSessions ? Math.floor(totalMinutes / totalSessions / 60) : 0
    }
  });
}));

export { router as yariConnectRoutes };