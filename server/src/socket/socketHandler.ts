import { Server, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { supabaseAdmin } from '../config/database';

interface AuthenticatedSocket extends Socket {
  userId?: string;
}

export const initializeSocket = (io: Server) => {
  // Authentication middleware for Socket.IO
  io.use(async (socket: AuthenticatedSocket, next) => {
    try {
      const token = socket.handshake.auth.token;
      
      if (!token) {
        return next(new Error('Authentication error'));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
      
      // Verify user exists
      const { data: user, error } = await supabaseAdmin
        .from('users')
        .select('id')
        .eq('id', decoded.userId)
        .single();

      if (error || !user) {
        return next(new Error('Authentication error'));
      }

      socket.userId = decoded.userId;
      next();
    } catch (error) {
      next(new Error('Authentication error'));
    }
  });

  io.on('connection', (socket: AuthenticatedSocket) => {
    console.log(`User ${socket.userId} connected`);

    // Join user to their personal room for notifications
    socket.join(`user:${socket.userId}`);

    // Handle YariConnect events
    socket.on('yari-connect:join-queue', async (filters) => {
      socket.join('yari-connect:queue');
      
      // Emit to other users in queue for potential matching
      socket.to('yari-connect:queue').emit('yari-connect:user-joined', {
        userId: socket.userId,
        filters
      });
    });

    socket.on('yari-connect:leave-queue', () => {
      socket.leave('yari-connect:queue');
      socket.to('yari-connect:queue').emit('yari-connect:user-left', {
        userId: socket.userId
      });
    });

    socket.on('yari-connect:call-user', ({ targetUserId, offer }) => {
      socket.to(`user:${targetUserId}`).emit('yari-connect:incoming-call', {
        from: socket.userId,
        offer
      });
    });

    socket.on('yari-connect:answer-call', ({ targetUserId, answer }) => {
      socket.to(`user:${targetUserId}`).emit('yari-connect:call-answered', {
        from: socket.userId,
        answer
      });
    });

    socket.on('yari-connect:ice-candidate', ({ targetUserId, candidate }) => {
      socket.to(`user:${targetUserId}`).emit('yari-connect:ice-candidate', {
        from: socket.userId,
        candidate
      });
    });

    socket.on('yari-connect:end-call', ({ targetUserId }) => {
      socket.to(`user:${targetUserId}`).emit('yari-connect:call-ended', {
        from: socket.userId
      });
    });

    // Handle chat messages
    socket.on('chat:send-message', async (data) => {
      const { recipientId, message, sessionId } = data;
      
      // Save message to database
      try {
        await supabaseAdmin
          .from('chat_messages')
          .insert({
            sender_id: socket.userId,
            recipient_id: recipientId,
            session_id: sessionId,
            message,
            created_at: new Date().toISOString()
          });

        // Send to recipient
        socket.to(`user:${recipientId}`).emit('chat:new-message', {
          senderId: socket.userId,
          message,
          sessionId,
          timestamp: new Date().toISOString()
        });
      } catch (error) {
        console.error('Chat message error:', error);
        socket.emit('chat:error', { message: 'Failed to send message' });
      }
    });

    // Handle typing indicators
    socket.on('chat:typing', ({ recipientId, isTyping }) => {
      socket.to(`user:${recipientId}`).emit('chat:user-typing', {
        userId: socket.userId,
        isTyping
      });
    });

    // Handle session updates
    socket.on('session:join', (sessionId) => {
      socket.join(`session:${sessionId}`);
    });

    socket.on('session:leave', (sessionId) => {
      socket.leave(`session:${sessionId}`);
    });

    socket.on('session:update-status', async ({ sessionId, status }) => {
      // Broadcast to all users in the session
      socket.to(`session:${sessionId}`).emit('session:status-updated', {
        sessionId,
        status,
        updatedBy: socket.userId
      });
    });

    // Handle notifications
    socket.on('notification:mark-read', async (notificationId) => {
      try {
        await supabaseAdmin
          .from('notifications')
          .update({ is_read: true })
          .eq('id', notificationId)
          .eq('user_id', socket.userId);
      } catch (error) {
        console.error('Notification update error:', error);
      }
    });

    // Handle disconnect
    socket.on('disconnect', () => {
      console.log(`User ${socket.userId} disconnected`);
      
      // Leave YariConnect queue
      socket.to('yari-connect:queue').emit('yari-connect:user-left', {
        userId: socket.userId
      });
    });
  });

  return io;
};

// Helper function to send notification via socket
export const sendNotificationToUser = (io: Server, userId: string, notification: any) => {
  io.to(`user:${userId}`).emit('notification:new', notification);
};

// Helper function to broadcast session update
export const broadcastSessionUpdate = (io: Server, sessionId: string, update: any) => {
  io.to(`session:${sessionId}`).emit('session:updated', update);
};