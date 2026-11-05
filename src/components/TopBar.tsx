import React, { useState } from 'react';
import { Flame, Zap, Award, Volume2, VolumeX, Heart, Download, HelpCircle } from 'lucide-react';
import { UserStats } from '../types';
import { usePWAInstall } from '../hooks/usePWAInstall';

interface TopBarProps {
  stats: UserStats;
  totalVerbs: number;
  masteredCount: number;
  onToggleSound: () => void;
  onOpenHowToPlay?: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({
  stats,
  totalVerbs,
  masteredCount,
  onToggleSound,
}) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSModal, setShowIOSModal] = useState(false);

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b-2 border-slate-200 shadow-xs px-3 sm:px-6 py-2.5">
      <div className="max-w-4xl mx-auto flex items-center justify-between gap-2">
        {/* Brand / Logo */}
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl bg-linear-to-br from-emerald-500 to-emerald-700 flex items-center justify-center text-white shadow-xs font-heading font-black text-xl tracking-tighter">
            V
          </div>
          <div className="hidden sm:block">
            <h1 className="text-base font-black tracking-tight text-slate-800 leading-none">
              Verbo<span className="text-emerald-600">Lingo</span>
            </h1>
            <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
              178 Verbos Irregulares
            </p>
          </div>
        </div>

        {/* Real-time Game Stats */}
        <div className="flex items-center gap-1.5 sm:gap-3">
          {/* Streak */}
          <div
            className="flex items-center gap-1 bg-amber-50 border border-amber-200 px-2 sm:px-2.5 py-1 rounded-full text-xs sm:text-sm font-bold text-amber-600 shadow-xs"
            title={`Racha de práctica: ${stats.streakDays} días`}
          >
            <Flame className="w-4 h-4 fill-amber-500 text-amber-500 animate-pulse" />
            <span>{stats.streakDays}</span>
          </div>

          {/* XP Points */}
          <div
            className="flex items-center gap-1 bg-blue-50 border border-blue-200 px-2 sm:px-2.5 py-1 rounded-full text-xs sm:text-sm font-bold text-blue-600 shadow-xs"
            title={`Puntos de experiencia acumulados: ${stats.xp} XP`}
          >
            <Zap className="w-4 h-4 fill-blue-500 text-blue-500" />
            <span>{stats.xp}</span>
          </div>

          {/* Mastered Verbs Counter */}
          <div
            className="flex items-center gap-1 bg-emerald-50 border border-emerald-200 px-2 sm:px-2.5 py-1 rounded-full text-xs sm:text-sm font-bold text-emerald-700 shadow-xs"
            title={`Verbos dominados: ${masteredCount} de ${totalVerbs}`}
          >
            <Award className="w-4 h-4 text-emerald-600" />
            <span>
              {masteredCount}
              <span className="text-emerald-500/70 font-normal text-[11px]">/{totalVerbs}</span>
            </span>
          </div>

          {/* Lives / Hearts */}
          <div
            className="hidden xs:flex items-center gap-1 bg-rose-50 border border-rose-200 px-2 py-1 rounded-full text-xs sm:text-sm font-bold text-rose-600 shadow-xs"
            title={`Vidas restantes: ${stats.lives}/${stats.maxLives}`}
          >
            <Heart className="w-3.5 h-3.5 fill-rose-500 text-rose-500" />
            <span>{stats.lives}</span>
          </div>
        </div>

        {/* Right Actions: Sound & PWA Install */}
        <div className="flex items-center gap-1 sm:gap-2">
          {/* In-App PWA Install Button */}
          {!isInstalled && isInstallable && (
            <button
              onClick={install}
              className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg shadow-xs transition-all active:scale-95"
              title="Instalar aplicación en pantalla de inicio"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Instalar</span>
            </button>
          )}

          {!isInstalled && isIOS && (
            <button
              onClick={() => setShowIOSModal(true)}
              className="flex items-center gap-1 px-2 py-1 text-xs font-bold border border-slate-300 text-slate-700 hover:bg-slate-50 rounded-lg shadow-xs transition-all"
              title="Instalar en iPhone / iPad"
            >
              <Download className="w-3.5 h-3.5 text-slate-600" />
              <span className="text-[11px]">iOS</span>
            </button>
          )}

          {/* Sound Toggle */}
          <button
            onClick={onToggleSound}
            className={`p-1.5 sm:p-2 rounded-xl border-2 transition-all ${
              stats.soundEnabled
                ? 'bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100'
                : 'bg-slate-100 border-slate-200 text-slate-400 hover:bg-slate-200'
            }`}
            title={stats.soundEnabled ? 'Silenciar efectos' : 'Activar sonido'}
            aria-label="Alternar sonido"
          >
            {stats.soundEnabled ? (
              <Volume2 className="w-4 h-4" />
            ) : (
              <VolumeX className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>

      {/* iOS Safari Installation Guide Modal */}
      {showIOSModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fade-in">
          <div className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-2xl border-2 border-emerald-100">
            <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-3">
              <Download className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-black text-center text-slate-800">
              Instala VerboLingo en iOS
            </h3>
            <p className="mt-2 text-xs sm:text-sm text-slate-600 text-center leading-relaxed">
              Disfruta de la experiencia a pantalla completa y sin conexión a internet:
            </p>
            <div className="mt-3.5 bg-slate-50 rounded-xl p-3 border border-slate-200 text-xs text-slate-700 space-y-2">
              <p className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-emerald-600 text-white font-bold text-[11px] flex items-center justify-center shrink-0">1</span>
                <span>Toca el botón <strong>Compartir</strong> en la barra de Safari.</span>
              </p>
              <p className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-emerald-600 text-white font-bold text-[11px] flex items-center justify-center shrink-0">2</span>
                <span>Baja y selecciona <strong>«Agregar a Inicio»</strong>.</span>
              </p>
            </div>
            <button
              onClick={() => setShowIOSModal(false)}
              className="mt-4 w-full py-2.5 rounded-xl bg-emerald-600 text-white font-bold text-sm shadow-xs hover:bg-emerald-700 active:scale-98 transition"
            >
              ¡Entendido!
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
