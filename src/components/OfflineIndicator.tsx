import React from 'react';
import { WifiOff } from 'lucide-react';
import { useOnlineStatus } from '../hooks/useOnlineStatus';

export const OfflineIndicator: React.FC = () => {
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <div className="fixed top-14 left-4 right-4 sm:left-auto sm:right-4 z-50 flex items-center gap-2 rounded-xl bg-amber-500 px-3.5 py-2 text-xs font-bold text-white shadow-xl animate-fade-in border border-amber-600">
      <WifiOff className="w-4 h-4 shrink-0" />
      <span>Modo Sin Conexión — Todos los 178 verbos y el quiz funcionan 100% offline.</span>
    </div>
  );
};
