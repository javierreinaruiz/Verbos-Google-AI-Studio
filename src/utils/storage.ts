import { UserStats, Achievement } from '../types';
import { ACHIEVEMENTS } from '../data/achievements';

const STORAGE_KEY = 'verbolingo_user_stats_v1';

function getTodayString(): string {
  const now = new Date();
  return now.toISOString().split('T')[0];
}

function getYesterdayString(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.toISOString().split('T')[0];
}

export const INITIAL_USER_STATS: UserStats = {
  xp: 0,
  streakDays: 1,
  lastActiveDate: getTodayString(),
  lives: 5,
  maxLives: 5,
  verbsProgress: {},
  unlockedAchievements: [],
  soundEnabled: true,
  dailyGoal: 50,
  todayXp: 0,
};

export function loadUserStats(): UserStats {
  if (typeof window === 'undefined') return INITIAL_USER_STATS;

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      saveUserStats(INITIAL_USER_STATS);
      return INITIAL_USER_STATS;
    }

    const data: UserStats = JSON.parse(raw);
    const today = getTodayString();
    const yesterday = getYesterdayString();

    // Reset todayXp if it's a new day
    if (data.lastActiveDate !== today) {
      data.todayXp = 0;
      data.lives = 5; // refill lives for new day

      if (data.lastActiveDate === yesterday) {
        data.streakDays += 1;
      } else {
        data.streakDays = 1;
      }
      data.lastActiveDate = today;
      saveUserStats(data);
    }

    return data;
  } catch (err) {
    console.error('Error loading stats from localStorage', err);
    return INITIAL_USER_STATS;
  }
}

export function saveUserStats(stats: UserStats): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stats));
  } catch (err) {
    console.error('Error saving stats to localStorage', err);
  }
}

export function recordVerbResult(
  stats: UserStats,
  verbId: string,
  isCorrect: boolean,
  xpEarned: number = 10
): { updatedStats: UserStats; newlyMastered: boolean; unlockedAchievements: Achievement[] } {
  const today = getTodayString();
  const currentProgress = stats.verbsProgress[verbId] || {
    verbId,
    correctCount: 0,
    incorrectCount: 0,
    consecutiveCorrect: 0,
    lastPracticed: Date.now(),
    mastered: false,
  };

  let newlyMastered = false;

  if (isCorrect) {
    currentProgress.correctCount += 1;
    currentProgress.consecutiveCorrect += 1;
    if (currentProgress.consecutiveCorrect >= 3 && !currentProgress.mastered) {
      currentProgress.mastered = true;
      newlyMastered = true;
    }
  } else {
    currentProgress.incorrectCount += 1;
    currentProgress.consecutiveCorrect = 0;
    // Remains unmastered if failed
  }

  currentProgress.lastPracticed = Date.now();

  const nextVerbsProgress = {
    ...stats.verbsProgress,
    [verbId]: currentProgress,
  };

  const nextXp = stats.xp + (isCorrect ? xpEarned : 2);
  const nextTodayXp = stats.todayXp + (isCorrect ? xpEarned : 2);
  const nextLives = isCorrect ? stats.lives : Math.max(0, stats.lives - 1);

  const intermediateStats: UserStats = {
    ...stats,
    xp: nextXp,
    todayXp: nextTodayXp,
    lives: nextLives,
    verbsProgress: nextVerbsProgress,
    lastActiveDate: today,
  };

  // Check achievements
  const newAchievements: Achievement[] = [];
  const currentUnlocked = new Set(stats.unlockedAchievements);

  ACHIEVEMENTS.forEach((ach) => {
    if (!currentUnlocked.has(ach.id)) {
      if (ach.current(intermediateStats) >= ach.target) {
        currentUnlocked.add(ach.id);
        newAchievements.push(ach);
      }
    }
  });

  let finalXp = intermediateStats.xp;
  if (newAchievements.length > 0) {
    newAchievements.forEach((a) => {
      finalXp += a.xpReward;
    });
  }

  const finalStats: UserStats = {
    ...intermediateStats,
    xp: finalXp,
    unlockedAchievements: Array.from(currentUnlocked),
  };

  saveUserStats(finalStats);

  return {
    updatedStats: finalStats,
    newlyMastered,
    unlockedAchievements: newAchievements,
  };
}

export function resetAllProgress(): UserStats {
  const fresh: UserStats = {
    ...INITIAL_USER_STATS,
    lastActiveDate: getTodayString(),
  };
  saveUserStats(fresh);
  return fresh;
}
