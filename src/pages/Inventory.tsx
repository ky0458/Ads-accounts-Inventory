import React, { useState, useMemo, useRef, useEffect } from 'react';
import { AdAccount, FilterState } from '../types';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Badge } from '../components/ui/Badge';
import { Filter, Download, Plus, Search, ChevronDown, RefreshCw, Layers, X, ChevronLeft, ChevronRight, Copy, Check, Upload } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { exportToCSV, cn } from '../lib/utils';
import { AnimatePresence } from 'motion/react';
import * as motion from 'motion/react-client';
import { useI18n } from '../lib/i18n';
import { Select } from '../components/ui/Select';
import { ImportModal } from '../components/ImportModal';
import { updateAccount, saveAccounts } from '../lib/api';

interface InventoryProps {
  accounts: AdAccount[];
  setAccounts: React.Dispatch<React.SetStateAction<AdAccount[]>>;
}

export function Inventory({ accounts, setAccounts }: InventoryProps) {
  const { t } = useI18n();
  const [filters, setFilters] = useState<FilterState>({
    searchQuery: '',
    searchField: 'all',
    accountTypes: [],
    inventoryStatus: 'ALL',
    fbStatus: 'ALL',
    dateRange: { start: null, end: null },
  });

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState('25');
  const [showImportModal, setShowImportModal] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    setCurrentPage(1);
  }, [filters, itemsPerPage]);

  const [showFilters, setShowFilters] = useState(false);

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const isSelectingRef = useRef(false);
  const selectionModeRef = useRef<boolean>(true);

  const handleCopyId = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const numericId = id.replace('act_', '');
    navigator.clipboard.writeText(numericId);
    setCopiedId(numericId);
    setTimeout(() => setCopiedId(null), 2000);
  };

  useEffect(() => {
    const handleMouseUp = () => { isSelectingRef.current = false; };
    window.addEventListener('mouseup', handleMouseUp);
    return () => window.removeEventListener('mouseup', handleMouseUp);
  }, []);

  const toggleSelection = (id: string, select: boolean) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (select) next.add(id);
      else next.delete(id);
      return next;
    });
  };

  const handleMouseDown = (id: string, currentlySelected: boolean) => {
    isSelectingRef.current = true;
    selectionModeRef.current = !currentlySelected;
    toggleSelection(id, !currentlySelected);
  };

  const handleMouseEnter = (id: string) => {
    if (isSelectingRef.current) {
      toggleSelection(id, selectionModeRef.current);
    }
  };

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedIds(new Set(filteredAccounts.map(a => a.id)));
    } else {
      setSelectedIds(new Set());
    }
  };

  const [bulkAction, setBulkAction] = useState<string>('');
  
  const applyBulkAction = async () => {
    if (selectedIds.size === 0 || !bulkAction) return;
    
    if (bulkAction === 'SYNC_FB') {
      const token = localStorage.getItem('fb_access_token');
      if (!token) {
        alert("Vui lòng thiết lập Access Token ở trang Cấu Hình trước.");
        return;
      }
      setIsSyncing(true);
      const idArray = Array.from(selectedIds);
      let updatedCount = 0;
      
      const { fetchAccountById } = await import('../lib/fb-api');
      
      for (const id of idArray) {
        const newData = await fetchAccountById(id, token);
        if (newData) {
          // Eagerly update UI
          setAccounts(prev => prev.map(acc => acc.id === id ? { ...acc, ...newData } : acc));
          // Update DB
          await updateAccount(id, newData);
          updatedCount++;
        }
      }
      
      setIsSyncing(false);
      setSelectedIds(new Set());
      setBulkAction('');
      return;
    }
    
    const updates: Partial<AdAccount> = {};
    if (bulkAction === 'IN_STOCK' || bulkAction === 'OUT_OF_STOCK') {
      updates.inventoryStatus = bulkAction as any;
    } else if (bulkAction === 'BW_SYNC') {
      updates.blueWhaleSync = true;
    } else if (bulkAction === 'BW_UNSYNC') {
      updates.blueWhaleSync = false;
    }

    // Update in UI eagerly
    setAccounts(prev => prev.map(acc => {
      if (!selectedIds.has(acc.id)) return acc;
      return { ...acc, ...updates };
    }));
    
    // Background update all IDs to db
    const idArray = Array.from(selectedIds);
    await Promise.all(idArray.map(id => updateAccount(id, updates)));

    setSelectedIds(new Set());
    setBulkAction('');
  };

  // Filtering Logic
  const filteredAccounts = useMemo(() => {
    return accounts.filter((acc) => {
      if (filters.searchQuery) {
        const allowMultiple = filters.searchField === 'id' || filters.searchField === 'name';
        const searchTerms = allowMultiple
          ? filters.searchQuery.split(/[\n,;]+/).map(s => s.trim()).filter(Boolean)
          : [filters.searchQuery.trim()].filter(Boolean);

        const matchesSearch = searchTerms.some(term => {
          const t = term.toLowerCase();
          const cleanId = acc.id.toLowerCase().replace('act_', '');
          
          if (filters.searchField === 'id') {
            return cleanId.includes(t);
          } else if (filters.searchField === 'name') {
            return acc.name.toLowerCase().includes(t);
          } else if (filters.searchField === 'card') {
            return acc.paymentCard && acc.paymentCard.toLowerCase().endsWith(t);
          } else if (filters.searchField === 'timezone') {
            return acc.timezone.toLowerCase().includes(t);
          }
          
          return (
            cleanId.includes(t) || 
            acc.name.toLowerCase().includes(t) ||
            (acc.paymentCard && acc.paymentCard.toLowerCase().endsWith(t)) ||
            acc.timezone.toLowerCase().includes(t) ||
            acc.fbStatus.toLowerCase().includes(t)
          );
        });
        if (!matchesSearch) return false;
      }

      if (filters.fbStatus !== 'ALL' && acc.fbStatus !== filters.fbStatus) return false;

      if (filters.inventoryStatus !== 'ALL' && acc.inventoryStatus !== filters.inventoryStatus) return false;

      if (filters.accountTypes.length > 0 && !filters.accountTypes.includes(acc.accountType)) return false;

      if (filters.dateRange.start) {
        if (new Date(acc.importDate) < new Date(filters.dateRange.start)) return false;
      }
      if (filters.dateRange.end) {
        const end = new Date(filters.dateRange.end);
        end.setDate(end.getDate() + 1);
        if (new Date(acc.importDate) >= end) return false;
      }

      return true;
    });
  }, [accounts, filters]);

  // Pagination Logic
  const paginatedAccounts = useMemo(() => {
    const limit = parseInt(itemsPerPage);
    if (isNaN(limit)) return filteredAccounts; // 'All' case or error
    const start = (currentPage - 1) * limit;
    return filteredAccounts.slice(start, start + limit);
  }, [filteredAccounts, currentPage, itemsPerPage]);

  const totalPages = itemsPerPage === 'ALL' ? 1 : Math.ceil(filteredAccounts.length / parseInt(itemsPerPage));

  const handleExportCSV = () => {
    const exportData = filteredAccounts.map(a => ({
      'ID Tài Khoản': a.id.replace('act_', ''),
      'Tên': a.name,
      'Status FB': a.fbStatus,
      'Thẻ (Card)': a.paymentCard || 'Chưa nối',
      'Limit (USD)': a.limit === -1 ? 'No Limit' : a.limit,
      'Loại TK': a.accountType,
      'Quy mô': a.accountScope,
      'Trạng thái Kho': a.inventoryStatus,
      'Ngày Nhập Kho': format(parseISO(a.importDate), 'dd/MM/yyyy HH:mm'),
      'Ngày Xuất Kho': a.exportDate ? format(parseISO(a.exportDate), 'dd/MM/yyyy HH:mm') : '',
      'BM Đối Tác (Partners)': a.linkedPartners.map(p => typeof p === 'string' ? p : `${p.name} (${p.id})`).join('; '),
      'Múi Giờ': a.timezone,
      'Chi Tiêu': `${a.spend} ${a.currency}`,
      'Đồng bộ BW': a.blueWhaleSync ? 'YES' : 'NO'
    }));
    exportToCSV(`Inventory_Report_${format(new Date(), 'yyyyMMdd')}.csv`, exportData);
  };

  const getStatusBadge = (status: AdAccount['fbStatus']) => {
    switch (status) {
      case 'ACTIVE': return <Badge variant="success">{t('active')}</Badge>;
      case 'DISABLED': return <Badge variant="danger">{t('disabled')}</Badge>;
      case 'IN_REVIEW': return <Badge variant="warning">{t('inReview')}</Badge>;
      case 'UNSETTLED': return <Badge variant="danger">Unsettled</Badge>;
      default: return <Badge variant="neutral">{status}</Badge>;
    }
  };

  const getInventoryBadge = (status: AdAccount['inventoryStatus']) => {
    return status === 'IN_STOCK' ? (
      <Badge variant="neutral">{t('inStock')}</Badge>
    ) : (
      <Badge variant="info">{t('outStock')}</Badge>
    );
  };
  
  const getBWSyncBadge = (isSynced?: boolean) => {
    if (isSynced) return <Badge variant="success">{t('bwSynced')}</Badge>;
    return <Badge variant="danger">{t('bwNotSynced')}</Badge>;
  };

  const [isSyncing, setIsSyncing] = useState(false);

  const syncDataFromFB = async () => {
    const token = localStorage.getItem('fb_access_token');
    if (!token) {
      alert("Vui lòng thiết lập Access Token ở trang Cấu Hình trước.");
      return;
    }
    
    setIsSyncing(true);
    try {
      const { fetchAllUserAccounts } = await import('../lib/fb-api');
      const newAccounts = await fetchAllUserAccounts(token);
      
      let newFinalAccounts: AdAccount[] = [];
      setAccounts(prevAccounts => {
        const accMap = new Map(prevAccounts.map(a => [a.id, a]));
        const merged = newAccounts.map(newAcc => {
          if (accMap.has(newAcc.id)) {
             const existing = accMap.get(newAcc.id)!;
             return { ...newAcc, inventoryStatus: existing.inventoryStatus, importDate: existing.importDate, blueWhaleSync: existing.blueWhaleSync };
          }
          return newAcc;
        });
        
        const newAccIds = new Set(newAccounts.map(a => a.id));
        const keptAccounts = prevAccounts.filter(a => !newAccIds.has(a.id));
        
        newFinalAccounts = [...merged, ...keptAccounts];
        return newFinalAccounts;
      });
      
      if (newFinalAccounts.length > 0) {
        await saveAccounts(newFinalAccounts);
      }
      alert(`Đồng bộ thành công! Tìm thấy ${newAccounts.length} tài khoản.`);
    } catch (err: any) {
      alert(err.message || 'Lỗi đồng bộ dữ liệu.');
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className="flex flex-col h-full animate-in fade-in duration-500 p-4 md:p-6 overflow-hidden">
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4 mb-4 md:mb-6 shrink-0 w-full overflow-x-auto">
        <div className="flex-1 min-w-0 flex items-center justify-between w-full">
          <h2 className="text-xl md:text-2xl font-semibold tracking-tight text-white mb-1 truncate">{t('inventory')}</h2>
        </div>
        <div className="flex items-center gap-2 md:gap-3 flex-wrap">
          <Button variant="primary" onClick={() => setShowImportModal(true)} className="text-[11px] md:text-xs font-bold rounded flex items-center gap-2">
            <Upload className="w-3.5 h-3.5" />
            {t('importInventory')}
          </Button>
          <Button variant="secondary" onClick={handleExportCSV} className="text-[11px] md:text-xs font-bold rounded flex items-center gap-2">
            <Download className="w-3.5 h-3.5" />
            {t('exportCsv')}
          </Button>
          <Button variant="outline" onClick={syncDataFromFB} disabled={isSyncing} className="text-[11px] md:text-xs font-bold rounded flex items-center gap-2">
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? "animate-spin" : ""}`} />
            {isSyncing ? "SYNCING..." : t('syncData')}
          </Button>
        </div>
      </div>

      <AnimatePresence>
        {showImportModal && (
          <ImportModal 
            onClose={() => setShowImportModal(false)} 
            onImportSuccess={(newAccounts) => {
              // Merge into current active set to avoid refresh wait
              setAccounts(prev => {
                const prevMap = new Map(prev.map(a => [a.id, a]));
                newAccounts.forEach(a => prevMap.set(a.id, a));
                return Array.from(prevMap.values());
              });
            }} 
          />
        )}
      </AnimatePresence>

      {/* Filter Bar */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 flex flex-wrap gap-4 shrink-0 shadow-xl mb-6 items-start">
        <div className="w-full lg:flex-1 lg:min-w-[360px] space-y-1.5 min-w-0">
          <label className="text-[10px] uppercase text-zinc-500 font-bold tracking-wider flex justify-between">
            {t('filterUid')}
          </label>
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="w-full sm:w-32 shrink-0">
               <Select
                  value={filters.searchField}
                  onChange={(val) => setFilters(f => ({ ...f, searchField: val }))}
                  options={[
                    { value: 'all', label: t('searchAll') },
                    { value: 'id', label: t('searchId') },
                    { value: 'name', label: t('searchName') },
                    { value: 'card', label: t('searchCard') },
                    { value: 'timezone', label: t('searchTimezone') }
                  ]}
               />
            </div>
            <div className="relative flex-1 min-w-0">
              <Search className="w-4 h-4 absolute left-3 top-3 text-zinc-500" />
              <textarea
                className="w-full bg-zinc-950 border border-zinc-800 rounded pl-9 pr-3 py-2 text-xs text-zinc-300 focus:ring-1 focus:ring-blue-600 focus:border-blue-600 outline-none resize-none h-10 transition-all font-mono placeholder:text-zinc-600 placeholder:font-sans"
                placeholder={t('searchPlaceholder')}
                value={filters.searchQuery}
                onChange={(e) => setFilters(f => ({ ...f, searchQuery: e.target.value }))}
              />
            </div>
          </div>
        </div>
        
        <div className="w-full sm:w-44 space-y-1.5 shrink-0">
          <label className="text-[10px] uppercase text-zinc-500 font-bold tracking-wider">{t('status')}</label>
          <Select
            value={filters.fbStatus}
            onChange={(val) => setFilters(f => ({ ...f, fbStatus: val as any }))}
            options={[
              { value: 'ALL', label: t('allStatus') },
              { value: 'ACTIVE', label: t('active') },
              { value: 'DISABLED', label: t('disabled') },
              { value: 'IN_REVIEW', label: t('inReview') }
            ]}
          />
        </div>
        
        <div className="w-full sm:w-40 space-y-1.5 shrink-0">
           <label className="text-[10px] uppercase text-zinc-500 font-bold tracking-wider">{t('warehouse')}</label>
           <Select
            value={filters.inventoryStatus}
            onChange={(val) => setFilters(f => ({ ...f, inventoryStatus: val as any }))}
            options={[
              { value: 'ALL', label: t('allStates') },
              { value: 'IN_STOCK', label: t('inStock') },
              { value: 'OUT_OF_STOCK', label: t('outStock') }
            ]}
          />
        </div>

        <div className="flex items-center gap-2 pt-0 lg:pt-[22px] w-full lg:w-auto shrink-0">
           <Button variant="primary" onClick={() => {}} className="flex-1 lg:flex-none h-10 px-6 bg-blue-700 hover:bg-blue-600 text-white text-xs font-bold rounded transition-all shadow-[0_0_15px_rgba(37,99,235,0.2)]">
            {t('applyFilters')}
           </Button>
           <button 
             onClick={() => setFilters({ searchQuery: '', searchField: 'all', accountTypes: [], inventoryStatus: 'ALL', fbStatus: 'ALL', dateRange: { start: null, end: null } })}
             className="h-10 px-3 shrink-0 bg-zinc-950 border border-zinc-800 hover:border-zinc-600 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 text-xs font-bold rounded transition-all flex items-center justify-center group"
             title={t('resetFilters')}
           >
             <X className="w-4 h-4 group-hover:rotate-90 transition-transform duration-200" />
           </button>
        </div>
      </div>
      
      {/* Bulk Actions */}
      {selectedIds.size > 0 && (
        <div className="bg-zinc-900 border border-zinc-500/30 rounded-xl p-3 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-xl shadow-blue-900/10 mb-4 animate-in fade-in slide-in-from-top-2 shrink-0">
          <div className="text-sm font-medium text-blue-400 font-mono sm:pl-2 text-center sm:text-left w-full sm:w-auto">
            {t('selected')}: {selectedIds.size} {t('accounts')}
          </div>
          <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-3 w-full sm:w-auto">
             <div className="w-full sm:w-48">
               <Select
                  value={bulkAction}
                  onChange={setBulkAction}
                  placeholder={`-- ${t('selectBulkMode')} --`}
                  options={[
                    { value: 'IN_STOCK', label: t('markInStock') },
                    { value: 'OUT_OF_STOCK', label: t('markOutStock') },
                    { value: 'BW_SYNC', label: t('markBWSynced') },
                    { value: 'BW_UNSYNC', label: t('markBWNotSynced') },
                    { value: 'SYNC_FB', label: t('syncSelectedFB') }
                  ]}
               />
             </div>
             <Button variant="primary" size="sm" onClick={applyBulkAction} disabled={!bulkAction} className="h-10 px-4 w-full sm:w-auto">
               {t('applyAction')}
             </Button>
          </div>
        </div>
      )}

      {/* Main Table */}
      <div className="flex-1 bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden flex flex-col shadow-2xl min-h-0">
        <div className="overflow-auto flex-1 select-none">
          <table className="w-full text-left text-[11px] whitespace-nowrap">
            <thead className="bg-zinc-950 text-zinc-500 border-b border-zinc-800 uppercase tracking-widest font-bold tracking-wider text-[10px] sticky top-0 z-10">
              <tr>
                <th className="px-5 py-3 w-10">
                  <input 
                    type="checkbox" 
                    checked={selectedIds.size > 0 && selectedIds.size === filteredAccounts.length}
                    onChange={handleSelectAll}
                    className="w-3.5 h-3.5 accent-blue-600 rounded bg-zinc-900 border-zinc-700"
                  />
                </th>
                <th className="px-5 py-3">{t('status')}</th>
                <th className="px-5 py-3">{t('accountInfo')}</th>
                <th className="px-5 py-3">{t('partnerId')}</th>
                <th className="px-5 py-3">{t('type')} / {t('limit')}</th>
                <th className="px-5 py-3">{t('payment')}</th>
                <th className="px-5 py-3">{t('warehouse')}</th>
                <th className="px-5 py-3">{t('bwSync')}</th>
                <th className="px-5 py-3">{t('actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800 font-sans text-white text-[13px]">
              {paginatedAccounts.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-16 text-center text-zinc-500 font-sans">
                    <div className="flex flex-col items-center justify-center">
                      <Layers className="w-10 h-10 text-zinc-700 mb-3" />
                      <p className="text-sm font-medium text-zinc-400 font-bold">{t('noAccountsFound')}</p>
                      <p className="text-xs mt-1 text-zinc-600">{t('tryAdjustingFilters')}</p>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedAccounts.map((acc) => {
                  const isSelected = selectedIds.has(acc.id);
                  return (
                  <tr 
                    key={acc.id} 
                    className={cn(
                      "transition-colors", 
                      isSelected ? "bg-blue-900/10" : "hover:bg-zinc-800/20"
                    )}
                  >
                    <td 
                      className="px-5 py-3 cursor-pointer"
                      onMouseDown={() => handleMouseDown(acc.id, isSelected)}
                      onMouseEnter={() => handleMouseEnter(acc.id)}
                    >
                      <input 
                        type="checkbox" 
                        checked={isSelected}
                        readOnly // managed by parent handlers
                        className="w-3.5 h-3.5 accent-blue-600 rounded bg-zinc-900 border-zinc-700 pointer-events-none"
                      />
                    </td>
                    <td className="px-5 py-3">
                      {getStatusBadge(acc.fbStatus)}
                    </td>
                    <td className="px-5 py-3">
                      <div className="font-sans font-bold text-white mb-1 truncate max-w-[150px]">{acc.name}</div>
                      <div 
                        className="text-[11px] text-zinc-400 font-mono hover:text-blue-400 cursor-pointer flex items-center gap-1 group"
                        onClick={(e) => handleCopyId(acc.id, e)}
                        title="Copy ID"
                      >
                        {acc.id.replace('act_', '')}
                        <span className="opacity-0 group-hover:opacity-100 transition-opacity">
                          {copiedId === acc.id.replace('act_', '') ? (
                            <Check className="w-3 h-3 text-green-500" />
                          ) : (
                            <Copy className="w-3 h-3" />
                          )}
                        </span>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-zinc-400">
                      {acc.linkedPartners.length > 0 ? (
                        <div className="flex flex-col gap-2">
                          {acc.linkedPartners.map((p, i) => (
                            <div key={i} className="flex flex-col">
                              <span className="text-white font-medium text-xs truncate max-w-[120px]" title={p.name}>{p.name}</span>
                              <div 
                                className="text-[10px] text-zinc-500 font-mono hover:text-blue-400 cursor-pointer flex items-center gap-1 group"
                                onClick={(e) => handleCopyId(p.id, e)}
                                title="Copy Partner ID"
                              >
                                {p.id}
                                <span className="opacity-0 group-hover:opacity-100 transition-opacity">
                                  {copiedId === p.id ? <Check className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3" />}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <span>-</span>
                      )}
                    </td>
                    <td className="px-5 py-3 whitespace-normal max-w-[200px]">
                      <span className="text-zinc-500">{acc.accountScope} / {acc.accountType}</span> <br/>
                      <span className="text-white">
                        {acc.limit === -1 ? 'No Limit' : `$${acc.limit} / Daily`}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <span className={acc.paymentCard ? "text-zinc-300" : "text-rose-300"}>
                        {acc.paymentCard || 'Declined'}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      {getInventoryBadge(acc.inventoryStatus)}
                    </td>
                    <td className="px-5 py-3">
                      {getBWSyncBadge(acc.blueWhaleSync)}
                    </td>
                    <td className="px-5 py-3 gap-2 flex items-center">
                       <button 
                         className="px-2 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded text-[10px] transition-colors"
                         title={t('updateStockTooltip')}
                         onClick={() => {
                           const newStatus = acc.inventoryStatus === 'IN_STOCK' ? 'OUT_OF_STOCK' : 'IN_STOCK';
                           setAccounts(prev => prev.map(a => a.id === acc.id ? { ...a, inventoryStatus: newStatus } : a));
                           updateAccount(acc.id, { inventoryStatus: newStatus });
                         }}
                       >
                         {t('switchStock')}
                       </button>
                       <button 
                         className={cn(
                           "px-2 py-1 border rounded text-[10px] transition-colors",
                           acc.blueWhaleSync 
                            ? "bg-zinc-800 hover:bg-zinc-700 text-zinc-400 border-zinc-700" 
                            : "bg-blue-900/30 hover:bg-blue-900/50 text-blue-400 border-blue-900/50"
                         )}
                         title={t('updateBWTooltip')}
                         onClick={() => {
                           const newStatus = !acc.blueWhaleSync;
                           setAccounts(prev => prev.map(a => a.id === acc.id ? { ...a, blueWhaleSync: newStatus } : a));
                           updateAccount(acc.id, { blueWhaleSync: newStatus });
                         }}
                       >
                         {acc.blueWhaleSync ? t('unsyncBW') : t('syncBW')}
                       </button>
                    </td>
                  </tr>
                )})
              )}
            </tbody>
          </table>
        </div>
        <div className="border-t border-zinc-800 p-3 md:p-4 bg-zinc-950 flex flex-col lg:flex-row justify-between items-center shrink-0 gap-4">
          <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-4 text-[10px] text-zinc-500 uppercase tracking-widest font-bold font-mono text-center sm:text-left">
            <div>
              {t('showing')} {((currentPage - 1) * parseInt(itemsPerPage) || 0) + (paginatedAccounts.length > 0 ? 1 : 0)} - {Math.min(currentPage * (parseInt(itemsPerPage) || filteredAccounts.length), filteredAccounts.length)} {t('of')} {filteredAccounts.length}
            </div>
            <div className="flex items-center gap-2">
              <span>{t('rowsPerPage')}:</span>
              <div className="w-20">
                <Select
                  value={itemsPerPage}
                  onChange={setItemsPerPage}
                  menuPosition="top"
                  options={[
                    { value: '10', label: '10' },
                    { value: '25', label: '25' },
                    { value: '50', label: '50' },
                    { value: '100', label: '100' },
                    { value: 'ALL', label: t('all') }
                  ]}
                  className="h-8 text-[11px]"
                />
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-1 overflow-x-auto max-w-full pb-1">
            <button 
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="w-8 h-8 flex items-center justify-center rounded border border-zinc-800 bg-zinc-950 text-zinc-400 hover:bg-zinc-800 hover:text-white disabled:opacity-50 disabled:hover:bg-zinc-950 disabled:hover:text-zinc-400 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <div className="flex items-center gap-1 px-2">
               {Array.from({ length: Math.min(5, totalPages) }).map((_, idx) => {
                  let p = currentPage;
                  if (currentPage <= 3) { p = idx + 1; }
                  else if (currentPage >= totalPages - 2) { p = totalPages - 4 + idx; }
                  else { p = currentPage - 2 + idx; }
                  
                  if (p < 1 || p > totalPages) return null;
                  
                  return (
                    <button
                      key={p}
                      onClick={() => setCurrentPage(p)}
                      className={cn(
                        "w-8 h-8 flex items-center justify-center rounded text-xs font-mono font-medium transition-colors",
                        currentPage === p 
                          ? "bg-blue-600 text-white" 
                          : "text-zinc-400 hover:bg-zinc-800 hover:text-white"
                      )}
                    >
                      {p}
                    </button>
                  );
               })}
            </div>
            <button 
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages || totalPages === 0}
              className="w-8 h-8 flex items-center justify-center rounded border border-zinc-800 bg-zinc-950 text-zinc-400 hover:bg-zinc-800 hover:text-white disabled:opacity-50 disabled:hover:bg-zinc-950 disabled:hover:text-zinc-400 transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
