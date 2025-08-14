import React, { useState } from 'react';
import { X, Send, Calendar } from 'lucide-react';
import { User } from '../../types';

interface ConnectionRequestProps {
  user: User;
  onClose: () => void;
  onSendRequest: (userId: string, message: string, requestFreeCall: boolean) => void;
}

export const ConnectionRequest: React.FC<ConnectionRequestProps> = ({ user, onClose, onSendRequest }) => {
  const [message, setMessage] = useState('');
  const [requestFreeCall, setRequestFreeCall] = useState(false);

  const handleSubmit = () => {
    onSendRequest(user.id, message, requestFreeCall);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl max-w-md w-full">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-900">Send Connection Request</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="h-5 w-5 text-gray-500" />
            </button>
          </div>
        </div>

        {/* User Info */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center space-x-4">
            <img
              src={user.avatar || 'https://images.pexels.com/photos/2379004/pexels-photo-2379004.jpeg?auto=compress&cs=tinysrgb&w=80&h=80&dpr=1'}
              alt={user.name}
              className="w-16 h-16 rounded-full"
            />
            <div>
              <h3 className="text-lg font-semibold text-gray-900">{user.name}</h3>
              <p className="text-gray-600">{user.profession}</p>
              <div className="flex items-center space-x-2 mt-1">
                <span className="text-yellow-500">★</span>
                <span className="text-sm font-medium">{user.rating}</span>
                <span className="text-sm text-gray-500">({user.reviewCount} reviews)</span>
              </div>
            </div>
          </div>
        </div>

        {/* Message */}
        <div className="p-6">
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Personal Message (Optional)
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Hi! I'd love to connect and learn from your expertise in..."
              rows={4}
              className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 resize-none"
            />
          </div>

          {/* Free Call Request */}
          <div className="mb-6">
            <label className="flex items-start space-x-3 cursor-pointer">
              <input
                type="checkbox"
                checked={requestFreeCall}
                onChange={(e) => setRequestFreeCall(e.target.checked)}
                className="mt-1 h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
              />
              <div>
                <span className="text-sm font-medium text-gray-900">
                  Request a free 15-minute connection call
                </span>
                <p className="text-xs text-gray-500 mt-1">
                  Ask for a brief introductory call to get to know each other better
                </p>
              </div>
            </label>
          </div>

          {requestFreeCall && (
            <div className="mb-6 p-4 bg-indigo-50 rounded-xl border border-indigo-200">
              <div className="flex items-center space-x-2 mb-2">
                <Calendar className="h-4 w-4 text-indigo-600" />
                <span className="text-sm font-medium text-indigo-900">Free Connection Call</span>
              </div>
              <p className="text-xs text-indigo-700">
                This will send a request for a complimentary 15-minute video call to introduce yourselves and explore potential collaboration opportunities.
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200">
          <div className="flex justify-end space-x-4">
            <button
              onClick={onClose}
              className="px-6 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              className="flex items-center space-x-2 px-6 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-all"
            >
              <Send className="h-4 w-4" />
              <span>Send Request</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};