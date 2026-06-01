import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Key, ShieldCheck, HelpCircle, Code, RefreshCcw } from 'lucide-react';
import * as motion from 'motion/react-client';
import { useI18n } from '../lib/i18n';

export function SettingsPage() {
  const { t } = useI18n();
  const [token, setToken] = useState(localStorage.getItem('fb_access_token') || '');
  const [isSaved, setIsSaved] = useState(false);

  const handleSave = () => {
    localStorage.setItem('fb_access_token', token);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  return (
    <div className="max-w-4xl space-y-6 animate-in slide-in-from-bottom-2 duration-500 fade-in p-4 md:p-6">
       <div className="mb-4 md:mb-6">
        <h2 className="text-xl font-semibold tracking-tight text-zinc-900 dark:text-white mb-1">{t('settingsTitle')}</h2>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">{t('tokenHelp')}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* API Form */}
        <Card className="h-fit">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Key className="w-4 h-4 text-blue-500" />
              User Access Token (Via Token)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-[10px] uppercase text-zinc-500 dark:text-zinc-400 font-bold tracking-wider">Access Token (EAAG... hoặc EAAB...)</label>
              <textarea
                className="flex w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded px-3 py-2 text-xs text-zinc-600 dark:text-zinc-300 placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-zinc-700 min-h-[100px] font-mono resize-none"
                placeholder="EAAGm0PX4ZCpwBA..."
                value={token}
                onChange={e => setToken(e.target.value)}
              />
              <p className="text-[10px] text-emerald-500 mt-2 flex items-center gap-1 font-mono uppercase">
                <ShieldCheck className="w-3 h-3" /> Token được lưu trữ bảo mật nội bộ
              </p>
            </div>

            <Button className="w-full mt-4" onClick={handleSave}>
              {isSaved ? t('savedToken') : t('saveToken')}
            </Button>
          </CardContent>
        </Card>

        {/* Instructions */}
        <div className="space-y-4">
          <Card className="bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-zinc-900 dark:text-white">
                <HelpCircle className="w-4 h-4" />
                Hướng dẫn cấu hình
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-zinc-500 dark:text-zinc-400 space-y-3">
              <p>Hệ thống tự động quét <strong>tất cả BM</strong> mà Via đang có mặt. Không cần cấu hình từng BM ID riêng lẻ.</p>
              
              <ol className="list-decimal pl-5 space-y-2 text-xs">
                <li>Truy cập <a href="https://developers.facebook.com/tools/explorer/" target="_blank" rel="noreferrer" className="text-blue-400 font-medium hover:underline">Graph API Explorer</a> trên trình duyệt đã đăng nhập Facebook (Via).</li>
                <li>Chọn App bất kỳ của bạn, hoặc tạo một App mới ở chế độ Business.</li>
                <li>Cấp quyền: <strong>ads_management, business_management</strong>.</li>
                <li>Nhấn "Tạo Token truy cập".</li>
                <li>Sao chép toàn bộ mã Token và dán vào ô bên trái, sau đó lưu lại và qua trang <strong>Logs</strong> để đồng bộ.</li>
              </ol>

              <div className="mt-4 p-3 rounded bg-zinc-50 dark:bg-zinc-950/50 border border-zinc-200 dark:border-zinc-800">
                 <p className="text-[10.5px] text-zinc-500 dark:text-zinc-400 italic">Lưu ý bảo mật trình duyệt (CORS): Ứng dụng web không quyền ngầm lấy Cookie (c_user) từ thẻ Facebook.com của mảng duyệt web do quy định bảo mật. Bạn bắt buộc phải dán Token thủ công.</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
