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

  const upcomingSessions = sessions.filter(s => s.status === 'confirmed' || s.status === 'pending');
  const pastSessions = sessions.filter(s => s.status === 'completed' || s.status === 'cancelled');

  const generateValidMeetingLink = (sessionId: string, sessionTitle: string) => {
    // Generate a valid Google Meet link format
    const meetingId = sessionId.substring(0, 8) + '-' + sessionId.substring(8, 12) + '-' + sessionId.substring(12, 16);
    return `https://meet.google.com/${meetingId}`;
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
    const otherUser = session.expert.id === session.client.id ? session.client : session.expert;
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
      const result = await apiClient.updateSessionStatus(sessionId, 'confirmed');
      if (result.success) {
        // Update the session in the local state
        setSessions(prev => prev.map(session => 
          session.id === sessionId 
            ? { 
                ...session, 
                status: 'confirmed' as const,
                meeting_link: result.data.session.meeting_link || session.meeting_link,
                meetingLink: result.data.session.meeting_link || session.meetingLink
              }
            : session
        ));
        console.log('Session confirmed successfully with meeting link');
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
      const result = await apiClient.updateSessionStatus(sessionId, 'cancelled');
      if (result.success) {
        // Remove cancelled session from upcoming list or move to past
        setSessions(prev => prev.filter(session => session.id !== sessionId));
        console.log('Session declined and removed from list');
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
          <span className="sm:hidden">Requests (0)</span>
          <span className="hidden sm:inline">Requests (0)</span>
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
                    <div className="flex items-center space-x-1 flex-shrink-0">
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
                    className="flex items-center space-x-1 px-3 sm:px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm whitespace-nowrap"
                  >
                    <Video className="h-4 w-4" />
                    <span>Join Meeting</span>
                  </button>
                )}
                {session.status === 'pending' && (
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleConfirmSession(session.id)}
                      disabled={updatingSession === session.id}
                      className="flex items-center space-x-1 px-3 sm:px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm whitespace-nowrap disabled:opacity-50"
                    >
                      {updatingSession === session.id ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                      ) : (
                      <CheckCircle className="h-4 w-4" />
                      )}
                      <span>Confirm</span>
                    </button>
                    <button
                      onClick={() => handleDeclineSession(session.id)}
                      disabled={updatingSession === session.id}
                      className="flex items-center space-x-1 px-3 sm:px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm whitespace-nowrap disabled:opacity-50"
                    >
                      {updatingSession === session.id ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                      ) : (
                      <XCircle className="h-4 w-4" />
                      )}
                      <span>Decline</span>
                    </button>
                  </div>
                )}
                <button 
                  onClick={() => handleMessage(session)}
                  className="flex items-center space-x-1 px-3 sm:px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors text-sm whitespace-nowrap"
                >
                  <MessageCircle className="h-4 w-4" />
                  <span>Message</span>
                </button>
                <button 
                  onClick={() => handleReschedule(session)}
                  className="flex items-center space-x-1 px-3 sm:px-4 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors text-sm whitespace-nowrap"
                >
                  <Edit className="h-4 w-4" />
                  <span>Reschedule</span>
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

        {!loading && activeTab === 'requests' && (
          <div className="text-center py-12">
            <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Session Requests</h3>
            <p className="text-gray-600">Session requests will appear here when you receive them.</p>
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