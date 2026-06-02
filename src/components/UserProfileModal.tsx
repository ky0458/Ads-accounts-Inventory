import React, { useState } from 'react';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { X, User as UserIcon, Camera } from 'lucide-react';
import { AuthUser } from './Login';
import * as motion from 'motion/react-client';

interface Props {
  user: AuthUser;
  onClose: () => void;
  onUpdate: (data: Partial<AuthUser>) => void;
}

export function UserProfileModal({ user, onClose, onUpdate }: Props) {
  const [avatarUrl, setAvatarUrl] = useState(user.avatarUrl || '');

  const handleUpdateProfile = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdate({ avatarUrl });
    onClose();
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
        className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 w-full max-w-sm rounded-2xl shadow-2xl flex flex-col relative z-10"
      >
        <div className="flex items-center justify-between p-5 border-b border-zinc-200 dark:border-zinc-800">
          <h2 className="text-xl font-bold flex items-center gap-2">
             <UserIcon className="w-5 h-5 text-blue-500" />
             Hồ sơ hiện tại
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white">
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
               <div className="text-zinc-500 dark:text-zinc-400 text-sm">{user.id}</div>
            </div>
          </div>

          <form onSubmit={handleUpdateProfile} className="space-y-4 pt-4 border-t border-zinc-200 dark:border-zinc-800">
             <div>
                <label className="text-xs uppercase text-zinc-500 dark:text-zinc-400 font-bold tracking-wider mb-1.5 flex items-center gap-1.5">
                  <Camera className="w-3.5 h-3.5" /> Avatar URL
                </label>
                <Input value={avatarUrl} onChange={e => setAvatarUrl(e.target.value)} placeholder="https://..." />
             </div>
             <Button type="submit" variant="primary" className="h-9 font-bold w-full">
                Lưu hiển thị
             </Button>
          </form>
        </div>
      </motion.div>
    </div>
  );
}
