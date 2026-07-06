import { useRef, useState } from 'react';
import type { CategoryId, UserProfile, AppSettings } from '../types';
import { CATEGORY_COLOR, CATEGORY_ICON, CATEGORY_LABEL, CATEGORY_ORDER, CATEGORY_SECTIONS } from '../engine/meta';
import { recentAccuracy, getCategoryPriorities } from '../engine/adaptive';
import { exportProfile, importProfileFromFile, loadTrainingSelection, saveTrainingSelection } from '../engine/storage';
import { useT } from '../i18n';

interface Props {
  profile: UserProfile;
  settings: AppSettings;
  onPlaySingle:    (cat: CategoryId) => void;
  onPlayMulti:     (cats: CategoryId[]) => void;
  onPlayRelax:     (cats: CategoryId[]) => void;
  onStats:         () => void;
  onSettings:      () => void;
  onProfiles:      () => void;
  onProfileUpdate: (p: UserProfile) => void;
}

export default function Menu({
  profile, settings,
  onPlaySingle, onPlayMulti, onPlayRelax, onStats, onSettings, onProfiles, onProfileUpdate,
}: Props) {
  const t    = useT(settings.language);
  const lang = settings.language;
  const importRef = useRef<HTMLInputElement>(null);

  // 'free' = app decides, 'focused' = user picks categories, 'relax' = no timer
  const [practiceTab, setPracticeTab] = useState<'free' | 'focused' | 'relax'>('free');
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
      const next = prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id];
      const safe = next.length === 0 ? [id] : next;
      saveTrainingSelection(profile.id, safe);
      return safe;
    });
  };

  const toggleSection = (ids: CategoryId[]) => {
    const allIn = ids.every(id => selected.includes(id));
    setSelected(prev => {
      const next = allIn ? prev.filter(id => !ids.includes(id)) : [...new Set([...prev, ...ids])];
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

  // Smart recommendations
  const priorities = getCategoryPriorities(profile);
  const recommended = new Set(priorities.slice(0, 6).map(p => p.id));
  const urgentCount = priorities.filter(p => p.score > 0.5).length;

  // Both focused and relax let the user pick categories via the grid
  const selecting = practiceTab === 'focused' || practiceTab === 'relax';

  const xpInLevel = profile.xp % 100;
  const now = Date.now();

  return (
    <div className="min-h-screen bg-[#07070f] max-w-2xl mx-auto">

      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-6 pb-4">
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
      <div className="px-4 mb-5">
        <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
          <div className="h-full bg-violet-500 rounded-full transition-all duration-700" style={{ width: `${xpInLevel}%` }} />
        </div>
        <p className="text-xs text-slate-600 text-right mt-1">{t.xpLevel(Math.floor(profile.xp / 100) + 1)}</p>
      </div>

      {/* Practice mode tabs */}
      <div className="px-4 mb-5">
        <div className="flex gap-2 bg-white/5 p-1 rounded-2xl">
          <button
            onClick={() => setPracticeTab('free')}
            className={`flex-1 flex flex-col items-center py-3 px-2 rounded-xl transition-all ${
              practiceTab === 'free'
                ? 'bg-violet-600 shadow-lg shadow-violet-900/50'
                : 'hover:bg-white/5'
            }`}
          >
            <span className="text-lg mb-0.5">🎲</span>
            <span className={`text-xs font-bold ${practiceTab === 'free' ? 'text-white' : 'text-slate-400'}`}>
              {lang === 'es' ? 'Práctica Libre' : 'Free Practice'}
            </span>
            <span className={`text-[10px] mt-0.5 ${practiceTab === 'free' ? 'text-violet-200' : 'text-slate-600'}`}>
              {lang === 'es' ? 'La app decide' : 'App decides'}
            </span>
          </button>
          <button
            onClick={() => setPracticeTab('focused')}
            className={`flex-1 flex flex-col items-center py-3 px-2 rounded-xl transition-all ${
              practiceTab === 'focused'
                ? 'bg-fuchsia-600 shadow-lg shadow-fuchsia-900/50'
                : 'hover:bg-white/5'
            }`}
          >
            <span className="text-lg mb-0.5">🎯</span>
            <span className={`text-xs font-bold ${practiceTab === 'focused' ? 'text-white' : 'text-slate-400'}`}>
              {lang === 'es' ? 'A Consciencia' : 'Focused'}
            </span>
            <span className={`text-[10px] mt-0.5 ${practiceTab === 'focused' ? 'text-fuchsia-200' : 'text-slate-600'}`}>
              {lang === 'es' ? 'Tú eliges' : 'You choose'}
            </span>
          </button>
          <button
            onClick={() => setPracticeTab('relax')}
            className={`flex-1 flex flex-col items-center py-3 px-2 rounded-xl transition-all ${
              practiceTab === 'relax'
                ? 'bg-teal-600 shadow-lg shadow-teal-900/50'
                : 'hover:bg-white/5'
            }`}
          >
            <span className="text-lg mb-0.5">🧘</span>
            <span className={`text-xs font-bold ${practiceTab === 'relax' ? 'text-white' : 'text-slate-400'}`}>
              {lang === 'es' ? 'Relax' : 'Relax'}
            </span>
            <span className={`text-[10px] mt-0.5 ${practiceTab === 'relax' ? 'text-teal-200' : 'text-slate-600'}`}>
              {lang === 'es' ? 'Sin tiempo' : 'No timer'}
            </span>
          </button>
        </div>
      </div>

      {/* === FREE PRACTICE === */}
      {practiceTab === 'free' && (
        <div className="px-4 mb-6">
          {/* Smart recommendations panel */}
          {urgentCount > 0 && (
            <div className="bg-violet-500/10 border border-violet-500/25 rounded-2xl p-4 mb-4">
              <p className="text-xs font-semibold text-violet-400 mb-2">
                {lang === 'es' ? '📌 La app recomienda trabajar en:' : '📌 App recommends working on:'}
              </p>
              <div className="flex flex-wrap gap-1.5">
                {priorities.slice(0, 5).map(p => (
                  <span key={p.id} className="text-xs bg-violet-500/20 text-violet-300 rounded-full px-2 py-0.5 flex items-center gap-1">
                    {CATEGORY_ICON[p.id]} {CATEGORY_LABEL[p.id]}
                    {p.reason === 'neglect'    && <span className="text-amber-400">⏰</span>}
                    {p.reason === 'struggling' && <span className="text-rose-400">💪</span>}
                    {p.reason === 'new'        && <span className="text-sky-400">✨</span>}
                  </span>
                ))}
              </div>
            </div>
          )}

          <button
            onClick={() => onPlayMulti(CATEGORY_ORDER)}
            className="w-full bg-violet-600 hover:bg-violet-500 active:scale-95 text-white font-bold text-lg py-5 rounded-2xl transition-all shadow-lg shadow-violet-900/40 mb-3"
          >
            {lang === 'es' ? '¡Practicar ahora!' : 'Practice now!'}
          </button>
          <p className="text-center text-xs text-slate-600">
            {lang === 'es'
              ? 'El algoritmo adaptativo elige categorías y niveles según tu progreso real.'
              : 'The adaptive algorithm picks categories and levels based on your actual progress.'}
          </p>
        </div>
      )}

      {/* === FOCUSED PRACTICE === */}
      {practiceTab === 'focused' && (
        <div className="px-4 mb-6">
          <p className="text-xs text-slate-500 mb-4 text-center">
            {lang === 'es'
              ? 'Selecciona qué quieres practicar hoy. El algoritmo sigue adaptando dentro de tu selección.'
              : 'Choose what to practice today. The algorithm still adapts within your selection.'}
          </p>
        </div>
      )}

      {/* === RELAX PRACTICE === */}
      {practiceTab === 'relax' && (
        <div className="px-4 mb-6">
          <p className="text-xs text-slate-500 mb-4 text-center">
            {lang === 'es'
              ? '🧘 Sin cronómetro, sin puntaje. Tómate el tiempo que quieras, salta lo que sea. Elige categorías y practica tranquila.'
              : '🧘 No timer, no scoring. Take all the time you want, skip anything. Pick categories and practise calmly.'}
          </p>
        </div>
      )}

      {/* Category sections — shown in both modes (clickable for single in free, selectable in focused) */}
      <div className="px-4 space-y-5 mb-6">
        {CATEGORY_SECTIONS.map(section => {
          const sectionLabel = lang === 'es' ? section.label : section.labelEn;
          const allSectionSelected = selecting && section.categories.every(id => selected.includes(id));

          return (
            <div key={section.id}>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest">
                  {sectionLabel}
                </h3>
                {selecting && (
                  <button
                    onClick={() => toggleSection(section.categories)}
                    className={`text-xs px-2 py-0.5 rounded-full border transition ${
                      allSectionSelected
                        ? 'border-fuchsia-500/50 text-fuchsia-400 bg-fuchsia-500/10'
                        : 'border-white/10 text-slate-600 hover:text-slate-300'
                    }`}
                  >
                    {allSectionSelected ? '✓ todos' : 'todos'}
                  </button>
                )}
              </div>

              <div className="grid grid-cols-2 gap-2">
                {section.categories.map(id => {
                  const s   = profile.categories[id];
                  if (!s) return null;
                  const c   = CATEGORY_COLOR[id];
                  const acc = s.attempts > 0 ? recentAccuracy(s) : null;
                  const isSelected   = selected.includes(id);
                  const isNeglected  = s.lastPracticed > 0 && s.level > 1 && (now - s.lastPracticed) / 86_400_000 >= 4;
                  const isRecommended = recommended.has(id);
                  const levelLabels  = lang === 'es' ? ['','Básico','Interm.','Avanzado','Experto'] : ['','Basic','Inter.','Advanced','Expert'];

                  const dimmed = selecting && !isSelected;

                  return (
                    <button
                      key={id}
                      onClick={() => selecting ? toggle(id) : onPlaySingle(id)}
                      className={`${c.bg} border ${
                        dimmed ? 'opacity-30 border-white/8'
                          : isNeglected ? 'border-amber-500/50'
                          : c.border
                      } rounded-2xl p-3 text-left transition-all active:scale-95 relative`}
                    >
                      {/* Checkbox in focused/relax modes */}
                      {selecting && (
                        <div className={`absolute top-2 right-2 w-4 h-4 rounded border flex items-center justify-center ${
                          isSelected ? `${c.bar} border-transparent` : 'border-slate-600'
                        }`}>
                          {isSelected && <span className="text-white text-[9px] font-bold leading-none">✓</span>}
                        </div>
                      )}

                      {/* Recommended badge in free mode */}
                      {practiceTab === 'free' && isRecommended && (
                        <div className="absolute top-1.5 right-1.5 w-2 h-2 bg-violet-400 rounded-full" />
                      )}

                      <div className="flex items-center gap-1.5 mb-1.5">
                        <span className={`font-bold text-base ${c.text}`}>{CATEGORY_ICON[id]}</span>
                        <span className="text-white text-xs font-medium truncate flex-1 pr-4">{CATEGORY_LABEL[id]}</span>
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

      {/* Focused / relax start button — sticky at bottom */}
      {selecting && (
        <div className="sticky bottom-0 bg-[#07070f]/95 backdrop-blur-sm px-4 pb-6 pt-3 border-t border-white/5">
          <button
            onClick={() => (practiceTab === 'relax' ? onPlayRelax(selected) : onPlayMulti(selected))}
            disabled={selected.length === 0}
            className={`w-full disabled:opacity-30 active:scale-95 text-white font-bold text-lg py-4 rounded-2xl transition-all shadow-lg ${
              practiceTab === 'relax'
                ? 'bg-teal-600 hover:bg-teal-500 shadow-teal-900/40'
                : 'bg-fuchsia-600 hover:bg-fuchsia-500 shadow-fuchsia-900/40'
            }`}
          >
            {practiceTab === 'relax'
              ? (lang === 'es'
                  ? `🧘 Relax con ${selected.length === CATEGORY_ORDER.length ? 'todo' : `${selected.length} categoría${selected.length !== 1 ? 's' : ''}`}`
                  : `🧘 Relax with ${selected.length === CATEGORY_ORDER.length ? 'all' : `${selected.length} categor${selected.length !== 1 ? 'ies' : 'y'}`}`)
              : (lang === 'es'
                  ? `Practicar ${selected.length === CATEGORY_ORDER.length ? 'todo' : `${selected.length} categoría${selected.length !== 1 ? 's' : ''}`}`
                  : `Practice ${selected.length === CATEGORY_ORDER.length ? 'all' : `${selected.length} categor${selected.length !== 1 ? 'ies' : 'y'}`}`)}
          </button>
          <div className="flex gap-2 mt-2">
            <button
              onClick={() => { setSelected(CATEGORY_ORDER); saveTrainingSelection(profile.id, CATEGORY_ORDER); }}
              className="flex-1 text-xs text-slate-500 hover:text-white border border-white/8 rounded-xl py-2 transition"
            >
              {lang === 'es' ? 'Todas' : 'All'}
            </button>
            <button
              onClick={() => { setSelected([]); }}
              className="flex-1 text-xs text-slate-500 hover:text-white border border-white/8 rounded-xl py-2 transition"
            >
              {lang === 'es' ? 'Ninguna' : 'None'}
            </button>
          </div>
        </div>
      )}

      {/* Export / Import */}
      <div className="flex gap-2 px-4 pb-8">
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
