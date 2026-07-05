import type { AppSettings, DayRecord, UserProfile } from '../types';
import { CATEGORY_COLOR, CATEGORY_ICON, CATEGORY_LABEL, CATEGORY_ORDER } from '../engine/meta';
import { recentAccuracy } from '../engine/adaptive';
import { useT } from '../i18n';
import { exportProfile, resetProfileProgress } from '../engine/storage';

interface Props {
  profile: UserProfile;
  profiles: UserProfile[];
  settings: AppSettings;
  onBack: () => void;
  onProfiles: (updated: UserProfile[]) => void;
}

// ── Activity Bar Chart (last 30 days) ─────────────────────────────────────────

function ActivityChart({ history, lang }: { history: DayRecord[]; lang: string }) {
  const DAYS = 30;
  const today = new Date().toISOString().slice(0, 10);

  // Build a map for quick lookup
  const byDate = new Map(history.map(d => [d.date, d]));

  // Generate last DAYS dates
  const dates: string[] = [];
  for (let i = DAYS - 1; i >= 0; i--) {
    const d = new Date(Date.now() - i * 86_400_000);
    dates.push(d.toISOString().slice(0, 10));
  }

  const values = dates.map(d => byDate.get(d)?.xp ?? 0);
  const maxXP  = Math.max(...values, 1);

  // 7-day average for projection
  const last7  = values.slice(-7).filter(v => v > 0);
  const avg7   = last7.length > 0 ? Math.round(last7.reduce((s,v)=>s+v,0) / 7) : 0;

  const hasData = values.some(v => v > 0);
  const noDataLabel = lang === 'es' ? '¡Juega para ver tu progreso!' : 'Play to see your progress!';
  const projLabel   = lang === 'es'
    ? `Proyección: a este ritmo en 30 días +${avg7*30} XP más`
    : `Projection: at this pace +${avg7*30} XP in 30 days`;

  return (
    <div className="mb-6">
      <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-3">
        {lang === 'es' ? 'Actividad (30 días)' : 'Activity (30 days)'}
      </p>
      {!hasData ? (
        <div className="h-20 flex items-center justify-center text-slate-600 text-sm border border-white/8 rounded-2xl">
          {noDataLabel}
        </div>
      ) : (
        <>
          <div className="flex items-end gap-[2px] h-20">
            {values.map((v, i) => {
              const isToday = dates[i] === today;
              const height  = v > 0 ? Math.max(4, Math.round((v / maxXP) * 72)) : 2;
              return (
                <div key={i} className="flex-1 flex flex-col items-center justify-end" title={`${dates[i]}: ${v} XP`}>
                  <div
                    className={`w-full rounded-sm transition-all ${
                      isToday ? 'bg-violet-400' : v > 0 ? 'bg-violet-600/70' : 'bg-white/5'
                    }`}
                    style={{ height: `${height}px` }}
                  />
                </div>
              );
            })}
          </div>
          <div className="flex justify-between text-xs text-slate-600 mt-1">
            <span>30d</span><span>{lang === 'es' ? 'hoy' : 'today'}</span>
          </div>
          {avg7 > 0 && <p className="text-xs text-slate-600 mt-2 text-center">{projLabel}</p>}
        </>
      )}
    </div>
  );
}

// ── Neglect warnings ──────────────────────────────────────────────────────────

function NeglectWarnings({ profile, lang }: { profile: UserProfile; lang: string }) {
  const now = Date.now();
  const neglected = CATEGORY_ORDER.filter(id => {
    const s = profile.categories[id];
    if (!s || s.lastPracticed === 0 || s.level <= 1) return false;
    return (now - s.lastPracticed) / 86_400_000 >= 4; // 4 days
  });

  if (neglected.length === 0) return null;
  const label = lang === 'es' ? '⚠️ Categorías en riesgo de bajar de nivel:' : '⚠️ Categories at risk of level drop:';

  return (
    <div className="mb-5 bg-amber-500/10 border border-amber-500/25 rounded-2xl p-4">
      <p className="text-xs font-semibold text-amber-400 mb-2">{label}</p>
      <div className="flex flex-wrap gap-2">
        {neglected.map(id => {
          const days = Math.floor((now - profile.categories[id].lastPracticed) / 86_400_000);
          return (
            <span key={id} className="text-xs text-amber-300 bg-amber-500/15 rounded-full px-2 py-0.5">
              {CATEGORY_ICON[id]} {CATEGORY_LABEL[id]} · {days}d
            </span>
          );
        })}
      </div>
    </div>
  );
}

// ── Main Stats component ──────────────────────────────────────────────────────

