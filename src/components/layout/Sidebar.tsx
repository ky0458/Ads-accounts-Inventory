import React from 'react';
import { LayoutDashboard, Users, Settings, Database, Filter, Download, Plus, Search, HelpCircle, Globe, X } from 'lucide-react';
import { cn } from '../../lib/utils';
import { useI18n, Language } from '../../lib/i18n';
import { Select } from '../ui/Select';

interface SidebarProps {
  currentTab: string;
  onTabChange: (tab: string) => void;
  isOpen?: boolean;
  setIsOpen?: (v: boolean) => void;
}

export function Sidebar({ currentTab, onTabChange, isOpen, setIsOpen }: SidebarProps) {
  const { lang, setLang, t } = useI18n();

  const items = [
    { id: 'dashboard', label: t('dashboard'), icon: LayoutDashboard },
    { id: 'inventory', label: t('inventory'), icon: Database },
    { id: 'setup', label: t('setup'), icon: Settings },
  ];

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/60 z-40 md:hidden backdrop-blur-sm" 
          onClick={() => setIsOpen?.(false)} 
        />
      )}

      <aside className={cn(
        "fixed md:static inset-y-0 left-0 w-64 border-r border-zinc-800 bg-zinc-950 flex flex-col flex-shrink-0 z-50 transition-transform duration-300 md:translate-x-0 h-[100dvh]",
        isOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="p-4 md:p-6 border-b border-zinc-800 flex items-center justify-between">
          <div>
            <h1 className="text-lg md:text-xl font-semibold tracking-tight text-white flex items-center gap-2">
              <span className="w-3 h-3 bg-blue-600 rounded-full"></span>
              FB Asset Hub
            </h1>
            <p className="text-[10px] uppercase tracking-widest text-zinc-500 mt-1 font-bold">{t('enterpriseManager')}</p>
          </div>
          {setIsOpen && (
            <button className="md:hidden text-zinc-400 hover:text-white" onClick={() => setIsOpen(false)}>
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
        
        <nav className="flex-1 p-3 md:p-4 space-y-1 overflow-y-auto">
          {items.map((item) => {
            const active = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onTabChange(item.id)}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors",
                  active 
                    ? "bg-zinc-900 text-zinc-100" 
                    : "text-zinc-400 hover:bg-zinc-900 hover:text-zinc-100"
                )}
              >
                <item.icon className="w-4 h-4 md:w-4 md:h-4" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="px-4 py-3 flex items-center gap-3 border-t border-zinc-800 text-xs text-zinc-400 shrink-0">
           <div className="text-xl leading-none" title={lang === 'vi' ? '🇻🇳' : lang === 'zh' ? '🇨🇳' : '🇬🇧'}>
             {lang === 'vi' ? '🇻🇳' : lang === 'zh' ? '🇨🇳' : '🇬🇧'}
           </div>
           <div className="flex-1">
             <Select
               value={lang}
               onChange={(val) => setLang(val as Language)}
               menuPosition="top"
               options={[
                 { value: 'vi', label: '🇻🇳 Tiếng Việt' },
                 { value: 'en', label: '🇬🇧 English' },
                 { value: 'zh', label: '🇨🇳 中文' }
               ]}
             />
           </div>
        </div>

        <div className="p-4 border-t border-zinc-800 bg-zinc-900/30 shrink-0 hidden md:block">
          <div className="flex items-start gap-3">
            <HelpCircle className="w-5 h-5 text-zinc-500 shrink-0 mt-0.5" />
            <div>
              <h4 className="text-[11px] uppercase tracking-widest text-zinc-500 font-bold mb-1">{t('needHelp')}</h4>
              <p className="text-xs text-zinc-400 leading-relaxed mb-3">{t('readSetup')}</p>
              <button className="text-xs font-semibold text-zinc-300 hover:text-white transition-colors" onClick={() => onTabChange('setup')}>
                 {t('viewGuide')} &rarr;
              </button>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
