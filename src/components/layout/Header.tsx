import React from 'react';
import { Search, Bell, MessageCircle, Calendar, User, LogOut, Menu, X, Sparkles } from 'lucide-react';
import { User as UserType } from '../../types';
import { NotificationCenter } from '../notifications/NotificationCenter';
import { ChatWindow } from '../chat/ChatWindow';
import { CalendarView } from '../calendar/CalendarView';
import { apiClient } from '../../config/api';

interface HeaderProps {
  user: UserType;
  onLogout: () => void;
  currentView: string;
  onViewChange: (view: string) => void;
}

export const Header: React.FC<HeaderProps> = ({ user, onLogout, currentView, onViewChange }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);
  const [showNotifications, setShowNotifications] = React.useState(false);
  const [showChat, setShowChat] = React.useState(false);
  const [showCalendar, setShowCalendar] = React.useState(false);
  const [chatRecipient, setChatRecipient] = React.useState<UserType | null>(null);
  const [unreadCount, setUnreadCount] = React.useState(0);

  // Load unread notifications count
  React.useEffect(() => {
    const loadUnreadCount = async () => {
      try {
        console.log('Loading unread notifications count...');
        const result = await apiClient.getUnreadNotificationsCount();
        if (result.success && result.data) {
          console.log('Unread count loaded:', result.data.unread_count);
          setUnreadCount(result.data.unread_count);
        } else {
          console.error('Failed to load unread count:', result.error);
        }
      } catch (error) {
        console.error('Failed to load unread count:', error);
      }
    };

    loadUnreadCount();
    // Poll for updates every 30 seconds
    const interval = setInterval(loadUnreadCount, 30000);
    return () => clearInterval(interval);
  }, []);

  const openChat = (recipient: UserType) => {
    console.log('Opening chat with:', recipient.name);
    setChatRecipient(recipient);
    setShowChat(true);
  };
  const navigationItems = [
    { id: 'feed', label: 'Feed' },
    { id: 'search', label: 'Search' },
    { id: 'connections', label: 'Connections' },
    { id: 'sessions', label: 'Sessions' },
    { id: 'yariconnect', label: 'YariConnect' },
    { id: 'dashboard', label: 'Dashboard' }
  ];

  return (
    <header className="bg-white/95 backdrop-blur-md shadow-lg border-b border-gray-200/50 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center flex-shrink-0">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-brand-primary to-brand-secondary rounded-xl flex items-center justify-center shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
                <div className="w-6 h-6 border-2 border-white rounded-full relative animate-pulse">
                  <div className="absolute top-1 left-1 w-2 h-2 bg-white rounded-full animate-bounce"></div>
                  <div className="absolute bottom-0 right-0 w-1 h-3 bg-white rounded-full transform rotate-45"></div>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <h1 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-brand-primary to-brand-secondary bg-clip-text text-transparent">
                  GrowthYari
                </h1>
                <Sparkles className="h-4 w-4 text-brand-primary animate-pulse" />
              </div>
            </div>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center space-x-1">
            {navigationItems.map((item) => (
              <button
                key={item.id}
                onClick={() => onViewChange(item.id)}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-300 whitespace-nowrap hover:scale-105 ${
                  currentView === item.id
                    ? 'bg-gradient-to-r from-brand-primary to-brand-secondary text-white shadow-lg'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100/80 hover:shadow-md'
                }`}
              >
                {item.label}
              </button>
            ))}
          </nav>

          {/* Desktop Search */}
          <div className="hidden md:flex flex-1 max-w-sm lg:max-w-md mx-2 lg:mx-4">
            <button
              onClick={() => onViewChange('search')}
              className="w-full flex items-center px-3 lg:px-4 py-2 border border-gray-300 rounded-xl text-gray-500 hover:text-gray-700 hover:border-brand-primary/50 hover:bg-brand-primary/5 transition-all duration-300 text-sm lg:text-base shadow-sm hover:shadow-md"
            >
              <Search className="h-5 w-5 mr-3 flex-shrink-0" />
              <span className="truncate">Search professionals...</span>
            </button>
          </div>

          {/* Right side actions */}
          <div className="flex items-center space-x-2 sm:space-x-4">
            {/* Mobile Search */}
            <button
              onClick={() => onViewChange('search')}
              className="md:hidden p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-all duration-300 hover:scale-110"
            >
              <Search className="h-5 w-5" />
            </button>

            {/* Desktop Action Buttons */}
            <div className="hidden sm:flex items-center space-x-2">
              <button 
                onClick={() => setShowNotifications(true)}
                className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-all duration-300 hover:scale-110"
              >
                <Bell className="h-5 w-5" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-gradient-to-r from-red-500 to-red-600 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center animate-pulse shadow-lg">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>
              <button 
                onClick={() => setShowChat(true)}
                className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-all duration-300 hover:scale-110"
              >
                <MessageCircle className="h-5 w-5" />
              </button>
              <button 
                onClick={() => setShowCalendar(true)}
                className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-all duration-300 hover:scale-110"
              >
                <Calendar className="h-5 w-5" />
              </button>
            </div>

            {/* Desktop User Menu */}
            <div className="hidden lg:block relative group">
              <button className="flex items-center space-x-2 lg:space-x-3 p-2 text-gray-600 hover:text-gray-900 hover:bg-gradient-to-r hover:from-brand-primary/10 hover:to-brand-secondary/10 rounded-xl transition-all duration-300 hover:shadow-md">
                <img
                  src={user.avatar || 'https://images.pexels.com/photos/2379004/pexels-photo-2379004.jpeg?auto=compress&cs=tinysrgb&w=40&h=40&dpr=1'}
                  alt={user.name}
                  className="w-8 h-8 rounded-full flex-shrink-0 ring-2 ring-brand-primary/20 hover:ring-brand-primary/40 transition-all duration-300"
                />
                <div className="hidden xl:block text-left min-w-0">
                  <div className="text-sm font-medium text-gray-900 truncate max-w-24 xl:max-w-32">{user.name}</div>
                  <div className="text-xs text-gray-500 truncate max-w-24 xl:max-w-32">{user.profession}</div>
                </div>
              </button>
              
              {/* Dropdown Menu */}
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-xl border border-gray-200/50 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 z-50 backdrop-blur-md">
                <div className="py-1">
                  <button
                    onClick={() => onViewChange('profile')}
                    className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gradient-to-r hover:from-brand-primary/10 hover:to-brand-secondary/10 w-full text-left transition-all duration-300"
                  >
                    <User className="h-4 w-4 mr-3" />
                    Profile
                  </button>
                  <hr className="my-1 border-gray-200" />
                  <button
                    onClick={onLogout}
                    className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-red-50 hover:text-red-600 w-full text-left transition-all duration-300"
                  >
                    <LogOut className="h-4 w-4 mr-3" />
                    Sign Out
                  </button>
                </div>
              </div>
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="lg:hidden p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-all duration-300 hover:scale-110"
            >
              {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="lg:hidden border-t border-gray-200/50 bg-white/95 backdrop-blur-md">
            <div className="px-2 pt-2 pb-3 space-y-1">
              {/* Navigation Items */}
              {navigationItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => {
                    onViewChange(item.id);
                    setIsMobileMenuOpen(false);
                  }}
                  className={`block w-full text-left px-3 py-2 rounded-xl text-base font-medium transition-all duration-300 ${
                    currentView === item.id
                      ? 'bg-gradient-to-r from-brand-primary to-brand-secondary text-white shadow-md'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100/80'
                  }`}
                >
                  {item.label}
                </button>
              ))}
              
              {/* Mobile Action Buttons */}
              <div className="pt-4 border-t border-gray-200 sm:hidden">
                <div className="grid grid-cols-3 gap-2">
                  <button 
                    onClick={() => {
                      setShowNotifications(true);
                      setIsMobileMenuOpen(false);
                    }}
                    className="relative flex flex-col items-center p-3 text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-colors"
                  >
                    <Bell className="h-5 w-5 mb-1" />
                    <span className="text-xs">Notifications</span>
                    {unreadCount > 0 && (
                      <span className="absolute top-1 right-1 bg-red-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center">
                        {unreadCount > 9 ? '9+' : unreadCount}
                      </span>
                    )}
                  </button>
                  <button 
                    onClick={() => {
                      setShowChat(true);
                      setIsMobileMenuOpen(false);
                    }}
                    className="flex flex-col items-center p-3 text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-colors"
                  >
                    <MessageCircle className="h-5 w-5 mb-1" />
                    <span className="text-xs">Messages</span>
                  </button>
                  <button 
                    onClick={() => {
                      setShowCalendar(true);
                      setIsMobileMenuOpen(false);
                    }}
                    className="flex flex-col items-center p-3 text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-colors"
                  >
                    <Calendar className="h-5 w-5 mb-1" />
                    <span className="text-xs">Calendar</span>
                  </button>
                </div>
              </div>
              
              {/* User Section */}
              <div className="pt-4 border-t border-gray-200">
                <div className="flex items-center px-3 py-2 mb-2">
                  <img
                    src={user.avatar || 'https://images.pexels.com/photos/2379004/pexels-photo-2379004.jpeg?auto=compress&cs=tinysrgb&w=40&h=40&dpr=1'}
                    alt={user.name}
                    className="w-10 h-10 rounded-full mr-3"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-gray-900 truncate">{user.name}</div>
                    <div className="text-sm text-gray-500 truncate">{user.profession}</div>
                  </div>
                </div>
                
                <button
                  onClick={() => {
                    onViewChange('profile');
                    setIsMobileMenuOpen(false);
                  }}
                  className="block w-full text-left px-3 py-2 text-base text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-colors"
                >
                  <div className="flex items-center">
                    <User className="h-5 w-5 mr-3" />
                    Profile
                  </div>
                </button>
                
                <button
                  onClick={() => {
                    onLogout();
                    setIsMobileMenuOpen(false);
                  }}
                  className="block w-full text-left px-3 py-2 text-base text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-colors"
                >
                  <div className="flex items-center">
                    <LogOut className="h-5 w-5 mr-3" />
                    Sign Out
                  </div>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      <NotificationCenter
        isOpen={showNotifications}
        onClose={() => setShowNotifications(false)}
      />

      {showChat && (
        <ChatWindow
          isOpen={showChat}
          onClose={() => setShowChat(false)}
          currentUser={user}
        />
      )}

      <CalendarView
        isOpen={showCalendar}
        onClose={() => setShowCalendar(false)}
      />
    </header>
  );
};