export type CategoryId =
  // Core arithmetic
  | 'addition' | 'subtraction' | 'multiplication' | 'division'
  | 'percentage' | 'power' | 'squareRoot' | 'fractions'
  // Algebra & higher
  | 'algebra' | 'geometry' | 'trigonometry' | 'logarithms' | 'sequences'
  // Number theory & mental math
  | 'numberTheory' | 'vedic'
  // Applied / everyday
  | 'clockTime' | 'calendarMath' | 'moneyMath' | 'financialMath' | 'converting'
  // Science & tech
  | 'statistics' | 'chemistry' | 'physics' | 'computing';

export type ProblemLevel = 1 | 2 | 3 | 4;
export type Lang = 'es' | 'en';
export type ColorTheme = 'default' | 'colorblind';

export interface AppSettings {
  language: Lang;
  symbolColors: boolean;
  colorTheme: ColorTheme;
}

export interface ProblemVisual {
  type: 'emoji-grid' | 'fraction-bar' | 'clock';
  emoji?: string;
  rows?: number; cols?: number;
  active?: number; total?: number;
  hours?: number; minutes?: number;
}

export interface Problem {
  id: string;
  category: CategoryId;
  question: string;
  answer: number;
  level: ProblemLevel;
  timeLimit: number;
  visual?: ProblemVisual;
  hint?: string;
}

export interface CategoryStats {
  attempts: number;
  correct: number;
  totalTimeMs: number;
  recentResults: boolean[];
  level: ProblemLevel;
  weight: number;
  baseTime: number;
  unlocked: boolean;
  lastPracticed: number;   // timestamp, 0 = never
  attemptsAtLevel: number; // resets on level change — used for sweet-spot detection
}

export interface DayRecord {
  date: string;    // "YYYY-MM-DD"
  xp: number;
  correct: number;
  total: number;
}

export interface UserProfile {
  id: string;
  name: string;
  avatar: string;
  categories: Record<CategoryId, CategoryStats>;
  totalSessions: number;
  totalProblems: number;
  xp: number;
  createdAt: number;
  lastPlayed: number;
  // Streak
  streak: number;
  bestStreak: number;
  lastPlayedDate: string; // "YYYY-MM-DD"
  // History
  history: DayRecord[];   // up to 90 days
}

export type Screen = 'profiles' | 'setup' | 'menu' | 'game' | 'stats' | 'summary' | 'settings';

export interface ProblemResult {
  problem: Problem;
  correct: boolean;
  timeUsedMs: number;
}

export interface SessionSummary {
  correct: number;
  wrong: number;
  xpGained: number;
  problems: ProblemResult[];
}
