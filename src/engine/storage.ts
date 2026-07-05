import type { UserProfile, CategoryId, CategoryStats, AppSettings, DayRecord, SessionSummary } from '../types';

const PROFILES_KEY  = 'mathbrain_profiles_v2';
const ACTIVE_KEY    = 'mathbrain_active_v2';
const TRAINING_KEY  = 'mathbrain_training_v1';
const SETTINGS_KEY  = 'mathbrain_settings_v1';

// ── Category stats factory ────────────────────────────────────────────────────

const stat = (baseTime: number): CategoryStats => ({
  attempts: 0, correct: 0, totalTimeMs: 0,
  recentResults: [], level: 1, weight: 1.0,
  baseTime, unlocked: true,
  lastPracticed: 0,
  attemptsAtLevel: 0,
});

const DEFAULT_CATEGORIES = (): UserProfile['categories'] => ({
  // Core arithmetic
  addition:       stat(10),
  subtraction:    stat(12),
  multiplication: stat(15),
  division:       stat(20),
  percentage:     stat(25),
  power:          stat(20),
  squareRoot:     stat(30),
  fractions:      stat(25),
  // Algebra & higher
  algebra:        stat(30),
  geometry:       stat(25),
  trigonometry:   stat(35),
  logarithms:     stat(35),
  sequences:      stat(30),
  // Number theory
  numberTheory:   stat(25),
  vedic:          stat(35),
  // Applied
  clockTime:      stat(20),
  calendarMath:   stat(20),
  moneyMath:      stat(25),
  financialMath:  stat(30),
  converting:     stat(20),
  // Science & tech
  statistics:     stat(30),
  chemistry:      stat(30),
  physics:        stat(35),
  computing:      stat(30),
});

