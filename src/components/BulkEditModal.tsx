import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Save } from 'lucide-react';
import { Button } from './ui/Button';
import { Select } from './ui/Select';
import { useI18n } from '../lib/i18n';
import { Input } from './ui/Input';
import { AccountType, InventoryStatus } from '../types';

interface BulkEditModalProps {
  onClose: () => void;
  onApply: (updates: any) => void;
  selectedCount: number;
}

export function BulkEditModal({ onClose, onApply, selectedCount }: BulkEditModalProps) {
  const { t } = useI18n();
  
  const [inventoryStatus, setInventoryStatus] = useState<InventoryStatus | 'NO_CHANGE'>('NO_CHANGE');
  const [accountType, setAccountType] = useState<AccountType | 'NO_CHANGE'>('NO_CHANGE');
  const [importDate, setImportDate] = useState<string>('');
  const [exportDate, setExportDate] = useState<string>('');

  const handleApply = () => {
    const updates: any = {};
    if (inventoryStatus !== 'NO_CHANGE') {
      updates.inventoryStatus = inventoryStatus;
    }
    if (accountType !== 'NO_CHANGE') {
      updates.accountType = accountType;
    }
    if (importDate) {
      updates.importDate = new Date(importDate).toISOString();
    }
    if (exportDate) {
      updates.exportDate = new Date(exportDate).toISOString();
    }
    
    // If no changes
    if (Object.keys(updates).length === 0) {
      onClose();
      return;
    }

    onApply(updates);
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={onClose}
      />
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        className="bg-white dark:bg-zinc-950 w-full max-w-md rounded-2xl shadow-2xl relative z-10 border border-zinc-200 dark:border-zinc-800 overflow-hidden flex flex-col max-h-[90vh]"
      >
        <div className="flex items-center justify-between p-5 border-b border-zinc-100 dark:border-zinc-800/50">
          <div>
            <h3 className="font-bold text-lg">{t('bulkEdit') as string}</h3>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">{(t('editingAccounts') as string).replace('{count}', selectedCount.toString())}</p>
          </div>
          <button onClick={onClose} className="text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors bg-zinc-100 dark:bg-zinc-800/50 hover:bg-zinc-100 dark:hover:bg-zinc-800 p-2 rounded-full">
            <X className="w-4 h-4" />
          </button>
        </div>
        
        <div className="p-5 flex-1 overflow-y-auto custom-scrollbar space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs uppercase text-zinc-500 dark:text-zinc-400 font-bold">{t('warehouseStatus')}</label>
            <Select
              value={inventoryStatus}
              onChange={(val) => setInventoryStatus(val as any)}
              options={[
                { value: 'NO_CHANGE', label: t('noChange') as string },
                { value: 'IN_STOCK', label: t('lblUnexported') as string },
                { value: 'OUT_OF_STOCK', label: t('lblExported') as string }
              ]}
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs uppercase text-zinc-500 dark:text-zinc-400 font-bold">{t('type')}</label>
            <Select
              value={accountType}
              onChange={(val) => setAccountType(val as any)}
              options={[
                { value: 'NO_CHANGE', label: t('noChange') as string },
                { value: 'Cá nhân', label: t('typePersonal') as string },
                { value: 'BM1', label: 'BM1' },
                { value: 'BM3', label: 'BM3' },
                { value: 'BM5', label: 'BM5' },
                { value: 'VO', label: 'VO' },
                { value: 'REGULAR', label: t('typeRegular') as string },
                { value: 'NOLIMIT', label: t('noLimit') as string }
              ]}
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs uppercase text-zinc-500 dark:text-zinc-400 font-bold">{t('lblImportDate') as string}</label>
            <Input 
              type="date"
              value={importDate}
              onChange={(e) => setImportDate(e.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs uppercase text-zinc-500 dark:text-zinc-400 font-bold">{t('lblExportDate') as string}</label>
            <Input 
              type="date"
              value={exportDate}
              onChange={(e) => setExportDate(e.target.value)}
            />
          </div>
        </div>

        <div className="p-5 border-t border-zinc-100 dark:border-zinc-800/50 bg-zinc-50/50 dark:bg-zinc-900/50 flex justify-end gap-3 shrink-0">
          <Button variant="outline" onClick={onClose}>{t('cancel')}</Button>
          <Button variant="primary" onClick={handleApply}>
            <Save className="w-4 h-4 mr-2" />
            {t('saveChanges') as string}
          </Button>
        </div>
      </motion.div>
    </div>
  );
}
