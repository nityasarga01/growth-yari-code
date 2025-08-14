import React, { useState, useEffect } from 'react';
import { Video, VideoOff, Mic, MicOff, Phone, SkipForward, Filter, Users, MapPin, Briefcase, Clock, Star, Settings } from 'lucide-react';
import { User } from '../../types';
import { YariConnectFilters } from './YariConnectFilters';
import { ConnectionCard } from './ConnectionCard';
import { VideoChat } from './VideoChat';
import { apiClient } from '../../config/api';

interface YariConnectViewProps {
  currentUser: User;
}

export const YariConnectView: React.FC<YariConnectViewProps> = ({ currentUser }) => {
  const [isConnecting, setIsConnecting] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [currentMatch, setCurrentMatch] = useState<User | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [connectionTime, setConnectionTime] = useState(0);
  const [matchingQueue, setMatchingQueue] = useState<User[]>([]);
  const [currentQueueIndex, setCurrentQueueIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Filter states
  const [filters, setFilters] = useState({
    jobProfile: 'all',
    field: 'all',
    location: 'all',
    experience: 'all',
    availability: 'all'
  });

  // Start matching process
  const startMatching = async () => {
    try {
      setLoading(true);
      setError(null);
      setIsConnecting(true);
      
      const result = await apiClient.getYariConnectProfessionals(filters);
      if (result.success && result.data) {
        const professionals = result.data.professionals;
        if (professionals.length === 0) {
          setError('No professionals found matching your criteria. Please adjust your filters.');
          setIsConnecting(false);
          return;
        }
        
        setMatchingQueue(professionals);
        setCurrentQueueIndex(0);
        
        // Simulate connection delay
        setTimeout(() => {
          setIsConnecting(false);
          setIsConnected(true);
          setCurrentMatch(professionals[0]);
          setConnectionTime(0);
        }, 2000);
      } else {
        setError(result.error || 'Failed to find professionals');
        setIsConnecting(false);
      }
    } catch (error) {
      setError('Failed to start matching');
      setIsConnecting(false);
      console.error('Matching error:', error);
    } finally {
      setLoading(false);
    }
  };

  // Load YariConnect stats
  useEffect(() => {
    const loadStats = async () => {
      try {
        const result = await apiClient.getYariConnectStats();
        if (result.success && result.data) {
          // Update stats display if needed
          console.log('YariConnect stats:', result.data);
        }
      } catch (error) {
        console.error('Failed to load YariConnect stats:', error);
      }
    };

    loadStats();
  }, []);

  // Skip to next person
  const skipToNext = () => {
    if (matchingQueue.length === 0) return;
    
    setIsConnecting(true);
    setIsConnected(false);
    setCurrentMatch(null);
    
    setTimeout(() => {
      const nextIndex = (currentQueueIndex + 1) % matchingQueue.length;
      setCurrentQueueIndex(nextIndex);
      setCurrentMatch(matchingQueue[nextIndex]);
      setIsConnecting(false);
      setIsConnected(true);
      setConnectionTime(0);
    }, 1500);
  };

  // End connection
  const endConnection = () => {
    setIsConnected(false);
    setIsConnecting(false);
    setCurrentMatch(null);
    setConnectionTime(0);
  };

      {/* Error Message */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-600 text-sm">{error}</p>
          <button onClick={() => setError(null)} className="text-red-700 underline text-sm mt-2">
            Dismiss
          </button>
        </div>
      )}

  // Timer for connection duration
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isConnected) {
      interval = setInterval(() => {
        setConnectionTime(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isConnected]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Upcoming Feature Banner */}
      <div className="mb-8 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xl font-bold mb-2">🚀 YariConnect - Coming Soon!</h3>
            <p className="text-indigo-100">
              Real-time video connections with professionals worldwide. Connect instantly, learn faster, grow together.
            </p>
          </div>
          <div className="hidden md:block">
            <div className="bg-white bg-opacity-20 rounded-lg p-4">
              <Video className="h-12 w-12 text-white opacity-80" />
            </div>
          </div>
        </div>
        <div className="mt-4 flex items-center space-x-4 text-sm text-indigo-100">
          <span>✨ Instant matching</span>
          <span>🎥 HD video calls</span>
          <span>🌍 Global network</span>
          <span>⚡ Real-time connections</span>
        </div>
      </div>

      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">YariConnect</h2>
            <p className="text-gray-600">Preview the future of professional networking</p>
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center space-x-2 px-4 py-2 bg-indigo-100 text-indigo-700 rounded-lg hover:bg-indigo-200 transition-colors"
          >
            <Filter className="h-5 w-5" />
            <span>Filters</span>
          </button>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-600 text-sm">{error}</p>
          <button onClick={() => setError(null)} className="text-red-700 underline text-sm mt-2">
            Dismiss
          </button>
        </div>
      )}

      {/* Filters Panel */}
      {showFilters && (
        <YariConnectFilters
          filters={filters}
          onFiltersChange={setFilters}
          onClose={() => setShowFilters(false)}
        />
      )}

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Video Chat Area */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
            {!isConnected && !isConnecting ? (
              /* Start Screen */
              <div className="aspect-video bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center">
                <div className="text-center text-white">
                  <Video className="h-16 w-16 mx-auto mb-4 opacity-80" />
                  <h3 className="text-2xl font-bold mb-2">Ready to Connect?</h3>
                  <p className="text-indigo-100 mb-6">
                    Click start to begin connecting with professionals
                  </p>
                  <button
                    onClick={startMatching}
                    disabled={loading}
                    className="px-8 py-3 bg-white text-indigo-600 rounded-lg font-semibold hover:bg-gray-100 transition-colors disabled:opacity-50"
                  >
                    {loading ? 'Loading...' : 'Start Connecting'}
                  </button>
                </div>
              </div>
            ) : isConnecting ? (
              /* Connecting Screen */
              <div className="aspect-video bg-gray-900 flex items-center justify-center">
                <div className="text-center text-white">
                  <div className="animate-spin rounded-full h-16 w-16 border-4 border-white border-t-transparent mx-auto mb-4"></div>
                  <h3 className="text-xl font-semibold mb-2">Connecting...</h3>
                  <p className="text-gray-300">Finding the perfect professional match</p>
                </div>
              </div>
            ) : (
              /* Video Chat */
              <VideoChat
                currentUser={currentUser}
                connectedUser={currentMatch!}
                isVideoEnabled={isVideoEnabled}
                isAudioEnabled={isAudioEnabled}
                connectionTime={connectionTime}
              />
            )}

            {/* Controls */}
            {isConnected && (
              <div className="p-4 bg-gray-50 border-t">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                    <Clock className="h-4 w-4" />
                    <span>{formatTime(connectionTime)}</span>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <button
                      onClick={() => setIsVideoEnabled(!isVideoEnabled)}
                      className={`p-3 rounded-full transition-colors ${
                        isVideoEnabled 
                          ? 'bg-gray-200 text-gray-700 hover:bg-gray-300' 
                          : 'bg-red-500 text-white hover:bg-red-600'
                      }`}
                    >
                      {isVideoEnabled ? <Video className="h-5 w-5" /> : <VideoOff className="h-5 w-5" />}
                    </button>
                    
                    <button
                      onClick={() => setIsAudioEnabled(!isAudioEnabled)}
                      className={`p-3 rounded-full transition-colors ${
                        isAudioEnabled 
                          ? 'bg-gray-200 text-gray-700 hover:bg-gray-300' 
                          : 'bg-red-500 text-white hover:bg-red-600'
                      }`}
                    >
                      {isAudioEnabled ? <Mic className="h-5 w-5" /> : <MicOff className="h-5 w-5" />}
                    </button>
                    
                    <button
                      onClick={skipToNext}
                      className="p-3 bg-yellow-500 text-white rounded-full hover:bg-yellow-600 transition-colors"
                    >
                      <SkipForward className="h-5 w-5" />
                    </button>
                    
                    <button
                      onClick={endConnection}
                      className="p-3 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                    >
                      <Phone className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Current Connection Info */}
          {currentMatch && isConnected && (
            <ConnectionCard user={currentMatch} />
          )}

          {/* Stats */}
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Session Stats</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Available Matches</span>
                <span className="font-semibold">{matchingQueue.length}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Connection Time</span>
                <span className="font-semibold">{formatTime(connectionTime)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Status</span>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  isConnected ? 'bg-green-100 text-green-800' : 
                  isConnecting ? 'bg-yellow-100 text-yellow-800' : 
                  'bg-gray-100 text-gray-800'
                }`}>
                  {isConnected ? 'Connected' : isConnecting ? 'Connecting' : 'Idle'}
                </span>
              </div>
            </div>
          </div>

          {/* Tips */}
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Connection Tips</h3>
            <div className="space-y-3 text-sm text-gray-600">
              <div className="flex items-start space-x-2">
                <div className="w-2 h-2 bg-indigo-500 rounded-full mt-2 flex-shrink-0"></div>
                <p>Be respectful and professional in all interactions</p>
              </div>
              <div className="flex items-start space-x-2">
                <div className="w-2 h-2 bg-indigo-500 rounded-full mt-2 flex-shrink-0"></div>
                <p>Introduce yourself and your professional background</p>
              </div>
              <div className="flex items-start space-x-2">
                <div className="w-2 h-2 bg-indigo-500 rounded-full mt-2 flex-shrink-0"></div>
                <p>Ask meaningful questions about their expertise</p>
              </div>
              <div className="flex items-start space-x-2">
                <div className="w-2 h-2 bg-indigo-500 rounded-full mt-2 flex-shrink-0"></div>
                <p>Use filters to find professionals in your field of interest</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};