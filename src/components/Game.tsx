import { useCallback, useEffect, useRef, useState } from 'react';
import type { AppSettings, CategoryId, Problem, ProblemLevel, SessionSummary, UserProfile } from '../types';
import { applyResult, calcTimeLimit, nextProblem } from '../engine/adaptive';
import { generateProblem } from '../engine/problems';
import { CATEGORY_COLOR, CATEGORY_ICON, CATEGORY_LABEL } from '../engine/meta';
import { useT } from '../i18n';
import VisualDisplay from './VisualDisplay';
import ColoredMath from './ColoredMath';
import Abacus from './Abacus';

const PROBLEMS_PER_SESSION = 10;

// 'practice' = app controls levels (no manual override)
// 'single'   = user manually selected one category, can pick level
export type GameMode = 'practice' | 'single';

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
  const levelLabels = settings.language === 'es'
    ? ['', 'Básico', 'Intermedio', 'Avanzado', 'Experto']
    : ['', 'Basic', 'Intermediate', 'Advanced', 'Expert'];

  // Freeze active categories at session start
  const activeCatsRef   = useRef<CategoryId[]>(activeCategories);
  const profileRef      = useRef(profile);
  const startTimeRef    = useRef(Date.now());
  const handleRef       = useRef<(timeout?: boolean) => void>(() => {});

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

  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { profileRef.current = profile; }, [profile]);

  const loadProblem = useCallback((p: Problem) => {
    setProblem(p);
    setPhase('playing');
    setAnswer('');
    setTimeLeft(p.timeLimit);
    setAnimKey(k => k + 1);
    startTimeRef.current = Date.now();
    setTimeout(() => inputRef.current?.focus(), 50);
  }, []);

  // Resolve distraction prompt: true = was distracted (skip), false = count as wrong
  const resolveDistracted = useCallback((wasDistracted: boolean) => {
    setDistractedPrompt(false);
    if (wasDistracted) {
      // Skip this problem entirely — don't affect stats
      loadProblem(nextProblem(profileRef.current, activeCatsRef.current));
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
    const updated = applyResult(profileRef.current, problem.category, false, timeUsedMs);
    profileRef.current = updated;
    onUpdate(updated);
    const done = newSummary.problems.length >= PROBLEMS_PER_SESSION;
    setTimeout(() => {
      if (done) onEnd(newSummary);
      else loadProblem(nextProblem(updated, activeCatsRef.current));
    }, 1800);
  }, [summary, problem, onUpdate, onEnd, loadProblem]);

  const handleSubmit = useCallback((timeout = false) => {
    if (phase !== 'playing') return;
    // Timeout with empty answer → ask if distracted
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
      xpGained: summary.xpGained + (correct ? 10 : 2),
      problems: [...summary.problems, { problem, correct, timeUsedMs }],
    };
    setSummary(newSummary);

    const updated = applyResult(profileRef.current, problem.category, correct, timeUsedMs);
    profileRef.current = updated;
    onUpdate(updated);

    const done = newSummary.problems.length >= PROBLEMS_PER_SESSION;
    setTimeout(() => {
      if (done) onEnd(newSummary);
      else loadProblem(nextProblem(updated, activeCatsRef.current));
    }, correct ? 900 : 1800);
  }, [phase, answer, problem, streak, summary, onUpdate, onEnd, loadProblem]);

  handleRef.current = handleSubmit;

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

  // Countdown timer — restarts only when problem.id changes
  useEffect(() => {
    setTimeLeft(problem.timeLimit);
    startTimeRef.current = Date.now();
    const iv = setInterval(() => {
      const left = Math.max(0, problem.timeLimit - (Date.now() - startTimeRef.current) / 1000);
      setTimeLeft(left);
      if (left === 0) { clearInterval(iv); handleRef.current(true); }
    }, 50);
    return () => clearInterval(iv);
  }, [problem.id]); // eslint-disable-line

  // Level change (only in 'single' mode)
  const handleLevelChange = (level: ProblemLevel) => {
    const cats = { ...profileRef.current.categories };
    cats[problem.category] = { ...cats[problem.category], level };
    const updated = { ...profileRef.current, categories: cats };
    profileRef.current = updated;
    onUpdate(updated);
    setShowLevels(false);
    loadProblem(generateProblem(problem.category, level, calcTimeLimit(cats[problem.category])));
  };

  const pct        = timeLeft / problem.timeLimit;
  const color      = CATEGORY_COLOR[problem.category];
  const timerColor = pct > 0.5 ? 'bg-emerald-500' : pct > 0.25 ? 'bg-amber-400' : 'bg-rose-500';
  const isColorblind = settings.colorTheme === 'colorblind';
  const currentLevel = profileRef.current.categories[problem.category]?.level ?? problem.level;

  return (
    <div className="min-h-screen bg-[#07070f] flex flex-col items-center justify-center px-4">
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
            <button onClick={() => setShowAbacus(v => !v)} title={t.abacus} className="text-slate-600 hover:text-amber-400 transition">🧮</button>
            <span className="text-slate-600 text-sm">{summary.problems.length + 1}/{PROBLEMS_PER_SESSION}</span>
          </div>
        </div>

        {/* Timer bar */}
        <div className="h-1.5 bg-white/5 rounded-full overflow-hidden mb-4">
          <div className={`h-full rounded-full transition-none ${timerColor}`} style={{ width: `${pct * 100}%` }} />
        </div>

        {/* Category badge + level */}
        <div className="flex items-center gap-2 mb-4">
          <div className={`flex items-center gap-1.5 ${color.bg} border ${color.border} rounded-full px-3 py-1`}>
            <span className={`font-bold ${color.text}`}>{CATEGORY_ICON[problem.category]}</span>
            <span className={`text-xs font-medium ${color.text}`}>{CATEGORY_LABEL[problem.category]}</span>
          </div>

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
          ) : null /* practice mode: no level indicator — app decides */}
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
          <p className="text-slate-600 text-sm mt-3">{timeLeft.toFixed(1)}s</p>
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
            <button onClick={() => handleSubmit()}
              className="bg-violet-600 hover:bg-violet-500 active:scale-95 text-white font-bold px-6 rounded-2xl transition-all text-2xl">→</button>
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
              {settings.language === 'es' ? '¿Estabas distraído?' : 'Were you distracted?'}
            </p>
            <p className="text-slate-500 text-sm mb-6">
              {settings.language === 'es'
                ? 'Si fue una distracción, no contará contra tu puntuación.'
                : 'If you were distracted, it won\'t count against your score.'}
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => resolveDistracted(true)}
                className="flex-1 bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-bold py-3 rounded-2xl transition-all"
              >
                {settings.language === 'es' ? 'Sí [A]' : 'Yes [A]'}
              </button>
              <button
                onClick={() => resolveDistracted(false)}
                className="flex-1 bg-rose-600/80 hover:bg-rose-500 active:scale-95 text-white font-bold py-3 rounded-2xl transition-all"
              >
                {settings.language === 'es' ? 'No [N]' : 'No [N]'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
