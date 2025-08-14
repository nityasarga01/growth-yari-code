import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import { supabaseAdmin } from '../config/database';
import { asyncHandler } from '../middleware/errorHandler';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import { createNotification } from './notifications';

const router = express.Router();

// Get user's connections
router.get('/', authenticateToken, asyncHandler(async (req: AuthRequest, res) => {
  console.log('Getting connections for user:', req.user!.id);
  
  const { data: connections, error } = await supabaseAdmin
    .from('connections')
    .select(`
      id, connected_at,
      user1:user1_id(id, name, avatar, profession, expertise, rating, review_count, is_verified),
      user2:user2_id(id, name, avatar, profession, expertise, rating, review_count, is_verified)
    `)
    .or(`user1_id.eq.${req.user!.id},user2_id.eq.${req.user!.id}`)
    .order('connected_at', { ascending: false });

  if (error) {
    console.error('Connections fetch error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch connections'
    });
  }

  console.log('Raw connections data:', connections);

  // Transform connections to show the other user
  const transformedConnections = connections?.map(conn => ({
    id: conn.id,
    connected_at: conn.connected_at,
    user: conn.user1.id === req.user!.id ? conn.user2 : conn.user1
  })) || [];

  console.log('Transformed connections:', transformedConnections);

  res.json({
    success: true,
    data: { connections: transformedConnections }
  });
}));

// Send connection request
router.post('/request', authenticateToken, asyncHandler(async (req: AuthRequest, res) => {
  const { user_id, message } = req.body;

  if (!user_id) {
    return res.status(400).json({
      success: false,
      error: 'User ID is required'
    });
  }

  if (user_id === req.user!.id) {
    return res.status(400).json({
      success: false,
      error: 'Cannot send connection request to yourself'
    });
  }

  // Check if connection already exists
  const { data: existingConnection } = await supabaseAdmin
    .from('connections')
    .select('id')
    .or(`and(user1_id.eq.${req.user!.id},user2_id.eq.${user_id}),and(user1_id.eq.${user_id},user2_id.eq.${req.user!.id})`)
    .single();

  if (existingConnection) {
    return res.status(400).json({
      success: false,
      error: 'Connection already exists'
    });
  }

  // Check if request already exists
  const { data: existingRequest } = await supabaseAdmin
    .from('connection_requests')
    .select('id')
    .eq('sender_id', req.user!.id)
    .eq('receiver_id', user_id)
    .eq('status', 'pending')
    .single();

  if (existingRequest) {
    return res.status(400).json({
      success: false,
      error: 'Connection request already sent'
    });
  }

  // Create connection request
  const requestId = uuidv4();
  const { data: request, error } = await supabaseAdmin
    .from('connection_requests')
    .insert({
      id: requestId,
      sender_id: req.user!.id,
      receiver_id: user_id,
      message: message || '',
      status: 'pending',
      created_at: new Date().toISOString()
    })
    .select(`
      id, message, status, created_at,
      sender:sender_id(id, name, avatar, profession),
      receiver:receiver_id(id, name, avatar, profession)
    `)
    .single();

  if (error) {
    console.error('Connection request error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to send connection request'
    });
  }

  // Create notification for the receiver
  await createNotification(
    user_id,
    'connection_request',
    'New Connection Request',
    `${req.user!.id} wants to connect with you`,
    req.user!.id,
    { requestId: requestId }
  );

  res.status(201).json({
    success: true,
    data: { request }
  });
}));

// Get connection requests (received)
router.get('/requests', authenticateToken, asyncHandler(async (req: AuthRequest, res) => {
  const { type = 'received' } = req.query;

  let query = supabaseAdmin
    .from('connection_requests')
    .select(`
      id, message, status, created_at,
      sender:sender_id(id, name, avatar, profession, expertise, rating, review_count, is_verified),
      receiver:receiver_id(id, name, avatar, profession)
    `);

  if (type === 'received') {
    query = query.eq('receiver_id', req.user!.id);
  } else if (type === 'sent') {
    query = query.eq('sender_id', req.user!.id);
  }

  query = query.order('created_at', { ascending: false });

  const { data: requests, error } = await query;

  if (error) {
    console.error('Connection requests fetch error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch connection requests'
    });
  }

  res.json({
    success: true,
    data: { requests }
  });
}));

// Respond to connection request
router.patch('/requests/:id', authenticateToken, asyncHandler(async (req: AuthRequest, res) => {
  const { id } = req.params;
  const { action } = req.body; // 'accept' or 'decline'

  if (!['accept', 'decline'].includes(action)) {
    return res.status(400).json({
      success: false,
      error: 'Invalid action. Must be "accept" or "decline"'
    });
  }

  // Get the request
  const { data: request, error: requestError } = await supabaseAdmin
    .from('connection_requests')
    .select('sender_id, receiver_id, status')
    .eq('id', id)
    .single();

  if (requestError || !request) {
    return res.status(404).json({
      success: false,
      error: 'Connection request not found'
    });
  }

  // Check if user is the receiver
  if (request.receiver_id !== req.user!.id) {
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
  const { error: updateError } = await supabaseAdmin
    .from('connection_requests')
    .update({ 
      status: newStatus,
      updated_at: new Date().toISOString()
    })
    .eq('id', id);

  if (updateError) {
    console.error('Request update error:', updateError);
    return res.status(500).json({
      success: false,
      error: 'Failed to update request'
    });
  }

  // If accepted, create connection
  if (action === 'accept') {
    const connectionId = uuidv4();
    const { error: connectionError } = await supabaseAdmin
      .from('connections')
      .insert({
        id: connectionId,
        user1_id: request.sender_id,
        user2_id: request.receiver_id,
        connected_at: new Date().toISOString()
      });

    if (connectionError) {
      console.error('Connection creation error:', connectionError);
      return res.status(500).json({
        success: false,
        error: 'Failed to create connection'
      });
    }

    // Create notification for successful connection
    await createNotification(
      request.receiver_id,
      'connection_accepted',
      'Connection Accepted',
      `You are now connected with ${request.sender_id}`,
      request.sender_id
    );
  }

  res.json({
    success: true,
    data: { 
      status: newStatus,
      message: `Connection request ${action}ed successfully`
    }
  });
}));

// Remove connection
router.delete('/:id', authenticateToken, asyncHandler(async (req: AuthRequest, res) => {
  const { id } = req.params;

  // Get connection to verify user is part of it
  const { data: connection } = await supabaseAdmin
    .from('connections')
    .select('user1_id, user2_id')
    .eq('id', id)
    .single();

  if (!connection) {
    return res.status(404).json({
      success: false,
      error: 'Connection not found'
    });
  }

  // Check if user is part of this connection
  if (connection.user1_id !== req.user!.id && connection.user2_id !== req.user!.id) {
    return res.status(403).json({
      success: false,
      error: 'Not authorized to remove this connection'
    });
  }

  const { error } = await supabaseAdmin
    .from('connections')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Connection removal error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to remove connection'
    });
  }

  res.json({
    success: true,
    message: 'Connection removed successfully'
  });
}));

export { router as connectionRoutes };