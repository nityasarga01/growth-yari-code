import React from 'react';
import { useState, useEffect } from 'react';
import { Calendar, Users, Star, TrendingUp, Clock, DollarSign } from 'lucide-react';
import { apiClient } from '../../config/api';

export const DashboardView: React.FC = () => {
  const [stats, setStats] = useState<any>(null);
  const [activities, setActivities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load dashboard data
  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const [statsResult, activitiesResult] = await Promise.all([
          apiClient.getDashboardStats(),
          apiClient.getRecentActivity()
        ]);
        
        if (statsResult.success && statsResult.data) {
          setStats(statsResult.data.stats);
        }
        
        if (activitiesResult.success && activitiesResult.data) {
          setActivities(activitiesResult.data.activities);
        }
        
        if (!statsResult.success) {
          setError(statsResult.error || 'Failed to load dashboard stats');
        }
      } catch (error) {
        setError('Failed to load dashboard data');
        console.error('Dashboard load error:', error);
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
  }, []);

  const upcomingSessions = [
    { expert: 'Sarah Johnson', topic: 'UX Design Review', time: 'Today, 2:00 PM', price: '$75' },
    { expert: 'Mike Chen', topic: 'Product Strategy', time: 'Tomorrow, 10:00 AM', price: 'Free' },
    { expert: 'Emily Rodriguez', topic: 'Marketing Strategy', time: 'Jan 23, 3:00 PM', price: '$50' }
  ];

  const dashboardStatsConfig = [
    { key: 'sessions', label: 'Total Sessions', icon: Calendar, color: 'bg-blue-500', change: '+12%' },
    { key: 'connections', label: 'Connections', icon: Users, color: 'bg-green-500', change: '+8%' },
    { key: 'earnings', label: 'Total Earnings', icon: DollarSign, color: 'bg-purple-500', change: '+15%' },
    { key: 'rating', label: 'Average Rating', icon: Star, color: 'bg-yellow-500', change: '+0.2' }
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 py-4 sm:py-8">
      <div className="mb-8">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">Dashboard</h2>
        <p className="text-sm sm:text-base text-gray-600">Welcome back! Here's what's happening with your professional network.</p>
      </div>

      {/* Stats Grid */}
      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6 mb-8">
          {dashboardStatsConfig.map((config, index) => (
            <div key={index} className="bg-white rounded-xl sm:rounded-2xl shadow-lg p-3 sm:p-6 hover:shadow-xl transition-shadow">
              <div className="flex items-center justify-between mb-4">
                <div className={`p-2 sm:p-3 rounded-xl ${config.color}`}>
                  <config.icon className="h-4 sm:h-6 w-4 sm:w-6 text-white" />
                </div>
                <span className="text-xs sm:text-sm font-medium text-green-600">{config.change}</span>
              </div>
              <h3 className="text-lg sm:text-2xl font-bold text-gray-900 mb-1">{stats[config.key] || '0'}</h3>
              <p className="text-xs sm:text-sm text-gray-600">{config.label}</p>
            </div>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
        {/* Recent Activity */}
        <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg p-4 sm:p-6">
          <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
          <div className="space-y-4">
            {activities.map((activity, index) => (
              <div key={index} className="flex items-start space-x-3">
                <div className="flex-shrink-0 mt-1">
                  <div className={`w-2 h-2 rounded-full ${
                    activity.type === 'session' ? 'bg-blue-500' :
                    activity.type === 'review' ? 'bg-yellow-500' :
                    activity.type === 'booking' ? 'bg-green-500' :
                    'bg-purple-500'
                  }`} />
                </div>
                <div className="flex-1">
                  <p className="text-xs sm:text-sm text-gray-900">{activity.message}</p>
                  <p className="text-xs text-gray-500 mt-1">{activity.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Upcoming Sessions */}
        {/* This could be populated with actual upcoming sessions from the API */}
      </div>

      {/* Performance Chart Placeholder */}
      <div className="mt-6 sm:mt-8 bg-white rounded-xl sm:rounded-2xl shadow-lg p-4 sm:p-6">
        <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-4">Performance Overview</h3>
        <div className="h-48 sm:h-64 bg-gray-50 rounded-xl flex items-center justify-center">
          <div className="text-center">
            <TrendingUp className="h-8 sm:h-12 w-8 sm:w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-sm sm:text-base text-gray-600">Performance charts will be displayed here</p>
          </div>
        </div>
      </div>
    </div>
  );
};

// Helper function to format time ago
function formatTimeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
  
  if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
  if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
  return `${Math.floor(diffInMinutes / 1440)}d ago`;
}