# MathBrain — Full Technical Summary (EN-GB)

## What It Is

Adaptive mathematics training app that runs entirely in the browser (no backend), uses `localStorage` for persistence. Stack: **React 19 + TypeScript + Vite 8 + Tailwind CSS v4**.

Repository: https://github.com/ArchBlackKitten/MathBrain

---

## Architecture

```
src/
  components/
    App.tsx           — global navigation, screen routing
    Game.tsx          — game engine, timer, distraction prompt
    Menu.tsx          — Free Practice / Focused tabs, recommendations
    Stats.tsx         — activity chart, streak, 90-day history
    Summary.tsx       — end-of-session summary screen
    ProfileSelect.tsx — profile management
    ProfileSetup.tsx  — create new profile
    SettingsPanel.tsx — language, colour theme, sounds
    VisualDisplay.tsx — emoji grids, fraction bar, clock SVG
    ColoredMath.tsx   — colour-codes maths symbols
    Abacus.tsx        — interactive abacus support tool
  engine/
    adaptive.ts       — sweet-spot algorithm, weights, recommendations, neglect penalties
    problems.ts       — 27 problem generators (one per category × 4 levels) + mkq() helper
    storage.ts        — localStorage, profiles, session history
    meta.ts           — labels, icons, colours, CATEGORY_SECTIONS
    settings.ts       — settings persistence
  types/index.ts      — TypeScript types (CategoryId, UserProfile, Problem, etc.)
  i18n.ts             — Spanish / English
```

---

## 27 Maths Categories (6 Sections)

### Arithmetic
- Addition, Subtraction, Multiplication, Division

### Numbers
- Percentage, Fractions, **Decimals** (new), **Negatives** (new), Powers, Square Root

### Algebra & Analysis
- Algebra, **Proportionality** (new, includes rule of three), Geometry, Trigonometry, Logarithms, Sequences

### Theory & Mental
- Number Theory (primes, GCD/LCM, Roman numerals, divisibility rules, modular arithmetic)
- Vedic Mental Maths

### Everyday Use
- Clock Time, Calendar, Money & Tips, Finance & Investment, Measurements & Units

### Science & Technology
- Statistics & Probability, Chemistry, Physics, Computing

---

## Key Category Content

**Computing** — binary↔decimal, octal, hexadecimal, bytes/KB/MB, bit shifts (<<, >>), ASCII (A=65), AND/OR/XOR, two's complement, Boolean algebra

**Measurements** — metric, imperial (kg↔lbs, km↔miles, inches, gallons), °C↔°F, km/h↔m/s, d=v×t

**Physics** — kinematics (d,v,t), free fall, acceleration, F=ma, energy (Ek, Ep), thermodynamics, electricity (Ohm, P=VI), Kepler's laws, orbital velocity, escape velocity

**Geometry** — perimeters, areas, triangle angles (sum 180°), supplementary/complementary angles, interior angles of regular polygons, axes of symmetry, circle circumference/area, volume, Pythagoras' theorem, slope between two points

**Proportionality** — direct ratio, rule of three with context (price, speed, recipe, map), inverse proportionality (workers×days), percentage change, a/b=c/d, scales, exchange rates

**Decimals** — addition/subtraction, place value (tenths, hundredths), decimal×integer multiplication, decimal division, fractions↔decimals, recurring decimals

**Negatives** — number line, sign rules, multiplication/division with negatives, powers of negatives, absolute value, order of operations

---

## Adaptive Engine (adaptive.ts)

### Sweet-spot algorithm
The goal is to keep the user in the zone where they fail just enough to learn optimally (70–80% accuracy).

```
Level advances fast:   ≥92% in  5 attempts at new level
Level advances normal: ≥84% in  8 attempts
Level advances slow:   ≥77% in 15 attempts  ← sweet spot — no rush
Level drops:           <35% in  5 attempts
```

