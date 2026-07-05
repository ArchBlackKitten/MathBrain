import type { AppSettings, Lang } from '../types';
import { useT } from '../i18n';

interface Props {
  settings: AppSettings;
  onUpdate: (s: AppSettings) => void;
  onBack: () => void;
}

function Toggle({ on, onToggle }: { on: boolean; onToggle: () => void }) {
  return (
    <button
      onClick={onToggle}
      className={`w-12 h-6 rounded-full transition-all relative ${on ? 'bg-violet-500' : 'bg-white/15'}`}
    >
      <span className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all shadow ${on ? 'left-7' : 'left-1'}`} />
    </button>
  );
}

export default function SettingsPanel({ settings, onUpdate, onBack }: Props) {
  const t   = useT(settings.language);
  const set = <K extends keyof AppSettings>(key: K, val: AppSettings[K]) =>
    onUpdate({ ...settings, [key]: val });

  return (
    <div className="min-h-screen bg-[#07070f] px-4 py-8 max-w-lg mx-auto">
      <div className="flex items-center gap-3 mb-8">
        <button onClick={onBack} className="text-slate-500 hover:text-white transition text-lg">{t.back}</button>
        <h1 className="text-xl font-bold text-white">{t.settings}</h1>
      </div>

      <div className="space-y-4">

        {/* Language */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
          <p className="text-white font-medium mb-3">{t.language}</p>
          <div className="flex gap-2">
            {(['es', 'en'] as Lang[]).map(l => (
              <button
                key={l}
                onClick={() => set('language', l)}
                className={`flex-1 py-2 rounded-xl text-sm font-semibold transition ${
                  settings.language === l
                    ? 'bg-violet-600 text-white'
                    : 'bg-white/5 text-slate-400 hover:text-white'
                }`}
              >
                {l === 'es' ? '🇪🇸 Español' : '🇬🇧 English'}
              </button>
            ))}
          </div>
        </div>

        {/* Symbol colors */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white font-medium">{t.symbolColors}</p>
              <p className="text-slate-500 text-xs mt-0.5">{t.symbolColorsDesc}</p>
            </div>
            <Toggle on={settings.symbolColors} onToggle={() => set('symbolColors', !settings.symbolColors)} />
          </div>
          {settings.symbolColors && (
            <div className="mt-3 flex gap-3 text-lg font-bold font-mono">
              <span className="text-blue-400">+</span>
              <span className="text-orange-400">−</span>
              <span className="text-emerald-400">×</span>
              <span className="text-violet-400">÷</span>
              <span className="text-teal-400">√</span>
              <span className="text-yellow-400">%</span>
              <span className="text-rose-400">^</span>
            </div>
          )}
        </div>

        {/* Color theme */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
          <p className="text-white font-medium mb-3">{t.colorTheme}</p>
          <div className="flex gap-2">
            {[
              { id: 'default',    label: t.themeDefault,     swatch: ['bg-violet-500','bg-emerald-500','bg-rose-500'] },
              { id: 'colorblind', label: t.themeColorblind,  swatch: ['bg-sky-400','bg-cyan-400','bg-amber-400'] },
            ].map(opt => (
              <button
                key={opt.id}
                onClick={() => set('colorTheme', opt.id as AppSettings['colorTheme'])}
                className={`flex-1 p-3 rounded-xl border transition text-left ${
                  settings.colorTheme === opt.id
                    ? 'border-violet-500 bg-violet-500/10'
                    : 'border-white/10 bg-white/3 hover:border-white/25'
                }`}
              >
                <div className="flex gap-1 mb-2">
                  {opt.swatch.map((c, i) => <div key={i} className={`w-4 h-4 rounded-full ${c}`} />)}
                </div>
                <p className="text-white text-xs font-medium">{opt.label}</p>
              </button>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
