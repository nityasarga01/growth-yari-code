import React, { useState, useEffect, useRef } from 'react';
import { Send, X, Phone, Video, MoreVertical, Paperclip, ArrowLeft, Users } from 'lucide-react';
import { User } from '../../types';
import { apiClient } from '../../config/api';

interface ChatMessage {
  id: string;
  sender_id: string;
  recipient_id: string;
  message: string;
  is_read: boolean;
  created_at: string;
  sender?: {
    id: string;
    name: string;
    avatar: string;
    profession: string;
  };
}

interface Conversation {
  user: {
    id: string;
    name: string;
    avatar: string;
    profession: string;
  };
  last_message: {
    message: string;
    created_at: string;
    is_from_me: boolean;
  };
  unread_count: number;
}

interface ChatWindowProps {
  isOpen: boolean;
  onClose: () => void;
  recipient?: User;
  currentUser: User;
}

export const ChatWindow: React.FC<ChatWindowProps> = ({ 
  isOpen, 
  onClose, 
  recipient, 
  currentUser 
}) => {
  const [view, setView] = useState<'conversations' | 'chat'>('conversations');
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<User | null>(recipient || null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      if (recipient) {
        setSelectedConversation(recipient);
        setView('chat');
        loadMessages(recipient.id);
      } else {
        loadConversations();
      }
    }
  }, [isOpen, recipient]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadConversations = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('Loading chat conversations...');
      
      const result = await apiClient.getChatConversations();
      if (result.success && result.data) {
        console.log('Conversations loaded:', result.data.conversations.length);
        setConversations(result.data.conversations);
      } else {
        console.error('Failed to load conversations:', result.error);
        setError(result.error || 'Failed to load conversations');
      }
    } catch (error) {
      console.error('Conversations load error:', error);
      setError('Failed to load conversations');
    } finally {
      setLoading(false);
    }
  };

  const loadMessages = async (recipientId: string) => {
    try {
      setLoading(true);
      setError(null);
      console.log('Loading chat messages with:', recipientId);
      
      const result = await apiClient.getChatMessages(recipientId);
      if (result.success && result.data) {
        console.log('Chat messages loaded:', result.data.messages.length);
        setMessages(result.data.messages);
        
        // Mark messages as read
        await apiClient.markChatMessagesAsRead(recipientId);
      } else {
        console.error('Failed to load messages:', result.error);
        setError(result.error || 'Failed to load messages');
      }
    } catch (error) {
      console.error('Messages load error:', error);
      setError('Failed to load messages');
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation) return;

    try {
      setSending(true);
      console.log('Sending message to:', selectedConversation.name);
      
      const result = await apiClient.sendChatMessage(selectedConversation.id, newMessage.trim());
      if (result.success && result.data) {
        console.log('Message sent successfully');
        setMessages(prev => [...prev, result.data.message]);
        setNewMessage('');
      } else {
        console.error('Failed to send message:', result.error);
        setError(result.error || 'Failed to send message');
      }
      
    } catch (error) {
      console.error('Send message error:', error);
      setError('Failed to send message');
    } finally {
      setSending(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 24) {
      return date.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit' 
      });
    } else {
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric' 
      });
    }
  };

  const openConversation = (user: User) => {
    setSelectedConversation(user);
    setView('chat');
    loadMessages(user.id);
  };

  const backToConversations = () => {
    setView('conversations');
    setSelectedConversation(null);
    setMessages([]);
    loadConversations();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed bottom-4 right-4 w-96 h-[500px] bg-white rounded-2xl shadow-xl border border-gray-200 flex flex-col z-50">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          {view === 'chat' && (
            <button
              onClick={backToConversations}
              className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="h-4 w-4 text-gray-600" />
            </button>
          )}
          
          {view === 'conversations' ? (
            <div className="flex items-center space-x-2">
              <Users className="h-5 w-5 text-indigo-600" />
              <h3 className="font-semibold text-gray-900">Messages</h3>
            </div>
          ) : selectedConversation ? (
            <div className="flex items-center space-x-3">
              <img
                src={selectedConversation.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(selectedConversation.name)}&background=6366f1&color=fff`}
                alt={selectedConversation.name}
                className="w-8 h-8 rounded-full"
              />
              <div>
                <h3 className="font-semibold text-gray-900 text-sm">{selectedConversation.name}</h3>
                <p className="text-xs text-gray-600">{selectedConversation.profession}</p>
              </div>
            </div>
          ) : null}
        </div>
        
        <div className="flex items-center space-x-2">
          {view === 'chat' && selectedConversation && (
            <>
              <button className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors">
                <Phone className="h-4 w-4" />
              </button>
              <button className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors">
                <Video className="h-4 w-4" />
              </button>
            </>
          )}
          <button
            onClick={onClose}
            className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        {view === 'conversations' ? (
          /* Conversations List */
          <div className="h-full overflow-y-auto">
            {loading ? (
              <div className="p-6 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-4 border-indigo-600 border-t-transparent mx-auto mb-4"></div>
                <p className="text-gray-600">Loading conversations...</p>
              </div>
            ) : error ? (
              <div className="p-6 text-center">
                <p className="text-red-600 mb-4">{error}</p>
                <button
                  onClick={loadConversations}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                >
                  Retry
                </button>
              </div>
            ) : conversations.length === 0 ? (
              <div className="p-6 text-center">
                <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No conversations yet</h3>
                <p className="text-gray-600 text-sm">Start connecting with professionals to begin chatting!</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {conversations.map((conversation) => (
                  <button
                    key={conversation.user.id}
                    onClick={() => openConversation(conversation.user)}
                    className="w-full p-4 text-left hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="relative">
                        <img
                          src={conversation.user.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(conversation.user.name)}&background=6366f1&color=fff`}
                          alt={conversation.user.name}
                          className="w-12 h-12 rounded-full"
                        />
                        {conversation.unread_count > 0 && (
                          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                            {conversation.unread_count > 9 ? '9+' : conversation.unread_count}
                          </span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <h4 className="text-sm font-medium text-gray-900 truncate">
                            {conversation.user.name}
                          </h4>
                          <span className="text-xs text-gray-500">
                            {formatTime(conversation.last_message.created_at)}
                          </span>
                        </div>
                        <p className="text-xs text-gray-600 truncate">
                          {conversation.user.profession}
                        </p>
                        <p className={`text-sm mt-1 truncate ${
                          conversation.unread_count > 0 ? 'font-medium text-gray-900' : 'text-gray-600'
                        }`}>
                          {conversation.last_message.is_from_me ? 'You: ' : ''}
                          {conversation.last_message.message}
                        </p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        ) : (
          /* Chat Messages */
          <div className="flex flex-col h-full">
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {loading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-6 w-6 border-4 border-indigo-600 border-t-transparent mx-auto mb-2"></div>
                  <p className="text-sm text-gray-600">Loading messages...</p>
                </div>
              ) : error ? (
                <div className="text-center py-8">
                  <p className="text-red-600 text-sm mb-2">{error}</p>
                  <button
                    onClick={() => selectedConversation && loadMessages(selectedConversation.id)}
                    className="text-indigo-600 hover:text-indigo-700 text-sm font-medium"
                  >
                    Retry
                  </button>
                </div>
              ) : messages.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-600 text-sm">No messages yet. Start the conversation!</p>
                </div>
              ) : (
                messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.sender_id === currentUser.id ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className="flex items-end space-x-2 max-w-xs">
                      {message.sender_id !== currentUser.id && (
                        <img
                          src={selectedConversation?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(selectedConversation?.name || 'User')}&background=6366f1&color=fff`}
                          alt={selectedConversation?.name}
                          className="w-6 h-6 rounded-full"
                        />
                      )}
                      <div
                        className={`px-4 py-2 rounded-2xl ${
                          message.sender_id === currentUser.id
                            ? 'bg-indigo-600 text-white rounded-br-sm'
                            : 'bg-gray-100 text-gray-900 rounded-bl-sm'
                        }`}
                      >
                        <p className="text-sm">{message.message}</p>
                        <p className={`text-xs mt-1 ${
                          message.sender_id === currentUser.id ? 'text-indigo-200' : 'text-gray-500'
                        }`}>
                          {formatTime(message.created_at)}
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-4 border-t border-gray-200">
              <div className="flex items-center space-x-2">
                <button className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors">
                  <Paperclip className="h-4 w-4" />
                </button>
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Type a message..."
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
                <button
                  onClick={sendMessage}
                  disabled={!newMessage.trim() || sending}
                  className="p-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <Send className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};