import { useCallback, useEffect, useRef, useState } from 'react';
import type { AppSettings, CategoryId, Problem, ProblemLevel, SessionSummary, UserProfile } from '../types';
import { applyResult, accMultiplier, nextProblem } from '../engine/adaptive';
import { generateProblem } from '../engine/problems';
import { CATEGORY_COLOR, CATEGORY_ICON, CATEGORY_LABEL } from '../engine/meta';
import { useT } from '../i18n';
import VisualDisplay from './VisualDisplay';
import ColoredMath from './ColoredMath';
import Abacus from './Abacus';

const PROBLEMS_PER_SESSION = 10;

// Scratchpad grid dimensions
const GRID_ROWS = 5;
const GRID_COLS = 9;
const emptyGrid = () => Array(GRID_ROWS * GRID_COLS).fill('') as string[];

// 'practice' = app controls levels (no manual override)
// 'single'   = user manually selected one category, can pick level
// 'relax'    = no timer, no scoring pressure, skip freely, endless
export type GameMode = 'practice' | 'single' | 'relax';

interface Props {
  profile: UserProfile;
  activeCategories: CategoryId[];
  mode: GameMode;
  settings: AppSettings;
  onUpdate: (p: UserProfile) => void;
  onEnd: (summary: SessionSummary) => void;
}

type Phase = 'playing' | 'feedback';

