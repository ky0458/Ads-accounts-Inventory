import React, { useState, useEffect } from 'react';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { useI18n } from '../lib/i18n';
import { Globe, User, Sun, Moon } from 'lucide-react';
import { useTheme } from '../lib/theme';

export interface AuthUser {
  username: string;
  email: string;
  role: string;
  avatarUrl?: string;
  twoFactorEnabled?: boolean;
}

export function useAuth() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkLogin = async () => {
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
  const [mode, setMode] = useState<'login' | 'register' | 'verify_email' | 'verify_2fa'>('login');
  
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [code, setCode] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ emailOrUsername: email, password })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Login failed');
      
      if (data.requireEmailVerification) {
         setMode('verify_email');
      } else if (data.require2FA) {
         setMode('verify_2fa');
      } else {
         onLoginSuccess(data);
      }
    } catch(err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (password !== confirmPassword) {
      setError(t('passwordMismatch') as string);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, email, password })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Registration failed');
      
      onLoginSuccess(data);
    } catch(err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/auth/verify-register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Verification failed');
      
      onLoginSuccess(data);
    } catch(err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleVerify2FA = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/auth/verify-2fa-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Verification failed');
      
      onLoginSuccess(data);
    } catch(err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
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

        {mode === 'login' && (
          <form onSubmit={handleLogin} className="space-y-4">
             <h1 className="text-2xl font-bold tracking-tight text-center">{t('loginTitle')}</h1>
             <div>
                <label className="text-xs uppercase text-zinc-500 dark:text-zinc-400 font-bold tracking-wider mb-1.5 block">{t('emailOrUsername')}</label>
                <Input value={email} onChange={e => setEmail(e.target.value)} required />
             </div>
             <div>
                <label className="text-xs uppercase text-zinc-500 dark:text-zinc-400 font-bold tracking-wider mb-1.5 block">{t('passwordLabel')}</label>
                <Input type="password" value={password} onChange={e => setPassword(e.target.value)} required />
             </div>
             {error && <p className="text-red-500 text-xs text-center">{error}</p>}
             <Button type="submit" variant="primary" className="w-full h-11" disabled={loading}>
               {loading ? t('loadingInput') : t('loginBtn')}
             </Button>
             <p className="text-xs text-center text-zinc-500 dark:text-zinc-400 pt-4">
               {t('noAccount')} <button type="button" onClick={() => setMode('register')} className="text-blue-500 font-bold">{t('registerBtn')}</button>
             </p>
          </form>
        )}

        {mode === 'register' && (
          <form onSubmit={handleRegister} className="space-y-4">
             <h1 className="text-2xl font-bold tracking-tight text-center">{t('registerTitle')}</h1>
             <div>
                <label className="text-xs uppercase text-zinc-500 dark:text-zinc-400 font-bold tracking-wider mb-1.5 block">{t('usernameLabel')}</label>
                <Input value={username} onChange={e => setUsername(e.target.value)} required />
             </div>
             <div>
                <label className="text-xs uppercase text-zinc-500 dark:text-zinc-400 font-bold tracking-wider mb-1.5 block">{t('emailLabel')}</label>
                <Input type="email" value={email} onChange={e => setEmail(e.target.value)} required />
             </div>
             <div>
                <label className="text-xs uppercase text-zinc-500 dark:text-zinc-400 font-bold tracking-wider mb-1.5 block">{t('passwordLabel')}</label>
                <Input type="password" value={password} onChange={e => setPassword(e.target.value)} required minLength={6} />
             </div>
             <div>
                <label className="text-xs uppercase text-zinc-500 dark:text-zinc-400 font-bold tracking-wider mb-1.5 block">{t('confirmPasswordLabel')}</label>
                <Input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required minLength={6} />
             </div>
             {error && <p className="text-red-500 text-xs text-center">{error}</p>}
             <Button type="submit" variant="primary" className="w-full h-11" disabled={loading}>
               {loading ? t('loadingInput') : t('registerBtn')}
             </Button>
             <p className="text-xs text-center text-zinc-500 dark:text-zinc-400 pt-4">
               {t('hasAccount')} <button type="button" onClick={() => setMode('login')} className="text-blue-500 font-bold">{t('loginBtn')}</button>
             </p>
          </form>
        )}

        {mode === 'verify_email' && (
          <form onSubmit={handleVerifyEmail} className="space-y-4">
             <h1 className="text-xl font-bold tracking-tight text-center">{t('verifyEmailTitle')}</h1>
             <p className="text-sm text-zinc-500 dark:text-zinc-400 dark:text-zinc-400 text-center">{t('codeSentTo')} {email}</p>
             <div>
                <label className="text-xs uppercase text-zinc-500 dark:text-zinc-400 font-bold tracking-wider mb-1.5 block">{t('verifyCode')}</label>
                <Input value={code} onChange={e => setCode(e.target.value)} required placeholder="123456" maxLength={6} className="text-center tracking-widest text-lg font-mono" />
             </div>
             {error && <p className="text-red-500 text-xs text-center">{error}</p>}
             <Button type="submit" variant="primary" className="w-full h-11" disabled={loading || code.length !== 6}>
               {loading ? t('loadingInput') : t('verifyBtn')}
             </Button>
          </form>
        )}

        {mode === 'verify_2fa' && (
          <form onSubmit={handleVerify2FA} className="space-y-4">
             <h1 className="text-xl font-bold tracking-tight text-center">{t('verify2FATitle')}</h1>
             <p className="text-sm text-zinc-500 dark:text-zinc-400 dark:text-zinc-400 text-center">{t('codeSentTo')} {email}</p>
             <div>
                <label className="text-xs uppercase text-zinc-500 dark:text-zinc-400 font-bold tracking-wider mb-1.5 block">{t('securityCode')}</label>
                <Input value={code} onChange={e => setCode(e.target.value)} required placeholder="123456" maxLength={6} className="text-center tracking-widest text-lg font-mono" />
             </div>
             {error && <p className="text-red-500 text-xs text-center">{error}</p>}
             <Button type="submit" variant="primary" className="w-full h-11" disabled={loading || code.length !== 6}>
               {loading ? t('loadingInput') : t('verifyBtn')}
             </Button>
          </form>
        )}
      </div>
    </div>
  );
}
