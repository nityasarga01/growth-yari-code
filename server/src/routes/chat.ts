import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import { supabaseAdmin } from '../config/database';
import { asyncHandler } from '../middleware/errorHandler';
import { authenticateToken, AuthRequest } from '../middleware/auth';

const router = express.Router();

// Send chat message
router.post('/send', authenticateToken, asyncHandler(async (req: AuthRequest, res) => {
  const { recipient_id, message, session_id } = req.body;

  if (!recipient_id || !message) {
    return res.status(400).json({
      success: false,
      error: 'Recipient ID and message are required'
    });
  }

  if (recipient_id === req.user!.id) {
    return res.status(400).json({
      success: false,
      error: 'Cannot send message to yourself'
    });
  }

  const messageId = uuidv4();
  const { data: chatMessage, error } = await supabaseAdmin
    .from('chat_messages')
    .insert({
      id: messageId,
      sender_id: req.user!.id,
      recipient_id,
      session_id,
      message: message.trim(),
      is_read: false,
      created_at: new Date().toISOString()
    })
    .select(`
      id, sender_id, recipient_id, session_id, message, is_read, created_at,
      sender:sender_id(id, name, avatar, profession)
    `)
    .single();

  if (error) {
    console.error('Send message error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to send message'
    });
  }

  res.status(201).json({
    success: true,
    data: { message: chatMessage }
  });
}));

// Get chat messages between two users
router.get('/messages/:recipientId', authenticateToken, asyncHandler(async (req: AuthRequest, res) => {
  const { recipientId } = req.params;
  const { page = 1, limit = 50 } = req.query;
  const offset = (parseInt(page as string) - 1) * parseInt(limit as string);

  const { data: messages, error } = await supabaseAdmin
    .from('chat_messages')
    .select(`
      id, sender_id, recipient_id, session_id, message, is_read, created_at,
      sender:sender_id(id, name, avatar, profession)
    `)
    .or(`and(sender_id.eq.${req.user!.id},recipient_id.eq.${recipientId}),and(sender_id.eq.${recipientId},recipient_id.eq.${req.user!.id})`)
    .order('created_at', { ascending: true })
    .range(offset, offset + parseInt(limit as string) - 1);

  if (error) {
    console.error('Messages fetch error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch messages'
    });
  }

  res.json({
    success: true,
    data: { messages: messages || [] }
  });
}));

// Mark messages as read
router.patch('/messages/:senderId/read', authenticateToken, asyncHandler(async (req: AuthRequest, res) => {
  const { senderId } = req.params;

  const { error } = await supabaseAdmin
    .from('chat_messages')
    .update({ 
      is_read: true,
      updated_at: new Date().toISOString()
    })
    .eq('sender_id', senderId)
    .eq('recipient_id', req.user!.id)
    .eq('is_read', false);

  if (error) {
    console.error('Mark messages read error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to mark messages as read'
    });
  }

  res.json({
    success: true,
    message: 'Messages marked as read'
  });
}));

// Get chat conversations list
router.get('/conversations', authenticateToken, asyncHandler(async (req: AuthRequest, res) => {
  // Get all messages involving the user
  const { data: messages, error } = await supabaseAdmin
    .from('chat_messages')
    .select(`
      id, sender_id, recipient_id, message, created_at, is_read,
      sender:sender_id(id, name, avatar, profession),
      recipient:recipient_id(id, name, avatar, profession)
    `)
    .or(`sender_id.eq.${req.user!.id},recipient_id.eq.${req.user!.id}`)
    .order('created_at', { ascending: false });

  if (error || !messages) {
    console.error('Conversations fetch error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch conversations'
    });
  }

  // Group by conversation partner
  const conversationMap = new Map();
  messages.forEach(msg => {
    const partnerId = msg.sender_id === req.user!.id ? msg.recipient_id : msg.sender_id;
    if (!conversationMap.has(partnerId)) {
      const partner = msg.sender_id === req.user!.id ? msg.recipient : msg.sender;
      const unreadCount = messages.filter(m => 
        m.sender_id === partnerId && 
        m.recipient_id === req.user!.id && 
        !m.is_read
      ).length;
      
      conversationMap.set(partnerId, {
        user: partner,
        last_message: {
          message: msg.message,
          created_at: msg.created_at,
          is_from_me: msg.sender_id === req.user!.id
        },
        unread_count: unreadCount
      });
    }
  });

  const conversations = Array.from(conversationMap.values())
    .sort((a, b) => new Date(b.last_message.created_at).getTime() - new Date(a.last_message.created_at).getTime());

  res.json({
    success: true,
    data: { conversations }
  });
}));

export { router as chatRoutes };