export default function Stats({ profile, profiles, settings, onBack, onProfiles }: Props) {
  const t = useT(settings.language);
  const lang = settings.language;
  const levelLabels = lang === 'es'
    ? ['', 'Básico', 'Intermedio', 'Avanzado', 'Experto']
    : ['', 'Basic', 'Intermediate', 'Advanced', 'Expert'];

  const handleReset = () => {
    const msg = lang === 'es'
      ? '¿Reiniciar progreso? Perderás todo el avance.'
      : 'Reset progress? All progress will be lost.';
    if (confirm(msg)) {
      const updated = resetProfileProgress(profiles, profile.id);
      onProfiles(updated);
    }
  };

  const xpLevel = Math.floor(profile.xp / 100) + 1;
  const streakLabel = lang === 'es' ? 'días seguidos' : 'day streak';
  const bestLabel   = lang === 'es' ? `Récord: ${profile.bestStreak}d` : `Best: ${profile.bestStreak}d`;

  return (
    <div className="min-h-screen bg-[#07070f] px-4 py-8 max-w-2xl mx-auto">

      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button onClick={onBack} className="text-slate-500 hover:text-white transition">{t.back}</button>
        <span className="text-2xl">{profile.avatar}</span>
        <div>
          <p className="text-white font-semibold">{profile.name}</p>
          <p className="text-slate-500 text-xs">{t.xpLevel(xpLevel)} · {profile.xp} {t.xp}</p>
        </div>
      </div>

      {/* Streak banner */}
      {profile.streak > 0 && (
        <div className="flex items-center gap-3 bg-amber-500/10 border border-amber-500/25 rounded-2xl px-5 py-3 mb-5">
          <span className="text-3xl">🔥</span>
          <div>
            <p className="text-amber-400 font-bold text-lg">{profile.streak} {streakLabel}</p>
            <p className="text-amber-600 text-xs">{bestLabel}</p>
          </div>
        </div>
      )}

      {/* Global stats */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="bg-white/5 border border-white/10 rounded-2xl p-4 text-center">
          <p className="text-2xl font-bold text-white">{profile.totalProblems}</p>
          <p className="text-xs text-slate-500 mt-1">{t.problems}</p>
        </div>
        <div className="bg-violet-500/10 border border-violet-500/20 rounded-2xl p-4 text-center">
          <p className="text-2xl font-bold text-violet-400">{profile.xp}</p>
          <p className="text-xs text-slate-500 mt-1">{t.xp}</p>
        </div>
        <div className="bg-white/5 border border-white/10 rounded-2xl p-4 text-center">
          <p className="text-2xl font-bold text-white">{profile.totalSessions}</p>
          <p className="text-xs text-slate-500 mt-1">{t.sessions}</p>
        </div>
      </div>

      {/* Activity chart */}
      <ActivityChart history={profile.history ?? []} lang={lang} />

      {/* Neglect warnings */}
      <NeglectWarnings profile={profile} lang={lang} />

      {/* Per-category */}
      <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-3">{t.categories}</p>
      <div className="space-y-2 mb-8">
        {CATEGORY_ORDER.map(id => {
          const s   = profile.categories[id];
          if (!s) return null;
          const c   = CATEGORY_COLOR[id];
          const acc = s.attempts > 0 ? recentAccuracy(s) : null;
          const avgSec = s.attempts > 0 ? (s.totalTimeMs / s.attempts / 1000).toFixed(1) : '—';
          const isNeglected = s.lastPracticed > 0 && s.level > 1 && (Date.now() - s.lastPracticed) / 86_400_000 >= 4;

          return (
            <div key={id} className={`${c.bg} border ${isNeglected ? 'border-amber-500/40' : c.border} rounded-2xl p-3`}>
              <div className="flex items-center gap-2 mb-1.5">
                <span className={`font-bold ${c.text} text-base`}>{CATEGORY_ICON[id]}</span>
                <div className="flex-1 min-w-0">
                  <span className="text-white font-medium text-sm truncate">{CATEGORY_LABEL[id]}</span>
                  <span className="text-slate-500 text-xs ml-2">{levelLabels[s.level]}</span>
                  {isNeglected && <span className="ml-2 text-amber-400 text-xs">⚠️</span>}
                </div>
                {acc !== null && (
                  <span className={`text-sm font-bold shrink-0 ${acc >= 0.7 ? 'text-emerald-400' : acc >= 0.5 ? 'text-amber-400' : 'text-rose-400'}`}>
                    {Math.round(acc * 100)}%
                  </span>
                )}
              </div>
              {acc !== null && (
                <div className="h-1 bg-white/10 rounded-full overflow-hidden mb-1.5">
                  <div className={`h-full rounded-full ${c.bar}`} style={{ width: `${Math.round(acc * 100)}%` }} />
                </div>
              )}
              <div className="flex gap-3 text-xs text-slate-600">
                <span>{s.attempts} {t.problems}</span>
                <span>{s.correct} ✓</span>
                <span>{avgSec}s</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Actions */}
      <div className="flex gap-2 pb-8">
        <button onClick={() => exportProfile(profile)} className="flex-1 bg-white/5 hover:bg-white/10 text-slate-400 text-sm py-2.5 rounded-xl transition border border-white/8">
          {t.exportProfile}
        </button>
        <button onClick={handleReset} className="flex-1 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 text-sm py-2.5 rounded-xl transition border border-rose-500/20">
          {t.resetProgress}
        </button>
      </div>
    </div>
  );
}
