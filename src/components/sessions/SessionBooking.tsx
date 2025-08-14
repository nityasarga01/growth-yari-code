import React, { useState } from 'react';
import { useEffect } from 'react';
import { Calendar, Clock, DollarSign, Video, X, AlertCircle } from 'lucide-react';
import { User, BookingSlot } from '../../types';
import { apiClient } from '../../config/api';

interface SessionBookingProps {
  expert: User | { id: string };
  onClose: () => void;
  onBookSession: (expertId: string, slotId: string, sessionType: 'free' | 'paid') => void;
}

export const SessionBooking: React.FC<SessionBookingProps> = ({ expert, onClose, onBookSession }) => {
  const [selectedSlot, setSelectedSlot] = useState<BookingSlot | null>(null);
  const [sessionType, setSessionType] = useState<'free' | 'paid'>('free');
  const [topic, setTopic] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expertData, setExpertData] = useState<User | null>(null);
  const [loadingExpert, setLoadingExpert] = useState(false);
  const [availableSlots, setAvailableSlots] = useState<BookingSlot[]>([]);
  const [availabilitySettings, setAvailabilitySettings] = useState<any>(null);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [debugInfo, setDebugInfo] = useState<any>(null);

  // Load expert data if only ID is provided
  useEffect(() => {
    const loadExpertData = async () => {
      if ('name' in expert) {
        // Full expert data already provided
        setExpertData(expert as User);
      } else {
        // Only ID provided, need to fetch expert data
        try {
          setLoadingExpert(true);
          const result = await apiClient.getUser(expert.id);
          if (result.success && result.data) {
            setExpertData(result.data.user);
          } else {
            setError('Failed to load expert information');
          }
        } catch (error) {
          setError('Failed to load expert information');
          console.error('Expert load error:', error);
        } finally {
          setLoadingExpert(false);
        }
      }
    };

    loadExpertData();
  }, [expert]);

  // Load expert's availability when expert data is loaded
  useEffect(() => {
    if (expertData) {
      loadExpertAvailability();
    }
  }, [expertData]);

  const loadExpertAvailability = async () => {
    try {
      setLoadingSlots(true);
      setError(null);
      console.log('Loading availability for expert:', expertData!.id);
      
      // Load availability settings and slots
      const [settingsResult, slotsResult] = await Promise.all([
        apiClient.getAvailabilitySettings(expertData!.id),
        apiClient.getExpertAvailabilitySlots(expertData!.id)
      ]);
      
      console.log('SessionBooking: Settings result:', settingsResult);
      console.log('SessionBooking: Slots result:', slotsResult);
      
      if (settingsResult.success && settingsResult.data) {
        console.log('Availability settings loaded:', settingsResult.data.settings);
        setAvailabilitySettings(settingsResult.data.settings);
      } else {
        console.error('Failed to load settings:', settingsResult.error);
      }
      
      if (slotsResult.success && slotsResult.data) {
        console.log('Available slots loaded:', slotsResult.data.slots);
        const slots = slotsResult.data.slots || [];
        console.log('SessionBooking: Raw slots data:', slots);
        console.log('SessionBooking: Slots breakdown:', {
          total: slots.length,
          free: slots.filter(s => s.slot_type === 'free').length,
          paid: slots.filter(s => s.slot_type === 'paid').length,
          unbooked: slots.filter(s => !s.is_booked).length,
          future: slots.filter(s => {
            const slotDateTime = new Date(`${s.date} ${s.start_time}`);
            const now = new Date();
            console.log('Comparing slot time:', slotDateTime, 'with now:', now, 'is future:', slotDateTime > now);
            return slotDateTime > now;
          }).length
        });
        setAvailableSlots(slotsResult.data.slots);
        
        const debugData = {
          totalSlots: slots.length,
          freeSlots: slots.filter(s => s.slot_type === 'free').length,
          paidSlots: slots.filter(s => s.slot_type === 'paid').length,
          unbookedSlots: slots.filter(s => !s.is_booked).length,
          futureSlots: slots.filter(s => new Date(`${s.date} ${s.start_time}`) > new Date()).length
        };
        console.log('SessionBooking: Debug info:', debugData);
        setDebugInfo(debugData);
      } else {
        console.error('Failed to load slots:', slotsResult.error);
        setError(slotsResult.error || 'Failed to load available slots');
      }
    } catch (error) {
      console.error('Failed to load expert availability:', error);
      setError('Failed to load expert availability');
    } finally {
      setLoadingSlots(false);
    }
  };

  const handleBooking = async () => {
    if (!selectedSlot || !topic) {
      setError('Please select a time slot and provide a topic');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const sessionData = {
        expert_id: expertData!.id,
        title: topic,
        description: description || `${sessionType === 'free' ? 'Free' : 'Paid'} session with ${expertData!.name}`,
        duration: selectedSlot.duration,
        price: selectedSlot.price,
        scheduled_at: new Date(`${selectedSlot.date} ${selectedSlot.start_time}`).toISOString()
      };
      
      console.log('SessionBooking: Booking session with data:', sessionData);
      
      const result = await apiClient.bookSession(sessionData);
      if (result.success) {
        console.log('SessionBooking: Session booked successfully, updating slot...');
        // Mark the slot as booked
        const updateResult = await apiClient.updateAvailabilitySlot(selectedSlot.id, {
          is_booked: true,
          session_id: result.data.session.id
        });
        console.log('SessionBooking: Slot update result:', updateResult);
        
        onBookSession(expertData!.id, selectedSlot.id, selectedSlot.slot_type as 'free' | 'paid');
        onClose();
      } else {
        console.error('SessionBooking: Failed to book session:', result.error);
        setError(result.error || 'Failed to book session');
      }
    } catch (error) {
      console.error('SessionBooking: Booking error:', error);
      setError('Failed to book session');
    } finally {
      setLoading(false);
    }
  };


  if (loadingExpert) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-xl sm:rounded-2xl p-8 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-4 border-brand-primary border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-600">Loading expert information...</p>
        </div>
      </div>
    );
  }

  if (!expertData) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-xl sm:rounded-2xl p-8 text-center">
          <p className="text-red-600 mb-4">Failed to load expert information</p>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl sm:rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="p-4 sm:p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Book a Session</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="h-5 w-5 text-gray-500" />
            </button>
          </div>
        </div>

        {/* Expert info */}
        <div className="p-4 sm:p-6 border-b border-gray-200">
          <div className="flex items-center space-x-4">
            <img
              src={expertData.avatar || 'https://images.pexels.com/photos/2379004/pexels-photo-2379004.jpeg?auto=compress&cs=tinysrgb&w=80&h=80&dpr=1'}
              alt={expertData.name}
              className="w-12 sm:w-16 h-12 sm:h-16 rounded-full"
            />
            <div>
              <h3 className="text-lg sm:text-xl font-semibold text-gray-900">{expertData.name}</h3>
              <p className="text-sm sm:text-base text-gray-600">{expertData.profession}</p>
              <div className="flex items-center space-x-2 mt-1">
                <span className="text-yellow-500">★</span>
                <span className="text-sm font-medium">{expertData.rating}</span>
                <span className="text-sm text-gray-500">({expertData.reviewCount} reviews)</span>
              </div>
            </div>
          </div>
          
          <div className="mt-4">
            <p className="text-sm sm:text-base text-gray-600 mb-2">{expertData.bio}</p>
            <div className="flex flex-wrap gap-2">
              {expertData.expertise?.map((skill, index) => (
                <span
                  key={index}
                  className="px-2 py-1 bg-indigo-100 text-indigo-700 text-xs sm:text-sm rounded-full"
                >
                  {skill}
                </span>
              )) || []}
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="p-4 sm:p-6 border-b border-gray-200">
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          </div>
        )}

        {/* Session type selection */}
        <div className="p-4 sm:p-6 border-b border-gray-200">
          <h4 className="text-base sm:text-lg font-semibold text-gray-900 mb-4">Session Type</h4>
          
          {loadingSlots ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-6 w-6 border-4 border-brand-primary border-t-transparent mx-auto mb-2"></div>
              <p className="text-sm text-gray-600">Loading availability...</p>
            </div>
          ) : availabilitySettings ? (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {availabilitySettings.offersFreeSessions && (
                  <button
                    onClick={() => setSessionType('free')}
                    className={`p-4 rounded-lg border-2 transition-colors ${
                      sessionType === 'free'
                        ? 'border-brand-primary bg-brand-primary/10'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center space-x-2 mb-2">
                      <Video className="h-5 w-5 text-brand-primary" />
                      <span className="text-sm sm:text-base font-medium">Free Session</span>
                    </div>
                    <p className="text-xs sm:text-sm text-gray-600">
                      {availabilitySettings.freeSessionDuration}-minute introductory call
                    </p>
                  </button>
                )}
                
                <button
                  onClick={() => setSessionType('paid')}
                  className={`p-4 rounded-lg border-2 transition-colors ${
                    sessionType === 'paid'
                      ? 'border-brand-primary bg-brand-primary/10'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center space-x-2 mb-2">
                    <DollarSign className="h-5 w-5 text-brand-primary" />
                    <span className="text-sm sm:text-base font-medium">Paid Session</span>
                  </div>
                  <p className="text-xs sm:text-sm text-gray-600">
                    {availabilitySettings.defaultPaidDuration}-minute deep dive session
                  </p>
                  <p className="text-xs text-brand-primary font-medium mt-1">
                    Starting from ${availabilitySettings.defaultPaidPrice}
                  </p>
                </button>
              </div>
              
              {/* Show message if only paid sessions available */}
              {!availabilitySettings.offersFreeSessions && (
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <AlertCircle className="h-4 w-4 text-blue-600" />
                    <p className="text-sm text-blue-700">
                      This expert only offers paid sessions
                    </p>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-center space-x-2">
                <AlertCircle className="h-4 w-4 text-yellow-600" />
                <p className="text-sm text-yellow-700">
                  This expert hasn't set up their availability yet
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Available slots */}
        <div className="p-4 sm:p-6 border-b border-gray-200">
          <h4 className="text-base sm:text-lg font-semibold text-gray-900 mb-4">Available Time Slots</h4>
          
          {loadingSlots ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-6 w-6 border-4 border-brand-primary border-t-transparent mx-auto mb-2"></div>
              <p className="text-sm text-gray-600">Loading available slots...</p>
            </div>
          ) : availableSlots.length === 0 ? (
            <div className="text-center py-8">
              <Calendar className="h-8 w-8 text-gray-400 mx-auto mb-2" />
              <p className="text-sm text-gray-600">No available slots found</p>
              {debugInfo && (
                <div className="mt-2 text-xs text-gray-500">
                  <p>Debug: {debugInfo.totalSlots} total, {debugInfo.freeSlots} free, {debugInfo.paidSlots} paid, {debugInfo.unbookedSlots} unbooked</p>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {availableSlots
                .filter(slot => {
                  console.log('SessionBooking: Filtering slot:', {
                    id: slot.id,
                    slot_type: slot.slot_type,
                    is_booked: slot.is_booked,
                    date: slot.date,
                    start_time: slot.start_time
                  }, 'for session type:', sessionType);
                  
                  if (sessionType === 'free') {
                    const isFreeAndUnbooked = slot.slot_type === 'free' && !slot.is_booked;
                    console.log('SessionBooking: Free slot check:', isFreeAndUnbooked);
                    return isFreeAndUnbooked;
                  } else {
                    const isPaidAndUnbooked = slot.slot_type === 'paid' && !slot.is_booked;
                    console.log('SessionBooking: Paid slot check:', isPaidAndUnbooked);
                    return isPaidAndUnbooked;
                  }
                })
                .filter(slot => {
                  // Additional filter to ensure slot is in the future
                  const slotDateTime = new Date(`${slot.date} ${slot.start_time}`);
                  const now = new Date();
                  const isFuture = slotDateTime > now;
                  console.log('SessionBooking: Future check for slot:', slotDateTime, 'vs now:', now, 'is future:', isFuture);
                  return isFuture;
                })
                .map((slot) => (
                  <button
                    key={slot.id}
                    onClick={() => setSelectedSlot(slot)}
                    className={`w-full p-3 sm:p-4 rounded-lg border-2 text-left transition-colors ${
                      selectedSlot?.id === slot.id
                        ? 'border-brand-primary bg-brand-primary/10'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="flex items-center space-x-2 mb-1">
                          <Calendar className="h-4 w-4 text-gray-500" />
                          <span className="text-sm sm:text-base font-medium">
                            {new Date(slot.date).toLocaleDateString('en-US', {
                              weekday: 'long',
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric'
                            })}
                          </span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Clock className="h-4 w-4 text-gray-500" />
                          <span className="text-sm text-gray-600">{slot.start_time} - {slot.end_time}</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-base sm:text-lg font-semibold text-gray-900">
                          {slot.price === 0 ? 'Free' : `$${slot.price}`}
                        </div>
                        <div className="text-sm text-gray-500">{slot.duration} min</div>
                      </div>
                    </div>
                  </button>
                ))}
              
              {availableSlots.filter(slot => {
                if (sessionType === 'free') {
                  return slot.slot_type === 'free' && !slot.is_booked && new Date(`${slot.date} ${slot.start_time}`) > new Date();
                } else {
                  return slot.slot_type === 'paid' && !slot.is_booked && new Date(`${slot.date} ${slot.start_time}`) > new Date();
                }
              }).length === 0 && (
                <div className="text-center py-6">
                  <AlertCircle className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-600">
                    No {sessionType} slots available.
                    {sessionType === 'free' && availabilitySettings && !availabilitySettings.offersFreeSessions && (
                      <span className="block mt-1">This expert doesn't offer free sessions.</span>
                    )}
                    {debugInfo && (
                      <span className="block mt-1 text-xs">
                        Debug: {debugInfo.totalSlots} total, {debugInfo.freeSlots} free, {debugInfo.paidSlots} paid, {debugInfo.unbookedSlots} unbooked, {debugInfo.futureSlots} future
                      </span>
                    )}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Session details */}
        <div className="p-4 sm:p-6 border-b border-gray-200">
          <h4 className="text-base sm:text-lg font-semibold text-gray-900 mb-4">Session Details</h4>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Topic/Focus Area
              </label>
              <input
                type="text"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-brand-primary"
                placeholder="What would you like to discuss?"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description (Optional)
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-brand-primary"
                placeholder="Provide more details about what you'd like to learn or discuss..."
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 sm:p-6">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">
              {selectedSlot && (
                <span className="hidden sm:inline">
                  Selected: {formatDate(new Date(selectedSlot.date))} at {selectedSlot.start_time}
                </span>
              )}
            </div>
            <div className="flex items-center space-x-2 sm:space-x-4">
              <button
                onClick={onClose}
                className="px-4 sm:px-6 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors text-sm sm:text-base"
              >
                Cancel
              </button>
              <button
                onClick={handleBooking}
                disabled={!selectedSlot || !topic || loading}
                className="px-4 sm:px-6 py-2 bg-gradient-to-r from-brand-primary to-brand-secondary text-white rounded-lg hover:from-brand-primary/90 hover:to-brand-secondary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all text-sm sm:text-base"
              >
                {loading ? 'Booking...' : 'Book Session'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};