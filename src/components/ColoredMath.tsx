// Colored math symbols help users with dyslexia / dyscalculia distinguish operators quickly.

const SYMBOL_COLORS: Record<string, string> = {
  '+':  'text-blue-400',
  '−':  'text-orange-400',
  '-':  'text-orange-400',
  '×':  'text-emerald-400',
  '÷':  'text-violet-400',
  '√':  'text-teal-400',
  '%':  'text-yellow-400',
  '^':  'text-rose-400',
  '²':  'text-rose-400',
  '³':  'text-rose-400',
  '=':  'text-slate-400',
  '/':  'text-violet-400',
};

// Colorblind-safe overrides (deuteranopia-friendly — no red/green reliance)
const SYMBOL_COLORS_CB: Record<string, string> = {
  '+':  'text-sky-300',
  '−':  'text-amber-300',
  '-':  'text-amber-300',
  '×':  'text-cyan-300',
  '÷':  'text-purple-300',
  '√':  'text-indigo-300',
  '%':  'text-yellow-200',
  '^':  'text-pink-300',
  '²':  'text-pink-300',
  '³':  'text-pink-300',
  '=':  'text-slate-400',
  '/':  'text-purple-300',
};

// Split question into alternating text/symbol tokens
function tokenize(q: string): { text: string; isSymbol: boolean }[] {
  const parts = q.split(/([+−\-×÷√%^²³=/])/).filter(Boolean);
  return parts.map(t => ({
    text: t,
    isSymbol: /^[+−\-×÷√%^²³=/]$/.test(t),
  }));
}

interface Props {
  question: string;
  colorSymbols: boolean;
  colorblind?: boolean;
  className?: string;
}

export default function ColoredMath({ question, colorSymbols, colorblind = false, className = '' }: Props) {
  if (!colorSymbols) {
    return <span className={className}>{question}</span>;
  }

  const palette = colorblind ? SYMBOL_COLORS_CB : SYMBOL_COLORS;
  const tokens  = tokenize(question);

  return (
    <span className={className}>
      {tokens.map((t, i) =>
        t.isSymbol && palette[t.text] ? (
          <span key={i} className={`${palette[t.text]} font-bold`}>{t.text}</span>
        ) : (
          <span key={i}>{t.text}</span>
        )
      )}
    </span>
  );
}
