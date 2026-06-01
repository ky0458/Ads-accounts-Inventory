import React from 'react';
import { AdAccount } from '../types';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Activity, ShieldAlert, CheckCircle, Boxes } from 'lucide-react';
import { useI18n } from '../lib/i18n';

interface DashboardProps {
  accounts: AdAccount[];
}

const COLORS = ['#3b82f6', '#ef4444', '#f59e0b', '#8b5cf6'];

export function Dashboard({ accounts }: DashboardProps) {
  const { t } = useI18n();
  const stats = {
    total: accounts.length,
    active: accounts.filter(a => a.fbStatus === 'ACTIVE').length,
    disabled: accounts.filter(a => a.fbStatus === 'DISABLED').length,
    outOfStock: accounts.filter(a => a.inventoryStatus === 'OUT_OF_STOCK').length,
  };

  const typeData = [
    { name: 'Regular', value: accounts.filter(a => a.accountType === 'REGULAR').length },
    { name: 'VO', value: accounts.filter(a => a.accountType === 'VO').length },
    { name: t('noLimit'), value: accounts.filter(a => a.accountType === 'NOLIMIT').length },
  ].filter(d => d.value > 0);

  const statusData = [
    { name: t('active').toUpperCase(), value: stats.active },
    { name: t('disabled').toUpperCase(), value: stats.disabled },
    { name: 'OTHER', value: stats.total - stats.active - stats.disabled }
  ].filter(d => d.value > 0);

  return (
    <div className="flex-1 overflow-auto flex flex-col p-4 md:p-6 animate-in slide-in-from-bottom-2 duration-500 fade-in">
      <div className="flex flex-col gap-1 mb-4 md:mb-6">
        <h2 className="text-xl font-semibold tracking-tight text-white">{t('dashboard')}</h2>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 shrink-0 mb-6">
        <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-xl">
          <p className="text-xs text-zinc-500 uppercase font-medium mb-1">{t('totalAssigned')}</p>
          <div className="flex justify-between items-end">
            <h3 className="text-2xl font-semibold italic serif tracking-tight text-white">{stats.total}</h3>
            <Boxes className="w-5 h-5 text-zinc-600 mb-1" />
          </div>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-xl">
          <p className="text-xs text-zinc-500 uppercase font-medium mb-1">{t('liveAccounts')}</p>
          <div className="flex justify-between items-end">
             <h3 className="text-2xl font-semibold italic serif tracking-tight text-emerald-400">{stats.active}</h3>
             <Activity className="w-5 h-5 text-emerald-600 mb-1" />
          </div>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-xl">
          <p className="text-xs text-zinc-500 uppercase font-medium mb-1">{t('disabledAccs')}</p>
          <div className="flex justify-between items-end">
             <h3 className="text-2xl font-semibold italic serif tracking-tight text-rose-500">{stats.disabled}</h3>
             <ShieldAlert className="w-5 h-5 text-rose-600 mb-1" />
          </div>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-xl">
          <p className="text-xs text-zinc-500 uppercase font-medium mb-1">{t('outOfStockItems')}</p>
          <div className="flex justify-between items-end">
            <h3 className="text-2xl font-semibold italic serif tracking-tight text-blue-400">{stats.outOfStock}</h3>
            <CheckCircle className="w-5 h-5 text-blue-600 mb-1" />
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 min-h-[300px]">
        <div className="lg:col-span-2 bg-zinc-900 border border-zinc-800 p-4 rounded-xl flex flex-col shadow-xl">
          <h3 className="text-xs text-zinc-500 uppercase font-bold tracking-wider mb-4">{t('accountStatusDist')}</h3>
          <div className="flex-1 min-h-0">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={statusData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                <XAxis dataKey="name" stroke="#52525b" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="#52525b" fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip
                  cursor={{fill: '#27272a', opacity: 0.4}}
                  contentStyle={{ backgroundColor: '#09090b', borderColor: '#27272a', color: '#f4f4f5', borderRadius: '8px', fontSize: '12px' }}
                />
                <Bar dataKey="value" fill="#3b82f6" radius={[4, 4, 0, 0]} maxBarSize={50} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-xl flex flex-col shadow-xl">
          <h3 className="text-xs text-zinc-500 uppercase font-bold tracking-wider mb-4">{t('accountTypeSplit')}</h3>
          <div className="flex-1 min-h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={typeData}
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {typeData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: '#09090b', borderColor: '#27272a', color: '#f4f4f5', borderRadius: '8px', fontSize: '12px' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-center gap-4 mt-2 mb-2">
            {typeData.map((entry, index) => (
              <div key={entry.name} className="flex items-center gap-2 text-xs">
                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                <span className="text-zinc-400">{entry.name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
