import { useState } from 'react';
import type { Lang } from '../types';
import { useT } from '../i18n';

const AVATARS = [
  '🧠','🔥','🚀','⭐','🦋','🐬','🦊','💎','🌸','🎯',
  '🏆','🦄','👾','🤖','🧪','🎸','⚡','🌊','🦁','🐉',
];

interface Props {
  lang: Lang;
  initialName?: string;
  initialAvatar?: string;
  onSave: (name: string, avatar: string) => void;
  onBack?: () => void;
  editMode?: boolean;
}

export default function ProfileSetup({ lang, initialName = '', initialAvatar = '🧠', onSave, onBack, editMode = false }: Props) {
  const t = useT(lang);
  const [name, setName]     = useState(initialName);
  const [avatar, setAvatar] = useState(initialAvatar);

  const submit = () => {
    const n = name.trim();
    if (n) onSave(n, avatar);
  };

  return (
    <div className="min-h-screen bg-[#07070f] flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        {!editMode && (
          <div className="text-center mb-6">
            <div className="text-5xl mb-3">🧠</div>
            <h1 className="text-2xl font-bold text-white tracking-tight">MathBrain</h1>
          </div>
        )}

        {onBack && (
          <button onClick={onBack} className="text-slate-500 hover:text-white transition text-lg mb-4 block">{t.back}</button>
        )}

        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-5">
          {/* Avatar picker */}
          <div>
            <p className="text-slate-400 text-sm mb-3">{t.chooseAvatar}</p>
            <div className="grid grid-cols-10 gap-1.5">
              {AVATARS.map(a => (
                <button
                  key={a}
                  onClick={() => setAvatar(a)}
                  className={`text-2xl leading-none p-1.5 rounded-xl transition-all ${
                    a === avatar
                      ? 'bg-violet-500/30 ring-2 ring-violet-500 scale-110'
                      : 'hover:bg-white/10'
                  }`}
                >
                  {a}
                </button>
              ))}
            </div>
          </div>

          {/* Name input */}
          <div>
            <input
              autoFocus
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && submit()}
              placeholder={t.yourName}
              maxLength={20}
              className="w-full bg-white/5 border border-white/15 rounded-xl px-4 py-3 text-white placeholder-slate-600 outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition"
            />
          </div>

          <button
            onClick={submit}
            disabled={!name.trim()}
            className="w-full bg-violet-600 hover:bg-violet-500 disabled:opacity-30 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-xl transition"
          >
            {editMode ? t.save : t.start}
          </button>
        </div>
      </div>
    </div>
  );
}
