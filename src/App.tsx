/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { UserStats, Verb, Achievement } from './types';
import { IRREGULAR_VERBS } from './data/verbs';
import { loadUserStats, recordVerbResult, saveUserStats } from './utils/storage';
import { TopBar } from './components/TopBar';
import { BottomNav, ActiveTab } from './components/BottomNav';
import { PracticeView } from './components/PracticeView';
import { LibraryView } from './components/LibraryView';
import { AchievementsView } from './components/AchievementsView';
import { AITutorView } from './components/AITutorView';
import { OfflineIndicator } from './components/OfflineIndicator';
import { soundEffects } from './utils/audio';

export default function App() {
  const [stats, setStats] = useState<UserStats>(loadUserStats);
  const [activeTab, setActiveTab] = useState<ActiveTab>('practice');
  const [tutorVerb, setTutorVerb] = useState<Verb | null>(null);
  const [recentAchievement, setRecentAchievement] = useState<Achievement | null>(null);

  // Sync stats when loaded
  useEffect(() => {
    const loaded = loadUserStats();
    setStats(loaded);
  }, []);

  const totalVerbs = IRREGULAR_VERBS.length;
  const masteredCount = Object.values(stats.verbsProgress).filter((p) => p.mastered).length;

  const handleToggleSound = () => {
    setStats((prev) => {
      const next = { ...prev, soundEnabled: !prev.soundEnabled };
      saveUserStats(next);
      return next;
    });
  };

  const handleRecordResult = (verbId: string, isCorrect: boolean, xp: number) => {
    const { updatedStats, newlyMastered, unlockedAchievements } = recordVerbResult(
      stats,
      verbId,
      isCorrect,
      xp
    );
    setStats(updatedStats);

    if (newlyMastered) {
      soundEffects.playLevelUp(stats.soundEnabled);
      try {
        confetti({
          particleCount: 60,
          spread: 70,
          origin: { y: 0.5 },
        });
      } catch {}
    }

    if (unlockedAchievements.length > 0) {
      setRecentAchievement(unlockedAchievements[0]);
      soundEffects.playLevelUp(stats.soundEnabled);
      try {
        confetti({
          particleCount: 100,
          spread: 80,
          origin: { y: 0.5 },
        });
      } catch {}
    }
  };

  const handleSelectVerbForTutor = (verb?: Verb) => {
    setTutorVerb(verb ?? null);
    setActiveTab('ai-tutor');
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col antialiased text-slate-800">
      {/* Offline Toast Banner */}
      <OfflineIndicator />

      {/* Persistent Game Top Bar */}
      <TopBar
        stats={stats}
        totalVerbs={totalVerbs}
        masteredCount={masteredCount}
        onToggleSound={handleToggleSound}
      />

      {/* Main Content Area */}
      <main className="flex-1">
        {activeTab === 'practice' && (
          <PracticeView
            stats={stats}
            onRecordResult={handleRecordResult}
            onNavigateToTutor={handleSelectVerbForTutor}
          />
        )}

        {activeTab === 'library' && (
          <LibraryView
            stats={stats}
            onSelectVerbForTutor={handleSelectVerbForTutor}
          />
        )}

        {activeTab === 'achievements' && (
          <AchievementsView stats={stats} />
        )}

        {activeTab === 'ai-tutor' && (
          <AITutorView initialVerb={tutorVerb} />
        )}
      </main>

      {/* Persistent Bottom Mobile Nav */}
      <BottomNav
        activeTab={activeTab}
        onChangeTab={(tab) => {
          if (tab !== 'ai-tutor') setTutorVerb(null);
          setActiveTab(tab);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
      />

      {/* Unlocked Achievement Celebratory Modal */}
      {recentAchievement && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fade-in">
          <div className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl text-center border-4 border-amber-300 animate-pop">
            <div className="w-20 h-20 rounded-3xl bg-amber-100 border-2 border-amber-300 text-4xl flex items-center justify-center mx-auto mb-3 shadow-inner">
              {recentAchievement.icon}
            </div>

            <span className="text-[11px] font-black uppercase tracking-widest text-amber-600 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200">
              ¡Nueva Insignia Desbloqueada!
            </span>

            <h3 className="text-2xl font-heading font-black text-slate-900 mt-2">
              {recentAchievement.title}
            </h3>

            <p className="mt-1 text-xs text-slate-600 leading-relaxed font-semibold">
              {recentAchievement.description}
            </p>

            <div className="my-3 py-2 bg-amber-50 rounded-xl border border-amber-200">
              <span className="text-base font-black text-amber-600">
                +{recentAchievement.xpReward} XP Extra
              </span>
            </div>

            <button
              onClick={() => setRecentAchievement(null)}
              className="w-full btn-tactile-amber py-3 rounded-2xl font-black text-sm shadow-md cursor-pointer"
            >
              ¡GENIAL, A CELEBRAR!
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
