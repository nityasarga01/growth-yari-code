import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  Users, 
  Calendar, 
  DollarSign, 
  BarChart3,
  PieChart,
  Activity,
  Globe,
  Clock,
  Star
} from 'lucide-react';
import { adminApiClient } from '../../config/adminApi';

export const AdminAnalytics: React.FC = () => {
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('7d');

  useEffect(() => {
    loadAnalytics();
  }, [timeRange]);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      
      const result = await adminApiClient.getAnalytics(timeRange);
      if (result.success && result.data) {
        setAnalytics(result.data);
      } else {
        // Mock analytics data
        setAnalytics({
          userGrowth: {
            total: 1247,
            growth: 12.5,
            newThisWeek: 89
          },
          sessionMetrics: {
            total: 3456,
            completed: 3201,
            revenue: 45678,
            averageRating: 4.7
          },
          engagement: {
            dailyActiveUsers: 567,
            weeklyActiveUsers: 892,
            averageSessionTime: 45,
            returnRate: 78.5
          },
          topExperts: [
            { name: 'Sarah Johnson', sessions: 156, rating: 4.9, revenue: 8750 },
            { name: 'Mike Chen', sessions: 134, rating: 4.8, revenue: 7200 },
            { name: 'Emily Rodriguez', sessions: 98, rating: 4.9, revenue: 5400 }
          ],
          recentActivity: [
            { type: 'user_signup', count: 23, change: 15 },
            { type: 'session_booked', count: 67, change: 8 },
            { type: 'connection_made', count: 145, change: 22 }
          ]
        });
      }
    } catch (error) {
      console.error('Failed to load analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-red-600 border-t-transparent mx-auto mb-4"></div>
        <p className="text-gray-600">Loading analytics...</p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Analytics & Insights</h1>
          <p className="text-gray-600">Platform performance and user behavior analytics</p>
        </div>
        <select
          value={timeRange}
          onChange={(e) => setTimeRange(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
        >
          <option value="24h">Last 24 Hours</option>
          <option value="7d">Last 7 Days</option>
          <option value="30d">Last 30 Days</option>
          <option value="90d">Last 90 Days</option>
        </select>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-blue-100 rounded-xl">
              <Users className="h-6 w-6 text-blue-600" />
            </div>
            <span className="text-sm font-medium text-green-600">+{analytics?.userGrowth?.growth}%</span>
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-1">{analytics?.userGrowth?.total?.toLocaleString()}</h3>
          <p className="text-sm text-gray-600">Total Users</p>
          <p className="text-xs text-gray-500 mt-1">{analytics?.userGrowth?.newThisWeek} new this week</p>
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-green-100 rounded-xl">
              <Calendar className="h-6 w-6 text-green-600" />
            </div>
            <span className="text-sm font-medium text-green-600">+8%</span>
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-1">{analytics?.sessionMetrics?.total?.toLocaleString()}</h3>
          <p className="text-sm text-gray-600">Total Sessions</p>
          <p className="text-xs text-gray-500 mt-1">{analytics?.sessionMetrics?.completed} completed</p>
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-purple-100 rounded-xl">
              <DollarSign className="h-6 w-6 text-purple-600" />
            </div>
            <span className="text-sm font-medium text-green-600">+23%</span>
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-1">${analytics?.sessionMetrics?.revenue?.toLocaleString()}</h3>
          <p className="text-sm text-gray-600">Revenue</p>
          <p className="text-xs text-gray-500 mt-1">Platform earnings</p>
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-yellow-100 rounded-xl">
              <Star className="h-6 w-6 text-yellow-600" />
            </div>
            <span className="text-sm font-medium text-green-600">+0.2</span>
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-1">{analytics?.sessionMetrics?.averageRating}</h3>
          <p className="text-sm text-gray-600">Avg Rating</p>
          <p className="text-xs text-gray-500 mt-1">Session quality</p>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* User Growth Chart */}
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">User Growth</h3>
          <div className="h-64 bg-gray-50 rounded-xl flex items-center justify-center">
            <div className="text-center">
              <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">User growth chart will be displayed here</p>
              <p className="text-sm text-gray-500 mt-2">Integration with charting library needed</p>
            </div>
          </div>
        </div>

        {/* Session Distribution */}
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Session Distribution</h3>
          <div className="h-64 bg-gray-50 rounded-xl flex items-center justify-center">
            <div className="text-center">
              <PieChart className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">Session type distribution chart</p>
              <p className="text-sm text-gray-500 mt-2">Free vs Paid sessions breakdown</p>
            </div>
          </div>
        </div>
      </div>

      {/* Top Experts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Performing Experts</h3>
          <div className="space-y-4">
            {analytics?.topExperts?.map((expert: any, index: number) => (
              <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                    {index + 1}
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900">{expert.name}</h4>
                    <p className="text-sm text-gray-600">{expert.sessions} sessions</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="flex items-center space-x-1 mb-1">
                    <Star className="h-4 w-4 text-yellow-500" />
                    <span className="text-sm font-medium">{expert.rating}</span>
                  </div>
                  <p className="text-sm text-gray-600">${expert.revenue.toLocaleString()}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
          <div className="space-y-4">
            {analytics?.recentActivity?.map((activity: any, index: number) => (
              <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <Activity className="h-5 w-5 text-gray-500" />
                  <div>
                    <h4 className="font-medium text-gray-900 capitalize">
                      {activity.type.replace('_', ' ')}
                    </h4>
                    <p className="text-sm text-gray-600">{activity.count} this week</p>
                  </div>
                </div>
                <span className={`text-sm font-medium ${
                  activity.change > 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {activity.change > 0 ? '+' : ''}{activity.change}%
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};