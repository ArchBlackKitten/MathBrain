import type { ProblemVisual } from '../types';

// ── Emoji Grid — grouped by 5 for fast subitizing ────────────────────────────

function EmojiGrid({ emoji, rows, cols }: { emoji: string; rows: number; cols: number }) {
  const total = rows * cols;
  const fontSize = total <= 25 ? 'text-2xl' : total <= 45 ? 'text-lg' : 'text-sm';

  // Flatten total emojis into groups of 5
  const groups: number[][] = [];
  let remaining = total;
  while (remaining > 0) {
    const size = Math.min(5, remaining);
    groups.push(Array.from({ length: size }, (_, i) => groups.flat().length + i));
    remaining -= size;
  }

  return (
    <div className="flex flex-col items-center gap-2 py-3 px-2">
      <div className="flex flex-wrap justify-center gap-2">
        {groups.map((group, gi) => (
          <div key={gi} className="flex gap-0.5 bg-white/5 rounded-lg px-1.5 py-1">
            {group.map((_, ei) => (
              <span key={ei} className={`${fontSize} leading-none`}>{emoji}</span>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Fraction Bar — items grouped by 5 ────────────────────────────────────────

const FRACTION_EMOJI = '🍌';

function FractionBar({ active, total }: { active: number; total: number }) {
  return (
    <div className="flex flex-col items-center gap-2 py-3">
      {/* Emoji row — active ones bright, rest faded */}
      <div className="flex gap-1 flex-wrap justify-center">
        {Array.from({ length: total }, (_, i) => (
          <span
            key={i}
            className={`text-3xl leading-none transition-all ${i < active ? 'opacity-100' : 'opacity-20 grayscale'}`}
          >
            {FRACTION_EMOJI}
          </span>
        ))}
      </div>

      {/* Bar grouped by 5 */}
      <div className="flex gap-1 flex-wrap justify-center">
        {Array.from({ length: total }, (_, i) => (
          <div
            key={i}
            className={`h-2.5 w-7 rounded-sm transition-all ${i < active ? 'bg-lime-400' : 'bg-white/15'} ${(i + 1) % 5 === 0 && i < total - 1 ? 'mr-2' : ''}`}
          />
        ))}
      </div>

      <p className="text-slate-400 text-sm font-mono">
        <span className="text-lime-400 font-bold">{active}</span>
        <span className="text-slate-600">/{total}</span>
      </p>
    </div>
  );
}

// ── Analog Clock ──────────────────────────────────────────────────────────────

function ClockFace({ hours, minutes }: { hours: number; minutes: number }) {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const cx = 50, cy = 50;
  const pt = (r: number, deg: number) => ({
    x: cx + r * Math.cos(toRad(deg - 90)),
    y: cy + r * Math.sin(toRad(deg - 90)),
  });

  const minAngle  = minutes * 6;
  const hourAngle = (hours % 12) * 30 + minutes * 0.5;
  const minTip    = pt(36, minAngle);
  const hourTip   = pt(26, hourAngle);

  return (
    <div className="flex flex-col items-center gap-1 py-3">
      <svg viewBox="0 0 100 100" className="w-36 h-36">
        <circle cx={cx} cy={cy} r="47" fill="#0d0d1a" stroke="#2d3748" strokeWidth="2" />
        {/* 5-minute tick marks highlighted */}
        {Array.from({ length: 60 }, (_, i) => {
          const isMajor = i % 5 === 0;
          const inner = pt(isMajor ? 36 : 40, i * 6);
          const outer = pt(43, i * 6);
          return (
            <line key={i}
              x1={inner.x} y1={inner.y} x2={outer.x} y2={outer.y}
              stroke={isMajor ? '#4a5568' : '#2d3748'}
              strokeWidth={isMajor ? 1.5 : 0.8}
              strokeLinecap="round"
            />
          );
        })}
        {/* Hour numbers */}
        {[12,1,2,3,4,5,6,7,8,9,10,11].map((n, i) => {
          const p = pt(32, i * 30);
          return <text key={n} x={p.x} y={p.y} textAnchor="middle" dominantBaseline="central" fontSize="7" fill="#718096">{n}</text>;
        })}
        {/* Minute hand */}
        <line x1={cx} y1={cy} x2={minTip.x} y2={minTip.y} stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" />
        {/* Hour hand */}
        <line x1={cx} y1={cy} x2={hourTip.x} y2={hourTip.y} stroke="white" strokeWidth="3.5" strokeLinecap="round" />
        <circle cx={cx} cy={cy} r="2.5" fill="white" />
      </svg>
      <p className="text-slate-300 text-base font-mono tracking-widest">
        {hours}:{String(minutes).padStart(2, '0')}
      </p>
    </div>
  );
}

// ── Entry point ───────────────────────────────────────────────────────────────

export default function VisualDisplay({ visual }: { visual: ProblemVisual }) {
  if (visual.type === 'emoji-grid' && visual.emoji && visual.rows && visual.cols)
    return <EmojiGrid emoji={visual.emoji} rows={visual.rows} cols={visual.cols} />;
  if (visual.type === 'fraction-bar' && visual.active !== undefined && visual.total)
    return <FractionBar active={visual.active} total={visual.total} />;
  if (visual.type === 'clock' && visual.hours !== undefined && visual.minutes !== undefined)
    return <ClockFace hours={visual.hours} minutes={visual.minutes} />;
  return null;
}
