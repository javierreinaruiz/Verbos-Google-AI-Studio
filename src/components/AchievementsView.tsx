import React from 'react';
import {
  Trophy,
  Award,
  Flame,
  Zap,
  Star,
  CheckCircle2,
  Lock,
  Sparkles,
  Target,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { UserStats } from '../types';
import { ACHIEVEMENTS } from '../data/achievements';
import { soundEffects } from '../utils/audio';

interface AchievementsViewProps {
  stats: UserStats;
}

export const AchievementsView: React.FC<AchievementsViewProps> = ({ stats }) => {
  // Determine overall Player Title & Level based on total XP
  const getPlayerRank = (xp: number) => {
    if (xp >= 2500) return { title: 'Leyenda del Inglés', level: 5, color: 'from-amber-500 to-yellow-600', min: 2500, next: 5000 };
    if (xp >= 1200) return { title: 'Maestro de Verbos', level: 4, color: 'from-purple-500 to-indigo-600', min: 1200, next: 2500 };
    if (xp >= 500) return { title: 'Guerrero del Pasado', level: 3, color: 'from-blue-500 to-cyan-600', min: 500, next: 1200 };
    if (xp >= 150) return { title: 'Explorador Gramatical', level: 2, color: 'from-emerald-500 to-teal-600', min: 150, next: 500 };
    return { title: 'Novato Curioso', level: 1, color: 'from-slate-600 to-slate-800', min: 0, next: 150 };
  };

  const rank = getPlayerRank(stats.xp);
  const xpInLevel = stats.xp - rank.min;
  const xpRequiredForNext = rank.next - rank.min;
  const levelProgressPercent = Math.min(100, Math.round((xpInLevel / xpRequiredForNext) * 100));

  const unlockedCount = stats.unlockedAchievements.length;
  const totalAchievements = ACHIEVEMENTS.length;

  const handleCelebrateBadge = (title: string) => {
    soundEffects.playLevelUp(stats.soundEnabled);
    try {
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.7 },
      });
    } catch {}
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-5 space-y-5 pb-28">
      {/* Player Level & Profile Card */}
      <div className={`bg-linear-to-br ${rank.color} rounded-3xl p-5 sm:p-6 text-white shadow-xl relative overflow-hidden`}>
        <div className="flex items-center justify-between gap-4 relative z-10">
          <div className="flex items-center gap-3.5">
            <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center font-black text-2xl border-2 border-white/30 shadow-inner">
              👑
            </div>
            <div>
              <span className="text-[11px] font-black uppercase tracking-widest bg-white/25 px-2.5 py-0.5 rounded-full border border-white/20">
                Nivel {rank.level}
              </span>
              <h2 className="text-xl sm:text-2xl font-heading font-black mt-1">
                {rank.title}
              </h2>
              <p className="text-xs text-white/80 font-semibold">
                {stats.xp} XP totales acumulados
              </p>
            </div>
          </div>

          <div className="text-right">
            <p className="text-[10px] uppercase font-bold text-white/80">Racha actual</p>
            <p className="text-2xl font-black flex items-center justify-end gap-1">
              <Flame className="w-6 h-6 fill-amber-300 text-amber-300 animate-pulse" />
              {stats.streakDays} <span className="text-xs font-normal">días</span>
            </p>
          </div>
        </div>

        {/* Level XP Progress Bar */}
        <div className="mt-5 space-y-1 relative z-10">
          <div className="flex items-center justify-between text-xs font-bold text-white/90">
            <span>Progreso al siguiente nivel</span>
            <span>{levelProgressPercent}%</span>
          </div>
          <div className="h-3.5 bg-black/20 rounded-full overflow-hidden p-0.5 border border-white/20">
            <div
              className="h-full bg-white rounded-full transition-all duration-500 shadow-xs"
              style={{ width: `${levelProgressPercent}%` }}
            />
          </div>
        </div>
      </div>

      {/* Daily XP Goal Card */}
      <div className="bg-white rounded-3xl p-5 border-2 border-slate-200 shadow-xs flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center font-bold">
            <Target className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-heading font-black text-sm sm:text-base text-slate-800">
              Meta Diaria de Práctica
            </h3>
            <p className="text-xs text-slate-500 font-medium">
              {stats.todayXp} / {stats.dailyGoal} XP conseguidos hoy
            </p>
          </div>
        </div>

        <div className="text-right">
          <span
            className={`text-xs font-black px-3 py-1 rounded-full ${
              stats.todayXp >= stats.dailyGoal
                ? 'bg-emerald-100 text-emerald-800'
                : 'bg-slate-100 text-slate-600'
            }`}
          >
            {stats.todayXp >= stats.dailyGoal ? '¡Completada! 🎉' : `${stats.dailyGoal - stats.todayXp} XP restantes`}
          </span>
        </div>
      </div>

      {/* Achievements Header */}
      <div className="flex items-center justify-between px-1">
        <div>
          <h3 className="text-lg font-heading font-black text-slate-800 flex items-center gap-2">
            <Trophy className="w-5 h-5 text-amber-500" />
            Insignias y Medallas Desbloqueables
          </h3>
          <p className="text-xs text-slate-500 font-medium">
            Desbloquea medallas dominando verbos y sumando rachas.
          </p>
        </div>

        <span className="text-xs font-black text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-xl">
          {unlockedCount} / {totalAchievements}
        </span>
      </div>

      {/* Achievements Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {ACHIEVEMENTS.map((ach) => {
          const isUnlocked = stats.unlockedAchievements.includes(ach.id);
          const currentVal = ach.current(stats);
          const progressPercent = Math.min(100, Math.round((currentVal / ach.target) * 100));

          return (
            <div
              key={ach.id}
              onClick={() => isUnlocked && handleCelebrateBadge(ach.title)}
              className={`p-4 rounded-3xl border-2 transition-all shadow-xs flex items-start gap-3.5 ${
                isUnlocked
                  ? 'bg-white border-amber-300 ring-2 ring-amber-400/20 cursor-pointer hover:scale-101'
                  : 'bg-slate-50 border-slate-200 opacity-80'
              }`}
            >
              {/* Badge Icon */}
              <div
                className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shrink-0 border-2 ${
                  isUnlocked
                    ? 'bg-amber-100 border-amber-200 shadow-sm'
                    : 'bg-slate-200 border-slate-300 grayscale'
                }`}
              >
                {ach.icon}
              </div>

              {/* Details */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-1">
                  <h4 className="font-heading font-black text-sm text-slate-900 truncate">
                    {ach.title}
                  </h4>
                  {isUnlocked ? (
                    <span className="text-[10px] font-black text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded-md flex items-center gap-0.5">
                      <CheckCircle2 className="w-3 h-3" /> Desbloqueado
                    </span>
                  ) : (
                    <span className="text-[10px] font-bold text-slate-400 bg-slate-200 px-1.5 py-0.5 rounded-md flex items-center gap-0.5">
                      <Lock className="w-3 h-3" /> Bloqueado
                    </span>
                  )}
                </div>

                <p className="text-xs text-slate-500 font-medium mt-0.5 leading-snug">
                  {ach.description}
                </p>

                {/* Progress bar or XP Reward */}
                <div className="mt-2.5 flex items-center justify-between gap-2">
                  <div className="flex-1 h-2 bg-slate-200 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${
                        isUnlocked ? 'bg-amber-500' : 'bg-slate-400'
                      }`}
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>

                  <span className="text-[11px] font-black text-amber-600 whitespace-nowrap">
                    +{ach.xpReward} XP
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
