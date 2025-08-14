import React, { useState, useEffect } from 'react';
import { Bell, X, Check, Trash2, BookMarked as MarkAsRead } from 'lucide-react';
import { apiClient } from '../../config/api';

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
  sender?: {
    id: string;
    name: string;
    avatar: string;
  };
  data?: any;
}

interface NotificationCenterProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NotificationCenter: React.FC<NotificationCenterProps> = ({ isOpen, onClose }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (isOpen) {
      loadNotifications();
    }
  }, [isOpen]);

  const loadNotifications = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('Loading notifications...');
      
      const result = await apiClient.getNotifications();
      if (result.success && result.data) {
        console.log('Notifications loaded:', result.data.notifications.length);
        setNotifications(result.data.notifications);
        const unread = result.data.notifications.filter((n: Notification) => !n.is_read).length;
        setUnreadCount(unread);
      } else {
        console.error('Failed to load notifications:', result.error);
        setError(result.error || 'Failed to load notifications');
      }
    } catch (error) {
      console.error('Notifications load error:', error);
      setError('Failed to load notifications');
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notificationId: string) => {
    try {
      console.log('Marking notification as read:', notificationId);
      const result = await apiClient.markNotificationAsRead(notificationId);
      if (result.success) {
        setNotifications(prev => 
          prev.map(n => n.id === notificationId ? { ...n, is_read: true } : n)
        );
        setUnreadCount(prev => Math.max(0, prev - 1));
        console.log('Notification marked as read successfully');
      } else {
        console.error('Failed to mark as read:', result.error);
      }
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      console.log('Marking all notifications as read...');
      const result = await apiClient.markAllNotificationsAsRead();
      if (result.success) {
        setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
        setUnreadCount(0);
        console.log('All notifications marked as read');
      } else {
        console.error('Failed to mark all as read:', result.error);
      }
    } catch (error) {
      console.error('Failed to mark all as read:', error);
    }
  };

  const deleteNotification = async (notificationId: string) => {
    try {
      console.log('Deleting notification:', notificationId);
      const result = await apiClient.deleteNotification(notificationId);
      if (result.success) {
        setNotifications(prev => prev.filter(n => n.id !== notificationId));
        if (!notifications.find(n => n.id === notificationId)?.is_read) {
          setUnreadCount(prev => Math.max(0, prev - 1));
        }
        console.log('Notification deleted successfully');
      } else {
        console.error('Failed to delete notification:', result.error);
      }
    } catch (error) {
      console.error('Failed to delete notification:', error);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'connection_request':
        return '👥';
      case 'session_booked':
      case 'session_request':
        return '📅';
      case 'session_confirmed':
        return '✅';
      case 'session_cancelled':
        return '❌';
      case 'session_reminder':
        return '⏰';
      case 'payment_received':
        return '💰';
      case 'review_received':
        return '⭐';
      default:
        return '📢';
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-start justify-center pt-16 px-4 z-50">
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full max-h-[80vh] overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Bell className="h-6 w-6 text-indigo-600" />
              <h2 className="text-xl font-bold text-gray-900">Notifications</h2>
              {unreadCount > 0 && (
                <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                  {unreadCount}
                </span>
              )}
            </div>
            <div className="flex items-center space-x-2">
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="text-sm text-indigo-600 hover:text-indigo-700 font-medium"
                >
                  Mark all read
                </button>
              )}
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="max-h-96 overflow-y-auto">
          {loading ? (
            <div className="p-6 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-4 border-indigo-600 border-t-transparent mx-auto mb-4"></div>
              <p className="text-gray-600">Loading notifications...</p>
            </div>
          ) : error ? (
            <div className="p-6 text-center">
              <p className="text-red-600 mb-4">{error}</p>
              <button
                onClick={loadNotifications}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
              >
                Retry
              </button>
            </div>
          ) : notifications.length === 0 ? (
            <div className="p-6 text-center">
              <Bell className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No notifications</h3>
              <p className="text-gray-600">You're all caught up!</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-4 hover:bg-gray-50 transition-colors ${
                    !notification.is_read ? 'bg-indigo-50' : ''
                  }`}
                >
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0">
                      <span className="text-2xl">{getNotificationIcon(notification.type)}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="text-sm font-medium text-gray-900">
                            {notification.title}
                          </h4>
                          <p className="text-sm text-gray-600 mt-1">
                            {notification.message}
                          </p>
                          <p className="text-xs text-gray-500 mt-2">
                            {formatTimeAgo(notification.created_at)}
                          </p>
                        </div>
                        <div className="flex items-center space-x-1 ml-2">
                          {!notification.is_read && (
                            <button
                              onClick={() => markAsRead(notification.id)}
                              className="p-1 text-indigo-600 hover:text-indigo-700"
                              title="Mark as read"
                            >
                              <Check className="h-4 w-4" />
                            </button>
                          )}
                          <button
                            onClick={() => deleteNotification(notification.id)}
                            className="p-1 text-red-600 hover:text-red-700"
                            title="Delete"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};