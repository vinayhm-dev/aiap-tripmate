import { useState, useEffect } from 'react';
import { LandingPage } from './components/LandingPage';
import { Dashboard } from './components/Dashboard';
import { TripEditor } from './components/TripEditor';
import { SharePage } from './components/SharePage';
import { supabase } from './lib/supabase';

type Page = 'landing' | 'dashboard' | 'trip' | 'share';

function App() {
  const [page, setPage] = useState<Page>('landing');
  const [userId, setUserId] = useState<string>('');
  const [selectedTripId, setSelectedTripId] = useState<string>('');
  const [shareSlug, setShareSlug] = useState<string>('');
  const [isInitializingUser, setIsInitializingUser] = useState(false);

  useEffect(() => {
    checkForShareLink();
  }, []);

  const checkForShareLink = () => {
    const path = window.location.pathname;
    const shareMatch = path.match(/^\/s\/([a-z0-9]+)$/);

    if (shareMatch) {
      setShareSlug(shareMatch[1]);
      setPage('share');
    }
  };

  const initializeUser = async () => {
    if (userId || isInitializingUser) return;

    setIsInitializingUser(true);
    const { data: users } = await supabase
      .from('users')
      .select('*')
      .limit(1)
      .maybeSingle();

    if (users) {
      setUserId(users.id);
    } else {
      const { data: newUser } = await supabase
        .from('users')
        .insert({
          email: 'demo@smarttrip.com',
          name: 'Demo User',
        })
        .select()
        .single();

      if (newUser) {
        setUserId(newUser.id);
      }
    }
    setIsInitializingUser(false);
  };

  const handleGetStarted = async () => {
    if (!userId) {
      await initializeUser();
    }
    setPage('dashboard');
  };

  const handleOpenTrip = (tripId: string) => {
    setSelectedTripId(tripId);
    setPage('trip');
  };

  const handleBackToDashboard = () => {
    setPage('dashboard');
    setSelectedTripId('');
  };

  if (page === 'share' && shareSlug) {
    return <SharePage slug={shareSlug} />;
  }

  if (page === 'landing') {
    return <LandingPage onGetStarted={handleGetStarted} />;
  }

  if (page === 'dashboard') {
    if (!userId) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-cyan-50 flex items-center justify-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-blue-600 border-t-transparent"></div>
        </div>
      );
    }
    return <Dashboard userId={userId} onOpenTrip={handleOpenTrip} />;
  }

  if (page === 'trip' && selectedTripId) {
    if (!userId) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-cyan-50 flex items-center justify-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-blue-600 border-t-transparent"></div>
        </div>
      );
    }
    return <TripEditor tripId={selectedTripId} onBack={handleBackToDashboard} />;
  }

  return null;
}

export default App;
