import type { CategoryId, CategoryStats, Problem, ProblemLevel, UserProfile } from '../types';
import { generateProblem } from './problems';

export function recentAccuracy(stats: CategoryStats, n?: number): number {
  const slice = n !== undefined ? stats.recentResults.slice(-n) : stats.recentResults;
  if (slice.length === 0) return 0.5;
  return slice.filter(Boolean).length / slice.length;
}

export function calcTimeLimit(stats: CategoryStats): number {
  const base = stats.baseTime;
  const acc  = recentAccuracy(stats);
  // Faster problems as accuracy improves — but don't compress below a floor
  if (acc > 0.90) return Math.max(Math.round(base * 0.50), 3);
  if (acc > 0.80) return Math.max(Math.round(base * 0.70), 4);
  if (acc > 0.70) return Math.max(Math.round(base * 0.85), 5);
  if (acc < 0.40) return Math.round(base * 1.40);
  if (acc < 0.55) return Math.round(base * 1.20);
  return base;
}

// ── Sweet-spot weight: mastered categories still appear, just less often ──────

export function calcWeight(stats: CategoryStats): number {
  const acc = recentAccuracy(stats);
  // Struggling → more frequent; mastered → slightly less but still present
  if (acc < 0.40) return 3.5;
  if (acc < 0.55) return 2.5;
  if (acc < 0.65) return 1.8;
  if (acc > 0.92) return 0.65; // mastered: still shows, just less
  if (acc > 0.82) return 0.80;
  return 1.0; // sweet spot: normal frequency
}

// ── Level advancement: fast at first, slow near sweet spot ───────────────────
//
// Sweet spot ≈ 70-80% accuracy. Near it, the brain is being challenged optimally
// → we don't rush out of it. Far above it → advance quickly.

function shouldAdvanceLevel(s: CategoryStats): boolean {
  const n   = s.recentResults.length;
  const acc = recentAccuracy(s);

  // Very easy: 5 attempts at 92%+ → fast track out
  if (n >= 5  && acc >= 0.92) return true;
  // Clearly above sweet spot: 8 attempts at 84%+
  if (n >= 8  && acc >= 0.84) return true;
  // Near sweet spot but consistently above: slow advance (15 attempts at 77%+)
  if (n >= 15 && acc >= 0.77) return true;

  return false;
}

function shouldDropLevel(s: CategoryStats): boolean {
  const n = s.recentResults.length;
  if (n < 5 || s.level <= 1) return false;
  // Clearly below: drop level to find a better floor
  return recentAccuracy(s) < 0.35;
}

// ── Neglect penalty ───────────────────────────────────────────────────────────
// Called on profile load and session start. Drops level for categories that
// haven't been practiced in a while. User must earn the level back by playing.

const NEGLECT_DAYS_PER_DROP = 5; // 1 level drop per 5 days of neglect

export function applyNeglectPenalties(profile: UserProfile): UserProfile {
  const now     = Date.now();
  const DAY_MS  = 86_400_000;
  let changed   = false;
  const cats    = { ...profile.categories };

  for (const [id, s] of Object.entries(cats) as [CategoryId, CategoryStats][]) {
    if (s.level <= 1 || s.lastPracticed === 0) continue;
    const daysSince = (now - s.lastPracticed) / DAY_MS;
    const drops = Math.min(Math.floor(daysSince / NEGLECT_DAYS_PER_DROP), s.level - 1);
    if (drops > 0) {
      cats[id] = {
        ...s,
        level: Math.max(1, s.level - drops) as ProblemLevel,
        recentResults: [],
        attemptsAtLevel: 0,
      };
      changed = true;
    }
  }

  return changed ? { ...profile, categories: cats } : profile;
}

// ── Category picker ───────────────────────────────────────────────────────────

export function pickCategory(profile: UserProfile, filter?: CategoryId[]): CategoryId {
  const all  = Object.entries(profile.categories) as [CategoryId, CategoryStats][];
  const pool = filter && filter.length > 0
    ? all.filter(([id]) => filter.includes(id))
    : all;

  if (pool.length === 0) return all[0][0];

  const total = pool.reduce((s, [, c]) => s + c.weight, 0);
  let r = Math.random() * total;
  for (const [id, stats] of pool) {
    r -= stats.weight;
    if (r <= 0) return id;
  }
  return pool[pool.length - 1][0];
}

export function nextProblem(profile: UserProfile, filter?: CategoryId[]): Problem {
  const cat   = pickCategory(profile, filter);
  const stats = profile.categories[cat];
  return generateProblem(cat, stats.level, calcTimeLimit(stats));
}

// ── Apply result ──────────────────────────────────────────────────────────────

export function applyResult(
  profile: UserProfile,
  category: CategoryId,
  correct: boolean,
  timeUsedMs: number,
): UserProfile {
  const cats = { ...profile.categories };
  const s    = { ...cats[category] };

  s.attempts++;
  s.attemptsAtLevel++;
  if (correct) s.correct++;
  s.totalTimeMs   += timeUsedMs;
  s.lastPracticed  = Date.now();
  // Keep a window of up to 20 recent results for flexible sweet-spot detection
  s.recentResults  = [...s.recentResults.slice(-19), correct];

  if (shouldAdvanceLevel(s) && s.level < 4) {
    s.level = (s.level + 1) as ProblemLevel;
    s.recentResults  = [];
    s.attemptsAtLevel = 0;
  } else if (shouldDropLevel(s) && s.level > 1) {
    s.level = (s.level - 1) as ProblemLevel;
    s.recentResults  = [];
    s.attemptsAtLevel = 0;
  }

  s.weight    = calcWeight(s);
  cats[category] = s;

  return {
    ...profile,
    categories: cats,
    totalProblems: profile.totalProblems + 1,
    xp: profile.xp + (correct ? 10 : 2),
    lastPlayed: Date.now(),
  };
}
