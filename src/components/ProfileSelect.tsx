import { useRef } from 'react';
import type { UserProfile, Lang } from '../types';
import { useT } from '../i18n';
import { exportProfile, importProfileFromFile } from '../engine/storage';

interface Props {
  profiles: UserProfile[];
  activeId: string | null;
  lang: Lang;
  onSelect:  (id: string)       => void;
  onNew:     ()                  => void;
  onEdit:    (id: string)       => void;
  onDelete:  (id: string)       => void;
  onImport:  (p: UserProfile)   => void;
}

export default function ProfileSelect({
  profiles, activeId, lang,
  onSelect, onNew, onEdit, onDelete, onImport,
}: Props) {
  const t = useT(lang);
  const importRef = useRef<HTMLInputElement>(null);

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const p = await importProfileFromFile(file);
      onImport(p);
    } catch {
      alert(lang === 'es' ? 'No se pudo importar el archivo.' : 'Could not import file.');
    }
    e.target.value = '';
  };

  const sorted = [...profiles].sort((a, b) => b.lastPlayed - a.lastPlayed);

  return (
    <div className="min-h-screen bg-[#07070f] flex flex-col items-center justify-center px-4 py-8">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="text-5xl mb-3">🧠</div>
          <h1 className="text-2xl font-bold text-white tracking-tight">MathBrain</h1>
          <p className="text-slate-500 text-sm mt-1">{t.profiles}</p>
        </div>

        <div className="space-y-3 mb-6">
          {sorted.map(p => (
            <div
              key={p.id}
              className={`flex items-center gap-3 rounded-2xl px-4 py-3 border cursor-pointer transition-all group ${
                p.id === activeId
                  ? 'bg-violet-500/15 border-violet-500/40'
                  : 'bg-white/5 border-white/10 hover:border-white/25'
              }`}
              onClick={() => onSelect(p.id)}
            >
              <span className="text-3xl shrink-0">{p.avatar}</span>
              <div className="flex-1 min-w-0">
                <p className="text-white font-semibold truncate">{p.name}</p>
                <p className="text-slate-500 text-xs">{p.totalProblems} {t.problems} · {p.xp} {t.xp}</p>
              </div>
              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition">
                <button
                  onClick={e => { e.stopPropagation(); onEdit(p.id); }}
                  className="text-slate-500 hover:text-white transition text-sm w-7 h-7 flex items-center justify-center rounded-lg hover:bg-white/10"
                >✏️</button>
                <button
                  onClick={e => { e.stopPropagation(); exportProfile(p); }}
                  className="text-slate-500 hover:text-white transition text-sm w-7 h-7 flex items-center justify-center rounded-lg hover:bg-white/10"
                >↑</button>
                <button
                  onClick={e => {
                    e.stopPropagation();
                    if (confirm(t.deleteConfirm)) onDelete(p.id);
                  }}
                  className="text-slate-500 hover:text-rose-400 transition text-sm w-7 h-7 flex items-center justify-center rounded-lg hover:bg-rose-500/10"
                >🗑</button>
              </div>
            </div>
          ))}
        </div>

        <button
          onClick={onNew}
          className="w-full bg-violet-600 hover:bg-violet-500 active:scale-95 text-white font-bold py-3.5 rounded-2xl transition-all mb-3"
        >
          {t.newProfile}
        </button>

        <button
          onClick={() => importRef.current?.click()}
          className="w-full bg-white/5 hover:bg-white/10 text-slate-400 text-sm py-2.5 rounded-xl transition border border-white/8"
        >
          {t.importProfile}
        </button>
        <input ref={importRef} type="file" accept=".json" className="hidden" onChange={handleImport} />
      </div>
    </div>
  );
}