### Category selection weights
Categories you need most appear more frequently:
```
acc < 40%  → weight 3.5× (appears much more often)
acc < 55%  → weight 2.5×
acc < 65%  → weight 1.8×
acc > 92%  → weight 0.65× (mastered, but still appears)
acc > 82%  → weight 0.80×
in range   → weight 1.0×  (normal)
```

### Progressive complexity (`calcComplexity`)
A separate axis from level (0 → 3). Once the user has mastered the current level, the
same level starts generating longer problems: more terms, parentheses, exponents (`8²`,
`4³`) and roots (`√49`).
```
acc ≥ 75% with 3+ attempts at the level   → complexity 1  (+1 term)
acc ≥ 85% with 6+ attempts                → complexity 2  (parentheses, exponents)
acc ≥ 90% with 10+ attempts               → complexity 3  (roots, long expressions)
```
Implemented in `buildExpression` (problems.ts) for addition, subtraction,
multiplication, division, decimals and negatives. The answer is correct by construction.

### Adaptive time limit (proportional to the problem)
Time is no longer fixed — it is derived from the actual problem. `accMultiplier` gives
the accuracy factor, and `generateProblem` computes:
`time = max(3, round((base + 4s × extra_terms) × accMultiplier))`
```
acc > 90%  → ×0.50 (more challenging)
acc > 80%  → ×0.70
acc > 70%  → ×0.85
acc < 40%  → ×1.40 (more lenient)
acc < 55%  → ×1.20
```

### Fatigue detection (session-scoped, in Game.tsx)
A rolling log of the last 5 results with `ease` = the category's lifetime mastery. If
the user starts failing categories they normally master, `fatigue` (0–1) rises and
`calcComplexity` uses it to **lower complexity** (`c -= round(fatigue × 2)`), easing the
pace. Not persisted — it is ephemeral session state.

### Neglect penalty
If a category hasn't been practised in ≥5 days and is at level >1: drops one level automatically on app load. In practice mode, the user cannot manually override this level.

### Smart recommendation system (`getCategoryPriorities`)
Each category receives a score from 0–1:
```
score = neglect_score    × 0.35  (days without practice / 7, capped at 1)
      + struggle_score   × 0.40  (how far below 70% accuracy)
      + new_score        × 0.20  (never practised)
      + sweet_spot_score × 0.05  (currently in optimal zone)
```
Top 5–6 categories are shown as recommendations in Free Practice.

---

## Practice Modes

### Free Practice (🎲)
- App chooses categories and levels via the adaptive algorithm
- Shows "App recommends" panel with the most urgent categories
- Level is not shown during the game — the system is internal
- 10 problems per session

### Focused Practice (🎯)
- User selects which categories to practise
- Can enable/disable entire sections at once
- Algorithm still adapts the level within the chosen categories
- Sticky bottom button with selected category count

### Relax (🧘)
- No timer, no scoring pressure, endless session
- **Skip** button to pass any problem
- **Does not mutate stats or level** (pure practice) — never calls `applyResult`
- Categories are chosen the same way as in Focused
- `GameMode = 'practice' | 'single' | 'relax'`

### Single Category
- Direct click on a category from the menu
- User can change the level manually (selector visible)
- Useful for exploring or practising something specific without restrictions

---

## User Mechanics

- **Personal scratchpad** (📝) inside the game: two modes — **grid** (5×9 cells to align
  columns and work by hand) and **free notes**. Clears on the next problem and is never
  your answer
