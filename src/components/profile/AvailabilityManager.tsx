import React, { useState, useEffect } from 'react';
import { Plus, Clock, DollarSign, Calendar, Trash2, Edit, Save, X, Settings } from 'lucide-react';
import { apiClient } from '../../config/api';

interface AvailabilitySlot {
  id: string;
  date: string;
  start_time: string;
  end_time: string;
  slot_type: 'free' | 'paid' | 'blocked';
  price: number;
  duration: number;
  is_booked: boolean;
  is_recurring: boolean;
  recurring_pattern?: string;
  notes?: string;
}

interface AvailabilitySettings {
  offersFreeSessions: boolean;
  freeSessionDuration: number;
  defaultPaidDuration: number;
  defaultPaidPrice: number;
  timezone: string;
  bufferTime: number;
  advanceBookingDays: number;
}

interface AvailabilityManagerProps {
  userId: string;
  isOpen: boolean;
  onClose: () => void;
}

export const AvailabilityManager: React.FC<AvailabilityManagerProps> = ({ 
  userId, 
  isOpen, 
  onClose 
}) => {
  const [slots, setSlots] = useState<AvailabilitySlot[]>([]);
  const [settings, setSettings] = useState<AvailabilitySettings>({
    offersFreeSessions: false,
    freeSessionDuration: 30,
    defaultPaidDuration: 60,
    defaultPaidPrice: 75,
    timezone: 'UTC',
    bufferTime: 15,
    advanceBookingDays: 30
  });
  const [showAddSlot, setShowAddSlot] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // New slot form state
  const [newSlot, setNewSlot] = useState({
    date: '',
    start_time: '',
    end_time: '',
    slot_type: 'paid' as 'free' | 'paid',
    price: 75,
    duration: 60,
    is_recurring: false,
    recurring_pattern: 'weekly',
    recurring_until: '',
    notes: ''
  });

  useEffect(() => {
    if (isOpen) {
      loadAvailabilityData();
    }
  }, [isOpen, userId]);

  const loadAvailabilityData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('AvailabilityManager: Loading data for user:', userId);
      
      // Load availability slots and settings
      const [slotsResult, settingsResult] = await Promise.all([
        apiClient.getExpertAvailabilitySlots(userId),
        apiClient.getAvailabilitySettings(userId)
      ]);
      
      console.log('AvailabilityManager: Slots result:', slotsResult);
      console.log('AvailabilityManager: Settings result:', settingsResult);
      
      if (slotsResult.success && slotsResult.data) {
        const slots = slotsResult.data.slots || [];
        console.log('AvailabilityManager: Setting slots:', slots);
        console.log('AvailabilityManager: Slots count:', slots.length);
        console.log('AvailabilityManager: Slot details:', slots.map(s => ({
          id: s.id,
          date: s.date,
          start_time: s.start_time,
          end_time: s.end_time,
          slot_type: s.slot_type,
          is_booked: s.is_booked,
          price: s.price
        })));
        setSlots(slotsResult.data.slots);
      } else {
        console.error('AvailabilityManager: Failed to load slots:', slotsResult.error);
        setError(slotsResult.error || 'Failed to load slots');
      }
      
      if (settingsResult.success && settingsResult.data) {
        console.log('AvailabilityManager: Setting settings:', settingsResult.data.settings);
        setSettings(settingsResult.data.settings);
      } else {
        console.error('AvailabilityManager: Failed to load settings:', settingsResult.error);
      }
    } catch (error) {
      console.error('Failed to load availability data:', error);
      setError('Failed to load availability data');
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async () => {
    try {
      setSaving(true);
      setError(null);
      
      const result = await apiClient.updateAvailabilitySettings(settings);
      if (result.success) {
        setShowSettings(false);
      } else {
        setError(result.error || 'Failed to save settings');
      }
    } catch (error) {
      console.error('Failed to save settings:', error);
      setError('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const addSlot = async () => {
    try {
      setSaving(true);
      setError(null);
      
      console.log('Creating slot with data:', newSlot);
      
      const slotData = {
        ...newSlot,
        price: newSlot.slot_type === 'free' ? 0 : newSlot.price
      };
      
      const result = await apiClient.createAvailabilitySlot(slotData);
      console.log('Create slot result:', result);
      
      if (result.success && result.data) {
        setSlots(prev => [...prev, result.data.slot]);
        setShowAddSlot(false);
        resetNewSlotForm();
        console.log('Slot created successfully');
      } else {
        console.error('Failed to create slot:', result.error);
        setError(result.error || 'Failed to create slot');
      }
    } catch (error) {
      console.error('Failed to create slot:', error);
      setError('Failed to create slot');
    } finally {
      setSaving(false);
    }
  };

  const deleteSlot = async (slotId: string) => {
    try {
      const result = await apiClient.deleteAvailabilitySlot(slotId);
      if (result.success) {
        setSlots(prev => prev.filter(slot => slot.id !== slotId));
      } else {
        setError(result.error || 'Failed to delete slot');
      }
    } catch (error) {
      console.error('Failed to delete slot:', error);
      setError('Failed to delete slot');
    }
  };

  const resetNewSlotForm = () => {
    setNewSlot({
      date: '',
      start_time: '',
      end_time: '',
      slot_type: 'paid',
      price: settings.defaultPaidPrice,
      duration: settings.defaultPaidDuration,
      is_recurring: false,
      recurring_pattern: 'weekly',
      recurring_until: '',
      notes: ''
    });
  };

  const timeSlots = Array.from({ length: 24 }, (_, i) => {
    const hour = i.toString().padStart(2, '0');
    return `${hour}:00`;
  });

  const formatSlotTime = (date: string, startTime: string, endTime: string) => {
    const slotDate = new Date(date);
    return `${slotDate.toLocaleDateString()} ${startTime} - ${endTime}`;
  };

  const getSlotTypeColor = (type: string) => {
    switch (type) {
      case 'free':
        return 'bg-green-100 text-green-800';
      case 'paid':
        return 'bg-blue-100 text-blue-800';
      case 'blocked':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-gray-900">Manage Availability</h2>
              <p className="text-gray-600">Set your available time slots and pricing</p>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setShowSettings(true)}
                className="flex items-center space-x-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              >
                <Settings className="h-4 w-4" />
                <span>Settings</span>
              </button>
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="p-6 border-b border-gray-200">
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          </div>
        )}

        {/* Content */}
        <div className="p-6 max-h-[60vh] overflow-y-auto">
          {/* Quick Stats */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="bg-green-50 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-green-600">
                {slots.filter(s => s.slot_type === 'free' && !s.is_booked).length}
              </div>
              <div className="text-sm text-green-700">Free Slots</div>
            </div>
            <div className="bg-blue-50 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-blue-600">
                {slots.filter(s => s.slot_type === 'paid' && !s.is_booked).length}
              </div>
              <div className="text-sm text-blue-700">Paid Slots</div>
            </div>
            <div className="bg-purple-50 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-purple-600">
                {slots.filter(s => s.is_booked).length}
              </div>
              <div className="text-sm text-purple-700">Booked</div>
            </div>
          </div>

          {/* Add Slot Button */}
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Available Slots</h3>
            <button
              onClick={() => setShowAddSlot(true)}
              className="flex items-center space-x-2 px-4 py-2 bg-brand-primary text-white rounded-lg hover:bg-brand-secondary transition-colors"
            >
              <Plus className="h-4 w-4" />
              <span>Add Slot</span>
            </button>
          </div>

          {/* Slots List */}
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-4 border-brand-primary border-t-transparent mx-auto mb-4"></div>
              <p className="text-gray-600">Loading availability...</p>
            </div>
          ) : slots.length === 0 ? (
            <div className="text-center py-12">
              <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No availability slots</h3>
              <p className="text-gray-600">Add your first availability slot to start accepting bookings</p>
            </div>
          ) : (
            <div className="space-y-3">
              {slots
                .sort((a, b) => new Date(`${a.date} ${a.start_time}`).getTime() - new Date(`${b.date} ${b.start_time}`).getTime())
                .map((slot) => (
                  <div key={slot.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center space-x-2">
                        <Calendar className="h-4 w-4 text-gray-500" />
                        <span className="font-medium">{formatSlotTime(slot.date, slot.start_time, slot.end_time)}</span>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getSlotTypeColor(slot.slot_type)}`}>
                        {slot.slot_type === 'free' ? 'Free' : `$${slot.price}`}
                      </span>
                      <div className="flex items-center space-x-1 text-sm text-gray-600">
                        <Clock className="h-4 w-4" />
                        <span>{slot.duration}min</span>
                      </div>
                      {slot.is_booked && (
                        <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-medium">
                          Booked
                        </span>
                      )}
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      {!slot.is_booked && (
                        <>
                          <button
                            onClick={() => {/* TODO: Edit slot */}}
                            className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => deleteSlot(slot.id)}
                            className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>

        {/* Add Slot Modal */}
        {showAddSlot && (
          <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl max-w-md w-full p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Add Availability Slot</h3>
                <button
                  onClick={() => setShowAddSlot(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="h-5 w-5 text-gray-500" />
                </button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Date</label>
                  <input
                    type="date"
                    value={newSlot.date}
                    onChange={(e) => setNewSlot(prev => ({ ...prev, date: e.target.value }))}
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-brand-primary"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Start Time</label>
                    <select
                      value={newSlot.start_time}
                      onChange={(e) => setNewSlot(prev => ({ ...prev, start_time: e.target.value }))}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-brand-primary"
                    >
                      <option value="">Select time</option>
                      {timeSlots.map(time => (
                        <option key={time} value={time}>{time}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">End Time</label>
                    <select
                      value={newSlot.end_time}
                      onChange={(e) => setNewSlot(prev => ({ ...prev, end_time: e.target.value }))}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-brand-primary"
                    >
                      <option value="">Select time</option>
                      {timeSlots.map(time => (
                        <option key={time} value={time}>{time}</option>
                      ))}
                    </select>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Session Type</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setNewSlot(prev => ({ 
                        ...prev, 
                        slot_type: 'free', 
                        price: 0, 
                        duration: settings.freeSessionDuration 
                      }))}
                      className={`p-3 rounded-lg border-2 transition-colors ${
                        newSlot.slot_type === 'free'
                          ? 'border-green-500 bg-green-50 text-green-700'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="text-center">
                        <div className="font-medium">Free</div>
                        <div className="text-xs">{settings.freeSessionDuration}min</div>
                      </div>
                    </button>
                    <button
                      type="button"
                      onClick={() => setNewSlot(prev => ({ 
                        ...prev, 
                        slot_type: 'paid', 
                        price: settings.defaultPaidPrice, 
                        duration: settings.defaultPaidDuration 
                      }))}
                      className={`p-3 rounded-lg border-2 transition-colors ${
                        newSlot.slot_type === 'paid'
                          ? 'border-blue-500 bg-blue-50 text-blue-700'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="text-center">
                        <div className="font-medium">Paid</div>
                        <div className="text-xs">${settings.defaultPaidPrice}</div>
                      </div>
                    </button>
                  </div>
                </div>
                
                {newSlot.slot_type === 'paid' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Price ($)</label>
                    <input
                      type="number"
                      value={newSlot.price}
                      onChange={(e) => setNewSlot(prev => ({ ...prev, price: parseFloat(e.target.value) || 0 }))}
                      min="0"
                      step="5"
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-brand-primary"
                    />
                  </div>
                )}
                
                <div>
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={newSlot.is_recurring}
                      onChange={(e) => setNewSlot(prev => ({ ...prev, is_recurring: e.target.checked }))}
                      className="h-4 w-4 text-brand-primary focus:ring-brand-primary border-gray-300 rounded"
                    />
                    <span className="text-sm font-medium text-gray-700">Recurring slot</span>
                  </label>
                </div>
                
                {newSlot.is_recurring && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Pattern</label>
                      <select
                        value={newSlot.recurring_pattern}
                        onChange={(e) => setNewSlot(prev => ({ ...prev, recurring_pattern: e.target.value }))}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-brand-primary"
                      >
                        <option value="weekly">Weekly</option>
                        <option value="daily">Daily</option>
                        <option value="monthly">Monthly</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Until</label>
                      <input
                        type="date"
                        value={newSlot.recurring_until}
                        onChange={(e) => setNewSlot(prev => ({ ...prev, recurring_until: e.target.value }))}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-brand-primary"
                      />
                    </div>
                  </div>
                )}
              </div>
              
              <div className="flex justify-end space-x-4 mt-6">
                <button
                  onClick={() => setShowAddSlot(false)}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={addSlot}
                  disabled={saving || !newSlot.date || !newSlot.start_time || !newSlot.end_time}
                  className="flex items-center space-x-2 px-4 py-2 bg-brand-primary text-white rounded-lg hover:bg-brand-secondary disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {saving ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                      <span>Adding...</span>
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4" />
                      <span>Add Slot</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Settings Modal */}
        {showSettings && (
          <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl max-w-md w-full p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Availability Settings</h3>
                <button
                  onClick={() => setShowSettings(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="h-5 w-5 text-gray-500" />
                </button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={settings.offersFreeSessions}
                      onChange={(e) => setSettings(prev => ({ ...prev, offersFreeSessions: e.target.checked }))}
                      className="h-4 w-4 text-brand-primary focus:ring-brand-primary border-gray-300 rounded"
                    />
                    <span className="text-sm font-medium text-gray-700">Offer free sessions</span>
                  </label>
                </div>
                
                {settings.offersFreeSessions && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Free session duration (minutes)</label>
                    <input
                      type="number"
                      value={settings.freeSessionDuration}
                      onChange={(e) => setSettings(prev => ({ ...prev, freeSessionDuration: parseInt(e.target.value) || 30 }))}
                      min="15"
                      max="60"
                      step="15"
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-brand-primary"
                    />
                  </div>
                )}
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Default paid session duration (minutes)</label>
                  <input
                    type="number"
                    value={settings.defaultPaidDuration}
                    onChange={(e) => setSettings(prev => ({ ...prev, defaultPaidDuration: parseInt(e.target.value) || 60 }))}
                    min="30"
                    max="180"
                    step="15"
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-brand-primary"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Default paid session price ($)</label>
                  <input
                    type="number"
                    value={settings.defaultPaidPrice}
                    onChange={(e) => setSettings(prev => ({ ...prev, defaultPaidPrice: parseFloat(e.target.value) || 75 }))}
                    min="0"
                    step="5"
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-brand-primary"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Buffer time between sessions (minutes)</label>
                  <input
                    type="number"
                    value={settings.bufferTime}
                    onChange={(e) => setSettings(prev => ({ ...prev, bufferTime: parseInt(e.target.value) || 15 }))}
                    min="0"
                    max="60"
                    step="5"
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-brand-primary"
                  />
                </div>
              </div>
              
              <div className="flex justify-end space-x-4 mt-6">
                <button
                  onClick={() => setShowSettings(false)}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={saveSettings}
                  disabled={saving}
                  className="flex items-center space-x-2 px-4 py-2 bg-brand-primary text-white rounded-lg hover:bg-brand-secondary disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {saving ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4" />
                      <span>Save Settings</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};