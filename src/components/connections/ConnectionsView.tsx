import React, { useState } from 'react';
import { useEffect } from 'react';
import { Users, UserPlus, Clock, Check, X, Calendar, MessageCircle, Video } from 'lucide-react';
import { ConnectionRequest, Connection } from '../../types';
import { apiClient } from '../../config/api';

interface ConnectionsViewProps {
  onBookSession?: (userId: string) => void;
  onOpenChat?: (user: any) => void;
}

export const ConnectionsView: React.FC<ConnectionsViewProps> = ({ 
  onBookSession, 
  onOpenChat 
}) => {
  const [activeTab, setActiveTab] = useState<'connections' | 'requests' | 'sent'>('connections');
  const [connections, setConnections] = useState<Connection[]>([]);
  const [requests, setRequests] = useState<ConnectionRequest[]>([]);
  const [sentRequests, setSentRequests] = useState<ConnectionRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load data based on active tab
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);

        if (activeTab === 'connections') {
          console.log('Loading connections...');
          const result = await apiClient.getConnections();
          console.log('Connections API result:', result);
          if (result.success && result.data) {
            console.log('Setting connections:', result.data.connections);
            setConnections(result.data.connections);
          } else {
            console.error('Failed to load connections:', result.error);
            setError(result.error || 'Failed to load connections');
          }
        } else if (activeTab === 'requests') {
          const result = await apiClient.getConnectionRequests('received');
          if (result.success && result.data) {
            setRequests(result.data.requests);
          } else {
            setError(result.error || 'Failed to load requests');
          }
        } else if (activeTab === 'sent') {
          const result = await apiClient.getConnectionRequests('sent');
          if (result.success && result.data) {
            setSentRequests(result.data.requests);
          } else {
            setError(result.error || 'Failed to load sent requests');
          }
        }
      } catch (error) {
        setError('Failed to load data');
        console.error('Connection data load error:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [activeTab]);

  const handleAcceptRequest = (requestId: string) => {
    const acceptRequest = async () => {
      try {
        console.log('ConnectionsView: Accepting request:', requestId);
        const result = await apiClient.respondToConnectionRequest(requestId, 'accept');
        console.log('ConnectionsView: Accept result:', result);
        if (result.success) {
          // Remove from requests and reload connections
          setRequests(prev => prev.filter(req => req.id !== requestId));
          console.log('ConnectionsView: Request accepted, removed from list');
          
          // If we're on connections tab, reload to show new connection
          if (activeTab === 'connections') {
            // Reload connections data
            const connectionsResult = await apiClient.getConnections();
            if (connectionsResult.success && connectionsResult.data) {
              setConnections(connectionsResult.data.connections);
            }
          }
        } else {
          console.error('Failed to accept request:', result.error);
          setError(result.error || 'Failed to accept connection request');
        }
      } catch (error) {
        console.error('Accept request error:', error);
        setError('Failed to accept connection request');
      }
    };
    acceptRequest();
  };

  const handleDeclineRequest = (requestId: string) => {
    const declineRequest = async () => {
      try {
        console.log('ConnectionsView: Declining request:', requestId);
        const result = await apiClient.respondToConnectionRequest(requestId, 'decline');
        console.log('ConnectionsView: Decline result:', result);
        if (result.success) {
          setRequests(prev => prev.filter(req => req.id !== requestId));
          console.log('ConnectionsView: Request declined, removed from list');
        } else {
          console.error('Failed to decline request:', result.error);
          setError(result.error || 'Failed to decline connection request');
        }
      } catch (error) {
        console.error('Decline request error:', error);
        setError('Failed to decline connection request');
      }
    };
    declineRequest();
  };

  const handleScheduleFreeCall = (userId: string) => {
    console.log('Scheduling free call with:', userId);
   // This could open a simplified booking modal for free calls
   if (onBookSession) {
     onBookSession(userId);
   }
  };

  const handleBookSession = (userId: string) => {
    console.log('Booking session with:', userId);
    if (onBookSession) {
      onBookSession(userId);
    }
  };

  const handleOpenChat = (user: any) => {
    console.log('Opening chat with:', user.name);
    if (onOpenChat) {
      onOpenChat(user);
    } else {
      console.error('onOpenChat handler not provided');
    }
  };

  // Debug logging
  useEffect(() => {
    console.log('ConnectionsView - activeTab:', activeTab);
    console.log('ConnectionsView - connections:', connections.length);
    console.log('ConnectionsView - requests:', requests.length);
    console.log('ConnectionsView - loading:', loading);
    console.log('ConnectionsView - error:', error);
  }, [activeTab, connections, requests, loading, error]);

  return (
    <div className="max-w-4xl mx-auto px-2 sm:px-4 py-4 sm:py-8">
      <div className="mb-8">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">Connections</h2>
        <p className="text-sm sm:text-base text-gray-600">Manage your professional network and connection requests</p>
      </div>

      {/* Tabs */}
      <div className="flex flex-col sm:flex-row space-y-1 sm:space-y-0 sm:space-x-1 mb-6 sm:mb-8 bg-gray-100/80 backdrop-blur-sm p-1 rounded-2xl shadow-lg">
        <button
          onClick={() => setActiveTab('connections')}
          className={`px-3 sm:px-4 py-3 rounded-xl font-medium transition-all duration-300 text-sm sm:text-base hover:scale-105 ${
            activeTab === 'connections'
              ? 'bg-white text-brand-primary shadow-lg'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <div className="flex items-center justify-center sm:justify-start space-x-2">
            <Users className="h-4 w-4" />
            <span className="hidden sm:inline">My Connections ({connections.length})</span>
            <span className="sm:hidden">Connections ({connections.length})</span>
          </div>
        </button>
        <button
          onClick={() => setActiveTab('requests')}
          className={`px-3 sm:px-4 py-2 rounded-lg font-medium transition-colors text-sm sm:text-base ${
            activeTab === 'requests'
              ? 'bg-white text-brand-primary shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <div className="flex items-center justify-center sm:justify-start space-x-2">
            <UserPlus className="h-4 w-4" />
            <span>Requests ({requests.length})</span>
          </div>
        </button>
        <button
          onClick={() => setActiveTab('sent')}
          className={`px-3 sm:px-4 py-2 rounded-lg font-medium transition-colors text-sm sm:text-base ${
            activeTab === 'sent'
              ? 'bg-white text-brand-primary shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <div className="flex items-center justify-center sm:justify-start space-x-2">
            <Clock className="h-4 w-4" />
            <span>Sent ({sentRequests.length})</span>
          </div>
        </button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-600 text-sm">{error}</p>
        </div>
      )}

      {/* Loading indicator */}
      {loading && (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-6 sm:h-8 w-6 sm:w-8 border-4 border-indigo-600 border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      )}

      {/* Content */}
      <div className="space-y-3 sm:space-y-4">
        {!loading && activeTab === 'connections' && (
          <>
            {connections.map((connection) => (
              <div key={connection.id} className="bg-white rounded-2xl sm:rounded-3xl shadow-lg p-4 sm:p-6 hover:shadow-2xl transition-all duration-300 hover:scale-[1.02] border border-gray-100/50 group">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
                  <div className="flex items-center space-x-3 sm:space-x-4 flex-1 min-w-0">
                    <img
                      src={connection.user.avatar || 'https://images.pexels.com/photos/2379004/pexels-photo-2379004.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&dpr=1'}
                      alt={connection.user.name}
                      className="w-14 sm:w-16 h-14 sm:h-16 rounded-full flex-shrink-0 ring-2 ring-brand-primary/20 group-hover:ring-brand-primary/40 transition-all duration-300"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2">
                        <h3 className="text-base sm:text-lg font-bold text-gray-900 truncate">{connection.user.name}</h3>
                        {connection.user.isVerified && (
                          <div className="w-4 h-4 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full flex items-center justify-center">
                            <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          </div>
                        )}
                      </div>
                      <p className="text-sm sm:text-base text-gray-600 truncate">{connection.user.profession}</p>
                      <div className="flex items-center space-x-2 mt-1 flex-wrap">
                        <span className="text-yellow-500 animate-pulse">★</span>
                        <span className="text-xs sm:text-sm font-medium">{connection.user.rating}</span>
                        <span className="text-xs sm:text-sm text-gray-500">({connection.user.reviewCount} reviews)</span>
                      </div>
                      <p className="text-xs text-gray-500 mt-1 hidden sm:block">
                        Connected on {new Date(connection.connected_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2 sm:space-x-3 flex-shrink-0">
                    <button
                      onClick={() => handleScheduleFreeCall(connection.user.id)}
                      className="flex items-center space-x-1 sm:space-x-2 px-2 sm:px-4 py-2 bg-gradient-to-r from-green-100 to-green-200 text-green-700 rounded-xl hover:from-green-200 hover:to-green-300 transition-all duration-300 text-xs sm:text-sm shadow-sm hover:shadow-md hover:scale-105"
                    >
                      <Calendar className="h-4 w-4" />
                      <span className="hidden sm:inline">Free Call</span>
                      <span className="sm:hidden">Call</span>
                    </button>
                    <button
                      onClick={() => handleOpenChat(connection.user)}
                      className="flex items-center space-x-1 sm:space-x-2 px-2 sm:px-4 py-2 bg-gradient-to-r from-indigo-100 to-purple-100 text-indigo-700 rounded-xl hover:from-indigo-200 hover:to-purple-200 transition-all duration-300 text-xs sm:text-sm shadow-sm hover:shadow-md hover:scale-105"
                    >
                      <MessageCircle className="h-4 w-4" />
                      <span className="hidden sm:inline">Message</span>
                      <span className="sm:hidden">Chat</span>
                    </button>
                   <button
                     onClick={() => handleBookSession(connection.user.id)}
                     className="flex items-center space-x-1 sm:space-x-2 px-2 sm:px-4 py-2 bg-gradient-to-r from-brand-primary to-brand-secondary text-white rounded-xl hover:from-brand-primary/90 hover:to-brand-secondary/90 transition-all duration-300 text-xs sm:text-sm shadow-md hover:shadow-lg hover:scale-105"
                   >
                     <Video className="h-4 w-4" />
                     <span className="hidden sm:inline">Book Session</span>
                     <span className="sm:hidden">Book</span>
                   </button>
                  </div>
                </div>
                <div className="mt-4 sm:mt-5">
                  <div className="flex flex-wrap gap-2">
                    {connection.user.expertise.map((skill, index) => (
                      <span
                        key={index}
                        className="px-3 py-1 bg-gradient-to-r from-gray-100 to-gray-200 text-gray-700 text-xs sm:text-sm rounded-full hover:from-gray-200 hover:to-gray-300 transition-all duration-300 cursor-pointer"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
            {connections.length === 0 && (
              <div className="text-center py-12">
                <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Connections Yet</h3>
                <p className="text-gray-600">Start connecting with professionals to build your network.</p>
              </div>
            )}
          </>
        )}

        {!loading && activeTab === 'requests' && (
          <>
            {requests.map((request) => (
              <div key={request.id} className="bg-white rounded-xl sm:rounded-2xl shadow-lg p-3 sm:p-6 hover:shadow-xl transition-shadow">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between space-y-3 sm:space-y-0">
                  <div className="flex items-start space-x-3 sm:space-x-4 flex-1 min-w-0">
                    <img
                      src={request.sender.avatar || 'https://images.pexels.com/photos/2379004/pexels-photo-2379004.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&dpr=1'}
                      alt={request.sender.name}
                      className="w-12 sm:w-16 h-12 sm:h-16 rounded-full flex-shrink-0"
                    />
                    <div className="flex-1">
                      <h3 className="text-base sm:text-lg font-semibold text-gray-900">{request.sender.name}</h3>
                      <p className="text-sm sm:text-base text-gray-600">{request.sender.profession}</p>
                      <div className="flex items-center space-x-2 mt-1 flex-wrap">
                        <span className="text-yellow-500">★</span>
                        <span className="text-xs sm:text-sm font-medium">{request.sender.rating}</span>
                        <span className="text-xs sm:text-sm text-gray-500">({request.sender.reviewCount} reviews)</span>
                      </div>
                      <p className="text-xs text-gray-500 mt-1 hidden sm:block">
                        Sent {new Date(request.created_at).toLocaleDateString()}
                      </p>
                      {request.message && (
                        <div className="mt-2 sm:mt-3 p-2 sm:p-3 bg-gray-50 rounded-lg">
                          <p className="text-xs sm:text-sm text-gray-700">{request.message}</p>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center space-x-2 flex-shrink-0">
                    <button
                      onClick={() => handleAcceptRequest(request.id)}
                      className="flex items-center space-x-1 px-3 sm:px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-xs sm:text-sm"
                    >
                      <Check className="h-4 w-4" />
                      <span>Accept</span>
                    </button>
                    <button
                      onClick={() => handleDeclineRequest(request.id)}
                      className="flex items-center space-x-1 px-3 sm:px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-xs sm:text-sm"
                    >
                      <X className="h-4 w-4" />
                      <span>Decline</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
            {requests.length === 0 && (
              <div className="text-center py-12">
                <UserPlus className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Connection Requests</h3>
                <p className="text-gray-600">Connection requests will appear here when you receive them.</p>
              </div>
            )}
          </>
        )}

        {!loading && activeTab === 'sent' && (
          <>
            {sentRequests.map((request) => (
              <div key={request.id} className="bg-white rounded-xl sm:rounded-2xl shadow-lg p-3 sm:p-6 hover:shadow-xl transition-shadow">
                <div className="flex items-start space-x-3 sm:space-x-4">
                    <img
                      src={request.receiver.avatar || 'https://images.pexels.com/photos/2379004/pexels-photo-2379004.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&dpr=1'}
                      alt={request.receiver.name}
                      className="w-12 sm:w-16 h-12 sm:h-16 rounded-full flex-shrink-0"
                    />
                    <div className="flex-1">
                      <h3 className="text-base sm:text-lg font-semibold text-gray-900">{request.receiver.name}</h3>
                      <p className="text-sm sm:text-base text-gray-600">{request.receiver.profession}</p>
                      <p className="text-xs text-gray-500 mt-1 hidden sm:block">
                        Sent {new Date(request.created_at || request.createdAt).toLocaleDateString()}
                      </p>
                      <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium mt-1 sm:mt-2 ${
                        request.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        request.status === 'accepted' ? 'bg-green-100 text-green-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {request.status}
                      </span>
                    </div>
                </div>
              </div>
            ))}
            {sentRequests.length === 0 && (
              <div className="text-center py-12">
                <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Sent Requests</h3>
                <p className="text-gray-600">Requests you send will appear here.</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};