- **Daily streak** Duolingo-style with personal best (🔥)
- **XP**: +10 per correct answer, +2 per incorrect (Relax mode adds no profile XP)
- **90-day activity history** with XP/day
- **Bar chart** of last 30 days + projected XP over next 30 days
- **Distraction prompt**: if time expires with no answer, asks "Were you distracted?" — key A (yes, doesn't count) / N (no, counts as wrong)
- **Multiple profiles** with emoji avatars
- **Export/Import** of profiles as JSON
- **Abacus** as a support tool during the game

---

## Colour-Blind Palettes

The app has a built-in colour-blind mode in Settings (⚙). Signal colour mapping for each vision type:

| State | Normal | App CB mode | Protanopia | Deuteranopia | Tritanopia |
|---|---|---|---|---|---|
| Correct | Emerald `#10b981` | Sky `#0ea5e9` | Sky `#0ea5e9` | Blue `#0284c7` | Emerald `#10b981` |
| Wrong | Rose `#f43f5e` | Amber `#f59e0b` | Orange `#ea6900` | Orange `#ea6900` | Rose `#e11d48` |
| Warning | Amber `#f59e0b` | Fuchsia `#e879f9` | Amber `#f59e0b` | Warm amber `#d97706` | Red `#dc2626` |
| Category | Violet `#7c3aed` | Violet `#7c3aed` | Indigo `#4f46e5` | Indigo `#4f46e5` | Purple `#7e22ce` |

For achromatopsia (full monochromacy): rely on shape, size, and position rather than colour; use strong contrast (dark text on light ground, border outlines on all interactive elements).

---

## Pending Features (Not Yet Implemented)

**Step-by-step explanations + animated visuals** when a wrong answer is given (Khan Academy style).

Planned architecture:
- Add `steps?: string[]` and `explainVisual?: ExplainVisual` to `Problem` type in `types/index.ts`
- `ExplainVisual` types: `bar` (percentage/tips), `fraction`, `dotgrid` (multiplication), `numberline` (addition/subtraction), `split` (bill-splitting)
- Component `ExplainPanel.tsx`: slide-up modal with animated visual + steps appearing one by one
- Generators for the main categories would include `steps` arrays
- In `Game.tsx`: wrong answers don't auto-advance, they wait for the user to tap "Continue →"

**Khan Academy-style mastery labels**
Replace visible level numbers (1/2/3/4) in Single mode with mastery states:
*Needs Practice → Familiar → Proficient → Mastered*

---

## Key TypeScript Types

```typescript
export type CategoryId = 'addition' | 'subtraction' | 'multiplication' | 'division'
  | 'percentage' | 'power' | 'squareRoot' | 'fractions' | 'decimals' | 'negatives'
  | 'algebra' | 'proportionality' | 'geometry' | 'trigonometry' | 'logarithms' | 'sequences'
  | 'numberTheory' | 'vedic'
  | 'clockTime' | 'calendarMath' | 'moneyMath' | 'financialMath' | 'converting'
  | 'statistics' | 'chemistry' | 'physics' | 'computing';

export type ProblemLevel = 1 | 2 | 3 | 4;

export interface CategoryStats {
  attempts: number; correct: number; totalTimeMs: number;
  recentResults: boolean[];   // sliding window of 20
  level: ProblemLevel;
  weight: number;             // calculated by calcWeight()
  baseTime: number;           // base time in seconds
  unlocked: boolean;
  lastPracticed: number;      // timestamp ms, 0 = never
  attemptsAtLevel: number;    // resets on level change
}

export interface UserProfile {
  id: string; name: string; avatar: string;
  categories: Record<CategoryId, CategoryStats>;
  totalSessions: number; totalProblems: number; xp: number;
  createdAt: number; lastPlayed: number;
  streak: number; bestStreak: number; lastPlayedDate: string;
  history: DayRecord[];  // up to 90 days
}
```

---

## Practice Session Flow

1. User picks a mode (Free / Focused / Single)
2. `nextProblem(profile, filter?)` selects category by weight, generates problem at the current level with adaptive time
3. User answers (or time runs out)
4. If time expires with no answer → distraction prompt (A/N)
5. `applyResult()` updates: attempts, correct, recentResults, lastPracticed, weight, XP
6. `shouldAdvanceLevel()` / `shouldDropLevel()` evaluate whether to change level
7. After 10 problems → summary screen → `applySessionToProfile()` updates streak + history
