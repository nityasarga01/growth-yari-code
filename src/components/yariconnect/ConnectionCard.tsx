import React from 'react';
import { MapPin, Briefcase, Star, Award, MessageCircle, UserPlus } from 'lucide-react';
import { User } from '../../types';

interface ConnectionCardProps {
  user: User;
}

export const ConnectionCard: React.FC<ConnectionCardProps> = ({ user }) => {
  return (
    <div className="bg-white rounded-2xl shadow-lg p-6">
      <div className="text-center mb-4">
        <img
          src={user.avatar}
          alt={user.name}
          className="w-20 h-20 rounded-full mx-auto mb-3"
        />
        <h3 className="text-lg font-semibold text-gray-900">{user.name}</h3>
        <p className="text-gray-600 text-sm">{user.profession}</p>
        
        <div className="flex items-center justify-center space-x-2 mt-2">
          <Star className="h-4 w-4 text-yellow-500 fill-current" />
          <span className="text-sm font-medium">{user.rating}</span>
          <span className="text-sm text-gray-500">({user.reviewCount})</span>
          {user.isVerified && (
            <Award className="h-4 w-4 text-green-500" />
          )}
        </div>
      </div>

      {/* Location & Experience */}
      <div className="space-y-2 mb-4">
        {(user as any).location && (
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <MapPin className="h-4 w-4" />
            <span>{(user as any).location}</span>
          </div>
        )}
        {(user as any).experience && (
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <Briefcase className="h-4 w-4" />
            <span>{(user as any).experience} experience</span>
          </div>
        )}
      </div>

      {/* Bio */}
      <p className="text-sm text-gray-600 mb-4 line-clamp-3">{user.bio}</p>

      {/* Expertise */}
      <div className="mb-4">
        <h4 className="text-sm font-medium text-gray-900 mb-2">Expertise</h4>
        <div className="flex flex-wrap gap-1">
          {user.expertise.slice(0, 3).map((skill, index) => (
            <span
              key={index}
              className="px-2 py-1 bg-indigo-100 text-indigo-700 text-xs rounded-full"
            >
              {skill}
            </span>
          ))}
          {user.expertise.length > 3 && (
            <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
              +{user.expertise.length - 3}
            </span>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex space-x-2">
        <button className="flex-1 flex items-center justify-center space-x-1 px-3 py-2 bg-green-100 text-green-700 rounded-lg text-sm font-medium hover:bg-green-200 transition-colors">
          <UserPlus className="h-4 w-4" />
          <span>Connect</span>
        </button>
        <button className="flex-1 flex items-center justify-center space-x-1 px-3 py-2 bg-indigo-100 text-indigo-700 rounded-lg text-sm font-medium hover:bg-indigo-200 transition-colors">
          <MessageCircle className="h-4 w-4" />
          <span>Message</span>
        </button>
      </div>
    </div>
  );
};