import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/layout/Sidebar';
import { Dashboard } from './pages/Dashboard';
import { Inventory } from './pages/Inventory';
import { SettingsPage } from './pages/Settings';
import { MOCK_ACCOUNTS } from './lib/mock-data';
import { AdAccount } from './types';
import { fetchAccounts, saveAccounts } from './lib/api';
import { Menu } from 'lucide-react';
import { Button } from './components/ui/Button';

export default function App() {
  const [currentTab, setCurrentTab] = useState('inventory');
  
  const [accounts, setAccounts] = useState<AdAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      const data = await fetchAccounts();
      setAccounts(data || []);
      setLoading(false);
    };
    loadData();
  }, []);

  // Sync back to db when accounts change in UI (for simple toggles)
  // Optimization: only update the changed account instead of all
  // But for now, we'll keep it simple: sync all or use the API calls in children
  useEffect(() => {
    if (accounts.length > 0 && !loading) {
      localStorage.setItem('fb_vault_accounts', JSON.stringify(accounts));
    }
  }, [accounts, loading]);

  const renderContent = () => {
    if (loading) {
      return (
        <div className="flex-1 p-4 md:p-8">
          <div className="max-w-7xl mx-auto space-y-6">
            <div className="h-10 w-48 bg-zinc-800/50 rounded-lg animate-pulse" />
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-32 bg-zinc-800/50 rounded-xl animate-pulse" />
              ))}
            </div>
            <div className="h-96 w-full bg-zinc-800/50 rounded-xl animate-pulse" />
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
    <div className="flex h-[100dvh] bg-[#09090b] text-zinc-100 font-sans overflow-hidden">
      <Sidebar currentTab={currentTab} onTabChange={(tab) => { setCurrentTab(tab); setIsSidebarOpen(false); }} isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />
      <main className="flex-1 flex flex-col h-full relative overflow-hidden w-full">
        <div className="md:hidden flex items-center justify-between p-4 border-b border-zinc-800 bg-zinc-950 z-20">
           <div className="text-sm font-bold tracking-tight text-white flex items-center gap-2">
             <span className="w-2.5 h-2.5 bg-blue-600 rounded-full"></span>
             FB Asset Hub
           </div>
           <button onClick={() => setIsSidebarOpen(true)} className="text-zinc-400 hover:text-white">
             <Menu className="w-6 h-6" />
           </button>
        </div>
        <div className="flex-1 overflow-auto relative z-10 flex flex-col">
          {renderContent()}
        </div>
      </main>
    </div>
  );
}
