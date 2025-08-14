import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import { supabaseAdmin } from '../config/database';
import { asyncHandler } from '../middleware/errorHandler';
import { authenticateToken, AuthRequest } from '../middleware/auth';

const router = express.Router();

// Get user notifications
router.get('/', authenticateToken, asyncHandler(async (req: AuthRequest, res) => {
  const { page = 1, limit = 20, unread_only = false } = req.query;
  const offset = (parseInt(page as string) - 1) * parseInt(limit as string);

  let query = supabaseAdmin
    .from('notifications')
    .select(`
      id, type, title, message, data, is_read, created_at,
      sender:sender_id(id, name, avatar)
    `)
    .eq('user_id', req.user!.id);

  if (unread_only === 'true') {
    query = query.eq('is_read', false);
  }

  query = query
    .order('created_at', { ascending: false })
    .range(offset, offset + parseInt(limit as string) - 1);

  const { data: notifications, error } = await query;

  if (error) {
    console.error('Notifications fetch error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch notifications'
    });
  }

  res.json({
    success: true,
    data: { notifications: notifications || [] }
  });
}));

// Mark notification as read
router.patch('/:id/read', authenticateToken, asyncHandler(async (req: AuthRequest, res) => {
  const { id } = req.params;

  const { error } = await supabaseAdmin
    .from('notifications')
    .update({ 
      is_read: true,
      updated_at: new Date().toISOString()
    })
    .eq('id', id)
    .eq('user_id', req.user!.id);

  if (error) {
    console.error('Notification update error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to mark notification as read'
    });
  }

  res.json({
    success: true,
    message: 'Notification marked as read'
  });
}));

// Mark all notifications as read
router.patch('/read-all', authenticateToken, asyncHandler(async (req: AuthRequest, res) => {
  const { error } = await supabaseAdmin
    .from('notifications')
    .update({ 
      is_read: true,
      updated_at: new Date().toISOString()
    })
    .eq('user_id', req.user!.id)
    .eq('is_read', false);

  if (error) {
    console.error('Notifications update error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to mark notifications as read'
    });
  }

  res.json({
    success: true,
    message: 'All notifications marked as read'
  });
}));

// Get unread count
router.get('/unread-count', authenticateToken, asyncHandler(async (req: AuthRequest, res) => {
  const { count, error } = await supabaseAdmin
    .from('notifications')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', req.user!.id)
    .eq('is_read', false);

  if (error) {
    console.error('Unread count error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to get unread count'
    });
  }

  res.json({
    success: true,
    data: { unread_count: count || 0 }
  });
}));

// Delete notification
router.delete('/:id', authenticateToken, asyncHandler(async (req: AuthRequest, res) => {
  const { id } = req.params;

  const { error } = await supabaseAdmin
    .from('notifications')
    .delete()
    .eq('id', id)
    .eq('user_id', req.user!.id);

  if (error) {
    console.error('Notification deletion error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to delete notification'
    });
  }

  res.json({
    success: true,
    message: 'Notification deleted successfully'
  });
}));

// Helper function to create notification (used by other services)
export const createNotification = async (
  userId: string,
  type: string,
  title: string,
  message: string,
  senderId?: string,
  data?: any
) => {
  try {
    await supabaseAdmin
      .from('notifications')
      .insert({
        id: uuidv4(),
        user_id: userId,
        sender_id: senderId,
        type,
        title,
        message,
        data,
        is_read: false,
        created_at: new Date().toISOString()
      });
    console.log('Notification created successfully');
  } catch (error) {
    console.error('Notification creation error:', error);
  }
};

export { router as notificationRoutes };