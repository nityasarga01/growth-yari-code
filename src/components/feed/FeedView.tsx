import React from 'react';
import { useState, useEffect } from 'react';
import { Plus } from 'lucide-react';
import { PostCard } from './PostCard';
import { CreatePost } from '../content/CreatePost';
import { ConnectionRequest } from '../connections/ConnectionRequest';
import { User, Post } from '../../types';
import { apiClient } from '../../config/api';

interface FeedViewProps {
  onBookSession: (userId: string) => void;
}

export const FeedView: React.FC<FeedViewProps> = ({ onBookSession }) => {
  const [showCreatePost, setShowCreatePost] = useState(false);
  const [showConnectionRequest, setShowConnectionRequest] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);

  // Load feed data
  useEffect(() => {
    const loadFeed = async () => {
      try {
        setLoading(true);
        setError(null);
        const result = await apiClient.getFeed(page);
        if (result.success && result.data) {
          if (page === 1) {
            setPosts(result.data.posts);
          } else {
            setPosts(prev => [...prev, ...result.data.posts]);
          }
        } else {
          setError(result.error || 'Failed to load feed');
        }
      } catch (error) {
        setError('Failed to load feed');
        console.error('Feed load error:', error);
      } finally {
        setLoading(false);
      }
    };

    loadFeed();
  }, [page]);

  const handleLike = (postId: string) => {
    const likePost = async () => {
      try {
        const result = await apiClient.likePost(postId);
        if (result.success) {
          // Update local state
          setPosts(prev => prev.map(post => 
            post.id === postId 
              ? { ...post, likes: result.data?.liked ? post.likes + 1 : post.likes - 1 }
              : post
          ));
        }
      } catch (error) {
        console.error('Failed to like post:', error);
      }
    };
    likePost();
  };

  const handleCreatePost = (postData: { type: 'video' | 'thought' | 'image'; content: string; caption?: string; tags: string[]; mediaUrl?: string; thumbnail?: string }) => {
    const createPost = async () => {
      try {
        console.log('Creating post with data:', postData);
        const result = await apiClient.createPost(postData);
        if (result.success && result.data) {
          setPosts(prev => [result.data.post, ...prev]);
          setShowCreatePost(false);
        } else {
          console.error('Failed to create post:', result.error);
          alert(result.error || 'Failed to create post. Please try again.');
        }
      } catch (error) {
        console.error('Post creation error:', error);
        alert('Failed to create post. Please try again.');
      }
    };

    createPost();
  };

  const handleConnect = (user: User) => {
    setSelectedUser(user);
    setShowConnectionRequest(true);
  };

  const handleSendConnectionRequest = (userId: string, message: string, requestFreeCall: boolean) => {
    const sendRequest = async () => {
      try {
        const result = await apiClient.sendConnectionRequest(userId, message);
        if (result.success) {
          console.log('Connection request sent successfully');
        }
      } catch (error) {
        console.error('Failed to send connection request:', error);
      }
    };
    sendRequest();
    setShowConnectionRequest(false);
    setSelectedUser(null);
  };

  return (
    <div className="max-w-4xl mx-auto px-2 sm:px-4 py-4 sm:py-8">
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">Professional Insights</h2>
            <p className="text-sm sm:text-base text-gray-600">Discover expert knowledge and connect with industry leaders</p>
          </div>
          <button
            onClick={() => setShowCreatePost(true)}
            className="flex items-center space-x-1 sm:space-x-2 px-3 sm:px-6 py-2 sm:py-3 bg-gradient-to-r from-brand-primary to-brand-secondary text-white rounded-xl sm:rounded-2xl hover:from-brand-primary/90 hover:to-brand-secondary/90 transition-all duration-300 shadow-lg hover:shadow-2xl hover:scale-105 text-sm sm:text-base flex-shrink-0 group"
          >
            <Plus className="h-5 w-5 group-hover:rotate-90 transition-transform duration-300" />
            <span className="hidden sm:inline">Create Post</span>
            <span className="sm:hidden">Post</span>
          </button>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-600 text-sm">{error}</p>
          <button onClick={() => setPage(1)} className="text-red-700 underline text-sm mt-2">
            Try again
          </button>
        </div>
      )}

      {/* User's Posts */}
      {posts.length > 0 && (
        <div className="space-y-4 sm:space-y-6 mb-8">
          {posts.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              onLike={handleLike}
              onBookSession={onBookSession}
            />
          ))}
        </div>
      )}

      {/* Loading indicator */}
      {loading && (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-4 border-indigo-600 border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-600">Loading posts...</p>
        </div>
      )}

      {/* Modals */}
      {showCreatePost && (
        <CreatePost
          onClose={() => setShowCreatePost(false)}
          onCreatePost={handleCreatePost}
        />
      )}

      {showConnectionRequest && selectedUser && (
        <ConnectionRequest
          user={selectedUser}
          onClose={() => setShowConnectionRequest(false)}
          onSendRequest={handleSendConnectionRequest}
        />
      )}
    </div>
  );
};