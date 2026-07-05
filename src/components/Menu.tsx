import { useRef, useState } from 'react';
import type { CategoryId, UserProfile, AppSettings } from '../types';
import { CATEGORY_COLOR, CATEGORY_ICON, CATEGORY_LABEL, CATEGORY_ORDER, CATEGORY_SECTIONS } from '../engine/meta';
import { recentAccuracy } from '../engine/adaptive';
import { exportProfile, importProfileFromFile, loadTrainingSelection, saveTrainingSelection } from '../engine/storage';
import { useT } from '../i18n';

interface Props {
  profile: UserProfile;
  settings: AppSettings;
  onPlaySingle:    (cat: CategoryId) => void;
  onPlayMulti:     (cats: CategoryId[]) => void;
  onStats:         () => void;
  onSettings:      () => void;
  onProfiles:      () => void;
  onProfileUpdate: (p: UserProfile) => void;
}

export default function Menu({
  profile, settings,
  onPlaySingle, onPlayMulti, onStats, onSettings, onProfiles, onProfileUpdate,
}: Props) {
  const t    = useT(settings.language);
  const lang = settings.language;
  const importRef = useRef<HTMLInputElement>(null);

  const [selectMode, setSelectMode] = useState(false);
  const [selected, setSelected] = useState<CategoryId[]>(() => {
    const saved = loadTrainingSelection(profile.id);
    if (saved) {
      const valid = saved.filter(id => CATEGORY_ORDER.includes(id));
      return valid.length > 0 ? valid : CATEGORY_ORDER;
    }
    return CATEGORY_ORDER;
  });

  const toggle = (id: CategoryId) => {
    setSelected(prev => {
      let next: CategoryId[];
      if (prev.length === CATEGORY_ORDER.length && prev.includes(id)) {
        next = [id];
      } else {
        next = prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id];
        if (next.length === 0) next = [id];
      }
      saveTrainingSelection(profile.id, next);
      return next;
    });
  };

  const toggleSection = (ids: CategoryId[]) => {
    const allIn = ids.every(id => selected.includes(id));
    setSelected(prev => {
      const next = allIn
        ? prev.filter(id => !ids.includes(id)).length === 0
          ? ids // don't go to zero: keep section if it would empty everything
          : prev.filter(id => !ids.includes(id))
        : [...new Set([...prev, ...ids])];
      const safe = next.length === 0 ? ids : next;
      saveTrainingSelection(profile.id, safe);
      return safe;
    });
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const p = await importProfileFromFile(file);
      onProfileUpdate(p);
      alert(lang === 'es' ? `¡Perfil de ${p.name} importado!` : `Profile ${p.name} imported!`);
    } catch {
      alert(lang === 'es' ? 'Archivo inválido.' : 'Invalid file.');
    }
    e.target.value = '';
  };

  const xpInLevel = profile.xp % 100;
  const now = Date.now();

  return (
    <div className="min-h-screen bg-[#07070f] px-4 py-6 max-w-2xl mx-auto">

      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <button onClick={onProfiles} className="flex items-center gap-2">
          <span className="text-2xl">{profile.avatar}</span>
          <div className="text-left">
            <p className="text-white font-semibold text-sm leading-none">{profile.name}</p>
            <div className="flex items-center gap-2 mt-0.5">
              <p className="text-slate-500 text-xs">{profile.totalProblems} {t.problems} · {profile.xp} {t.xp}</p>
              {(profile.streak ?? 0) > 0 && <span className="text-amber-400 text-xs font-semibold">🔥{profile.streak}</span>}
            </div>
          </div>
        </button>
        <div className="flex gap-2">
          <button onClick={onStats}    className="text-slate-400 hover:text-white transition text-xs border border-white/10 rounded-xl px-3 py-2">{t.stats}</button>
          <button onClick={onSettings} className="text-slate-400 hover:text-white transition text-xs border border-white/10 rounded-xl px-3 py-2">⚙</button>
        </div>
      </div>

      {/* XP bar */}
      <div className="mb-6">
        <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
          <div className="h-full bg-violet-500 rounded-full transition-all duration-700" style={{ width: `${xpInLevel}%` }} />
        </div>
        <p className="text-xs text-slate-600 text-right mt-1">{t.xpLevel(Math.floor(profile.xp / 100) + 1)}</p>
      </div>

      {/* Mode toggle */}
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-widest">{t.categories}</h2>
        <button
          onClick={() => setSelectMode(v => !v)}
          className={`text-xs px-3 py-1.5 rounded-xl border transition ${
            selectMode ? 'bg-violet-600 border-violet-500 text-white' : 'border-white/10 text-slate-400 hover:text-white'
          }`}
        >
          {selectMode ? t.selectCats : t.practice}
        </button>
      </div>

      {/* Sections */}
      <div className="space-y-6 mb-6">
        {CATEGORY_SECTIONS.map(section => {
          const sectionLabel = lang === 'es' ? section.label : section.labelEn;
          const allSectionSelected = section.categories.every(id => selected.includes(id));

          return (
            <div key={section.id}>
              {/* Section header */}
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                  {sectionLabel}
                </h3>
                {selectMode && (
                  <button
                    onClick={() => toggleSection(section.categories)}
                    className={`text-xs px-2 py-0.5 rounded-full border transition ${
                      allSectionSelected
                        ? 'border-violet-500/50 text-violet-400 bg-violet-500/10'
                        : 'border-white/10 text-slate-600 hover:text-slate-300'
                    }`}
                  >
                    {allSectionSelected ? '✓ todos' : 'seleccionar'}
                  </button>
                )}
              </div>

              {/* Category cards in 2-column grid */}
              <div className="grid grid-cols-2 gap-2">
                {section.categories.map(id => {
                  const s   = profile.categories[id];
                  if (!s) return null;
                  const c   = CATEGORY_COLOR[id];
                  const acc = s.attempts > 0 ? recentAccuracy(s) : null;
                  const isSelected   = selected.includes(id);
                  const isNeglected  = s.lastPracticed > 0 && s.level > 1 && (now - s.lastPracticed) / 86_400_000 >= 4;
                  const levelLabels  = lang === 'es' ? ['','Básico','Interm.','Avanzado','Experto'] : ['','Basic','Inter.','Advanced','Expert'];

                  return (
                    <button
                      key={id}
                      onClick={() => selectMode ? toggle(id) : onPlaySingle(id)}
                      className={`${c.bg} border ${
                        selectMode && !isSelected ? 'opacity-35 border-white/8'
                          : isNeglected ? 'border-amber-500/50'
                          : c.border
                      } rounded-2xl p-3 text-left transition-all active:scale-95 relative`}
                    >
                      {selectMode && (
                        <div className={`absolute top-2 right-2 w-4 h-4 rounded border flex items-center justify-center ${
                          isSelected ? `${c.bar} border-transparent` : 'border-slate-600 bg-transparent'
                        }`}>
                          {isSelected && <span className="text-white text-[9px] font-bold leading-none">✓</span>}
                        </div>
                      )}

                      <div className="flex items-center gap-1.5 mb-1.5">
                        <span className={`font-bold text-base ${c.text}`}>{CATEGORY_ICON[id]}</span>
                        <span className="text-white text-xs font-medium truncate flex-1">{CATEGORY_LABEL[id]}</span>
                        {isNeglected && <span className="text-amber-400 text-xs shrink-0">⚠️</span>}
                      </div>

                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs text-slate-600">{levelLabels[s.level]}</span>
                        {acc !== null && (
                          <span className={`text-xs font-semibold ${acc >= 0.7 ? 'text-emerald-400' : acc >= 0.5 ? 'text-amber-400' : 'text-rose-400'}`}>
                            {Math.round(acc * 100)}%
                          </span>
                        )}
                      </div>

                      <div className="h-0.5 bg-white/10 rounded-full overflow-hidden">
                        <div className={`h-full ${c.bar} rounded-full`} style={{ width: acc !== null ? `${Math.round(acc * 100)}%` : '0%' }} />
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Practice button (shown in select mode) */}
      {selectMode && (
        <div className="space-y-2 mb-5 sticky bottom-4">
          <button
            onClick={() => { onPlayMulti(selected); setSelectMode(false); }}
            disabled={selected.length === 0}
            className="w-full bg-violet-600 hover:bg-violet-500 disabled:opacity-30 active:scale-95 text-white font-bold text-lg py-4 rounded-2xl transition-all shadow-lg shadow-violet-900/50"
          >
            {t.playWith(selected.length)}
          </button>
          <div className="flex gap-2">
            <button
              onClick={() => { setSelected(CATEGORY_ORDER); saveTrainingSelection(profile.id, CATEGORY_ORDER); }}
              className="flex-1 text-xs text-slate-500 hover:text-white border border-white/8 rounded-xl py-2 transition"
            >
              {t.selectAll}
            </button>
            <button
              onClick={() => {
                const first = [CATEGORY_ORDER[0]];
                setSelected(first);
                saveTrainingSelection(profile.id, first);
              }}
              className="flex-1 text-xs text-slate-500 hover:text-white border border-white/8 rounded-xl py-2 transition"
            >
              {t.deselectAll}
            </button>
          </div>
        </div>
      )}

      {/* Export / Import */}
      <div className="flex gap-2 pb-6">
        <button onClick={() => exportProfile(profile)} className="flex-1 bg-white/5 hover:bg-white/10 text-slate-400 text-xs py-2.5 rounded-xl transition border border-white/8">
          {t.exportProfile}
        </button>
        <button onClick={() => importRef.current?.click()} className="flex-1 bg-white/5 hover:bg-white/10 text-slate-400 text-xs py-2.5 rounded-xl transition border border-white/8">
          {t.importProfile}
        </button>
        <input ref={importRef} type="file" accept=".json" className="hidden" onChange={handleImport} />
      </div>
    </div>
  );
}
