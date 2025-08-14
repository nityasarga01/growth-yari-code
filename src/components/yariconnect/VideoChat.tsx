import React from 'react';
import { User, Video, VideoOff, Mic, MicOff } from 'lucide-react';

interface VideoChatProps {
  currentUser: User;
  connectedUser: User;
  isVideoEnabled: boolean;
  isAudioEnabled: boolean;
  connectionTime: number;
}

export const VideoChat: React.FC<VideoChatProps> = ({
  currentUser,
  connectedUser,
  isVideoEnabled,
  isAudioEnabled,
  connectionTime
}) => {
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="relative aspect-video bg-gray-900">
      {/* Main video area - Connected user */}
      <div className="w-full h-full relative">
        {isVideoEnabled ? (
          <div className="w-full h-full bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center">
            <img
              src={connectedUser.avatar}
              alt={connectedUser.name}
              className="w-32 h-32 rounded-full border-4 border-white shadow-lg"
            />
          </div>
        ) : (
          <div className="w-full h-full bg-gray-800 flex items-center justify-center">
            <div className="text-center text-white">
              <VideoOff className="h-16 w-16 mx-auto mb-4 opacity-60" />
              <p className="text-lg font-medium">{connectedUser.name}</p>
              <p className="text-gray-300">Video is off</p>
            </div>
          </div>
        )}

        {/* Connected user info overlay */}
        <div className="absolute bottom-4 left-4 bg-black bg-opacity-50 text-white px-3 py-2 rounded-lg">
          <div className="flex items-center space-x-2">
            <span className="text-sm font-medium">{connectedUser.name}</span>
            {!isAudioEnabled && <MicOff className="h-4 w-4 text-red-400" />}
          </div>
          <p className="text-xs text-gray-300">{connectedUser.profession}</p>
        </div>

        {/* Connection time */}
        <div className="absolute top-4 left-4 bg-black bg-opacity-50 text-white px-3 py-2 rounded-lg">
          <span className="text-sm font-mono">{formatTime(connectionTime)}</span>
        </div>
      </div>

      {/* Picture-in-picture - Current user */}
      <div className="absolute bottom-4 right-4 w-32 h-24 bg-gray-800 rounded-lg overflow-hidden border-2 border-white shadow-lg">
        {isVideoEnabled ? (
          <div className="w-full h-full bg-gradient-to-br from-green-500 to-blue-500 flex items-center justify-center">
            <img
              src={currentUser.avatar}
              alt={currentUser.name}
              className="w-12 h-12 rounded-full"
            />
          </div>
        ) : (
          <div className="w-full h-full bg-gray-700 flex items-center justify-center">
            <VideoOff className="h-6 w-6 text-gray-400" />
          </div>
        )}
        
        {/* Current user status */}
        <div className="absolute bottom-1 left-1 right-1">
          <div className="flex items-center justify-between">
            <span className="text-xs text-white font-medium truncate">You</span>
            <div className="flex items-center space-x-1">
              {!isVideoEnabled && <VideoOff className="h-3 w-3 text-red-400" />}
              {!isAudioEnabled && <MicOff className="h-3 w-3 text-red-400" />}
            </div>
          </div>
        </div>
      </div>

      {/* Connection status indicator */}
      <div className="absolute top-4 right-4">
        <div className="flex items-center space-x-2 bg-green-500 text-white px-3 py-1 rounded-full text-sm">
          <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
          <span>Connected</span>
        </div>
      </div>
    </div>
  );
};