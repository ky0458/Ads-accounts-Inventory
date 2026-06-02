import React, { useState, useEffect } from 'react';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { useI18n } from '../lib/i18n';
import { Globe, User, Sun, Moon } from 'lucide-react';
import { useTheme } from '../lib/theme';

export interface AuthUser {
  id: string;
  username: string;
  email?: string;
  role?: string;
  avatarUrl?: string;
  twoFactorEnabled?: boolean;
}

export function useAuth() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkLogin = () => {
      const stored = localStorage.getItem('auth_user');
      const token = localStorage.getItem('auth_token');
      if (stored && token) {
        try {
          setUser(JSON.parse(stored));
        } catch (e) {
          localStorage.removeItem('auth_user');
          localStorage.removeItem('auth_token');
        }
      }
      setLoading(false);
    };
    checkLogin();
  }, []);

  const internalLoginSuccess = (data: { token: string, user: AuthUser }) => {
    localStorage.setItem('auth_token', data.token);
    localStorage.setItem('auth_user', JSON.stringify(data.user));
    setUser(data.user);
  };

  const logout = () => {
    localStorage.removeItem('auth_user');
    localStorage.removeItem('auth_token');
    setUser(null);
  };

  const updateProfile = (data: Partial<AuthUser>) => {
    setUser(prev => {
      if(!prev) return prev;
      const next = { ...prev, ...data };
      localStorage.setItem('auth_user', JSON.stringify(next));
      return next;
    });
  }

  return { user, loading, login: internalLoginSuccess, logout, updateProfile };
}

export function LoginScreen({ onLoginSuccess }: { onLoginSuccess: (data: {token: string, user: AuthUser}) => void }) {
  const { t, lang, setLang } = useI18n();
  
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!username.trim()) {
      setError('Vui lòng nhập tên của bạn');
      return;
    }

    setLoading(true);
    
    // Simulate generation locally
    setTimeout(() => {
       const user: AuthUser = {
         id: `${username.trim().replace(/\s+/g, '_')}_${Date.now()}`,
         username: username.trim(),
         email: `${username.trim().replace(/\s+/g, '_').toLowerCase()}@local`,
         role: 'user'
       };
       onLoginSuccess({ token: 'local_auth_token', user });
    }, 500);
  };

  const { theme, toggleTheme } = useTheme();

  const renderLangSelector = () => (
    <div className="absolute top-4 right-4 flex items-center gap-2 z-50">
      <button
        onClick={toggleTheme}
        className="p-2 text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg"
        title={t('themeOption')}
      >
        {theme === 'dark' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
      </button>
      <div className="flex items-center bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-1">
        {(['vi', 'en', 'zh'] as const).map(l => (
          <button
            key={l}
            onClick={() => setLang(l)}
            className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all ${lang === l ? 'bg-blue-600 text-white' : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300'}`}
          >
            {l.toUpperCase()}
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <div className="flex h-[100dvh] items-center justify-center bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-white p-4 relative overflow-hidden">
      {renderLangSelector()}
      
      {/* Dynamic Background Elements */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-blue-600/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-blue-900/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="w-full max-w-sm bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-8 shadow-2xl relative z-10">
        <div className="flex justify-center mb-6">
           <div className="w-12 h-12 bg-zinc-100 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 font-bold rounded-xl flex items-center justify-center text-blue-500 shadow-inner">
              <User className="w-6 h-6" />
           </div>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
           <h1 className="text-2xl font-bold tracking-tight text-center">{t('loginTitle') || 'Vào ứng dụng'}</h1>
           <div>
              <label className="text-xs uppercase text-zinc-500 dark:text-zinc-400 font-bold tracking-wider mb-1.5 block">{t('usernameLabel') || 'Tên của bạn'}</label>
              <Input 
                 value={username} 
                 onChange={e => setUsername(e.target.value)} 
                 required 
                 placeholder="Nhập tên để tiếp tục"
                 autoFocus
              />
           </div>
           {error && <p className="text-red-500 text-xs text-center">{error}</p>}
           <Button type="submit" variant="primary" className="w-full h-11" disabled={loading}>
             {loading ? t('loadingInput') : (t('loginTitle') as string)}
           </Button>
        </form>
      </div>
    </div>
  );
}
