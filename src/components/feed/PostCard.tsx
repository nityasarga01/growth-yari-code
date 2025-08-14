import React, { useState } from 'react';
import { Heart, MessageCircle, Share, Send, MoreHorizontal } from 'lucide-react';
import { Post, User } from '../../types';
import { apiClient } from '../../config/api';

interface PostCardProps {
  post: Post;
  onLike: (postId: string) => void;
  onBookSession: (userId: string) => void;
}

export const PostCard: React.FC<PostCardProps> = ({ post, onLike, onBookSession }) => {
  const [isLiked, setIsLiked] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState<any[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loadingComments, setLoadingComments] = useState(false);
  const [submittingComment, setSubmittingComment] = useState(false);

  const handleLike = () => {
    setIsLiked(!isLiked);
    onLike(post.id);
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${post.user.name}'s post`,
          text: post.content,
          url: `${window.location.origin}/post/${post.id}`
        });
      } catch (error) {
        if (error.name !== 'AbortError') {
          console.log('Error sharing:', error);
          fallbackShare();
        }
      }
    } else {
      fallbackShare();
    }
  };

  const fallbackShare = () => {
    const shareText = `Check out this post by ${post.user.name}: ${post.content}`;
    const shareUrl = `${window.location.origin}/post/${post.id}`;
    
    if (navigator.clipboard) {
      navigator.clipboard.writeText(`${shareText}\n${shareUrl}`)
        .then(() => {
          alert('Post link copied to clipboard!');
        })
        .catch(() => {
          // Fallback for clipboard API failure
          const textArea = document.createElement('textarea');
          textArea.value = `${shareText}\n${shareUrl}`;
          document.body.appendChild(textArea);
          textArea.select();
          document.execCommand('copy');
          document.body.removeChild(textArea);
          alert('Post link copied to clipboard!');
        });
    } else {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = `${shareText}\n${shareUrl}`;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      alert('Post link copied to clipboard!');
    }
  };

  const handleConnect = async () => {
    try {
      const result = await apiClient.sendConnectionRequest(post.user.id, `Hi ${post.user.name}, I'd like to connect with you on GrowthYari to expand my professional network.`);
      if (result.success) {
        alert(`Connection request sent to ${post.user.name}!`);
      } else {
        alert(result.error || 'Failed to send connection request');
      }
    } catch (error) {
      console.error('Connection request error:', error);
      alert('Failed to send connection request');
    }
  };

  const loadComments = async () => {
    if (comments.length > 0) {
      setShowComments(!showComments);
      return;
    }

    try {
      setLoadingComments(true);
      const result = await apiClient.getPostComments(post.id);
      if (result.success && result.data) {
        setComments(result.data.comments);
        setShowComments(true);
      } else {
        console.error('Failed to load comments:', result.error);
      }
    } catch (error) {
      console.error('Error loading comments:', error);
    } finally {
      setLoadingComments(false);
    }
  };

  const handleAddComment = async () => {
    if (!newComment.trim()) return;

    try {
      setSubmittingComment(true);
      const result = await apiClient.addComment(post.id, newComment.trim());
      if (result.success && result.data) {
        setComments(prev => [result.data.comment, ...prev]);
        setNewComment('');
        // Update post comment count locally
        post.comments += 1;
      } else {
        console.error('Failed to add comment:', result.error);
        alert('Failed to add comment. Please try again.');
      }
    } catch (error) {
      console.error('Error adding comment:', error);
      alert('Failed to add comment. Please try again.');
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleAddComment();
    }
  };

  return (
    <div className="bg-white rounded-xl sm:rounded-3xl shadow-lg overflow-hidden hover:shadow-2xl transition-all duration-300 hover:scale-[1.02] mx-1 sm:mx-0 border border-gray-100/50">
      {/* Post Header */}
      <div className="p-3 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 space-y-3 sm:space-y-0">
          <div className="flex items-center space-x-3 flex-1 min-w-0">
            <img
              src={post.user.avatar || 'https://images.pexels.com/photos/2379004/pexels-photo-2379004.jpeg?auto=compress&cs=tinysrgb&w=40&h=40&dpr=1'}
              alt={post.user.name}
              className="w-10 sm:w-12 h-10 sm:h-12 rounded-full flex-shrink-0 ring-2 ring-brand-primary/20 hover:ring-brand-primary/40 transition-all duration-300"
            />
            <div className="min-w-0 flex-1">
              <div className="flex items-center space-x-2">
                <h3 className="text-sm sm:text-base font-semibold text-gray-900 truncate">{post.user.name}</h3>
                {post.user.isVerified && (
                  <div className="w-4 h-4 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full flex items-center justify-center">
                    <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                )}
              </div>
              <p className="text-xs sm:text-sm text-gray-600 truncate">{post.user.profession}</p>
            </div>
          </div>
          <div className="flex items-center space-x-1 sm:space-x-2 flex-shrink-0">
            <button
              onClick={handleConnect}
              className="px-2 sm:px-3 py-1 bg-gradient-to-r from-green-100 to-green-200 text-green-700 rounded-xl text-xs sm:text-sm font-medium hover:from-green-200 hover:to-green-300 transition-all duration-300 whitespace-nowrap shadow-sm hover:shadow-md hover:scale-105"
            >
              Connect
            </button>
            <button
              onClick={() => onBookSession(post.user.id)}
              className="px-2 sm:px-3 py-1 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl text-xs sm:text-sm font-medium hover:from-indigo-700 hover:to-purple-700 transition-all duration-300 whitespace-nowrap shadow-md hover:shadow-lg hover:scale-105"
            >
              <span className="hidden sm:inline">Book Session</span>
              <span className="sm:hidden">Book</span>
            </button>
            <button className="p-1 sm:p-2 hover:bg-gray-100 rounded-xl transition-all duration-300 hover:scale-110">
              <MoreHorizontal className="h-4 w-4 text-gray-500" />
            </button>
          </div>
        </div>
        
        {/* Post Content */}
        <div className="mb-4">
          <p className="text-sm sm:text-base text-gray-800 leading-relaxed mb-3">{post.content}</p>
          {post.caption && (
            <p className="text-sm text-gray-600 mt-2 italic">{post.caption}</p>
          )}
        </div>

        {/* Media */}
        {(post.mediaUrl || post.media_url) && post.type !== 'thought' && (
          <div className="mb-4">
            {post.type === 'image' ? (
              <div className="relative group">
                <img
                  src={post.mediaUrl || post.media_url}
                  alt="Post content"
                  className="w-full rounded-2xl max-h-96 object-cover cursor-pointer hover:opacity-95 transition-all duration-300 shadow-md hover:shadow-xl"
                  onError={(e) => {
                    console.error('Image failed to load:', post.mediaUrl || post.media_url);
                    // Hide broken image and show placeholder
                    e.currentTarget.src = 'https://images.pexels.com/photos/3184291/pexels-photo-3184291.jpeg?auto=compress&cs=tinysrgb&w=800&h=600&dpr=1';
                  }}
                  onClick={() => {
                    // Open image in new tab for full view
                    window.open(post.mediaUrl || post.media_url, '_blank');
                  }}
                />
                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-10 transition-all duration-300 rounded-2xl flex items-center justify-center opacity-0 group-hover:opacity-100">
                  <span className="text-white text-sm bg-black bg-opacity-60 px-4 py-2 rounded-full backdrop-blur-sm">
                    Click to view full size
                  </span>
                </div>
              </div>
            ) : post.type === 'video' ? (
              <div className="relative">
                <video
                  src={post.mediaUrl || post.media_url}
                  poster={post.thumbnail}
                  controls
                  className="w-full rounded-2xl max-h-96 bg-gray-900 shadow-md hover:shadow-xl transition-shadow duration-300"
                  preload="metadata"
                  playsInline
                  muted
                  onError={(e) => {
                    console.error('Video failed to load:', post.mediaUrl || post.media_url);
                    // Use fallback video
                    e.currentTarget.src = 'https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_1mb.mp4';
                  }}
                >
                  Your browser does not support the video tag.
                </video>
              </div>
            ) : null}
          </div>
        )}
        
        {/* Tags */}
        {post.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-6">
            {post.tags.map((tag, index) => (
              <span
                key={index}
                className="px-3 py-1 bg-gradient-to-r from-indigo-100 to-purple-100 text-indigo-700 text-xs rounded-full whitespace-nowrap hover:from-indigo-200 hover:to-purple-200 transition-all duration-300 cursor-pointer"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}
        
        {/* Post Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pt-4 border-t border-gray-200/50 space-y-3 sm:space-y-0">
          <div className="flex items-center space-x-4 sm:space-x-6">
            <button
              onClick={handleLike}
              className={`flex items-center space-x-1 sm:space-x-2 text-xs sm:text-sm transition-all duration-300 hover:scale-110 ${
                isLiked ? 'text-red-500' : 'text-gray-600 hover:text-red-500'
              }`}
            >
              <Heart className={`h-4 sm:h-5 w-4 sm:w-5 ${isLiked ? 'fill-current animate-pulse' : ''}`} />
              <span>{post.likes + (isLiked ? 1 : 0)}</span>
            </button>
            
            <button
              onClick={loadComments}
              disabled={loadingComments}
              className="flex items-center space-x-1 sm:space-x-2 text-xs sm:text-sm text-gray-600 hover:text-gray-900 transition-all duration-300 disabled:opacity-50 hover:scale-110"
            >
              <MessageCircle className="h-4 sm:h-5 w-4 sm:w-5" />
              <span>{loadingComments ? 'Loading...' : post.comments}</span>
            </button>
            
            <button
              onClick={handleShare}
              className="flex items-center space-x-1 sm:space-x-2 text-xs sm:text-sm text-gray-600 hover:text-gray-900 transition-all duration-300 hover:scale-110"
            >
              <Share className="h-4 sm:h-5 w-4 sm:w-5" />
              <span className="hidden sm:inline">Share</span>
            </button>
          </div>
          
          <div className="flex items-center space-x-2 text-xs sm:text-sm text-gray-500">
            <span className="bg-gray-100 px-2 py-1 rounded-full">{new Date(post.createdAt).toLocaleDateString()}</span>
          </div>
        </div>
      </div>

      {/* Comments Section */}
      {showComments && (
        <div className="border-t border-gray-100 p-3 sm:p-6">
          {/* Add Comment */}
          <div className="flex items-start space-x-2 sm:space-x-3 mb-4">
            <img
              src="https://images.pexels.com/photos/2379004/pexels-photo-2379004.jpeg?auto=compress&cs=tinysrgb&w=40&h=40&dpr=1"
              alt="Your avatar"
              className="w-6 sm:w-8 h-6 sm:h-8 rounded-full flex-shrink-0"
            />
            <div className="flex-1">
              <div className="flex flex-col sm:flex-row sm:items-end space-y-2 sm:space-y-0 sm:space-x-2">
                <textarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Write a comment..."
                  rows={2}
                  className="flex-1 p-2 sm:p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 resize-none text-sm"
                />
                <button
                  onClick={handleAddComment}
                  disabled={!newComment.trim() || submittingComment}
                  className="p-2 sm:p-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex-shrink-0"
                >
                  <Send className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Comments List */}
          {loadingComments ? (
            <div className="text-center py-4">
              <div className="animate-spin rounded-full h-4 sm:h-6 w-4 sm:w-6 border-2 border-indigo-600 border-t-transparent mx-auto"></div>
            </div>
          ) : (
            <div className="space-y-4">
              {comments.map((comment) => (
                <div key={comment.id} className="flex items-start space-x-2 sm:space-x-3">
                  <img
                    src={comment.user?.avatar || 'https://images.pexels.com/photos/2379004/pexels-photo-2379004.jpeg?auto=compress&cs=tinysrgb&w=40&h=40&dpr=1'}
                    alt={comment.user?.name || 'User'}
                    className="w-6 sm:w-8 h-6 sm:h-8 rounded-full flex-shrink-0"
                  />
                  <div className="flex-1">
                    <div className="bg-gray-50 rounded-lg p-2 sm:p-3">
                      <div className="flex items-center space-x-2 mb-1">
                        <span className="font-medium text-xs sm:text-sm text-gray-900">
                          {comment.user?.name || 'Anonymous'}
                        </span>
                        <span className="text-xs text-gray-500">
                          {new Date(comment.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-xs sm:text-sm text-gray-800">{comment.content}</p>
                    </div>
                  </div>
                </div>
              ))}
              
              {comments.length === 0 && (
                <p className="text-center text-gray-500 py-4 text-sm">
                  No comments yet. Be the first to comment!
                </p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};