import type { CategoryId, UserProfile } from '../types';
import { CATEGORY_COLOR, CATEGORY_ICON, CATEGORY_LABEL, CATEGORY_ORDER } from '../engine/meta';
import { recentAccuracy } from '../engine/adaptive';

interface Props {
  profile: UserProfile;
  selected: CategoryId[];
  onToggle: (id: CategoryId) => void;
  onPlay: () => void;
  onBack: () => void;
}

export default function CategorySelector({ profile, selected, onToggle, onPlay, onBack }: Props) {
  const unlocked = CATEGORY_ORDER.filter(id => profile.categories[id].unlocked);
  const locked   = CATEGORY_ORDER.filter(id => !profile.categories[id].unlocked);

  return (
    <div className="min-h-screen bg-[#07070f] px-4 py-8 max-w-2xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={onBack} className="text-slate-500 hover:text-white transition text-lg">←</button>
        <div>
          <h1 className="text-xl font-bold text-white">Elegir categorías</h1>
          <p className="text-xs text-slate-500 mt-0.5">Selecciona las que quieres practicar</p>
        </div>
      </div>

      <div className="space-y-2 mb-6">
        {unlocked.map(id => {
          const s = profile.categories[id];
          const c = CATEGORY_COLOR[id];
          const active = selected.includes(id);
          const acc = s.attempts > 0 ? recentAccuracy(s) : null;

          return (
            <button
              key={id}
              onClick={() => onToggle(id)}
              className={`w-full flex items-center gap-3 rounded-2xl px-4 py-3 border transition-all text-left ${
                active
                  ? `${c.bg} ${c.border}`
                  : 'bg-white/3 border-white/8 opacity-60'
              }`}
            >
              {/* Checkbox */}
              <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition ${
                active ? `${c.bar} border-transparent` : 'border-slate-600'
              }`}>
                {active && <span className="text-white text-xs font-bold">✓</span>}
              </div>

              <span className={`font-mono font-bold text-lg w-7 text-center ${c.text}`}>
                {CATEGORY_ICON[id]}
              </span>

              <span className="text-white font-medium text-sm flex-1">{CATEGORY_LABEL[id]}</span>

              {acc !== null && (
                <span className={`text-xs font-semibold ${acc >= 0.7 ? 'text-emerald-400' : acc >= 0.5 ? 'text-amber-400' : 'text-rose-400'}`}>
                  {Math.round(acc * 100)}%
                </span>
              )}
            </button>
          );
        })}
      </div>

      {locked.length > 0 && (
        <div className="space-y-1.5 mb-8 opacity-35">
          <p className="text-xs text-slate-600 uppercase tracking-widest mb-2">Bloqueadas</p>
          {locked.map(id => (
            <div key={id} className="flex items-center gap-3 bg-white/3 border border-white/5 rounded-2xl px-4 py-3">
              <div className="w-5 h-5 rounded-md border-2 border-slate-700" />
              <span className="font-mono text-lg w-7 text-center text-slate-600">{CATEGORY_ICON[id]}</span>
              <span className="text-slate-600 text-sm">{CATEGORY_LABEL[id]}</span>
              <span className="ml-auto text-xs text-slate-700">🔒</span>
            </div>
          ))}
        </div>
      )}

      <button
        onClick={onPlay}
        disabled={selected.length === 0}
        className="w-full bg-violet-600 hover:bg-violet-500 disabled:opacity-30 disabled:cursor-not-allowed active:scale-95 text-white font-bold text-lg py-4 rounded-2xl transition-all"
      >
        ▶ Jugar con {selected.length} categoría{selected.length !== 1 ? 's' : ''}
      </button>
    </div>
  );
}
