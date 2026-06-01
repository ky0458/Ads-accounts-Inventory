import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/layout/Sidebar';
import { Dashboard } from './pages/Dashboard';
import { Inventory } from './pages/Inventory';
import { SettingsPage } from './pages/Settings';
import { MOCK_ACCOUNTS } from './lib/mock-data';
import { AdAccount } from './types';
import { fetchAccounts, saveAccounts } from './lib/api';
import { Menu, Database, LogOut, User as UserIcon, Sun, Moon } from 'lucide-react';
import { Button } from './components/ui/Button';
import { useAuth, LoginScreen } from './components/Login';
import { UserProfileModal } from './components/UserProfileModal';
import { AnimatePresence } from 'motion/react';
import { useTheme } from './lib/theme';
import { useI18n } from './lib/i18n';

export default function App() {
  const { user, loading: authLoading, login, logout, updateProfile } = useAuth();
  const { t } = useI18n();
  const { theme, toggleTheme } = useTheme();
  const [currentTab, setCurrentTab] = useState('inventory');
  
  const [accounts, setAccounts] = useState<AdAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [showProfile, setShowProfile] = useState(false);

  useEffect(() => {
    if (!user) return;
    const loadData = async () => {
      setLoading(true);
      const data = await fetchAccounts();
      setAccounts(data || []);
      setLoading(false);
    };
    loadData();
  }, [user]);

  useEffect(() => {
    if (accounts.length > 0 && !loading) {
      localStorage.setItem('fb_vault_accounts', JSON.stringify(accounts));
    }
  }, [accounts, loading]);

  if (authLoading) return <div className="flex h-screen items-center justify-center bg-zinc-50 dark:bg-zinc-950 text-zinc-500 dark:text-zinc-400">Đang tải...</div>;

  if (!user) {
    return <LoginScreen onLoginSuccess={login} />;
  }

  const renderContent = () => {
    if (loading) {
      return (
        <div className="flex-1 p-4 md:p-8">
          <div className="max-w-7xl mx-auto space-y-6">
            <div className="h-10 w-48 bg-zinc-100 dark:bg-zinc-800/50 rounded-lg animate-pulse" />
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-32 bg-zinc-100 dark:bg-zinc-800/50 rounded-xl animate-pulse" />
              ))}
            </div>
            <div className="h-96 w-full bg-zinc-100 dark:bg-zinc-800/50 rounded-xl animate-pulse" />
          </div>
        </div>
      );
    }

    switch (currentTab) {
      case 'dashboard':
        return <Dashboard accounts={accounts} />;
      case 'inventory':
        return <Inventory accounts={accounts} setAccounts={setAccounts} />;
      case 'setup':
        return <SettingsPage />;
      default:
        return <Inventory accounts={accounts} setAccounts={setAccounts} />;
    }
  };

  return (
    <div className="flex h-[100dvh] bg-zinc-50 dark:bg-zinc-950 text-zinc-800 dark:text-zinc-100 font-sans overflow-hidden">
      <Sidebar currentTab={currentTab} onTabChange={(tab) => { setCurrentTab(tab); setIsSidebarOpen(false); }} isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />
      <main className="flex-1 flex flex-col h-full relative overflow-hidden w-full">
        <div className="md:hidden flex items-center justify-between p-4 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 z-20">
           <div className="text-sm font-bold tracking-tight text-zinc-900 dark:text-white flex items-center gap-2">
             <Database className="w-4 h-4 text-blue-500" />
             Ads Account Inventory
           </div>
           <button onClick={() => setIsSidebarOpen(true)} className="text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white">
             <Menu className="w-6 h-6" />
           </button>
        </div>
        
        {/* Topbar User Info */}
        <div className="hidden md:flex items-center justify-end p-4 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950/50 shrink-0 z-20 h-16">
          <div className="flex items-center gap-4">
             <button
               onClick={toggleTheme}
               className="p-2 text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded-lg flex items-center gap-2"
               title={t('themeOption')}
             >
               {theme === 'dark' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
             </button>
             <button 
               onClick={() => setShowProfile(true)}
               className="flex items-center gap-3 hover:bg-zinc-100 dark:hover:bg-zinc-800 px-3 py-1.5 rounded-lg transition-colors border border-transparent hover:border-zinc-300 dark:hover:border-zinc-700"
             >
                <div className="text-right">
                   <div className="text-sm font-bold text-zinc-700 dark:text-zinc-200">{user.username}</div>
                   <div className="text-[10px] uppercase font-bold text-blue-400">{user.role}</div>
                </div>
                <div className="w-8 h-8 rounded-full bg-zinc-100 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 overflow-hidden flex items-center justify-center shadow-inner">
                  {user.avatarUrl ? (
                    <img src={user.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    <UserIcon className="w-4 h-4 text-zinc-500 dark:text-zinc-400" />
                  )}
                </div>
             </button>
            <button onClick={logout} className="p-2 text-zinc-500 dark:text-zinc-400 hover:text-red-400 transition-colors hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg" title="Đăng xuất">
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-auto relative z-10 flex flex-col">
          {renderContent()}
        </div>
      </main>

      <AnimatePresence>
        {showProfile && (
          <UserProfileModal user={user} onClose={() => setShowProfile(false)} onUpdate={updateProfile} />
        )}
      </AnimatePresence>
    </div>
  );
}
