import React from 'react';
import { Gamepad2, BookOpen, Trophy, Sparkles } from 'lucide-react';

export type ActiveTab = 'practice' | 'library' | 'achievements' | 'ai-tutor';

interface BottomNavProps {
  activeTab: ActiveTab;
  onChangeTab: (tab: ActiveTab) => void;
  unclaimedAchievementsCount?: number;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  activeTab,
  onChangeTab,
  unclaimedAchievementsCount = 0,
}) => {
  const tabs = [
    {
      id: 'practice' as ActiveTab,
      label: 'Práctica',
      icon: Gamepad2,
      sub: 'Quiz y Retos',
    },
    {
      id: 'library' as ActiveTab,
      label: 'Biblioteca',
      icon: BookOpen,
      sub: '178 Verbos',
    },
    {
      id: 'achievements' as ActiveTab,
      label: 'Logros',
      icon: Trophy,
      sub: 'Medallas',
      badge: unclaimedAchievementsCount > 0 ? unclaimedAchievementsCount : undefined,
    },
    {
      id: 'ai-tutor' as ActiveTab,
      label: 'Tutor IA',
      icon: Sparkles,
      sub: 'Pensamiento',
    },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t-2 border-slate-200 px-2 py-1 shadow-lg pb-[max(0.35rem,env(safe-area-inset-bottom))]">
      <div className="max-w-md mx-auto grid grid-cols-4 gap-1">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => onChangeTab(tab.id)}
              className={`relative flex flex-col items-center justify-center py-1.5 px-1 rounded-2xl transition-all select-none ${
                isActive
                  ? 'text-emerald-700 font-extrabold bg-emerald-50/80 shadow-xs scale-102'
                  : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
              }`}
            >
              <div className="relative">
                <Icon
                  className={`w-5 h-5 sm:w-6 sm:h-6 transition-transform duration-200 ${
                    isActive ? 'scale-110 text-emerald-600' : 'text-slate-400'
                  }`}
                />
                {tab.badge && (
                  <span className="absolute -top-1.5 -right-2 bg-rose-500 text-white text-[10px] font-black w-4 h-4 rounded-full flex items-center justify-center animate-bounce">
                    {tab.badge}
                  </span>
                )}
              </div>
              <span className={`text-[11px] sm:text-xs mt-0.5 tracking-tight ${isActive ? 'font-black' : 'font-semibold'}`}>
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
