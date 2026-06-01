import React, { useState } from 'react';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { X, User as UserIcon, Shield, Camera } from 'lucide-react';
import { AuthUser } from './Login';
import * as motion from 'motion/react-client';

interface Props {
  user: AuthUser;
  onClose: () => void;
  onUpdate: (data: Partial<AuthUser>) => void;
}

export function UserProfileModal({ user, onClose, onUpdate }: Props) {
  const [avatarUrl, setAvatarUrl] = useState(user.avatarUrl || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [setup2FaMode, setSetup2FaMode] = useState(false);
  const [code, setCode] = useState('');
  const [twoFaLoading, setTwoFaLoading] = useState(false);
  const [twoFaError, setTwoFaError] = useState('');
  const [codeSent, setCodeSent] = useState(false);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const token = localStorage.getItem('auth_token');
      const res = await fetch('/api/auth/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ avatarUrl })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      onUpdate({ avatarUrl });
      onClose();
    } catch(err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSend2FACode = async () => {
    setTwoFaLoading(true);
    setTwoFaError('');
    try {
      const token = localStorage.getItem('auth_token');
      const res = await fetch('/api/auth/send-2fa-setup', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setCodeSent(true);
    } catch(err: any) {
      setTwoFaError(err.message);
    } finally {
      setTwoFaLoading(false);
    }
  };

  const handleVerify2FA = async () => {
    setTwoFaLoading(true);
    setTwoFaError('');
    try {
      const token = localStorage.getItem('auth_token');
      const res = await fetch('/api/auth/verify-2fa-setup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ code })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      
      onUpdate({ twoFactorEnabled: true });
      setSetup2FaMode(false);
    } catch(err: any) {
      setTwoFaError(err.message);
    } finally {
      setTwoFaLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.15 }}
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={onClose}
      />
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        transition={{ duration: 0.2, ease: "easeOut" }}
        className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 w-full max-w-md rounded-2xl shadow-2xl flex flex-col relative z-10"
      >
        <div className="flex items-center justify-between p-5 border-b border-zinc-200 dark:border-zinc-800">
          <h2 className="text-xl font-bold flex items-center gap-2">
             <UserIcon className="w-5 h-5 text-blue-500" />
             Hồ sơ người dùng
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-zinc-100 dark:bg-zinc-800 rounded-lg transition-colors text-zinc-500 dark:text-zinc-400 dark:text-zinc-400 hover:text-zinc-900 dark:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-zinc-100 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 overflow-hidden flex items-center justify-center">
               {avatarUrl ? (
                 <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
               ) : (
                 <UserIcon className="w-8 h-8 text-zinc-500 dark:text-zinc-400" />
               )}
            </div>
            <div>
               <div className="font-bold text-lg">{user.username}</div>
               <div className="text-zinc-500 dark:text-zinc-400 text-sm">{user.email}</div>
               <div className="text-xs uppercase font-bold text-blue-400 mt-1">{user.role}</div>
            </div>
          </div>

          <form onSubmit={handleUpdateProfile} className="space-y-4 pt-4 border-t border-zinc-200 dark:border-zinc-800">
             <div>
                <label className="text-xs uppercase text-zinc-500 dark:text-zinc-400 font-bold tracking-wider mb-1.5 block flex items-center gap-1.5">
                  <Camera className="w-3.5 h-3.5" /> Avatar URL
                </label>
                <Input value={avatarUrl} onChange={e => setAvatarUrl(e.target.value)} placeholder="https://..." />
             </div>
             {error && <p className="text-red-500 text-xs">{error}</p>}
             <Button type="submit" variant="primary" className="h-9 font-bold" disabled={loading}>
                Cập nhật thông tin
             </Button>
          </form>

          <div className="pt-6 border-t border-zinc-200 dark:border-zinc-800 space-y-4">
            <div className="flex items-center justify-between">
               <div>
                  <h3 className="font-bold text-sm flex items-center gap-1.5">
                    <Shield className={`w-4 h-4 ${user.twoFactorEnabled ? 'text-green-500' : 'text-zinc-500 dark:text-zinc-400'}`} />
                    Xác thực 2 bước (2FA)
                  </h3>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">Bảo vệ tài khoản với 2FA qua email.</p>
               </div>
               {user.twoFactorEnabled ? (
                 <div className="px-2 py-1 bg-green-500/10 text-green-500 rounded text-xs font-bold border border-green-500/20">
                    Đã bật
                 </div>
               ) : (
                 <Button variant="outline" size="sm" onClick={() => setSetup2FaMode(true)}>Bật 2FA</Button>
               )}
            </div>

            {setup2FaMode && !user.twoFactorEnabled && (
               <div className="bg-zinc-50 dark:bg-zinc-950 p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 space-y-4">
                 {!codeSent ? (
                   <div>
                     <p className="text-sm text-zinc-500 dark:text-zinc-400 dark:text-zinc-400 mb-3">Mã 6 số sẽ được gửi tới <b>{user.email}</b> để xác thực trước khi bật 2FA.</p>
                     <Button type="button" variant="primary" size="sm" onClick={handleSend2FACode} disabled={twoFaLoading}>
                       Gửi mã xác nhận
                     </Button>
                   </div>
                 ) : (
                   <div className="space-y-3">
                     <label className="text-xs uppercase text-zinc-500 dark:text-zinc-400 font-bold tracking-wider">Nhập mã xác nhận</label>
                     <Input required maxLength={6} value={code} onChange={e => setCode(e.target.value)} placeholder="123456" className="text-center tracking-widest font-mono" />
                     {twoFaError && <p className="text-red-500 text-xs">{twoFaError}</p>}
                     <Button type="button" variant="primary" size="sm" className="w-full" onClick={handleVerify2FA} disabled={twoFaLoading || code.length !== 6}>
                       Xác nhận & Bật
                     </Button>
                   </div>
                 )}
               </div>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
