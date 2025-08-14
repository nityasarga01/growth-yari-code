import React, { useState } from 'react';
import { useAuth } from './hooks/useAuth';
import { LoginForm } from './components/auth/LoginForm';
import { SignupForm } from './components/auth/SignupForm';
import { Header } from './components/layout/Header';
import { FeedView } from './components/feed/FeedView';
import { ConnectionsView } from './components/connections/ConnectionsView';
import { SearchView } from './components/search/SearchView';
import { SessionsView } from './components/sessions/SessionsView';
import { DashboardView } from './components/dashboard/DashboardView';
import { ProfileView } from './components/profile/ProfileView';
import { SessionBooking } from './components/sessions/SessionBooking';
import { YariConnectView } from './components/yariconnect/YariConnectView';
import { User } from './types';
import { ChatWindow } from './components/chat/ChatWindow';

function App() {
  const { user, login, signup, logout, loading, isAuthenticated, updateUser } = useAuth();
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
  const [currentView, setCurrentView] = useState<'feed' | 'search' | 'connections' | 'sessions' | 'yariconnect' | 'dashboard' | 'profile'>('feed');
  const [showBooking, setShowBooking] = useState(false);
  const [selectedExpert, setSelectedExpert] = useState<User | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showChat, setShowChat] = useState(false);
  const [chatRecipient, setChatRecipient] = useState<User | null>(null);

  const handleLogin = async (email: string, password: string) => {
    try {
      setError(null);
      console.log('App: Attempting login...');
      await login(email, password);
      console.log('App: Login successful');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Login failed';
      console.error('App: Login error:', errorMessage);
      setError(errorMessage);
    }
  };

  const handleSignup = async (userData: {
    name: string;
    email: string;
    password: string;
    password: string;
    profession: string;
    industry: string;
    experience: string;
    skills: string[];
    objectives: string[];
  }) => {
    try {
      setError(null);
      console.log('App: Attempting signup...');
      await signup(userData);
      console.log('App: Signup successful');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Signup failed';
      console.error('App: Signup error:', errorMessage);
      setError(errorMessage);
    }
  };

  const handleBookSession = (userId: string) => {
    console.log('App: handleBookSession called with userId:', userId);
    // Create a minimal expert object with just the ID
    setSelectedExpert({ id: userId, name: '', email: '', avatar: '', expertise: [], rating: 0, reviewCount: 0, isVerified: false } as User);
    setShowBooking(true);
  };

  const handleSessionBooked = (expertId: string, slotId: string, sessionType: 'free' | 'paid') => {
    console.log('Session booked:', { expertId, slotId, sessionType });
    setShowBooking(false);
    setSelectedExpert(null);
  };

  const handleConnect = (user: User) => {
    setSelectedExpert(user);
    setShowBooking(true);
  };

  const handleOpenChat = (user: User) => {
    console.log('Opening chat with user:', user.name);
    setChatRecipient(user);
    setShowChat(true);
  };

  // Show loading screen while checking authentication
  if (loading && !isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-green-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-brand-primary border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-green-100 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}
          {authMode === 'login' ? (
            <LoginForm
              onLogin={handleLogin}
              onSwitchToSignup={() => setAuthMode('signup')}
              loading={loading}
            />
          ) : (
            <SignupForm
              onSignup={handleSignup}
              onSwitchToLogin={() => setAuthMode('login')}
              loading={loading}
            />
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header
        user={user!}
        onLogout={logout}
        currentView={currentView}
        onViewChange={setCurrentView}
      />
      
      <main>
        {currentView === 'feed' && <FeedView onBookSession={handleBookSession} />}
        {currentView === 'search' && <SearchView onBookSession={handleBookSession} onConnect={handleConnect} />}
       {currentView === 'connections' && <ConnectionsView onBookSession={handleBookSession} onOpenChat={handleOpenChat} />}
        {currentView === 'sessions' && <SessionsView onOpenChat={handleOpenChat} />}
        {currentView === 'yariconnect' && <YariConnectView currentUser={user!} />}
        {currentView === 'dashboard' && <DashboardView />}
        {currentView === 'profile' && <ProfileView user={user!} onUserUpdate={updateUser} />}
      </main>

      {showBooking && selectedExpert && (
        <SessionBooking
          expert={selectedExpert}
          onClose={() => setShowBooking(false)}
          onBookSession={handleSessionBooked}
        />
      )}

      {showChat && chatRecipient && (
        <ChatWindow
          isOpen={showChat}
          onClose={() => {
            setShowChat(false);
            setChatRecipient(null);
          }}
          recipient={chatRecipient}
          currentUser={user!}
        />
      )}
    </div>
  );
}

export default App;