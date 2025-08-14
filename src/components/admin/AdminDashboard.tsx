import React, { useState, useEffect } from 'react';
import { 
  Users, 
  FileText, 
  Calendar, 
  DollarSign, 
  TrendingUp, 
  AlertTriangle,
  Shield,
  Settings,
  BarChart3,
  UserCheck,
  MessageSquare,
  Video
} from 'lucide-react';
import { AdminSidebar } from './AdminSidebar';
import { UserManagement } from './UserManagement';
import { ContentModeration } from './ContentModeration';
import { SessionManagement } from './SessionManagement';
import { AdminAnalytics } from './AdminAnalytics';
import { SystemSettings } from './SystemSettings';
import { adminApiClient } from '../../config/adminApi';

interface AdminDashboardProps {
  admin: any;
  onLogout: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ admin, onLogout }) => {
  const [currentView, setCurrentView] = useState('overview');
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadAdminStats();
  }, []);

  const loadAdminStats = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Load admin statistics
      const result = await adminApiClient.getAdminStats();
      if (result.success && result.data) {
        setStats(result.data);
      } else {
        // Use mock data for development
        setStats({
          totalUsers: 1247,
          activeUsers: 892,
          totalSessions: 3456,
          totalRevenue: 45678,
          pendingReports: 12,
          systemHealth: 98.5
        });
      }
    } catch (error) {
      console.error('Failed to load admin stats:', error);
      // Use mock data as fallback
      setStats({
        totalUsers: 1247,
        activeUsers: 892,
        totalSessions: 3456,
        totalRevenue: 45678,
        pendingReports: 12,
        systemHealth: 98.5
      });
    } finally {
      setLoading(false);
    }
  };

  const renderContent = () => {
    console.log('AdminDashboard: Rendering content for view:', currentView);
    
    switch (currentView) {
      case 'users':
        console.log('AdminDashboard: Rendering UserManagement');
        return <UserManagement />;
      case 'content':
        console.log('AdminDashboard: Rendering ContentModeration');
        return <ContentModeration />;
      case 'sessions':
        console.log('AdminDashboard: Rendering SessionManagement');
        return <SessionManagement />;
      case 'analytics':
        console.log('AdminDashboard: Rendering AdminAnalytics');
        return <AdminAnalytics />;
      case 'settings':
        console.log('AdminDashboard: Rendering SystemSettings');
        return <SystemSettings />;
      default:
        console.log('AdminDashboard: Rendering AdminOverview');
        return <AdminOverview stats={stats} admin={admin} />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <AdminSidebar
        currentView={currentView}
        onViewChange={setCurrentView}
        onLogout={onLogout}
      />
      
      <div className="flex-1 overflow-hidden">
        <div className="p-8">
          {renderContent()}
        </div>
      </div>
    </div>
  );
};

const AdminOverview: React.FC<{ stats: any; admin: any }> = ({ stats, admin }) => {
  if (!stats) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-red-600 border-t-transparent mx-auto mb-4"></div>
        <p className="text-gray-600">Loading admin dashboard...</p>
      </div>
    );
  }

  const statCards = [
    {
      title: 'Total Users',
      value: stats.totalUsers?.toLocaleString() || '0',
      change: '+12%',
      icon: Users,
      color: 'bg-blue-500'
    },
    {
      title: 'Active Users',
      value: stats.activeUsers?.toLocaleString() || '0',
      change: '+8%',
      icon: UserCheck,
      color: 'bg-green-500'
    },
    {
      title: 'Total Sessions',
      value: stats.totalSessions?.toLocaleString() || '0',
      change: '+15%',
      icon: Video,
      color: 'bg-purple-500'
    },
    {
      title: 'Revenue',
      value: `$${stats.totalRevenue?.toLocaleString() || '0'}`,
      change: '+23%',
      icon: DollarSign,
      color: 'bg-yellow-500'
    },
    {
      title: 'Pending Reports',
      value: stats.pendingReports?.toString() || '0',
      change: '-5%',
      icon: AlertTriangle,
      color: 'bg-red-500'
    },
    {
      title: 'System Health',
      value: `${stats.systemHealth || 100}%`,
      change: '+0.2%',
      icon: Shield,
      color: 'bg-indigo-500'
    }
  ];

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Welcome back, {admin?.name || 'Admin'}
        </h1>
        <p className="text-gray-600">Here's what's happening on GrowthYari today</p>
      </div>

      <div className="mb-8">
        <div className="bg-gradient-to-r from-red-500 to-red-600 rounded-2xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold mb-2">Platform Status</h2>
              <p className="text-red-100">All systems operational</p>
            </div>
            <Shield className="h-12 w-12 text-red-200" />
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {statCards.map((stat, index) => (
          <div key={index} className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className={`p-3 rounded-xl ${stat.color}`}>
                <stat.icon className="h-6 w-6 text-white" />
              </div>
              <span className={`text-sm font-medium ${
                stat.change.startsWith('+') ? 'text-green-600' : 'text-red-600'
              }`}>
                {stat.change}
              </span>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-1">{stat.value}</h3>
            <p className="text-sm text-gray-600">{stat.title}</p>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
          <div className="space-y-4">
            <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">New user registration</p>
                <p className="text-xs text-gray-500">Sarah Johnson joined as UX Designer</p>
              </div>
              <span className="text-xs text-gray-500">2m ago</span>
            </div>
            <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">Session completed</p>
                <p className="text-xs text-gray-500">Mike Chen completed session with Emily</p>
              </div>
              <span className="text-xs text-gray-500">5m ago</span>
            </div>
            <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
              <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">Content reported</p>
                <p className="text-xs text-gray-500">Post flagged for review</p>
              </div>
              <span className="text-xs text-gray-500">12m ago</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">System Status</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Database</span>
              <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
                Healthy
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">API Response Time</span>
              <span className="text-sm font-medium text-gray-900">45ms</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Storage Usage</span>
              <span className="text-sm font-medium text-gray-900">67%</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Active Sessions</span>
              <span className="text-sm font-medium text-gray-900">234</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};