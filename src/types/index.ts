export type VerbLevel = 1 | 2 | 3; // 1: Básico, 2: Intermedio, 3: Avanzado

export type VerbCategory =
  | '3-same' // e.g. hit-hit-hit, cut-cut-cut
  | 'past-participle-same' // e.g. buy-bought-bought, spend-spent-spent
  | 'inf-participle-same' // e.g. come-came-come, run-ran-run
  | '3-different'; // e.g. write-wrote-written, see-saw-seen

export interface Verb {
  id: string;
  infinitive: string;
  pastSimple: string;
  pastParticiple: string;
  spanish: string;
  level: VerbLevel;
  category?: VerbCategory;
  exampleEn: string;
  exampleEs: string;
}

export type QuizMode =
  | 'mixed' // smart mixed workout
  | 'multiple-choice' // choose correct forms
  | 'typing' // type past and participle
  | 'fill-in-blank' // fill in blank in sentence
  | 'flashcard'; // rapid review mode

export interface VerbProgress {
  verbId: string;
  correctCount: number;
  incorrectCount: number;
  consecutiveCorrect: number;
  lastPracticed: number;
  mastered: boolean; // true if consecutiveCorrect >= 3
}

export interface UserStats {
  xp: number;
  streakDays: number;
  lastActiveDate: string; // YYYY-MM-DD
  lives: number; // 5 max lives for gamification
  maxLives: number;
  verbsProgress: Record<string, VerbProgress>;
  unlockedAchievements: string[];
  soundEnabled: boolean;
  dailyGoal: number; // e.g. 50 XP
  todayXp: number;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  target: number;
  current: (stats: UserStats) => number;
  xpReward: number;
}
