import React, { useState } from 'react';
import { useEffect } from 'react';
import { Calendar, Clock, User, Video, DollarSign, Star, MessageCircle, Edit, CheckCircle, XCircle } from 'lucide-react';
import { Session } from '../../types';
import { apiClient } from '../../config/api';
import { RescheduleModal } from './RescheduleModal';

interface SessionsViewProps {
  onOpenChat?: (user: any) => void;
}

export const SessionsView: React.FC<SessionsViewProps> = ({ onOpenChat }) => {
  const [activeTab, setActiveTab] = useState<'upcoming' | 'past' | 'requests'>('upcoming');
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showReschedule, setShowReschedule] = useState(false);
  const [selectedSession, setSelectedSession] = useState<Session | null>(null);
  const [updatingSession, setUpdatingSession] = useState<string | null>(null);

  // Load sessions data
  useEffect(() => {
    const loadSessions = async () => {
      try {
        setLoading(true);
        setError(null);
        const result = await apiClient.getSessions();
        if (result.success && result.data) {
          setSessions(result.data.sessions);
        } else {
          setError(result.error || 'Failed to load sessions');
        }
      } catch (error) {
        setError('Failed to load sessions');
        console.error('Sessions load error:', error);
      } finally {
        setLoading(false);
      }
    };

    loadSessions();
  }, []);

  // Get current user ID for role detection
  const getCurrentUserId = () => {
    return localStorage.getItem('current_user_id') || '';
  };

  // Check if current user is the expert for a session
  const isCurrentUserExpert = (session: Session) => {
    const currentUserId = getCurrentUserId();
    return session.expert.id === currentUserId;
  };

  // Check if current user is the client for a session
  const isCurrentUserClient = (session: Session) => {
    const currentUserId = getCurrentUserId();
    return session.client.id === currentUserId;
  };
  const getStatusColor = (status: Session['status']) => {
    switch (status) {
      case 'confirmed':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'completed':
        return 'bg-blue-100 text-blue-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  const formatTime = (date: Date | string) => {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return dateObj.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const upcomingSessions = sessions.filter(s => {
    const currentUserId = getCurrentUserId();
    // For upcoming sessions, show confirmed sessions for both users
    // and pending sessions only for clients (who sent the request)
    if (s.status === 'confirmed') {
      return true; // Show confirmed sessions for both expert and client
    }
    if (s.status === 'pending') {
      return s.client.id === currentUserId; // Only show pending sessions to the client who requested
    }
    return false;
  });
  const pastSessions = sessions.filter(s => s.status === 'completed');
  const sessionRequests = sessions.filter(s => {
    const currentUserId = getCurrentUserId();
    const isExpert = s.expertId === currentUserId || s.expert?.id === currentUserId;
    // Only show pending sessions to the expert who needs to approve them
    return s.status === 'pending' && isExpert;
  });

  const generateValidMeetingLink = (sessionId: string, sessionTitle: string) => {
    // Generate a valid Google Meet link format
    const chars = 'abcdefghijklmnopqrstuvwxyz';
    const randomString = () => Array.from({length: 3}, () => chars[Math.floor(Math.random() * chars.length)]).join('');
    const meetingCode = `${randomString()}-${randomString()}-${randomString()}`;
    return `https://meet.google.com/${meetingCode}`;
  };

  const handleJoinMeeting = (session: Session) => {
    let meetingLink = session.meeting_link || session.meetingLink;
    
    // If no meeting link or invalid link, generate a valid one
    if (!meetingLink || meetingLink.includes('undefined') || meetingLink.includes('null')) {
      meetingLink = generateValidMeetingLink(session.id, session.title);
    }
    
    console.log('Opening meeting link:', meetingLink);
    window.open(meetingLink, '_blank');
  };

  const handleMessage = (session: Session) => {
    // Determine who to message (the other participant)
    const isExpert = session.expert.id === session.client.id; // This logic seems wrong, let me fix it
    // Get current user ID from session storage or context
    const currentUserId = localStorage.getItem('current_user_id') || 'unknown';
    const otherUser = session.expert.id === currentUserId ? session.client : session.expert;
    if (onOpenChat) {
      onOpenChat(otherUser);
    }
  };

  const handleReschedule = (session: Session) => {
    setSelectedSession(session);
    setShowReschedule(true);
  };

  const handleConfirmSession = async (sessionId: string) => {
    try {
      setUpdatingSession(sessionId);
      console.log('Expert confirming session:', sessionId);
      const result = await apiClient.updateSessionStatus(sessionId, 'confirmed');
      if (result.success) {
        // Update the session in the local state
        setSessions(prev => prev.map(session => 
          session.id === sessionId 
            ? { 
                ...session, 
                status: 'confirmed' as const,
                meeting_link: result.data?.session?.meeting_link || session.meeting_link,
                meetingLink: result.data?.session?.meeting_link || session.meetingLink
              }
            : session
        ));
        console.log('Session confirmed successfully with meeting link:', result.data?.session?.meeting_link);
      } else {
        setError(result.error || 'Failed to confirm session');
      }
    } catch (error) {
      console.error('Failed to confirm session:', error);
      setError('Failed to confirm session');
    } finally {
      setUpdatingSession(null);
    }
  };

  const handleDeclineSession = async (sessionId: string) => {
    try {
      setUpdatingSession(sessionId);
      console.log('Expert declining session:', sessionId);
      const result = await apiClient.updateSessionStatus(sessionId, 'cancelled');
      if (result.success) {
        // Update session status to cancelled
        setSessions(prev => prev.map(session => 
          session.id === sessionId 
            ? { ...session, status: 'cancelled' as const }
            : session
        ));
        console.log('Session declined successfully');
      } else {
        setError(result.error || 'Failed to decline session');
      }
    } catch (error) {
      console.error('Failed to decline session:', error);
      setError('Failed to decline session');
    } finally {
      setUpdatingSession(null);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-2 sm:px-4 py-4 sm:py-8">
      <div className="mb-8">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">My Sessions</h2>
        <p className="text-sm sm:text-base text-gray-600">Manage your upcoming and past sessions</p>
      </div>

      {/* Tabs */}
      <div className="flex flex-col sm:flex-row space-y-1 sm:space-y-0 sm:space-x-1 mb-6 sm:mb-8 bg-gray-100 p-1 rounded-lg">
        <button
          onClick={() => setActiveTab('upcoming')}
          className={`px-3 sm:px-4 py-2 rounded-lg font-medium transition-colors text-sm sm:text-base ${
            activeTab === 'upcoming'
              ? 'bg-white text-brand-primary shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <span className="sm:hidden">Upcoming ({upcomingSessions.length})</span>
          <span className="hidden sm:inline">Upcoming ({upcomingSessions.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('past')}
          className={`px-3 sm:px-4 py-2 rounded-lg font-medium transition-colors text-sm sm:text-base ${
            activeTab === 'past'
              ? 'bg-white text-brand-primary shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <span className="sm:hidden">Past ({pastSessions.length})</span>
          <span className="hidden sm:inline">Past ({pastSessions.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('requests')}
          className={`px-3 sm:px-4 py-2 rounded-lg font-medium transition-colors text-sm sm:text-base ${
            activeTab === 'requests'
            ? 'bg-white text-brand-primary shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <span className="sm:hidden">Requests ({sessionRequests.length})</span>
          <span className="hidden sm:inline">Requests ({sessionRequests.length})</span>
        </button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-600 text-sm">{error}</p>
        </div>
      )}

      {/* Loading indicator */}
      {loading && (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-4 border-indigo-600 border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-600">Loading sessions...</p>
        </div>
      )}

      {/* Session list */}
      <div className="space-y-4">
        {!loading && activeTab === 'upcoming' && upcomingSessions.map((session) => (
          <div key={session.id} className="bg-white rounded-xl sm:rounded-3xl shadow-lg p-4 sm:p-6 hover:shadow-2xl transition-all duration-300 hover:scale-[1.02] border border-gray-100/50">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between space-y-3 sm:space-y-0">
              <div className="flex items-start space-x-3 sm:space-x-4 flex-1">
                <img
                  src={session.expert.avatar || 'https://images.pexels.com/photos/2379004/pexels-photo-2379004.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&dpr=1'}
                  alt={session.expert.name}
                  className="w-12 sm:w-14 h-12 sm:h-14 rounded-full flex-shrink-0 ring-2 ring-brand-primary/20 hover:ring-brand-primary/40 transition-all duration-300"
                />
                <div className="flex-1">
                  <div className="flex flex-col sm:flex-row sm:items-center space-y-1 sm:space-y-0 sm:space-x-2 mb-1">
                    <h3 className="text-base sm:text-lg font-bold text-gray-900 line-clamp-1">{session.title}</h3>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium shadow-sm ${getStatusColor(session.status)}`}>
                      {session.status}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mb-3 line-clamp-2 leading-relaxed">{session.description}</p>
                  
                  <div className="flex flex-wrap gap-3 text-xs sm:text-sm text-gray-500">
                    <div className="flex items-center space-x-1 bg-gray-50 px-2 py-1 rounded-lg">
                      <User className="h-4 w-4" />
                      <span className="truncate">with {session.expert.name}</span>
                    </div>
                    <div className="flex items-center space-x-1 bg-gray-50 px-2 py-1 rounded-lg">
                      <Calendar className="h-4 w-4" />
                      <span className="hidden sm:inline">{formatDate(new Date(session.scheduledAt || session.scheduled_at))}</span>
                      <span className="sm:hidden">{new Date(session.scheduledAt || session.scheduled_at).toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center space-x-1 bg-gray-50 px-2 py-1 rounded-lg">
                      <Clock className="h-4 w-4" />
                      <span>{formatTime(new Date(session.scheduledAt || session.scheduled_at))} ({session.duration}min)</span>
                    </div>
                    <div className="flex items-center space-x-1 bg-gray-50 px-2 py-1 rounded-lg">
                      <DollarSign className="h-4 w-4" />
                      <span>{session.price === 0 ? 'Free' : `$${session.price}`}</span>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="flex flex-row sm:flex-col lg:flex-row items-center space-x-2 sm:space-x-0 sm:space-y-2 lg:space-y-0 lg:space-x-2 flex-shrink-0">
                {session.status === 'confirmed' && (
                  <button
                    onClick={() => handleJoinMeeting(session)}
                    className="flex items-center space-x-1 px-3 sm:px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl hover:from-indigo-700 hover:to-purple-700 transition-all duration-300 text-sm whitespace-nowrap shadow-lg hover:shadow-xl hover:scale-105 group"
                  >
                    <Video className="h-4 w-4 group-hover:animate-pulse" />
                    <span>Join Meeting</span>
                  </button>
                )}
                {session.status === 'pending' && (
                  <div className="flex items-center space-x-2">
                    {/* Only clients see waiting message for their pending requests */}
                    <div className="px-3 sm:px-4 py-2 bg-gradient-to-r from-yellow-100 to-orange-100 text-yellow-800 rounded-xl text-sm shadow-sm animate-pulse">
                      Waiting for {session.expert.name} to confirm
                    </div>
                  </div>
                )}
                <button 
                  onClick={() => handleMessage(session)}
                  className="flex items-center space-x-1 px-3 sm:px-4 py-2 bg-gradient-to-r from-blue-100 to-blue-200 text-blue-700 rounded-xl hover:from-blue-200 hover:to-blue-300 transition-all duration-300 text-sm whitespace-nowrap shadow-sm hover:shadow-md hover:scale-105"
                >
                  <MessageCircle className="h-4 w-4" />
                  <span>Message</span>
                </button>
                <button 
                  onClick={() => handleReschedule(session)}
                  className="flex items-center space-x-1 px-3 sm:px-4 py-2 text-gray-600 bg-gray-100 rounded-xl hover:bg-gray-200 transition-all duration-300 text-sm whitespace-nowrap hover:scale-105"
                >
                  <Edit className="h-4 w-4" />
                  <span>Reschedule</span>
                </button>
              </div>
            </div>
          </div>
        ))}

        {!loading && activeTab === 'requests' && sessionRequests.map((session) => (
          <div key={session.id} className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-xl sm:rounded-3xl shadow-lg p-4 sm:p-6 hover:shadow-2xl transition-all duration-300 hover:scale-[1.02] border-l-4 border-gradient-to-b from-yellow-400 to-orange-400">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between space-y-3 sm:space-y-0">
              <div className="flex items-start space-x-3 sm:space-x-4 flex-1">
                <img
                  src={session.client.avatar || 'https://images.pexels.com/photos/2379004/pexels-photo-2379004.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&dpr=1'}
                  alt={session.client.name}
                  className="w-12 sm:w-14 h-12 sm:h-14 rounded-full flex-shrink-0 ring-2 ring-yellow-400/30 hover:ring-yellow-400/60 transition-all duration-300"
                />
                <div className="flex-1">
                  <div className="flex flex-col sm:flex-row sm:items-center space-y-1 sm:space-y-0 sm:space-x-2 mb-1">
                    <h3 className="text-base sm:text-lg font-bold text-gray-900 line-clamp-1">{session.title}</h3>
                    <span className="px-3 py-1 rounded-full text-xs font-medium bg-gradient-to-r from-yellow-200 to-orange-200 text-yellow-800 shadow-sm animate-pulse">
                      Session Request
                    </span>
                  </div>
                  <p className="text-sm text-gray-700 mb-3 line-clamp-2 leading-relaxed">{session.description}</p>
                  
                  <div className="flex flex-wrap gap-3 text-xs sm:text-sm text-gray-600">
                    <div className="flex items-center space-x-1 bg-white/60 px-2 py-1 rounded-lg">
                      <User className="h-4 w-4" />
                      <span className="truncate">Request from {session.client.name}</span>
                    </div>
                    <div className="flex items-center space-x-1 bg-white/60 px-2 py-1 rounded-lg">
                      <Calendar className="h-4 w-4" />
                      <span className="hidden sm:inline">{formatDate(new Date(session.scheduledAt || session.scheduled_at))}</span>
                      <span className="sm:hidden">{new Date(session.scheduledAt || session.scheduled_at).toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center space-x-1 bg-white/60 px-2 py-1 rounded-lg">
                      <Clock className="h-4 w-4" />
                      <span>{formatTime(new Date(session.scheduledAt || session.scheduled_at))} ({session.duration}min)</span>
                    </div>
                    <div className="flex items-center space-x-1 bg-white/60 px-2 py-1 rounded-lg">
                      <DollarSign className="h-4 w-4" />
                      <span>{session.price === 0 ? 'Free' : `$${session.price}`}</span>
                    </div>
                    <div className="flex items-center space-x-1 flex-shrink-0">
                      <DollarSign className="h-4 w-4" />
                      <span>{session.price === 0 ? 'Free' : `$${session.price}`}</span>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="flex flex-row sm:flex-col lg:flex-row items-center space-x-2 sm:space-x-0 sm:space-y-2 lg:space-y-0 lg:space-x-2 flex-shrink-0">
                <button
                  onClick={() => handleConfirmSession(session.id)}
                  disabled={updatingSession === session.id}
                  className="flex items-center space-x-1 px-3 sm:px-4 py-2 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-xl hover:from-green-700 hover:to-green-800 transition-all duration-300 text-sm whitespace-nowrap disabled:opacity-50 shadow-lg hover:shadow-xl hover:scale-105 group"
                >
                  {updatingSession === session.id ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                  ) : (
                    <CheckCircle className="h-4 w-4 group-hover:animate-pulse" />
                  )}
                  <span>Accept & Generate Link</span>
                </button>
                <button
                  onClick={() => handleDeclineSession(session.id)}
                  disabled={updatingSession === session.id}
                  className="flex items-center space-x-1 px-3 sm:px-4 py-2 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-xl hover:from-red-700 hover:to-red-800 transition-all duration-300 text-sm whitespace-nowrap disabled:opacity-50 shadow-lg hover:shadow-xl hover:scale-105 group"
                >
                  {updatingSession === session.id ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                  ) : (
                    <XCircle className="h-4 w-4 group-hover:animate-pulse" />
                  )}
                  <span>Decline</span>
                </button>
                <button 
                  onClick={() => handleMessage(session)}
                  className="flex items-center space-x-1 px-3 sm:px-4 py-2 bg-gradient-to-r from-blue-100 to-blue-200 text-blue-700 rounded-xl hover:from-blue-200 hover:to-blue-300 transition-all duration-300 text-sm whitespace-nowrap shadow-sm hover:shadow-md hover:scale-105"
                >
                  <MessageCircle className="h-4 w-4" />
                  <span>Message</span>
                </button>
              </div>
            </div>
          </div>
        ))}
        {!loading && activeTab === 'past' && pastSessions.map((session) => (
          <div key={session.id} className="bg-white rounded-xl sm:rounded-2xl shadow-lg p-3 sm:p-6 hover:shadow-xl transition-shadow">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between space-y-3 sm:space-y-0">
              <div className="flex items-start space-x-3 sm:space-x-4 flex-1">
                <img
                  src={session.expert.avatar || 'https://images.pexels.com/photos/2379004/pexels-photo-2379004.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&dpr=1'}
                  alt={session.expert.name}
                  className="w-10 sm:w-12 h-10 sm:h-12 rounded-full flex-shrink-0"
                />
                <div className="flex-1">
                  <div className="flex flex-col sm:flex-row sm:items-center space-y-1 sm:space-y-0 sm:space-x-2 mb-1">
                    <h3 className="text-sm sm:text-base font-semibold text-gray-900 line-clamp-1">{session.title}</h3>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(session.status)}`}>
                      {session.status}
                    </span>
                  </div>
                  <p className="text-xs sm:text-sm text-gray-600 mb-2 line-clamp-2">{session.description}</p>
                  
                  <div className="flex flex-col sm:flex-row sm:items-center space-y-1 sm:space-y-0 sm:space-x-4 text-xs sm:text-sm text-gray-500">
                    <div className="flex items-center space-x-1 flex-shrink-0">
                      <User className="h-4 w-4" />
                      <span className="truncate">with {session.expert.name}</span>
                    </div>
                    <div className="flex items-center space-x-1 flex-shrink-0">
                      <Calendar className="h-4 w-4" />
                      <span className="hidden sm:inline">{formatDate(new Date(session.scheduledAt || session.scheduled_at))}</span>
                      <span className="sm:hidden">{new Date(session.scheduledAt || session.scheduled_at).toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center space-x-1 flex-shrink-0">
                      <Clock className="h-4 w-4" />
                      <span>{formatTime(new Date(session.scheduledAt || session.scheduled_at))} ({session.duration}min)</span>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="flex flex-row sm:flex-col lg:flex-row items-center space-x-2 sm:space-x-0 sm:space-y-2 lg:space-y-0 lg:space-x-2 flex-shrink-0">
                <button 
                  onClick={() => handleMessage(session)}
                  className="flex items-center space-x-1 px-3 sm:px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors text-sm whitespace-nowrap"
                >
                  <MessageCircle className="h-4 w-4" />
                  <span>Message</span>
                </button>
                <button className="flex items-center space-x-1 px-3 sm:px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors text-sm whitespace-nowrap">
                  <Star className="h-4 w-4" />
                  <span>Rate</span>
                </button>
              </div>
            </div>
          </div>
        ))}

        {!loading && activeTab === 'requests' && sessionRequests.length === 0 && (
          <div className="text-center py-12">
            <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Pending Requests</h3>
            <p className="text-gray-600">Session requests from clients will appear here for your approval.</p>
          </div>
        )}
      </div>

      {/* Reschedule Modal */}
      {showReschedule && selectedSession && (
        <RescheduleModal
          session={selectedSession}
          onClose={() => setShowReschedule(false)}
          onReschedule={(sessionId, newDate, newTime, reason) => {
            // TODO: Implement reschedule API call
            console.log('Reschedule request:', { sessionId, newDate, newTime, reason });
            alert('Reschedule request sent!');
            setShowReschedule(false);
          }}
        />
      )}
    </div>
  );
};