function genId(): string {
  return `${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}

export const createDefaultProfile = (name: string, avatar = '🧠'): UserProfile => ({
  id: genId(),
  name,
  avatar,
  categories: DEFAULT_CATEGORIES(),
  totalSessions: 0,
  totalProblems: 0,
  xp: 0,
  createdAt: Date.now(),
  lastPlayed: Date.now(),
  streak: 0,
  bestStreak: 0,
  lastPlayedDate: '',
  history: [],
});

// ── Multi-profile storage ─────────────────────────────────────────────────────

export const loadProfiles = (): UserProfile[] => {
  try {
    const raw = localStorage.getItem(PROFILES_KEY);
    if (!raw) return migrateOldProfile();
    const profiles = JSON.parse(raw) as UserProfile[];
    const defaults = DEFAULT_CATEGORIES();
    return profiles.map(p => {
      for (const id of Object.keys(defaults) as CategoryId[]) {
        if (!p.categories[id]) p.categories[id] = defaults[id];
        else {
          p.categories[id].unlocked = true;
          if (p.categories[id].lastPracticed === undefined) p.categories[id].lastPracticed = 0;
          if (p.categories[id].attemptsAtLevel === undefined) p.categories[id].attemptsAtLevel = 0;
        }
      }
      if (!p.id) p.id = genId();
      if (!p.avatar) p.avatar = '🧠';
      if (p.streak === undefined)         p.streak = 0;
      if (p.bestStreak === undefined)     p.bestStreak = 0;
      if (!p.lastPlayedDate)              p.lastPlayedDate = '';
      if (!p.history)                     p.history = [];
      return p;
    });
  } catch { return []; }
};

function migrateOldProfile(): UserProfile[] {
  try {
    const raw = localStorage.getItem('mathbrain_v1');
    if (!raw) return [];
    const old = JSON.parse(raw) as Omit<UserProfile, 'id' | 'avatar'>;
    if (!old.name) return [];
    const migrated: UserProfile = {
      ...createDefaultProfile(old.name),
      ...old,
      id: genId(),
      avatar: '🧠',
      categories: { ...DEFAULT_CATEGORIES(), ...old.categories },
      streak: 0, bestStreak: 0, lastPlayedDate: '', history: [],
    };
    Object.keys(migrated.categories).forEach(k => {
      migrated.categories[k as CategoryId].unlocked = true;
    });
    localStorage.removeItem('mathbrain_v1');
    saveProfiles([migrated]);
    return [migrated];
  } catch { return []; }
}

export const saveProfiles = (profiles: UserProfile[]): void => {
  localStorage.setItem(PROFILES_KEY, JSON.stringify(profiles));
};

export const loadActiveId = (): string | null => localStorage.getItem(ACTIVE_KEY);
export const saveActiveId = (id: string): void => localStorage.setItem(ACTIVE_KEY, id);

export const addProfile = (profiles: UserProfile[], p: UserProfile): UserProfile[] => {
  const next = [...profiles, p];
  saveProfiles(next);
  return next;
};

export const updateProfile = (profiles: UserProfile[], updated: UserProfile): UserProfile[] => {
  const next = profiles.map(p => p.id === updated.id ? updated : p);
  saveProfiles(next);
  return next;
};

export const deleteProfile = (profiles: UserProfile[], id: string): UserProfile[] => {
  const next = profiles.filter(p => p.id !== id);
  saveProfiles(next);
  if (loadActiveId() === id) localStorage.removeItem(ACTIVE_KEY);
  return next;
};

export const resetProfileProgress = (profiles: UserProfile[], id: string): UserProfile[] => {
  const profile = profiles.find(p => p.id === id);
  if (!profile) return profiles;
  const reset: UserProfile = {
    ...createDefaultProfile(profile.name, profile.avatar),
    id: profile.id,
    createdAt: profile.createdAt,
  };
  return updateProfile(profiles, reset);
};

// ── Streak & history helpers ──────────────────────────────────────────────────

function toDateStr(ts = Date.now()): string {
  return new Date(ts).toISOString().slice(0, 10);
}

export function applySessionToProfile(profile: UserProfile, summary: SessionSummary): UserProfile {
  const today = toDateStr();
  const yesterday = toDateStr(Date.now() - 86_400_000);

  // Streak
  let { streak, bestStreak } = profile;
  if (profile.lastPlayedDate !== today) {
    streak = profile.lastPlayedDate === yesterday ? streak + 1 : 1;
    bestStreak = Math.max(bestStreak, streak);
  }

  // Day record
  const history = [...profile.history];
  const idx = history.findIndex(d => d.date === today);
  const rec: DayRecord = {
    date: today,
    xp: summary.xpGained,
    correct: summary.correct,
    total: summary.correct + summary.wrong,
  };
  if (idx >= 0) {
    history[idx] = {
      date: today,
      xp: history[idx].xp + rec.xp,
      correct: history[idx].correct + rec.correct,
      total: history[idx].total + rec.total,
    };
  } else {
    history.push(rec);
  }

  return {
    ...profile,
    streak,
    bestStreak,
    lastPlayedDate: today,
    history: history.slice(-90),
    totalSessions: profile.totalSessions + 1,
  };
}

// ── Training selection ────────────────────────────────────────────────────────

export const loadTrainingSelection = (profileId: string): CategoryId[] | null => {
  try {
    const raw = localStorage.getItem(`${TRAINING_KEY}_${profileId}`);
    return raw ? (JSON.parse(raw) as CategoryId[]) : null;
  } catch { return null; }
};

export const saveTrainingSelection = (profileId: string, cats: CategoryId[]): void => {
  localStorage.setItem(`${TRAINING_KEY}_${profileId}`, JSON.stringify(cats));
};

// ── Settings ──────────────────────────────────────────────────────────────────

const SETTINGS_DEFAULTS: AppSettings = {
  language: 'es',
  symbolColors: true,
  colorTheme: 'default',
};

export const loadSettings = (): AppSettings => {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    return raw ? { ...SETTINGS_DEFAULTS, ...JSON.parse(raw) } : SETTINGS_DEFAULTS;
  } catch { return SETTINGS_DEFAULTS; }
};

export const saveSettings = (s: AppSettings): void => {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(s));
};

// ── Export / Import ───────────────────────────────────────────────────────────

export const exportProfile = (p: UserProfile): void => {
  const blob = new Blob([JSON.stringify(p, null, 2)], { type: 'application/json' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href = url;
  a.download = `mathbrain_${p.name.replace(/\s+/g, '_')}.json`;
  a.click();
  URL.revokeObjectURL(url);
};

export const importProfileFromFile = (file: File): Promise<UserProfile> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = e => {
      try {
        const p = JSON.parse(e.target?.result as string) as UserProfile;
        if (!p.name || !p.categories) throw new Error();
        if (!p.id) p.id = genId();
        if (!p.avatar) p.avatar = '🧠';
        resolve(p);
      } catch { reject(new Error('Archivo inválido')); }
    };
    reader.readAsText(file);
  });
