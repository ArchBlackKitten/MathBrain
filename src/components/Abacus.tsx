import { useState } from 'react';

// Soroban (Japanese abacus): 4 columns (thousands, hundreds, tens, ones)
// Each column: 1 heaven bead (worth 5) + 4 earth beads (worth 1)

const COLS = 4;
const COL_LABELS = ['M', 'C', 'D', 'U'];

interface ColState {
  heaven: boolean;   // pushed down = active
  earth: number;     // 0-4 pushed up
}

function colValue(c: ColState) {
  return (c.heaven ? 5 : 0) + c.earth;
}

function totalValue(cols: ColState[]) {
  return cols.reduce((sum, c, i) => sum + colValue(c) * Math.pow(10, COLS - 1 - i), 0);
}

export default function Abacus({ onClose }: { onClose: () => void }) {
  const [cols, setCols] = useState<ColState[]>(
    Array.from({ length: COLS }, () => ({ heaven: false, earth: 0 }))
  );

  const toggleHeaven = (ci: number) => {
    setCols(prev => prev.map((c, i) => i === ci ? { ...c, heaven: !c.heaven } : c));
  };

  const setEarth = (ci: number, count: number) => {
    setCols(prev => prev.map((c, i) => i === ci ? { ...c, earth: count } : c));
  };

  const reset = () => setCols(Array.from({ length: COLS }, () => ({ heaven: false, earth: 0 })));

  const value = totalValue(cols);

  return (
    <div className="fixed bottom-4 right-4 z-50 bg-[#12121f] border border-white/15 rounded-2xl shadow-2xl p-4 w-64 select-none">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Ábaco Soroban</span>
        <button onClick={onClose} className="text-slate-600 hover:text-white transition text-sm">✕</button>
      </div>

      {/* Value display */}
      <div className="text-center mb-3 bg-white/5 rounded-xl py-2">
        <span className="text-2xl font-mono font-bold text-amber-400">{value}</span>
      </div>

      {/* Abacus grid */}
      <div className="flex justify-center gap-3">
        {cols.map((col, ci) => (
          <div key={ci} className="flex flex-col items-center gap-1">
            {/* Column label */}
            <span className="text-xs text-slate-600 font-mono mb-1">{COL_LABELS[ci]}</span>

            {/* Heaven bead */}
            <button
              onClick={() => toggleHeaven(ci)}
              title={col.heaven ? 'Quitar 5' : 'Agregar 5'}
              className={`w-8 h-6 rounded-full border-2 transition-all ${
                col.heaven
                  ? 'bg-amber-400 border-amber-300 shadow-lg shadow-amber-500/40'
                  : 'bg-white/10 border-white/20 hover:border-amber-400/50'
              }`}
            />

            {/* Divider */}
            <div className="w-full h-px bg-white/20 my-1" />

            {/* Earth beads (4) — click bead N to set earth = N */}
            {[4, 3, 2, 1].map(n => (
              <button
                key={n}
                onClick={() => setEarth(ci, col.earth === n ? n - 1 : n)}
                title={`${n} unidad${n > 1 ? 'es' : ''}`}
                className={`w-8 h-5 rounded-full border-2 transition-all ${
                  n <= col.earth
                    ? 'bg-sky-400 border-sky-300 shadow shadow-sky-500/40'
                    : 'bg-white/10 border-white/20 hover:border-sky-400/50'
                }`}
              />
            ))}

            {/* Column value */}
            <span className="text-xs text-slate-500 font-mono mt-1">{colValue(col)}</span>
          </div>
        ))}
      </div>

      {/* Reset */}
      <button
        onClick={reset}
        className="w-full mt-3 text-xs text-slate-600 hover:text-slate-400 transition border border-white/5 rounded-xl py-1.5"
      >
        Reiniciar
      </button>

      <p className="text-xs text-slate-700 text-center mt-2">
        Clic bead dorado = ±5 · beads azules = ±1
      </p>
    </div>
  );
}
