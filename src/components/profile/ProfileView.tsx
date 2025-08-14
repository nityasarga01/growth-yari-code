import React, { useState, useEffect } from 'react';
import { Camera, Edit, MapPin, Link, Star, Calendar, Award, Save, X, Clock } from 'lucide-react';
import { User } from '../../types';
import { apiClient } from '../../config/api';
import { AvailabilityManager } from './AvailabilityManager';

interface ProfileViewProps {
  user: User;
  onUserUpdate?: (user: User) => void;
}

export const ProfileView: React.FC<ProfileViewProps> = ({ user: initialUser, onUserUpdate }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [user, setUser] = useState(initialUser);
  const [editedUser, setEditedUser] = useState(initialUser);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<any>(null);
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [showAvailability, setShowAvailability] = useState(false);

  // Load user profile data and stats
  useEffect(() => {
    const loadProfileData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Load user stats
        const statsResult = await apiClient.getDashboardStats();
        if (statsResult.success && statsResult.data) {
          setStats(statsResult.data.stats);
        }

        // Load recent activity
        const activityResult = await apiClient.getRecentActivity();
        if (activityResult.success && activityResult.data) {
          setRecentActivity(activityResult.data.activities);
        }

        // Refresh current user data
        const userResult = await apiClient.getCurrentUser();
        if (userResult.success && userResult.data) {
          setUser(userResult.data.user);
          setEditedUser(userResult.data.user);
        }
      } catch (error) {
        console.error('Failed to load profile data:', error);
        setError('Failed to load profile data');
      } finally {
        setLoading(false);
      }
    };

    loadProfileData();
  }, []);

  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);

      const updateData = {
        name: editedUser.name,
        profession: editedUser.profession,
        bio: editedUser.bio,
        expertise: editedUser.expertise,
        social_links: editedUser.socialLinks
      };

      const result = await apiClient.updateProfile(updateData);
      if (result.success && result.data) {
        setUser(result.data.user);
        setEditedUser(result.data.user);
        // Update the user in the parent component (App.tsx)
        if (onUserUpdate) {
          onUserUpdate(result.data.user);
        }
        setIsEditing(false);
      } else {
        setError(result.error || 'Failed to update profile');
      }
    } catch (error) {
      console.error('Profile update error:', error);
      setError('Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setEditedUser(user);
    setIsEditing(false);
    setError(null);
  };

  const handleExpertiseChange = (expertiseString: string) => {
    const expertise = expertiseString.split(',').map(skill => skill.trim()).filter(Boolean);
    setEditedUser(prev => ({ ...prev, expertise }));
  };

  const handleSocialLinksChange = (platform: string, url: string) => {
    setEditedUser(prev => ({
      ...prev,
      socialLinks: {
        ...prev.socialLinks,
        [platform]: url
      }
    }));
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-brand-primary border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Error Message */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-600 text-sm">{error}</p>
        </div>
      )}

      {/* Profile Header */}
      <div className="bg-white rounded-2xl shadow-lg overflow-hidden mb-8">
        {/* Cover Photo */}
        <div className="h-48 bg-gradient-to-r from-brand-primary to-brand-secondary relative">
          <div className="absolute inset-0 bg-black bg-opacity-20" />
          <button className="absolute top-4 right-4 p-2 bg-white bg-opacity-20 rounded-lg hover:bg-opacity-30 transition-colors">
            <Camera className="h-5 w-5 text-white" />
          </button>
        </div>

        {/* Profile Info */}
        <div className="relative px-8 pb-8">
          <div className="flex items-start space-x-6 -mt-16">
            {/* Profile Picture */}
            <div className="relative">
              <img
                src={user.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=2d5016&color=fff&size=128`}
                alt={user.name}
                className="w-32 h-32 rounded-full border-4 border-white shadow-lg"
              />
              <button className="absolute bottom-2 right-2 p-2 bg-brand-primary text-white rounded-full hover:bg-brand-secondary transition-colors">
                <Camera className="h-4 w-4" />
              </button>
            </div>

            {/* User Info */}
            <div className="flex-1 pt-20">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">{user.name}</h1>
                  <p className="text-gray-600">{user.profession || 'Professional'}</p>
                </div>
                <button
                  onClick={() => setIsEditing(true)}
                  className="flex items-center space-x-2 px-4 py-2 bg-brand-primary text-white rounded-lg hover:bg-brand-secondary transition-colors"
                >
                  <Edit className="h-4 w-4" />
                  <span>Edit Profile</span>
                </button>
              </div>
              <button
                onClick={() => setShowAvailability(true)}
                className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                <Clock className="h-4 w-4" />
                <span>Manage Availability</span>
              </button>

              <div className="flex items-center space-x-6 mb-4">
                <div className="flex items-center space-x-2">
                  <Star className="h-5 w-5 text-yellow-500" />
                  <span className="font-medium">{user.rating || 0}</span>
                  <span className="text-gray-500">({user.reviewCount || 0} reviews)</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Calendar className="h-5 w-5 text-gray-500" />
                  <span className="text-gray-600">{stats?.sessions || 0} sessions completed</span>
                </div>
                {user.isVerified && (
                  <div className="flex items-center space-x-2">
                    <Award className="h-5 w-5 text-green-500" />
                    <span className="text-green-600">Verified Expert</span>
                  </div>
                )}
              </div>

              <p className="text-gray-600 mb-4">{user.bio || 'No bio available yet.'}</p>

              {/* Expertise Tags */}
              <div className="flex flex-wrap gap-2">
                {user.expertise && user.expertise.length > 0 ? (
                  user.expertise.map((skill, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-brand-primary/10 text-brand-primary rounded-full text-sm font-medium cursor-pointer hover:bg-brand-primary/20 transition-colors"
                    >
                      {skill}
                    </span>
                  ))
                ) : (
                  <span className="text-gray-500 text-sm">No expertise areas added yet.</span>
                )}
              </div>

              {/* Social Links */}
              {user.socialLinks && Object.keys(user.socialLinks).length > 0 && (
                <div className="flex items-center space-x-4 mt-4">
                  {user.socialLinks.linkedin && (
                    <a
                      href={user.socialLinks.linkedin}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-700 transition-colors"
                    >
                      <span className="sr-only">LinkedIn</span>
                      LinkedIn
                    </a>
                  )}
                  {user.socialLinks.twitter && (
                    <a
                      href={user.socialLinks.twitter}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-400 hover:text-blue-500 transition-colors"
                    >
                      <span className="sr-only">Twitter</span>
                      Twitter
                    </a>
                  )}
                  {user.socialLinks.website && (
                    <a
                      href={user.socialLinks.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-gray-600 hover:text-gray-700 transition-colors flex items-center space-x-1"
                    >
                      <Link className="h-4 w-4" />
                      <span>Website</span>
                    </a>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Total Sessions</h3>
            <div className="text-3xl font-bold text-brand-primary mb-2">{stats.sessions || 0}</div>
            <p className="text-sm text-gray-600">Sessions completed</p>
          </div>
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Connections</h3>
            <div className="text-3xl font-bold text-green-600 mb-2">{stats.connections || 0}</div>
            <p className="text-sm text-gray-600">Professional connections</p>
          </div>
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Posts</h3>
            <div className="text-3xl font-bold text-purple-600 mb-2">{stats.postsCount || 0}</div>
            <p className="text-sm text-gray-600">Posts shared</p>
          </div>
        </div>
      )}

      {/* Recent Activity */}
      <div className="bg-white rounded-2xl shadow-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
        <div className="space-y-4">
          {recentActivity && recentActivity.length > 0 ? (
            recentActivity.slice(0, 5).map((activity, index) => (
              <div key={index} className="flex items-start space-x-3 p-4 bg-gray-50 rounded-xl">
                <div className={`w-2 h-2 rounded-full mt-2 ${
                  activity.type === 'session' ? 'bg-blue-500' :
                  activity.type === 'review' ? 'bg-yellow-500' :
                  activity.type === 'booking' ? 'bg-green-500' :
                  'bg-purple-500'
                }`} />
                <div>
                  <p className="text-sm font-medium text-gray-900">{activity.message}</p>
                  <p className="text-xs text-gray-500">{activity.time}</p>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-500">No recent activity to display.</p>
            </div>
          )}
        </div>
      </div>

      {/* Edit Profile Modal */}
      {isEditing && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">Edit Profile</h2>
              <button
                onClick={handleCancel}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Name</label>
                <input
                  type="text"
                  value={editedUser.name}
                  onChange={(e) => setEditedUser({...editedUser, name: e.target.value})}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-brand-primary"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Profession</label>
                <input
                  type="text"
                  value={editedUser.profession || ''}
                  onChange={(e) => setEditedUser({...editedUser, profession: e.target.value})}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-brand-primary"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Bio</label>
                <textarea
                  value={editedUser.bio || ''}
                  onChange={(e) => setEditedUser({...editedUser, bio: e.target.value})}
                  rows={3}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-brand-primary"
                  placeholder="Tell others about yourself and your professional background..."
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Expertise (comma-separated)</label>
                <p className="text-xs text-gray-500 mb-2">
                  Add skills like: Business Coach, Tech Developer, UX Design, Marketing Strategy, Data Analysis, etc.
                </p>
                <input
                  type="text"
                  value={editedUser.expertise ? editedUser.expertise.join(', ') : ''}
                  onChange={(e) => handleExpertiseChange(e.target.value)}
                  placeholder="e.g., Business Coach, Leadership Development, Strategic Planning"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-brand-primary"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Social Links</label>
                <div className="space-y-2">
                  <input
                    type="url"
                    value={editedUser.socialLinks?.linkedin || ''}
                    onChange={(e) => handleSocialLinksChange('linkedin', e.target.value)}
                    placeholder="LinkedIn profile URL"
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-brand-primary"
                  />
                  <input
                    type="url"
                    value={editedUser.socialLinks?.twitter || ''}
                    onChange={(e) => handleSocialLinksChange('twitter', e.target.value)}
                    placeholder="Twitter profile URL"
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-brand-primary"
                  />
                  <input
                    type="url"
                    value={editedUser.socialLinks?.website || ''}
                    onChange={(e) => handleSocialLinksChange('website', e.target.value)}
                    placeholder="Personal website URL"
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-brand-primary"
                  />
                </div>
              </div>
            </div>
            
            <div className="flex justify-end space-x-4 mt-6">
              <button
                onClick={handleCancel}
                disabled={saving}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center space-x-2 px-4 py-2 bg-brand-primary text-white rounded-lg hover:bg-brand-secondary transition-colors disabled:opacity-50"
              >
                {saving ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    <span>Save Changes</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Availability Manager */}
      <AvailabilityManager
        userId={user.id}
        isOpen={showAvailability}
        onClose={() => setShowAvailability(false)}
      />
    </div>
  );
};