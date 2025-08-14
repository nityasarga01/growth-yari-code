import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Plus, Calendar as CalendarIcon, Clock, User, Video, X, MapPin, CheckCircle, XCircle } from 'lucide-react';
import { Session } from '../../types';
import { apiClient } from '../../config/api';

interface CalendarEvent {
  id: string;
  title: string;
  description: string;
  start: string;
  end: string;
  duration: number;
  price: number;
  status: string;
  meeting_link?: string;
  expert: {
    id: string;
    name: string;
    avatar: string;
    profession: string;
  };
  client: {
    id: string;
    name: string;
    avatar: string;
    profession: string;
  };
  is_expert: boolean;
}

interface CalendarViewProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CalendarView: React.FC<CalendarViewProps> = ({ isOpen, onClose }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [view, setView] = useState<'month' | 'week' | 'day'>('month');
  const [updatingSession, setUpdatingSession] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadEvents();
    }
  }, [isOpen, currentDate, view]);

  const loadEvents = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('Loading calendar events for:', currentDate.getMonth() + 1, currentDate.getFullYear());
      
      // Get calendar events for the current month
      const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
      const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
      
      const result = await apiClient.getCalendarEvents(
        startOfMonth.toISOString(),
        endOfMonth.toISOString()
      );
      if (result.success && result.data) {
        console.log('Calendar events loaded:', result.data.events.length);
        setEvents(result.data.events || []);
      } else {
        console.error('Failed to load calendar events:', result.error);
        setError(result.error || 'Failed to load events');
      }
    } catch (error) {
      console.error('Calendar events load error:', error);
      setError('Failed to load events');
    } finally {
      setLoading(false);
    }
  };

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];
    
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    
    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day));
    }
    
    return days;
  };

  const getEventsForDate = (date: Date) => {
    return events.filter(event => {
      const eventDate = new Date(event.start);
      return eventDate.toDateString() === date.toDateString();
    });
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      if (direction === 'prev') {
        newDate.setMonth(prev.getMonth() - 1);
      } else {
        newDate.setMonth(prev.getMonth() + 1);
      }
      return newDate;
    });
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'bg-green-500';
      case 'pending':
        return 'bg-yellow-500';
      case 'completed':
        return 'bg-blue-500';
      case 'cancelled':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getStatusTextColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'text-green-800 bg-green-100';
      case 'pending':
        return 'text-yellow-800 bg-yellow-100';
      case 'completed':
        return 'text-blue-800 bg-blue-100';
      case 'cancelled':
        return 'text-red-800 bg-red-100';
      default:
        return 'text-gray-800 bg-gray-100';
    }
  };

  const handleConfirmSession = async (sessionId: string) => {
    try {
      setUpdatingSession(sessionId);
      console.log('Calendar: Expert confirming session:', sessionId);
      
      const result = await apiClient.updateSessionStatus(sessionId, 'confirmed');
      if (result.success) {
        // Update the event in local state
        setEvents(prev => prev.map(event => 
          event.id === sessionId 
            ? { 
                ...event, 
                status: 'confirmed',
                meeting_link: result.data?.session?.meeting_link || event.meeting_link
              }
            : event
        ));
        
        // Update selected event if it's the one being confirmed
        if (selectedEvent && selectedEvent.id === sessionId) {
          setSelectedEvent(prev => prev ? {
            ...prev,
            status: 'confirmed',
            meeting_link: result.data?.session?.meeting_link || prev.meeting_link
          } : null);
        }
        
        console.log('Calendar: Session confirmed successfully with meeting link:', result.data?.session?.meeting_link);
      } else {
        console.error('Failed to confirm session:', result.error);
        setError(result.error || 'Failed to confirm session');
      }
    } catch (error) {
      console.error('Session confirmation error:', error);
      setError('Failed to confirm session');
    } finally {
      setUpdatingSession(null);
    }
  };

  const handleDeclineSession = async (sessionId: string) => {
    try {
      setUpdatingSession(sessionId);
      console.log('Calendar: Expert declining session:', sessionId);
      
      const result = await apiClient.updateSessionStatus(sessionId, 'cancelled');
      if (result.success) {
        // Update the event in local state
        setEvents(prev => prev.map(event => 
          event.id === sessionId 
            ? { ...event, status: 'cancelled' }
            : event
        ));
        
        // Update selected event if it's the one being declined
        if (selectedEvent && selectedEvent.id === sessionId) {
          setSelectedEvent(prev => prev ? {
            ...prev,
            status: 'cancelled'
          } : null);
        }
        
        console.log('Calendar: Session declined successfully');
      } else {
        console.error('Failed to decline session:', result.error);
        setError(result.error || 'Failed to decline session');
      }
    } catch (error) {
      console.error('Session decline error:', error);
      setError('Failed to decline session');
    } finally {
      setUpdatingSession(null);
    }
  };
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-xl max-w-6xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <CalendarIcon className="h-6 w-6 text-indigo-600" />
              <h2 className="text-xl font-bold text-gray-900">Calendar</h2>
            </div>
            <div className="flex items-center space-x-4">
              {/* View Toggle */}
              <div className="flex items-center space-x-1 bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setView('month')}
                  className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                    view === 'month' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Month
                </button>
                <button
                  onClick={() => setView('week')}
                  className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                    view === 'week' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Week
                </button>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>
          </div>
        </div>

        <div className="flex h-[600px]">
          {/* Calendar */}
          <div className="flex-1 p-6 overflow-y-auto">
            {/* Calendar Header */}
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">
                {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
              </h3>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => navigateMonth('prev')}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <ChevronLeft className="h-5 w-5 text-gray-600" />
                </button>
                <button
                  onClick={() => setCurrentDate(new Date())}
                  className="px-3 py-1 text-sm bg-indigo-100 text-indigo-700 rounded-lg hover:bg-indigo-200 transition-colors"
                >
                  Today
                </button>
                <button
                  onClick={() => navigateMonth('next')}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <ChevronRight className="h-5 w-5 text-gray-600" />
                </button>
              </div>
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-7 gap-1 mb-4">
              {dayNames.map(day => (
                <div key={day} className="p-3 text-center text-sm font-medium text-gray-600 border-b border-gray-200">
                  {day}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-1">
              {getDaysInMonth(currentDate).map((date, index) => {
                if (!date) {
                  return <div key={index} className="p-2 h-24 border border-gray-100"></div>;
                }

                const eventsForDate = getEventsForDate(date);
                const isToday = date.toDateString() === new Date().toDateString();
                const isSelected = selectedDate?.toDateString() === date.toDateString();

                return (
                  <button
                    key={index}
                    onClick={() => setSelectedDate(date)}
                    className={`p-2 h-24 border rounded-lg text-left hover:bg-gray-50 transition-colors relative ${
                      isToday ? 'border-indigo-500 bg-indigo-50' :
                      isSelected ? 'border-indigo-300 bg-indigo-100' :
                      'border-gray-200'
                    }`}
                  >
                    <div className={`text-sm font-medium mb-1 ${
                      isToday ? 'text-indigo-700' : 'text-gray-900'
                    }`}>
                      {date.getDate()}
                    </div>
                    
                    {/* Event indicators */}
                    <div className="space-y-1">
                      {eventsForDate.slice(0, 3).map((event, idx) => (
                        <div
                          key={idx}
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedEvent(event);
                          }}
                          className={`text-xs px-1 py-0.5 rounded truncate cursor-pointer hover:opacity-80 ${
                            event.is_expert ? 'bg-blue-600 text-white' : 'bg-green-600 text-white'
                          }`}
                          title={`${formatTime(event.start)} - ${event.title}`}
                        >
                          {formatTime(event.start)} {event.title.substring(0, 10)}
                        </div>
                      ))}
                      {eventsForDate.length > 3 && (
                        <div className="text-xs text-gray-600 px-1">
                          +{eventsForDate.length - 3} more
                        </div>
                      )}
                    </div>

                    {/* Status dots */}
                    {eventsForDate.length > 0 && (
                      <div className="absolute top-1 right-1 flex space-x-1">
                        {eventsForDate.slice(0, 3).map((event, idx) => (
                          <div
                            key={idx}
                            className={`w-2 h-2 rounded-full ${getStatusColor(event.status)}`}
                            title={event.status}
                          />
                        ))}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Legend */}
            <div className="mt-6 flex items-center justify-center space-x-6 text-sm">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-blue-600 rounded"></div>
                <span className="text-gray-600">As Expert</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-green-600 rounded"></div>
                <span className="text-gray-600">As Client</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-yellow-500 rounded"></div>
                <span className="text-gray-600">Pending</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-green-500 rounded"></div>
                <span className="text-gray-600">Confirmed</span>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="w-80 border-l border-gray-200 p-6 overflow-y-auto">
            {selectedEvent ? (
              /* Event Details */
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-gray-900">Event Details</h3>
                  <button
                    onClick={() => setSelectedEvent(null)}
                    className="p-1 hover:bg-gray-100 rounded transition-colors"
                  >
                    <X className="h-4 w-4 text-gray-500" />
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">{selectedEvent.title}</h4>
                    <p className="text-sm text-gray-600">{selectedEvent.description}</p>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center space-x-2 text-sm">
                      <CalendarIcon className="h-4 w-4 text-gray-500" />
                      <span>{formatDate(selectedEvent.start)}</span>
                    </div>
                    <div className="flex items-center space-x-2 text-sm">
                      <Clock className="h-4 w-4 text-gray-500" />
                      <span>{formatTime(selectedEvent.start)} - {formatTime(selectedEvent.end)} ({selectedEvent.duration} min)</span>
                    </div>
                    <div className="flex items-center space-x-2 text-sm">
                      <User className="h-4 w-4 text-gray-500" />
                      <span>
                        {selectedEvent.is_expert ? 'Client: ' : 'Expert: '}
                        {selectedEvent.is_expert ? selectedEvent.client.name : selectedEvent.expert.name}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2 text-sm">
                      <span className="text-gray-500">Status:</span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusTextColor(selectedEvent.status)}`}>
                        {selectedEvent.status}
                      </span>
                    </div>
                    {selectedEvent.price > 0 && (
                      <div className="flex items-center space-x-2 text-sm">
                        <span className="text-gray-500">Price:</span>
                        <span className="font-medium">${selectedEvent.price}</span>
                      </div>
                    )}
                    {selectedEvent.meeting_link && (
                      <div className="flex items-center space-x-2 text-sm">
                        <Video className="h-4 w-4 text-gray-500" />
                        <span className="text-gray-500">Meeting link ready</span>
                      </div>
                    )}
                  </div>

                  {/* Participant Info */}
                  <div className="border-t border-gray-200 pt-4">
                    <h5 className="font-medium text-gray-900 mb-3">
                      {selectedEvent.is_expert ? 'Client' : 'Expert'}
                    </h5>
                    <div className="flex items-center space-x-3">
                      <img
                        src={selectedEvent.is_expert ? selectedEvent.client.avatar : selectedEvent.expert.avatar}
                        alt={selectedEvent.is_expert ? selectedEvent.client.name : selectedEvent.expert.name}
                        className="w-10 h-10 rounded-full"
                      />
                      <div>
                        <p className="font-medium text-gray-900">
                          {selectedEvent.is_expert ? selectedEvent.client.name : selectedEvent.expert.name}
                        </p>
                        <p className="text-sm text-gray-600">
                          {selectedEvent.is_expert ? selectedEvent.client.profession : selectedEvent.expert.profession}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="border-t border-gray-200 pt-4 space-y-2">
                    {selectedEvent.meeting_link && selectedEvent.status === 'confirmed' && (
                      <a
                        href={selectedEvent.meeting_link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                      >
                        <Video className="h-4 w-4" />
                        <span>Join Meeting</span>
                      </a>
                    )}
                    
                    {selectedEvent.status === 'pending' && (
                      <div className="flex space-x-2">
                        <button 
                          onClick={() => handleConfirmSession(selectedEvent.id)}
                          disabled={updatingSession === selectedEvent.id}
                          className="flex-1 flex items-center justify-center space-x-1 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm disabled:opacity-50"
                        >
                          {updatingSession === selectedEvent.id ? (
                            <div className="animate-spin rounded-full h-3 w-3 border-2 border-white border-t-transparent"></div>
                          ) : (
                            <>
                              <CheckCircle className="h-4 w-4" />
                              <span>Confirm & Generate Link</span>
                            </>
                          )}
                        </button>
                        <button 
                          onClick={() => handleDeclineSession(selectedEvent.id)}
                          disabled={updatingSession === selectedEvent.id}
                          className="flex-1 flex items-center justify-center space-x-1 px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm disabled:opacity-50"
                        >
                          {updatingSession === selectedEvent.id ? (
                            <div className="animate-spin rounded-full h-3 w-3 border-2 border-white border-t-transparent"></div>
                          ) : (
                            <>
                              <XCircle className="h-4 w-4" />
                              <span>Decline</span>
                            </>
                          )}
                        </button>
                      </div>
                    )}
                    
                    {selectedEvent.status === 'confirmed' && !selectedEvent.meeting_link && (
                      <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                        <p className="text-yellow-700 text-sm">Meeting link will be available shortly...</p>
                      </div>
                    )}
                    
                    <button className="w-full px-4 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors text-sm">
                      Reschedule
                    </button>
                  </div>
                </div>
              </div>
            ) : selectedDate ? (
              /* Day Details */
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-gray-900">
                    {selectedDate.toLocaleDateString('en-US', {
                      weekday: 'long',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </h3>
                  <button className="p-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors">
                    <Plus className="h-4 w-4" />
                  </button>
                </div>

                <div className="space-y-3">
                  {getEventsForDate(selectedDate).map((event) => (
                    <button
                      key={event.id}
                      onClick={() => setSelectedEvent(event)}
                      className="w-full p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-left"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="font-medium text-gray-900 text-sm">{event.title}</h4>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusTextColor(event.status)}`}>
                          {event.status}
                        </span>
                      </div>
                      
                      <div className="space-y-1 text-xs text-gray-600">
                        <div className="flex items-center space-x-2">
                          <Clock className="h-3 w-3" />
                          <span>{formatTime(event.start)} - {formatTime(event.end)}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <User className="h-3 w-3" />
                          <span>
                            {event.is_expert ? `Client: ${event.client.name}` : `Expert: ${event.expert.name}`}
                          </span>
                        </div>
                        {event.price > 0 && (
                          <div className="flex items-center space-x-2">
                            <span className="text-green-600 font-medium">${event.price}</span>
                          </div>
                        )}
                      </div>
                    </button>
                  ))}
                  
                  {getEventsForDate(selectedDate).length === 0 && (
                    <div className="text-center py-8">
                      <p className="text-gray-500 text-sm">No sessions scheduled for this day</p>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              /* Default Sidebar */
              <div>
                <h3 className="font-semibold text-gray-900 mb-4">Select a date</h3>
                <p className="text-sm text-gray-600 mb-6">
                  Click on a date to view sessions and availability for that day.
                </p>

                {/* Upcoming Sessions */}
                <div className="space-y-3">
                  <h4 className="font-medium text-gray-900">Upcoming Sessions</h4>
                  {events
                    .filter(event => new Date(event.start) > new Date())
                    .slice(0, 3)
                    .map((event) => (
                      <button
                        key={event.id}
                        onClick={() => setSelectedEvent(event)}
                        className="w-full p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-left"
                      >
                        <div className="flex items-center space-x-3">
                          <div className={`w-3 h-3 rounded-full ${getStatusColor(event.status)}`} />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">{event.title}</p>
                            <p className="text-xs text-gray-600">
                              {formatTime(event.start)} • {event.is_expert ? event.client.name : event.expert.name}
                            </p>
                          </div>
                        </div>
                      </button>
                    ))}
                  
                  {events.filter(event => new Date(event.start) > new Date()).length === 0 && (
                    <p className="text-sm text-gray-500">No upcoming sessions</p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};