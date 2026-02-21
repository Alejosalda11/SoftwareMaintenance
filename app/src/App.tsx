// Hotel Maintenance Pro - Main App Component

import { useState, useEffect } from 'react';
import { initializeData, getCurrentUser, setCurrentUser, getCurrentHotel, subscribe } from '@/data/store';
import { UserSelection } from '@/components/UserSelection';
import { Login } from '@/components/Login';
import { HotelSelection } from '@/components/HotelSelection';
import { isAuthenticated, isSupabaseAuth, initAuth, getSupabaseUserId, fetchProfileAsUser } from '@/lib/auth';
import { Dashboard } from '@/pages/Dashboard';
import { DamageTracker } from '@/pages/DamageTracker';
import { MaintenanceHistory } from '@/pages/MaintenanceHistory';
import { Reports } from '@/pages/Reports';
import { AdminSettings } from '@/pages/AdminSettings';
import { Rooms } from '@/pages/Rooms';
import { PreventiveSchedule } from '@/pages/PreventiveSchedule';
import { MobileNav } from '@/components/MobileNav';
import { Header } from '@/components/Header';
import { Toaster } from '@/components/ui/sonner';

type Page = 'dashboard' | 'damages' | 'history' | 'reports' | 'rooms' | 'preventive';
type AppState = 'login' | 'user-selection' | 'hotel-selection' | 'main' | 'admin-settings';

function App() {
  const [appState, setAppState] = useState<AppState>('login');
  const [currentPage, setCurrentPage] = useState<Page>('dashboard');
  const [isMobile, setIsMobile] = useState(false);
  const [, setRefresh] = useState(0);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (isSupabaseAuth()) await initAuth();
      if (cancelled) return;
      await initializeData();
      if (!isAuthenticated()) {
        setAppState('login');
        return;
      }
      let savedUser = getCurrentUser();
      if (isSupabaseAuth() && !savedUser) {
        const uid = getSupabaseUserId();
        if (uid) {
          const profile = await fetchProfileAsUser(uid);
          if (profile) {
            setCurrentUser(profile);
            savedUser = profile;
            await initializeData();
          }
        }
      }
      const savedHotel = getCurrentHotel();
      if (savedUser && savedHotel) setAppState('main');
      else if (savedUser) setAppState('hotel-selection');
      else setAppState('user-selection');
    })();
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    const unsub = subscribe(() => setRefresh((r) => r + 1));
    return () => {
      cancelled = true;
      unsub();
      window.removeEventListener('resize', checkMobile);
    };
  }, []);

  const handleUserSelected = () => {
    setAppState('hotel-selection');
  };

  const handleHotelSelected = () => {
    setAppState('main');
  };

  const handleBackToUser = () => {
    setAppState('user-selection');
  };

  const handleSwitchHotel = () => {
    setAppState('hotel-selection');
  };

  const handleAdminSettings = () => {
    setAppState('admin-settings');
  };

  const handleBackFromAdmin = () => {
    setAppState('login');
  };

  const handleLoginSuccess = () => {
    // After login, check if user and hotel are already selected
    const savedUser = getCurrentUser();
    const savedHotel = getCurrentHotel();
    
    if (savedUser && savedHotel) {
      setAppState('main');
    } else if (savedUser) {
      setAppState('hotel-selection');
    } else {
      setAppState('user-selection');
    }
  };

  const renderContent = () => {
    switch (appState) {
      case 'login':
        return (
          <Login 
            onLoginSuccess={handleLoginSuccess}
            onAdminSettings={handleAdminSettings}
          />
        );
      
      case 'user-selection':
        return (
          <UserSelection 
            onUserSelected={handleUserSelected} 
            onAdminSettings={handleAdminSettings}
          />
        );
      
      case 'hotel-selection':
        return (
          <HotelSelection 
            onHotelSelected={handleHotelSelected} 
            onBackToUser={handleBackToUser}
          />
        );
      
      case 'admin-settings':
        return (
          <main className="pt-16 min-h-screen">
            <div className="p-4 md:p-6 max-w-7xl mx-auto">
              <AdminSettings onBack={handleBackFromAdmin} />
            </div>
          </main>
        );
      
      case 'main':
        return (
          <>
            <Header 
              currentPage={currentPage} 
              onPageChange={setCurrentPage} 
              isMobile={isMobile}
              onSwitchHotel={handleSwitchHotel}
              onAdminSettings={handleAdminSettings}
            />
            
            <main className={`${isMobile ? 'pb-20' : 'pl-64'} pt-16 min-h-screen`}>
              <div className="p-4 md:p-6 max-w-7xl mx-auto">
                {renderPage()}
              </div>
            </main>
            
            {isMobile && (
              <MobileNav currentPage={currentPage} onPageChange={setCurrentPage} />
            )}
          </>
        );
    }
  };

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <Dashboard />;
      case 'damages':
        return <DamageTracker />;
      case 'history':
        return <MaintenanceHistory />;
      case 'reports':
        return <Reports />;
      case 'rooms':
        return <Rooms />;
      case 'preventive':
        return <PreventiveSchedule />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {renderContent()}
      <Toaster position="top-center" />
    </div>
  );
}

export default App;
