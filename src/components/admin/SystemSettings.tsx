import React, { useState, useEffect } from 'react';
import { 
  Settings, 
  Save, 
  Database, 
  Mail, 
  CreditCard, 
  Shield,
  Globe,
  Bell,
  Zap,
  AlertCircle,
  CheckCircle
} from 'lucide-react';
import { adminApiClient } from '../../config/adminApi';

interface SystemConfig {
  platform: {
    name: string;
    description: string;
    maintenanceMode: boolean;
    registrationEnabled: boolean;
    maxUsersPerSession: number;
  };
  email: {
    smtpHost: string;
    smtpPort: number;
    fromEmail: string;
    enabled: boolean;
  };
  payments: {
    stripeEnabled: boolean;
    platformFee: number;
    minimumSessionPrice: number;
    currency: string;
  };
  security: {
    sessionTimeout: number;
    maxLoginAttempts: number;
    requireEmailVerification: boolean;
    enableTwoFactor: boolean;
  };
  features: {
    yariConnectEnabled: boolean;
    freeSessionsEnabled: boolean;
    chatEnabled: boolean;
    notificationsEnabled: boolean;
  };
}

export const SystemSettings: React.FC = () => {
  const [config, setConfig] = useState<SystemConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('platform');

  useEffect(() => {
    loadSystemConfig();
  }, []);

  const loadSystemConfig = async () => {
    try {
      setLoading(true);
      
      const result = await adminApiClient.getSystemConfig();
      if (result.success && result.data) {
        setConfig(result.data.config);
      } else {
        // Default configuration
        setConfig({
          platform: {
            name: 'GrowthYari',
            description: 'Professional networking and mentorship platform',
            maintenanceMode: false,
            registrationEnabled: true,
            maxUsersPerSession: 2
          },
          email: {
            smtpHost: 'smtp.gmail.com',
            smtpPort: 587,
            fromEmail: 'noreply@growthyari.com',
            enabled: true
          },
          payments: {
            stripeEnabled: true,
            platformFee: 10,
            minimumSessionPrice: 25,
            currency: 'USD'
          },
          security: {
            sessionTimeout: 24,
            maxLoginAttempts: 5,
            requireEmailVerification: false,
            enableTwoFactor: false
          },
          features: {
            yariConnectEnabled: true,
            freeSessionsEnabled: true,
            chatEnabled: true,
            notificationsEnabled: true
          }
        });
      }
    } catch (error) {
      console.error('Failed to load system config:', error);
      setError('Failed to load system configuration');
    } finally {
      setLoading(false);
    }
  };

  const saveConfig = async () => {
    try {
      setSaving(true);
      setError(null);
      setSuccess(null);
      
      const result = await adminApiClient.updateSystemConfig(config);
      if (result.success) {
        setSuccess('Configuration saved successfully');
        setTimeout(() => setSuccess(null), 3000);
      } else {
        setError(result.error || 'Failed to save configuration');
      }
    } catch (error) {
      console.error('Failed to save config:', error);
      setError('Failed to save configuration');
    } finally {
      setSaving(false);
    }
  };

  const updateConfig = (section: keyof SystemConfig, field: string, value: any) => {
    setConfig(prev => prev ? {
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value
      }
    } : null);
  };

  const tabs = [
    { id: 'platform', label: 'Platform', icon: Globe },
    { id: 'email', label: 'Email', icon: Mail },
    { id: 'payments', label: 'Payments', icon: CreditCard },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'features', label: 'Features', icon: Zap }
  ];

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-red-600 border-t-transparent mx-auto mb-4"></div>
        <p className="text-gray-600">Loading system settings...</p>
      </div>
    );
  }

  if (!config) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
        <p className="text-red-600">Failed to load system configuration</p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">System Settings</h1>
          <p className="text-gray-600">Configure platform settings and features</p>
        </div>
        <button
          onClick={saveConfig}
          disabled={saving}
          className="flex items-center space-x-2 px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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

      {/* Status Messages */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center space-x-2">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        </div>
      )}

      {success && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center space-x-2">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <p className="text-green-600 text-sm">{success}</p>
          </div>
        </div>
      )}

      <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
        {/* Tabs */}
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 py-4 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab.id
                    ? 'border-red-500 text-red-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <tab.icon className="h-4 w-4" />
                <span>{tab.label}</span>
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {activeTab === 'platform' && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Platform Name</label>
                <input
                  type="text"
                  value={config.platform.name}
                  onChange={(e) => updateConfig('platform', 'name', e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Platform Description</label>
                <textarea
                  value={config.platform.description}
                  onChange={(e) => updateConfig('platform', 'description', e.target.value)}
                  rows={3}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={config.platform.maintenanceMode}
                      onChange={(e) => updateConfig('platform', 'maintenanceMode', e.target.checked)}
                      className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded"
                    />
                    <span className="text-sm font-medium text-gray-700">Maintenance Mode</span>
                  </label>
                  <p className="text-xs text-gray-500 mt-1">Temporarily disable platform access</p>
                </div>

                <div>
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={config.platform.registrationEnabled}
                      onChange={(e) => updateConfig('platform', 'registrationEnabled', e.target.checked)}
                      className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded"
                    />
                    <span className="text-sm font-medium text-gray-700">Registration Enabled</span>
                  </label>
                  <p className="text-xs text-gray-500 mt-1">Allow new user registrations</p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'email' && (
            <div className="space-y-6">
              <div>
                <label className="flex items-center space-x-2 mb-4">
                  <input
                    type="checkbox"
                    checked={config.email.enabled}
                    onChange={(e) => updateConfig('email', 'enabled', e.target.checked)}
                    className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded"
                  />
                  <span className="text-sm font-medium text-gray-700">Email Service Enabled</span>
                </label>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">SMTP Host</label>
                  <input
                    type="text"
                    value={config.email.smtpHost}
                    onChange={(e) => updateConfig('email', 'smtpHost', e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                    disabled={!config.email.enabled}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">SMTP Port</label>
                  <input
                    type="number"
                    value={config.email.smtpPort}
                    onChange={(e) => updateConfig('email', 'smtpPort', parseInt(e.target.value))}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                    disabled={!config.email.enabled}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">From Email Address</label>
                <input
                  type="email"
                  value={config.email.fromEmail}
                  onChange={(e) => updateConfig('email', 'fromEmail', e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                  disabled={!config.email.enabled}
                />
              </div>
            </div>
          )}

          {activeTab === 'payments' && (
            <div className="space-y-6">
              <div>
                <label className="flex items-center space-x-2 mb-4">
                  <input
                    type="checkbox"
                    checked={config.payments.stripeEnabled}
                    onChange={(e) => updateConfig('payments', 'stripeEnabled', e.target.checked)}
                    className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded"
                  />
                  <span className="text-sm font-medium text-gray-700">Stripe Payments Enabled</span>
                </label>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Platform Fee (%)</label>
                  <input
                    type="number"
                    value={config.payments.platformFee}
                    onChange={(e) => updateConfig('payments', 'platformFee', parseFloat(e.target.value))}
                    min="0"
                    max="30"
                    step="0.5"
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                    disabled={!config.payments.stripeEnabled}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Minimum Session Price ($)</label>
                  <input
                    type="number"
                    value={config.payments.minimumSessionPrice}
                    onChange={(e) => updateConfig('payments', 'minimumSessionPrice', parseFloat(e.target.value))}
                    min="0"
                    step="5"
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                    disabled={!config.payments.stripeEnabled}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Currency</label>
                <select
                  value={config.payments.currency}
                  onChange={(e) => updateConfig('payments', 'currency', e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                  disabled={!config.payments.stripeEnabled}
                >
                  <option value="USD">USD - US Dollar</option>
                  <option value="EUR">EUR - Euro</option>
                  <option value="GBP">GBP - British Pound</option>
                  <option value="CAD">CAD - Canadian Dollar</option>
                </select>
              </div>
            </div>
          )}

          {activeTab === 'security' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Session Timeout (hours)</label>
                  <input
                    type="number"
                    value={config.security.sessionTimeout}
                    onChange={(e) => updateConfig('security', 'sessionTimeout', parseInt(e.target.value))}
                    min="1"
                    max="168"
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Max Login Attempts</label>
                  <input
                    type="number"
                    value={config.security.maxLoginAttempts}
                    onChange={(e) => updateConfig('security', 'maxLoginAttempts', parseInt(e.target.value))}
                    min="3"
                    max="10"
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                  />
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={config.security.requireEmailVerification}
                      onChange={(e) => updateConfig('security', 'requireEmailVerification', e.target.checked)}
                      className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded"
                    />
                    <span className="text-sm font-medium text-gray-700">Require Email Verification</span>
                  </label>
                  <p className="text-xs text-gray-500 mt-1">Users must verify email before accessing platform</p>
                </div>

                <div>
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={config.security.enableTwoFactor}
                      onChange={(e) => updateConfig('security', 'enableTwoFactor', e.target.checked)}
                      className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded"
                    />
                    <span className="text-sm font-medium text-gray-700">Enable Two-Factor Authentication</span>
                  </label>
                  <p className="text-xs text-gray-500 mt-1">Optional 2FA for enhanced security</p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'features' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={config.features.yariConnectEnabled}
                      onChange={(e) => updateConfig('features', 'yariConnectEnabled', e.target.checked)}
                      className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded"
                    />
                    <span className="text-sm font-medium text-gray-700">YariConnect</span>
                  </label>
                  <p className="text-xs text-gray-500 mt-1">Real-time video matching feature</p>
                </div>

                <div>
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={config.features.freeSessionsEnabled}
                      onChange={(e) => updateConfig('features', 'freeSessionsEnabled', e.target.checked)}
                      className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded"
                    />
                    <span className="text-sm font-medium text-gray-700">Free Sessions</span>
                  </label>
                  <p className="text-xs text-gray-500 mt-1">Allow experts to offer free sessions</p>
                </div>

                <div>
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={config.features.chatEnabled}
                      onChange={(e) => updateConfig('features', 'chatEnabled', e.target.checked)}
                      className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded"
                    />
                    <span className="text-sm font-medium text-gray-700">Chat System</span>
                  </label>
                  <p className="text-xs text-gray-500 mt-1">Enable messaging between users</p>
                </div>

                <div>
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={config.features.notificationsEnabled}
                      onChange={(e) => updateConfig('features', 'notificationsEnabled', e.target.checked)}
                      className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded"
                    />
                    <span className="text-sm font-medium text-gray-700">Notifications</span>
                  </label>
                  <p className="text-xs text-gray-500 mt-1">Push and email notifications</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};