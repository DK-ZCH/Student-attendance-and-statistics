import React from 'react';
import { WifiOff, Database } from 'lucide-react';
import { useOnlineStatus } from '../hooks/useOnlineStatus';

export const OfflineIndicator: React.FC = () => {
  const isOnline = useOnlineStatus();

  if (isOnline) {
    return (
      <span className="hidden md:inline-flex items-center gap-1 text-[11px] font-medium text-slate-500 bg-slate-100/80 px-2 py-0.5 rounded-full" title="数据直接保存在手机本地IndexedDB数据库，无需网络也可随时使用">
        <Database className="w-3 h-3 text-emerald-600" />
        <span>本地极速数据库</span>
      </span>
    );
  }

  return (
    <div className="fixed bottom-20 left-4 right-4 sm:left-auto sm:right-6 sm:bottom-6 z-50 flex items-center justify-between gap-3 rounded-xl bg-amber-500 px-4 py-2 text-xs font-semibold text-white shadow-xl animate-bounce">
      <div className="flex items-center gap-2">
        <WifiOff className="w-4 h-4" />
        <span>已进入离线状态 — 本地数据库全功能可用</span>
      </div>
      <span className="bg-amber-600/60 px-2 py-0.5 rounded text-[10px]">IndexedDB就绪</span>
    </div>
  );
};
