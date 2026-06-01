import React, { useState } from 'react';
import * as motion from 'motion/react-client';
import { X, Upload, RefreshCw } from 'lucide-react';
import { Button } from './ui/Button';
import { Select } from './ui/Select';
import { AdAccount, FBAccountStatus, InventoryStatus, AccountType, AccountScope } from '../types';
import { useI18n } from '../lib/i18n';
import { FB_GRAPH_URL, normalizeFBStatus } from '../lib/fb-api';
import { saveAccounts } from '../lib/api';

interface ImportModalProps {
  onClose: () => void;
  onImportSuccess: (newAccounts: AdAccount[]) => void;
}

const FIELDS = 'account_id,name,account_status,currency,timezone_name,funding_source_details,spend_cap,amount_spent,business';

import { createPortal } from 'react-dom';

export function ImportModal({ onClose, onImportSuccess }: ImportModalProps) {
  const { t } = useI18n();
  const [idsText, setIdsText] = useState('');
  const [inventoryStatus, setInventoryStatus] = useState<InventoryStatus>('IN_STOCK');
  const [accountType, setAccountType] = useState<AccountType>('REGULAR');
  const [accountScope, setAccountScope] = useState<AccountScope>('BM');
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState('');

  const handleImport = async () => {
    const rawIds = idsText.split(/[\n,;]+/).map(s => s.trim()).filter(Boolean);
    if (rawIds.length === 0) return;

    setLoading(true);
    setProgress(`Scanning current Facebook account data...`);

    const token = localStorage.getItem('fb_access_token');
    const newAccounts: AdAccount[] = [];

    // Scan all user FB accounts
    let fbDataMap = new Map<string, AdAccount>();
    if (token) {
      try {
        const { fetchAllUserAccounts } = await import('../lib/fb-api');
        const allFetchedAccounts = await fetchAllUserAccounts(token);
        allFetchedAccounts.forEach(acc => fbDataMap.set(acc.id, acc));
      } catch (e) {
        console.warn('Scan failed, fallback to direct fetch', e);
      }
    }

    setProgress(`Processing ${rawIds.length} accounts...`);

    for (let i = 0; i < rawIds.length; i++) {
      let rawId = rawIds[i];
      const numericId = rawId.replace(/\D/g, '');
      if (!numericId) continue;
      
      const actId = `act_${numericId}`;
      let accData: Partial<AdAccount> = {
        id: actId,
        name: `Tài khoản ${numericId}`,
        fbStatus: 'UNSETTLED',
        inventoryStatus,
        importDate: new Date().toISOString(),
        linkedPartners: [],
        limit: 50,
        accountType,
        accountScope,
        timezone: 'UTC',
        currency: 'USD',
        spend: 0
      };

      if (token) {
        if (fbDataMap.has(actId)) {
          const synced = fbDataMap.get(actId)!;
          accData = {
            ...synced,
            inventoryStatus, // keep selected
            accountType, // keep selected
            accountScope // keep selected
          };
        } else {
          try {
            const res = await fetch(`${FB_GRAPH_URL}/${actId}?fields=${FIELDS}&access_token=${token}`);
            const fbData = await res.json();
            if (!fbData.error && fbData.account_id) {
              const rawLimit = fbData.spend_cap ? parseInt(fbData.spend_cap) : 0;
              const limit = rawLimit === 0 ? -1 : Math.round(rawLimit / 100);
              
              let paymentCard = '';
              if (fbData.funding_source_details && fbData.funding_source_details.display_string) {
                paymentCard = fbData.funding_source_details.display_string;
              }

              accData = {
                ...accData,
                name: fbData.name || accData.name,
                fbStatus: normalizeFBStatus(fbData.account_status),
                linkedPartners: fbData.business ? [{ id: fbData.business.id, name: fbData.business.name || fbData.business.id }] : [],
                paymentCard,
                limit,
                timezone: fbData.timezone_name || 'UTC',
                currency: fbData.currency || 'USD',
                spend: fbData.amount_spent ? parseFloat(fbData.amount_spent) / 100 : 0
              };
            }
          } catch (e) {
            console.warn(`Could not fetch data for ${actId}`);
          }
        }
      }

      newAccounts.push(accData as AdAccount);
    }

    setProgress(`Saving to database...`);
    await saveAccounts(newAccounts);
    
    setLoading(false);
    onImportSuccess(newAccounts);
    onClose();
  };

  const modalContent = (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
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
        className="bg-white dark:bg-zinc-900 border-2 border-blue-500/30 w-full max-w-2xl rounded-2xl shadow-[0_0_50px_rgba(37,99,235,0.15)] flex flex-col max-h-[90dvh] relative z-10"
      >
        <div className="flex items-center justify-between p-5 border-b border-zinc-200 dark:border-zinc-800 shrink-0">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <span className="w-2.5 h-2.5 bg-blue-500 rounded-full animate-pulse"></span>
            {t('importModalTitle')}
          </h2>
          <button onClick={onClose} className="text-zinc-500 dark:text-zinc-400 dark:text-zinc-400 hover:text-zinc-900 dark:text-white transition-colors bg-zinc-100 dark:bg-zinc-800/50 hover:bg-zinc-100 dark:bg-zinc-800 p-2 rounded-full">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="p-4 space-y-4 overflow-y-auto">
          <div className="space-y-1.5">
            <label className="text-xs uppercase text-zinc-500 dark:text-zinc-400 font-bold">{t('idListLabel')}</label>
            <textarea
              value={idsText}
              onChange={(e) => setIdsText(e.target.value)}
              className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg p-3 text-sm text-zinc-600 dark:text-zinc-300 focus:ring-1 focus:ring-blue-600 focus:border-blue-600 outline-none resize-none h-40 font-mono"
              placeholder="123456789\n987654321..."
            />
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs uppercase text-zinc-500 dark:text-zinc-400 font-bold">{t('warehouseStatus')}</label>
              <Select
                value={inventoryStatus}
                onChange={(val) => setInventoryStatus(val as InventoryStatus)}
                menuPosition="top"
                options={[
                  { value: 'IN_STOCK', label: t('inStock') },
                  { value: 'OUT_OF_STOCK', label: t('outStock') }
                ]}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs uppercase text-zinc-500 dark:text-zinc-400 font-bold">{t('type')}</label>
              <Select
                value={accountType}
                onChange={(val) => setAccountType(val as AccountType)}
                menuPosition="top"
                options={[
                  { value: 'Cá nhân', label: 'Cá nhân' },
                  { value: 'BM1', label: 'BM1' },
                  { value: 'BM3', label: 'BM3' },
                  { value: 'BM5', label: 'BM5' },
                  { value: 'VO', label: 'VO' },
                  { value: 'REGULAR', label: 'Thường / limit' },
                  { value: 'NOLIMIT', label: t('noLimit') }
                ]}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs uppercase text-zinc-500 dark:text-zinc-400 font-bold">{t('accountScope')}</label>
              <Select
                value={accountScope}
                onChange={(val) => setAccountScope(val as AccountScope)}
                menuPosition="top"
                options={[
                  { value: 'BM', label: 'Business Manager' },
                  { value: 'PERSONAL', label: 'Cá nhân' }
                ]}
              />
            </div>
          </div>
        </div>

        <div className="p-4 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 rounded-b-xl flex justify-between items-center">
          <div className="text-xs text-zinc-500 dark:text-zinc-400 dark:text-zinc-400 font-mono">
            {loading ? (
              <span className="flex items-center text-blue-400">
                <RefreshCw className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                {progress}
              </span>
            ) : (
              <span>{idsText.split(/[\n,;]+/).filter(Boolean).length} IDs ready</span>
            )}
          </div>
          <div className="flex gap-2">
            <Button variant="secondary" onClick={onClose} disabled={loading}>{t('cancel')}</Button>
            <Button variant="primary" onClick={handleImport} disabled={loading || !idsText.trim()}>
              <Upload className="w-4 h-4 mr-2" />
              {t('importInventory')}
            </Button>
          </div>
        </div>
      </motion.div>
    </div>
  );

  return typeof document !== 'undefined' ? createPortal(modalContent, document.body) : null;
}
