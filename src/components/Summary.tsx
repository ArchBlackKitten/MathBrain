import type { AppSettings, SessionSummary } from '../types';
import { CATEGORY_LABEL, CATEGORY_COLOR, CATEGORY_ICON } from '../engine/meta';
import { useT } from '../i18n';
import type { CategoryId } from '../types';

interface Props {
  summary: SessionSummary;
  settings: AppSettings;
  onContinue: () => void;
  onMenu: () => void;
}

export default function Summary({ summary, settings, onContinue, onMenu }: Props) {
  const t     = useT(settings.language);
  const total = summary.correct + summary.wrong;
  const acc   = total > 0 ? Math.round((summary.correct / total) * 100) : 0;
  const avgMs = summary.problems.length > 0
    ? summary.problems.reduce((s, p) => s + p.timeUsedMs, 0) / summary.problems.length
    : 0;

  const emoji = acc >= 90 ? '🔥' : acc >= 70 ? '💪' : acc >= 50 ? '📈' : '🧗';

  const byCategory = summary.problems.reduce<Record<string, { correct: number; total: number }>>((acc, r) => {
    const id = r.problem.category;
    if (!acc[id]) acc[id] = { correct: 0, total: 0 };
    acc[id].total++;
    if (r.correct) acc[id].correct++;
    return acc;
  }, {});

  const isColorblind = settings.colorTheme === 'colorblind';

  return (
    <div className="min-h-screen bg-[#07070f] flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-md">

        <div className="text-center mb-7 anim-pop">
          <div className="text-5xl mb-3">{emoji}</div>
          <h2 className="text-3xl font-bold text-white tracking-tight">{t.sessionDone}</h2>
          <p className="text-slate-500 mt-1 text-sm">+{summary.xpGained} {t.xp}</p>
        </div>

        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className={`${isColorblind ? 'bg-sky-500/10 border-sky-500/20' : 'bg-emerald-500/10 border-emerald-500/20'} border rounded-2xl p-4 text-center`}>
            <p className={`text-3xl font-bold ${isColorblind ? 'text-sky-400' : 'text-emerald-400'}`}>{summary.correct}</p>
            <p className="text-xs text-slate-500 mt-1">{t.correctCount}</p>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-2xl p-4 text-center">
            <p className="text-3xl font-bold text-white">{acc}%</p>
            <p className="text-xs text-slate-500 mt-1">{t.accuracy}</p>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-2xl p-4 text-center">
            <p className="text-3xl font-bold text-white">{(avgMs / 1000).toFixed(1)}s</p>
            <p className="text-xs text-slate-500 mt-1">{t.avgTime}</p>
          </div>
        </div>

        <div className="space-y-2 mb-7">
          {Object.entries(byCategory).map(([id, { correct, total }]) => {
            const catId  = id as CategoryId;
            const c      = CATEGORY_COLOR[catId];
            const catAcc = Math.round((correct / total) * 100);
            return (
              <div key={id} className={`flex items-center gap-3 ${c.bg} border ${c.border} rounded-xl px-4 py-2.5`}>
                <span className={`font-bold ${c.text} w-6 text-center`}>{CATEGORY_ICON[catId]}</span>
                <span className="text-white text-sm flex-1">{CATEGORY_LABEL[catId]}</span>
                <span className="text-slate-500 text-xs">{correct}/{total}</span>
                <span className={`text-xs font-semibold ${catAcc >= 70 ? (isColorblind ? 'text-sky-400' : 'text-emerald-400') : (isColorblind ? 'text-amber-400' : 'text-rose-400')}`}>
                  {catAcc}%
                </span>
              </div>
            );
          })}
        </div>

        <div className="space-y-3">
          <button onClick={onContinue} className="w-full bg-violet-600 hover:bg-violet-500 active:scale-95 text-white font-bold py-4 rounded-2xl transition-all">
            {t.anotherSession}
          </button>
          <button onClick={onMenu} className="w-full bg-white/5 hover:bg-white/10 text-slate-300 py-3 rounded-2xl transition">
            {t.mainMenu}
          </button>
        </div>
      </div>
    </div>
  );
}
