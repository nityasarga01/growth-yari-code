import React, { useState } from 'react';
import { Heart, MessageCircle, Share, Play, Pause, UserPlus } from 'lucide-react';
import { VideoReel as VideoReelType } from '../../types';

interface VideoReelProps {
  reel: VideoReelType;
  onLike: (id: string) => void;
  onBookSession: (userId: string) => void;
  onConnect: (user: VideoReelType['user']) => void;
}

export const VideoReel: React.FC<VideoReelProps> = ({ reel, onLike, onBookSession, onConnect }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLiked, setIsLiked] = useState(false);

  const handleLike = () => {
    setIsLiked(!isLiked);
    onLike(reel.id);
  };

  const togglePlay = () => {
    setIsPlaying(!isPlaying);
  };

  return (
    <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow">
      {/* User info header */}
      <div className="p-3 sm:p-4 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <img
            src={reel.user.avatar || 'https://images.pexels.com/photos/2379004/pexels-photo-2379004.jpeg?auto=compress&cs=tinysrgb&w=40&h=40&dpr=1'}
            alt={reel.user.name}
            className="w-8 sm:w-10 h-8 sm:h-10 rounded-full"
          />
          <div>
            <h3 className="text-sm sm:text-base font-semibold text-gray-900">{reel.user.name}</h3>
            <p className="text-xs sm:text-sm text-gray-600">{reel.user.profession}</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => onConnect(reel.user)}
            className="flex items-center space-x-1 px-2 sm:px-3 py-1 sm:py-2 bg-green-100 text-green-700 rounded-lg text-xs sm:text-sm font-medium hover:bg-green-200 transition-all"
          >
            <UserPlus className="h-3 sm:h-4 w-3 sm:w-4" />
            <span className="hidden sm:inline">Connect</span>
          </button>
          <button
            onClick={() => onBookSession(reel.user.id)}
            className="px-2 sm:px-4 py-1 sm:py-2 bg-gradient-to-r from-brand-primary to-brand-secondary text-white rounded-lg text-xs sm:text-sm font-medium hover:from-brand-primary/90 hover:to-brand-secondary/90 transition-all"
          >
            <span className="hidden sm:inline">Book Session</span>
            <span className="sm:hidden">Book</span>
          </button>
        </div>
      </div>

      {/* Video thumbnail with play button */}
      <div className="relative aspect-video bg-gray-900">
        {isPlaying ? (
          <video
            src={reel.videoUrl}
            autoPlay
            loop
            className="w-full h-full object-cover"
            controls
            onError={(e) => {
              console.error('Video failed to load:', reel.videoUrl);
              setIsPlaying(false);
              // Show error message
              const errorDiv = document.createElement('div');
              errorDiv.className = 'absolute inset-0 bg-gray-800 flex items-center justify-center';
              errorDiv.innerHTML = '<p class="text-white text-sm">Video unavailable</p>';
              e.currentTarget.parentNode?.appendChild(errorDiv);
            }}
          />
        ) : (
          <img
            src={reel.thumbnail}
            alt={reel.title}
            className="w-full h-full object-cover"
            onError={(e) => {
              console.error('Thumbnail failed to load:', reel.thumbnail);
              e.currentTarget.style.display = 'none';
              const errorDiv = document.createElement('div');
              errorDiv.className = 'w-full h-full bg-gray-800 flex items-center justify-center';
              errorDiv.innerHTML = '<p class="text-white text-sm">Thumbnail unavailable</p>';
              e.currentTarget.parentNode?.appendChild(errorDiv);
            }}
          />
        )}
        <button
          onClick={togglePlay}
          className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-30 hover:bg-opacity-40 transition-all"
        >
          {!isPlaying && (
            <Play className="h-8 sm:h-12 w-8 sm:w-12 text-white" />
          )}
        </button>
      </div>

      {/* Content */}
      <div className="p-3 sm:p-4">
        <h4 className="text-sm sm:text-base font-semibold text-gray-900 mb-2">{reel.title}</h4>
        <p className="text-gray-600 text-xs sm:text-sm mb-4">{reel.description}</p>
        
        {/* Tags */}
        <div className="flex flex-wrap gap-2 mb-4">
          {reel.tags.map((tag, index) => (
            <span
              key={index}
              className="px-2 py-1 bg-brand-primary/10 text-brand-primary text-xs rounded-full"
            >
              #{tag}
            </span>
          ))}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between pt-3 sm:pt-4 border-t border-gray-100">
          <div className="flex items-center space-x-3 sm:space-x-6">
            <button
              onClick={handleLike}
              className={`flex items-center space-x-1 sm:space-x-2 text-xs sm:text-sm transition-colors ${
                isLiked ? 'text-red-500' : 'text-gray-600 hover:text-red-500'
              }`}
            >
              <Heart className={`h-4 sm:h-5 w-4 sm:w-5 ${isLiked ? 'fill-current' : ''}`} />
              <span>{(reel.likes + (isLiked ? 1 : 0)).toLocaleString()}</span>
            </button>
            <button className="flex items-center space-x-1 sm:space-x-2 text-xs sm:text-sm text-gray-600 hover:text-gray-900 transition-colors">
              <MessageCircle className="h-4 sm:h-5 w-4 sm:w-5" />
              <span>{reel.comments.toLocaleString()}</span>
            </button>
            <button className="flex items-center space-x-1 sm:space-x-2 text-xs sm:text-sm text-gray-600 hover:text-gray-900 transition-colors">
              <Share className="h-4 sm:h-5 w-4 sm:w-5" />
              <span className="hidden sm:inline">Share</span>
            </button>
          </div>
          
          <div className="flex items-center space-x-1 sm:space-x-2">
            <div className="flex items-center space-x-1">
              <span className="text-yellow-500 text-sm">★</span>
              <span className="text-xs sm:text-sm font-medium">{reel.user.rating}</span>
            </div>
            <span className="text-xs sm:text-sm text-gray-500">({reel.user.reviewCount})</span>
          </div>
        </div>
      </div>
    </div>
  );
};