export default function Game({ profile, activeCategories, mode, settings, onUpdate, onEnd }: Props) {
  const t = useT(settings.language);
  const es = settings.language === 'es';
  const isRelax = mode === 'relax';
  const levelLabels = es
    ? ['', 'Básico', 'Intermedio', 'Avanzado', 'Experto']
    : ['', 'Basic', 'Intermediate', 'Advanced', 'Expert'];

  // Freeze active categories at session start
  const activeCatsRef   = useRef<CategoryId[]>(activeCategories);
  const profileRef      = useRef(profile);
  const startTimeRef    = useRef(Date.now());
  const handleRef       = useRef<(timeout?: boolean) => void>(() => {});

  // Session fatigue: rises when the user fails categories they normally find easy
  const fatigueRef      = useRef(0);
  const fatigueLogRef   = useRef<{ correct: boolean; ease: number }[]>([]);

  const [problem, setProblem]         = useState<Problem>(() => nextProblem(profile, activeCatsRef.current));
  const [phase, setPhase]             = useState<Phase>('playing');
  const [timeLeft, setTimeLeft]       = useState(0);
  const [answer, setAnswer]           = useState('');
  const [lastCorrect, setLastCorrect] = useState(false);
  const [streak, setStreak]           = useState(0);
  const [animKey, setAnimKey]         = useState(0);
  const [showAbacus, setShowAbacus]         = useState(false);
  const [showLevels, setShowLevels]         = useState(false);
  const [distractedPrompt, setDistractedPrompt] = useState(false);
  const [summary, setSummary]               = useState<SessionSummary>({ correct: 0, wrong: 0, xpGained: 0, problems: [] });

  // Scratchpad (personal board) — resets on every new problem
  const [showPad, setShowPad]   = useState(false);
  const [padMode, setPadMode]   = useState<'grid' | 'notes'>('grid');
  const [notes, setNotes]       = useState('');
  const [grid, setGrid]         = useState<string[]>(emptyGrid);

  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { profileRef.current = profile; }, [profile]);

  const loadProblem = useCallback((p: Problem) => {
    setProblem(p);
    setPhase('playing');
    setAnswer('');
    setTimeLeft(p.timeLimit);
    setAnimKey(k => k + 1);
    // Scratchpad resets each time we move to a new problem
    setNotes('');
    setGrid(emptyGrid());
    startTimeRef.current = Date.now();
    setTimeout(() => inputRef.current?.focus(), 50);
  }, []);

  // Record a result into the fatigue log (call BEFORE applyResult so `ease`
  // reflects the user's lifetime mastery of that category up to now).
  const recordFatigue = useCallback((correct: boolean, category: CategoryId) => {
    const s = profileRef.current.categories[category];
    const ease = s.attempts > 0 ? s.correct / s.attempts : 0.5;
    const log = [...fatigueLogRef.current.slice(-4), { correct, ease }];
    fatigueLogRef.current = log;
    if (log.length < 3) { fatigueRef.current = 0; return; }
    const wrongEasy  = log.filter(r => !r.correct && r.ease >= 0.75).length;
    const wrongTotal = log.filter(r => !r.correct).length;
    fatigueRef.current = Math.max(0, Math.min(1, wrongEasy * 0.3 + (wrongTotal >= 3 ? 0.4 : wrongTotal * 0.12)));
  }, []);

  // Resolve distraction prompt: true = was distracted (skip), false = count as wrong
  const resolveDistracted = useCallback((wasDistracted: boolean) => {
    setDistractedPrompt(false);
    if (wasDistracted) {
      // Skip this problem entirely — don't affect stats or fatigue
      loadProblem(nextProblem(profileRef.current, activeCatsRef.current, fatigueRef.current));
      return;
    }
    // Count as wrong answer
    const timeUsedMs = Date.now() - startTimeRef.current;
    const newSummary: SessionSummary = {
      correct:  summary.correct,
      wrong:    summary.wrong + 1,
      xpGained: summary.xpGained + 2,
      problems: [...summary.problems, { problem, correct: false, timeUsedMs }],
    };
    setSummary(newSummary);
    setLastCorrect(false);
    setStreak(0);
    setPhase('feedback');
    recordFatigue(false, problem.category);
    const updated = applyResult(profileRef.current, problem.category, false, timeUsedMs);
    profileRef.current = updated;
    onUpdate(updated);
    const done = newSummary.problems.length >= PROBLEMS_PER_SESSION;
    setTimeout(() => {
      if (done) onEnd(newSummary);
      else loadProblem(nextProblem(updated, activeCatsRef.current, fatigueRef.current));
    }, 1800);
  }, [summary, problem, onUpdate, onEnd, loadProblem, recordFatigue]);

  const handleSubmit = useCallback((timeout = false) => {
    if (phase !== 'playing') return;
    // Timeout with empty answer → ask if distracted (never happens in relax)
    if (timeout && answer.trim() === '') {
      setDistractedPrompt(true);
      return;
    }
    const timeUsedMs = Date.now() - startTimeRef.current;
    const num     = parseFloat(answer.replace(',', '.'));
    const correct = !timeout && !isNaN(num) && Math.abs(num - problem.answer) < 0.011;
    const newStreak = correct ? streak + 1 : 0;

    setLastCorrect(correct);
    setStreak(newStreak);
    setPhase('feedback');

    const newSummary: SessionSummary = {
      correct:  summary.correct  + (correct ? 1 : 0),
      wrong:    summary.wrong    + (correct ? 0 : 1),
      xpGained: summary.xpGained + (isRelax ? (correct ? 3 : 0) : (correct ? 10 : 2)),
      problems: [...summary.problems, { problem, correct, timeUsedMs }],
    };
    setSummary(newSummary);

    if (isRelax) {
      // Relax: no stats mutation, no XP grind, endless — just feedback and next
      setTimeout(() => {
        loadProblem(nextProblem(profileRef.current, activeCatsRef.current, 0));
      }, correct ? 800 : 1400);
      return;
    }

    recordFatigue(correct, problem.category);
    const updated = applyResult(profileRef.current, problem.category, correct, timeUsedMs);
    profileRef.current = updated;
    onUpdate(updated);

    const done = newSummary.problems.length >= PROBLEMS_PER_SESSION;
    setTimeout(() => {
      if (done) onEnd(newSummary);
      else loadProblem(nextProblem(updated, activeCatsRef.current, fatigueRef.current));
    }, correct ? 900 : 1800);
  }, [phase, answer, problem, streak, summary, onUpdate, onEnd, loadProblem, recordFatigue, isRelax]);

  handleRef.current = handleSubmit;

  // Skip current problem (relax mode only)
  const handleSkip = useCallback(() => {
    if (phase !== 'playing') return;
    loadProblem(nextProblem(profileRef.current, activeCatsRef.current, 0));
  }, [phase, loadProblem]);

  // Keyboard handler for distraction prompt (A = yes, N = no)
  useEffect(() => {
    if (!distractedPrompt) return;
    const onKey = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      if (k === 'a') resolveDistracted(true);
      if (k === 'n') resolveDistracted(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [distractedPrompt, resolveDistracted]);

  // Countdown timer — restarts only when problem.id changes. Disabled in relax.
  useEffect(() => {
    if (isRelax) { setTimeLeft(0); return; }
    setTimeLeft(problem.timeLimit);
    startTimeRef.current = Date.now();
    const iv = setInterval(() => {
      const left = Math.max(0, problem.timeLimit - (Date.now() - startTimeRef.current) / 1000);
      setTimeLeft(left);
      if (left === 0) { clearInterval(iv); handleRef.current(true); }
    }, 50);
    return () => clearInterval(iv);
  }, [problem.id]); // eslint-disable-line

  // Level change (only in 'single' mode) — restarts the level fresh
  const handleLevelChange = (level: ProblemLevel) => {
    const cats = { ...profileRef.current.categories };
    cats[problem.category] = { ...cats[problem.category], level, recentResults: [], attemptsAtLevel: 0 };
    const updated = { ...profileRef.current, categories: cats };
    profileRef.current = updated;
    onUpdate(updated);
    setShowLevels(false);
    const st = cats[problem.category];
    loadProblem(generateProblem(problem.category, level, 0, st.baseTime, accMultiplier(st)));
  };

  const pct        = problem.timeLimit > 0 ? timeLeft / problem.timeLimit : 0;
  const color      = CATEGORY_COLOR[problem.category];
  const timerColor = pct > 0.5 ? 'bg-emerald-500' : pct > 0.25 ? 'bg-amber-400' : 'bg-rose-500';
  const isColorblind = settings.colorTheme === 'colorblind';
  const currentLevel = profileRef.current.categories[problem.category]?.level ?? problem.level;

  return (
    <div className="min-h-screen bg-[#07070f] flex flex-col items-center justify-center px-4 py-6">
      <div className="w-full max-w-md">

        {/* Top bar */}
        <div className="flex items-center justify-between mb-4">
          <button onClick={() => onEnd(summary)} className="text-slate-600 hover:text-slate-400 text-sm transition">
            ✕ {t.endSession}
          </button>
          <div className="flex items-center gap-2">
            <span className={`${isColorblind ? 'text-sky-400' : 'text-emerald-400'} font-semibold text-sm`}>✓ {summary.correct}</span>
            <span className={`${isColorblind ? 'text-amber-400' : 'text-rose-400'} font-semibold text-sm`}>✗ {summary.wrong}</span>
            {streak >= 3 && <span className="text-amber-400 font-bold text-sm animate-pulse">{t.streak(streak)}</span>}
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setShowPad(v => !v)} title={es ? 'Tablero' : 'Scratchpad'}
              className={`transition ${showPad ? 'text-violet-400' : 'text-slate-600 hover:text-violet-400'}`}>📝</button>
            <button onClick={() => setShowAbacus(v => !v)} title={t.abacus} className="text-slate-600 hover:text-amber-400 transition">🧮</button>
            <span className="text-slate-600 text-sm">
              {isRelax ? `${summary.problems.length + 1}` : `${summary.problems.length + 1}/${PROBLEMS_PER_SESSION}`}
            </span>
          </div>
        </div>

        {/* Timer bar — hidden in relax */}
        {!isRelax && (
          <div className="h-1.5 bg-white/5 rounded-full overflow-hidden mb-4">
            <div className={`h-full rounded-full transition-none ${timerColor}`} style={{ width: `${pct * 100}%` }} />
          </div>
        )}

        {/* Category badge + level */}
        <div className="flex items-center gap-2 mb-4">
          <div className={`flex items-center gap-1.5 ${color.bg} border ${color.border} rounded-full px-3 py-1`}>
            <span className={`font-bold ${color.text}`}>{CATEGORY_ICON[problem.category]}</span>
            <span className={`text-xs font-medium ${color.text}`}>{CATEGORY_LABEL[problem.category]}</span>
          </div>

          {isRelax && (
            <span className="flex items-center gap-1 bg-teal-500/10 border border-teal-500/25 rounded-full px-3 py-1 text-xs text-teal-300">
              🧘 {es ? 'Relax · sin tiempo' : 'Relax · no timer'}
            </span>
          )}

          {/* Level display — only clickable in 'single' mode */}
          {mode === 'single' ? (
            <div className="relative">
              <button
                onClick={() => setShowLevels(v => !v)}
                className="flex items-center gap-1 bg-white/5 hover:bg-white/10 border border-white/10 rounded-full px-3 py-1 text-xs text-slate-300 transition"
              >
                {t.level}: {levelLabels[currentLevel]} <span className="text-slate-600">▼</span>
              </button>
              {showLevels && (
                <div className="absolute top-full mt-1 left-0 bg-[#1a1a2e] border border-white/15 rounded-xl overflow-hidden shadow-xl z-10 min-w-36">
                  {([1, 2, 3, 4] as ProblemLevel[]).map(lv => (
                    <button key={lv} onClick={() => handleLevelChange(lv)}
                      className={`w-full text-left px-4 py-2.5 text-sm transition ${
                        lv === currentLevel ? `${color.text} bg-white/10` : 'text-slate-400 hover:text-white hover:bg-white/5'
                      }`}>
                      {levelLabels[lv]}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ) : null /* practice/relax mode: no level indicator — app decides */}
        </div>

        {/* Visual */}
        {problem.visual && (
          <div className={`${color.bg} border ${color.border} rounded-2xl mb-4 overflow-hidden`}>
            <VisualDisplay visual={problem.visual} />
          </div>
        )}

        {/* Problem card */}
        <div key={animKey} className={`anim-pop ${color.bg} border ${color.border} rounded-3xl p-8 mb-4 text-center ${phase === 'feedback' ? (lastCorrect ? 'anim-green' : 'anim-red') : ''}`}>
          <ColoredMath
            question={problem.question}
            colorSymbols={settings.symbolColors}
            colorblind={isColorblind}
            className="text-4xl font-mono font-bold text-white tracking-tight"
          />
          <p className="text-slate-600 text-sm mt-3">{isRelax ? '∞' : `${timeLeft.toFixed(1)}s`}</p>
        </div>

        {/* Feedback */}
        {phase === 'feedback' && (
          <div className={`text-center mb-4 ${lastCorrect ? 'anim-pop' : 'anim-shake'}`}>
            {lastCorrect ? (
              <p className={`text-2xl font-bold ${isColorblind ? 'text-sky-400' : 'text-emerald-400'}`}>✓ {t.correct}</p>
            ) : (
              <div>
                <p className={`text-2xl font-bold ${isColorblind ? 'text-amber-400' : 'text-rose-400'}`}>✗ {t.wasAnswer} {problem.answer}</p>
                {problem.hint && (
                  <div className="mt-3 bg-fuchsia-500/10 border border-fuchsia-500/25 rounded-xl px-4 py-3 text-left">
                    <p className="text-xs font-semibold text-fuchsia-400 mb-1">{t.mentalTrick}</p>
                    <p className="text-xs text-slate-300 leading-relaxed">{problem.hint}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Input */}
        {phase === 'playing' && (
          <div className="flex gap-3">
            <input
              ref={inputRef}
              type="text"
              inputMode="decimal"
              value={answer}
              onChange={e => setAnswer(e.target.value.replace(/[^0-9.,\-]/g, ''))}
              onKeyDown={e => e.key === 'Enter' && handleSubmit()}
              placeholder="?"
              className="flex-1 bg-white/5 border border-white/15 rounded-2xl px-5 py-4 text-white text-2xl font-mono outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition text-center"
            />
            {isRelax && (
              <button onClick={handleSkip} title={es ? 'Saltar' : 'Skip'}
                className="bg-white/5 hover:bg-white/10 active:scale-95 text-slate-300 font-bold px-5 rounded-2xl transition-all text-base border border-white/10">
                {es ? 'Saltar' : 'Skip'} ↷
              </button>
            )}
            <button onClick={() => handleSubmit()}
              className="bg-violet-600 hover:bg-violet-500 active:scale-95 text-white font-bold px-6 rounded-2xl transition-all text-2xl">→</button>
          </div>
        )}

        {/* Scratchpad (personal board) */}
        {showPad && (
          <div className="mt-4 bg-[#0d0d1a] border border-violet-500/20 rounded-2xl p-3">
            <div className="flex items-center justify-between mb-2">
              <div className="flex gap-1 bg-white/5 p-0.5 rounded-lg">
                <button onClick={() => setPadMode('grid')}
                  className={`text-xs px-2.5 py-1 rounded-md transition ${padMode === 'grid' ? 'bg-violet-600 text-white' : 'text-slate-400'}`}>
                  {es ? '▦ Cuadrícula' : '▦ Grid'}
                </button>
                <button onClick={() => setPadMode('notes')}
                  className={`text-xs px-2.5 py-1 rounded-md transition ${padMode === 'notes' ? 'bg-violet-600 text-white' : 'text-slate-400'}`}>
                  {es ? '✎ Notas' : '✎ Notes'}
                </button>
              </div>
              <button onClick={() => { setNotes(''); setGrid(emptyGrid()); }}
                className="text-xs text-slate-500 hover:text-rose-400 transition">
                {es ? 'Limpiar' : 'Clear'}
              </button>
            </div>

            {padMode === 'grid' ? (
              <div className="grid gap-0.5" style={{ gridTemplateColumns: `repeat(${GRID_COLS}, minmax(0, 1fr))` }}>
                {grid.map((cell, i) => (
                  <input
                    key={i}
                    value={cell}
                    inputMode="numeric"
                    maxLength={1}
                    onChange={e => setGrid(g => { const n = [...g]; n[i] = e.target.value.slice(-1); return n; })}
                    className="aspect-square min-w-0 bg-white/5 border border-white/10 rounded text-center text-white text-sm font-mono outline-none focus:border-violet-500 focus:bg-violet-500/10 transition"
                  />
                ))}
              </div>
            ) : (
              <textarea
                value={notes}
                onChange={e => setNotes(e.target.value)}
                rows={4}
                placeholder={es ? 'Anota tus pasos aquí…' : 'Jot your steps here…'}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white text-sm font-mono outline-none focus:border-violet-500 transition resize-none"
              />
            )}
            <p className="text-[10px] text-slate-600 mt-1.5 text-center">
              {es ? 'Se borra al pasar de problema · no cuenta como respuesta' : 'Clears on next problem · not your answer'}
            </p>
          </div>
        )}
      </div>

      {showAbacus && <Abacus onClose={() => setShowAbacus(false)} />}
      {showLevels && <div className="fixed inset-0 z-0" onClick={() => setShowLevels(false)} />}

      {/* Distraction prompt */}
      {distractedPrompt && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 px-6">
          <div className="bg-[#13131f] border border-white/15 rounded-3xl p-8 max-w-sm w-full text-center anim-pop">
            <div className="text-4xl mb-4">😴</div>
            <p className="text-white font-bold text-xl mb-2">
              {es ? '¿Estabas distraído?' : 'Were you distracted?'}
            </p>
            <p className="text-slate-500 text-sm mb-6">
              {es
                ? 'Si fue una distracción, no contará contra tu puntuación.'
                : 'If you were distracted, it won\'t count against your score.'}
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => resolveDistracted(true)}
                className="flex-1 bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-bold py-3 rounded-2xl transition-all"
              >
                {es ? 'Sí [A]' : 'Yes [A]'}
              </button>
              <button
                onClick={() => resolveDistracted(false)}
                className="flex-1 bg-rose-600/80 hover:bg-rose-500 active:scale-95 text-white font-bold py-3 rounded-2xl transition-all"
              >
                {es ? 'No [N]' : 'No [N]'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
