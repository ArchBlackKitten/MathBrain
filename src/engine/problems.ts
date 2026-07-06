import type { CategoryId, Problem, ProblemLevel, ProblemVisual } from '../types';

let _id = 0;
const uid = () => `p${Date.now()}${_id++}`;

function gcd(a: number, b: number): number { return b === 0 ? a : gcd(b, a % b); }
function rand(min: number, max: number) { return Math.floor(Math.random() * (max - min + 1)) + min; }
function pick<T>(arr: T[]): T { return arr[rand(0, arr.length - 1)]; }
function round2(n: number) { return Math.round(n * 100) / 100; }

const EMOJIS = ['🍉','🍎','🍊','🍋','🍇','🍓','🥝','⭐','🏀','🎯','🌸','🦋','🐬','🦊','💎','🚀','🐙','🦄','🍕','🎸'];

// Helper: pick from a shorthand data array {q, a, hint}
type QA = { q: string; a: number; hint?: string };
function mkq(items: QA[]): GenResult {
  const { q, a, hint } = pick(items);
  return { question: q, answer: a, hint };
}

// ── Progressive expression builder ────────────────────────────────────────────
// As the user masters a level, `complexity` (0..3) grows and problems get LONGER
// and more laborious — extra terms, parentheses, exponents and roots — without
// jumping in conceptual difficulty. The returned `terms` is a difficulty weight
// used to scale the time limit (see SEC_PER_TERM below).

export const SEC_PER_TERM = 4; // extra seconds granted per unit of expression weight

type Atom = { str: string; val: number; weight: number };
type ExprKind = 'add' | 'sub' | 'mul' | 'neg';

function makeAtom(level: ProblemLevel, complexity: number, allowFancy: boolean): Atom {
  const size = [12, 40, 120, 400][level - 1];
  const r = Math.random();
  if (allowFancy && complexity >= 2 && level >= 3 && r < 0.15) {
    // √ of a perfect square
    const k = rand(2, [6, 8, 10, 12][level - 1]);
    return { str: `√${k * k}`, val: k, weight: 2 };
  }
  if (allowFancy && complexity >= 2 && level >= 2 && r < 0.32) {
    // small square / cube
    const useCube = level >= 4 && Math.random() < 0.35;
    const k = rand(2, useCube ? 5 : level >= 3 ? 9 : 6);
    return useCube
      ? { str: `${k}³`, val: k * k * k, weight: 2 }
      : { str: `${k}²`, val: k * k, weight: 2 };
  }
  if (allowFancy && complexity >= 1 && r < 0.45) {
    // product
    const a = rand(2, level >= 3 ? 12 : 9);
    const b = rand(2, 6);
    return { str: `${a}×${b}`, val: a * b, weight: 2 };
  }
  const v = rand(1, size);
  return { str: `${v}`, val: v, weight: 1 };
}

function buildExpression(kind: ExprKind, level: ProblemLevel, complexity: number): GenResult {
  const nAtoms = 2 + complexity; // 2..5
  const allowFancy = kind !== 'neg' || complexity >= 1;
  let parts: Atom[] = Array.from({ length: nAtoms }, () => makeAtom(level, complexity, allowFancy));

  // At high complexity, wrap the first two atoms in a parenthesised group × factor
  let parenBonus = 0;
  if (complexity >= 2 && parts.length >= 3 && Math.random() < 0.6) {
    const g = parts[0].val + parts[1].val;
    const f = rand(2, 4);
    const w = parts[0].weight + parts[1].weight + 1;
    parts.splice(0, 2, { str: `${f}×(${parts[0].str} + ${parts[1].str})`, val: f * g, weight: w });
    parenBonus = 1;
  }

  let val = parts[0].val;
  let q = parts[0].str;
  for (let i = 1; i < parts.length; i++) {
    const wantMinus = kind === 'sub'
      ? Math.random() < 0.7
      : kind === 'neg'
        ? Math.random() < 0.5
        : Math.random() < 0.35;
    // Non-negative kinds keep the running total ≥ 0
    if (wantMinus && (kind === 'neg' || val - parts[i].val >= 0)) {
      val -= parts[i].val; q += ` − ${parts[i].str}`;
    } else {
      val += parts[i].val; q += ` + ${parts[i].str}`;
    }
  }

  const weight = parts.reduce((s, p) => s + p.weight, 0) + parenBonus;
  return { question: q, answer: val, terms: Math.min(weight, 8) };
}

function divisionExpr(level: ProblemLevel, complexity: number): GenResult {
  const bMax = [5, 10, 12, 20][level - 1];
  const qMax = [10, 20, 30, 50][level - 1];
  const b = rand(2, bMax), q = rand(1, qMax);
  let val = q;
  let str = `${b * q} ÷ ${b}`;
  let weight = 2;
  for (let i = 0; i < complexity; i++) {
    const k = rand(1, [10, 20, 30, 40][level - 1]);
    if (Math.random() < 0.5 && val - k >= 0) { val -= k; str += ` − ${k}`; }
    else { val += k; str += ` + ${k}`; }
    weight += 1;
  }
  return { question: str, answer: val, terms: Math.min(weight, 8) };
}

function decimalExpr(level: ProblemLevel, complexity: number): GenResult {
  const nTerms = 2 + complexity;
  const scale = [10, 10, 100, 100][level - 1];
  const size = [20, 50, 80, 150][level - 1];
  let val = 0;
  const strs: string[] = [];
  for (let i = 0; i < nTerms; i++) {
    const d = round2(rand(1, size * scale) / scale);
    if (i === 0 || Math.random() < 0.5 || val - d < 0) { val = round2(val + d); strs.push(`+ ${d}`); }
    else { val = round2(val - d); strs.push(`− ${d}`); }
  }
  const q = strs.join(' ').replace(/^\+ /, '');
  return { question: q, answer: val, terms: Math.min(nTerms, 8) };
}

// ── Basic Arithmetic ──────────────────────────────────────────────────────────

function addition(level: ProblemLevel, complexity = 0) {
  if (complexity > 0) return buildExpression('add', level, complexity);
  const max = [10, 50, 200, 999][level - 1];
  const a = rand(1, max), b = rand(1, max);
  return { question: `${a} + ${b}`, answer: a + b };
}

function subtraction(level: ProblemLevel, complexity = 0) {
  if (complexity > 0) return buildExpression('sub', level, complexity);
  const max = [10, 50, 200, 999][level - 1];
  let a = rand(1, max), b = rand(1, max);
  if (b > a) [a, b] = [b, a];
  return { question: `${a} − ${b}`, answer: a - b };
}

function multiplication(level: ProblemLevel, complexity = 0) {
  if (complexity > 0) return buildExpression('mul', level, complexity);
  if (level === 1) {
    // Level 1: always show emoji grid
    const a = rand(2, 6), b = rand(2, 6);
    return {
      question: `${a} × ${b}`,
      answer: a * b,
      visual: { type: 'emoji-grid' as const, emoji: pick(EMOJIS), rows: a, cols: b },
    };
  }
  const ranges: [number, number][] = [[2, 12], [3, 20], [5, 50]];
  const [lo, hi] = ranges[level - 2];
  const a = rand(lo, hi), b = rand(lo, hi);
  // Show visual when factors are still small enough to count
  if (a <= 5 && b <= 5) {
    return {
      question: `${a} × ${b}`,
      answer: a * b,
      visual: { type: 'emoji-grid' as const, emoji: pick(EMOJIS), rows: a, cols: b },
    };
  }
  return { question: `${a} × ${b}`, answer: a * b };
}

function division(level: ProblemLevel, complexity = 0) {
  if (complexity > 0) return divisionExpr(level, complexity);
  const bMax = [5, 10, 12, 20][level - 1];
  const qMax = [10, 20, 30, 50][level - 1];
  const b = rand(2, bMax), q = rand(1, qMax);
  const a = b * q;
  // Visual: show groups when small enough
  if (a <= 30 && b <= 6) {
    return {
      question: `${a} ÷ ${b}`,
      answer: q,
      visual: { type: 'emoji-grid' as const, emoji: pick(EMOJIS), rows: q, cols: b } as ProblemVisual,
      hint: `${a} objetos en ${b} grupos iguales → ${q} por grupo`,
    };
  }
  return { question: `${a} ÷ ${b}`, answer: q };
}

function percentage(level: ProblemLevel) {
  const pools = [[10, 25, 50], [5, 10, 20, 25, 50], [10, 20, 30, 40, 75], [5, 15, 35, 45, 60]];
  const pct  = pick(pools[level - 1]);
  const factor = 100 / gcd(pct, 100);
  const base = factor * rand(1, [10, 20, 30, 50][level - 1]);
  return { question: `${pct}% de ${base}`, answer: Math.round((pct * base) / 100) };
}

function power(level: ProblemLevel) {
  const cfg: [number, number, number, number][] = [[2,5,2,3],[2,8,2,3],[2,10,2,4],[2,12,2,4]];
  const [blo, bhi, elo, ehi] = cfg[level - 1];
  const b = rand(blo, bhi), e = rand(elo, ehi);
  return { question: `${b}^${e}`, answer: Math.pow(b, e) };
}

function squareRoot(level: ProblemLevel) {
  const r = rand(2, [10, 15, 20, 30][level - 1]);
  return { question: `√${r * r}`, answer: r };
}

// ── Algebra ───────────────────────────────────────────────────────────────────

function algebra(level: ProblemLevel) {
  if (level === 1) {
    // x + a = b
    const x = rand(1, 10), a = rand(1, 10);
    return { question: `x + ${a} = ${x + a}  →  x = ?`, answer: x, hint: `x = ${x+a} − ${a} = ${x}` };
  }
  if (level === 2) {
    // ax + b = c
    const a = rand(2, 6), x = rand(1, 10), b = rand(1, 20);
    return {
      question: `${a}x + ${b} = ${a*x+b}  →  x = ?`,
      answer: x,
      hint: `${a}x = ${a*x+b}−${b} = ${a*x} → x = ${a*x}÷${a} = ${x}`,
    };
  }
  if (level === 3) {
    // ax + b = cx + d  (a > c, ensure real x)
    const a = rand(3, 8), c = rand(1, a - 1);
    const x = rand(1, 10);
    const diff = rand(1, 20);
    const d = c * x + diff;
    const b = a * x - (d - c * x);
    if (b < 0) return algebra(level);
    return {
      question: `${a}x + ${b} = ${c}x + ${d}  →  x = ?`,
      answer: x,
      hint: `(${a}-${c})x = ${d}-${b} → ${a-c}x = ${d-b} → x = ${x}`,
    };
  }
  // Level 4: quadratic with integer roots
  const r1 = rand(1, 8), r2 = rand(1, 8);
  const bCoef = -(r1 + r2), cCoef = r1 * r2;
  const bStr = bCoef < 0 ? `− ${Math.abs(bCoef)}` : `+ ${bCoef}`;
  const cStr = cCoef > 0 ? `+ ${cCoef}` : `− ${Math.abs(cCoef)}`;
  return {
    question: `x² ${bStr}x ${cStr} = 0. ¿Raíz menor?`,
    answer: Math.min(r1, r2),
    hint: `Factoriza: (x−${r1})(x−${r2})=0 → x=${r1} ó x=${r2}`,
  };
}

// ── Geometry ──────────────────────────────────────────────────────────────────

function geometry(level: ProblemLevel) {
  if (level === 1) {
    const type = pick(['perimeter','angle_tri','angle_supp'] as const);
    if (type === 'perimeter') {
      const w = rand(2, 15), h = rand(2, 15);
      return { question: `Perímetro de rectángulo ${w}×${h}`, answer: 2*(w+h), hint: `P=2×(${w}+${h})=${2*(w+h)}` };
    }
    if (type === 'angle_tri') {
      // Third angle of triangle
      const a = pick([30,40,45,50,60,70,80]), b = pick([30,40,45,50,60,70]);
      if (a + b >= 180) return { question: `Ángulos de triángulo: 60° y 60°. ¿Tercero?`, answer: 60, hint: `60+60+?=180 → ?=60` };
      return { question: `Triángulo: ángulos ${a}° y ${b}°. ¿Tercer ángulo?`, answer: 180-a-b, hint: `La suma de ángulos en triángulo = 180°: ${a}+${b}+?=180 → ?=${180-a-b}` };
    }
    // Supplementary/complementary angles
    const a = rand(20, 80);
    const type2 = pick(['supp','comp'] as const);
    if (type2 === 'supp') return { question: `Ángulos suplementarios: uno es ${a}°. ¿El otro?`, answer: 180-a, hint: `Suplementarios suman 180°: 180−${a}=${180-a}` };
    return { question: `Ángulos complementarios: uno es ${a}°. ¿El otro?`, answer: 90-a, hint: `Complementarios suman 90°: 90−${a}=${90-a}` };
  }
  if (level === 2) {
    const type = pick(['area_rect','area_tri','area_square','symmetry'] as const);
    if (type === 'area_square') {
      const s = rand(2, 15);
      return { question: `Área de cuadrado, lado ${s}`, answer: s*s, hint: `A=lado²=${s}²=${s*s}` };
    }
    if (type === 'area_rect') {
      const w = rand(2, 20), h = rand(2, 20);
      return { question: `Área de rectángulo ${w}×${h}`, answer: w*h, hint: `A=${w}×${h}=${w*h}` };
    }
    if (type === 'area_tri') {
      const b = rand(2, 20), h = (rand(2, 10)) * 2;
      return { question: `Área triángulo, base ${b}, altura ${h}`, answer: (b*h)/2, hint: `A=base×altura÷2=${b*h/2}` };
    }
    // Ejes de simetría
    return mkq([
      { q: `¿Cuántos ejes de simetría tiene un cuadrado?`,             a: 4,  hint: `4 diagonales + horizontales + verticales = 4` },
      { q: `¿Cuántos ejes de simetría tiene un triángulo equilátero?`, a: 3,  hint: `Una por cada vértice = 3` },
      { q: `¿Cuántos ejes de simetría tiene un rectángulo?`,           a: 2,  hint: `Solo horizontal y vertical = 2` },
      { q: `¿Cuántos ejes de simetría tiene un círculo?`,              a: 0,  hint: `Infinitos, pero como número exacto preguntamos: ∞ → en este contexto responde 0 para "no se puede contar"` },
      { q: `¿Cuántos ejes de simetría tiene un pentágono regular?`,    a: 5,  hint: `Uno por cada lado/vértice` },
      { q: `¿Cuántos ejes de simetría tiene un hexágono regular?`,     a: 6,  hint: `6 ejes para polígono regular de 6 lados` },
    ]);
  }
  if (level === 3) {
    const type = pick(['circle','volume','interior_angle'] as const);
    if (type === 'circle') {
      const r = rand(1, 10);
      const area = Math.round(3.14159 * r * r);
      const circ = Math.round(2 * 3.14159 * r);
      return pick([
        { question: `Área del círculo, radio ${r} (π≈3.14)`, answer: area, hint: `A=π×r²≈3.14×${r}²≈${area}` },
        { question: `Circunferencia, radio ${r} (π≈3.14)`,   answer: circ, hint: `C=2πr≈2×3.14×${r}≈${circ}` },
      ]);
    }
    if (type === 'volume') {
      const l = rand(2, 10), w = rand(2, 10), h = rand(2, 10);
      return { question: `Volumen de caja ${l}×${w}×${h}`, answer: l*w*h, hint: `V=l×w×h=${l*w*h}` };
    }
    // Ángulo interior de polígono regular = (n-2)×180/n
    const n = pick([3, 4, 5, 6, 8, 9, 10, 12]);
    const angle = (n - 2) * 180 / n;
    return { question: `Ángulo interior de polígono regular de ${n} lados`, answer: angle, hint: `(${n}-2)×180÷${n}=${(n-2)*180}÷${n}=${angle}°` };
  }
  // Level 4: Pitágoras + diagonal de rectángulo + pendiente
  const type = pick(['pythag','diagonal','slope'] as const);
  if (type === 'pythag') {
    const triples: [number,number,number][] = [[3,4,5],[5,12,13],[8,15,17],[7,24,25],[6,8,10],[9,12,15]];
    const [a, b, c] = pick(triples), k = rand(1, 3);
    return { question: `Triángulo rectángulo: catetos ${a*k} y ${b*k}. ¿Hipotenusa?`, answer: c*k, hint: `√(${(a*k)**2}+${(b*k)**2})=${c*k}` };
  }
  if (type === 'diagonal') {
    const triples: [number,number,number][] = [[3,4,5],[5,12,13],[6,8,10],[9,12,15]];
    const [a, b, c] = pick(triples), k = rand(1, 2);
    return { question: `Diagonal del rectángulo ${a*k}×${b*k}`, answer: c*k, hint: `d=√(${a*k}²+${b*k}²)=${c*k}` };
  }
  // Pendiente
  const x1 = rand(0, 3), y1 = rand(0, 3), x2 = rand(x1+1, x1+5), y2 = rand(y1+1, y1+5);
  const slope = y2 - y1; // only integer slopes
  return { question: `Pendiente entre (${x1},${y1}) y (${x2},${y1+slope}). ¿m?`, answer: slope/(x2-x1), hint: `m=(${y1+slope}-${y1})÷(${x2}-${x1})=${slope}÷${x2-x1}=${round2(slope/(x2-x1))}` };
}

// ── Fractions ─────────────────────────────────────────────────────────────────

function fractions(level: ProblemLevel) {
  if (level === 1) {
    // Lectura visual de fracción
    const denom = rand(2, 5), numer = rand(1, denom - 1);
    return {
      question: `¿Cuántas partes están marcadas?`,
      answer: numer,
      visual: { type: 'fraction-bar' as const, active: numer, total: denom } as ProblemVisual,
      hint: `Fracción ${numer}/${denom}: hay ${numer} partes activas de ${denom}`,
    };
  }
  if (level === 2) {
    // Fracción de un número + suma/resta mismo denominador
    const type = pick(['of_num','add_sub'] as const);
    if (type === 'of_num') {
      const denom = rand(2, 6), numer = rand(1, denom - 1), mult = rand(2, 8);
      const whole = denom * mult;
      return {
        question: `¿Cuánto es ${numer}/${denom} de ${whole}?`,
        answer: numer * mult,
        visual: { type: 'fraction-bar' as const, active: numer, total: denom } as ProblemVisual,
        hint: `${whole}÷${denom}×${numer}=${mult}×${numer}=${numer*mult}`,
      };
    }
    // Suma/resta mismo denominador → numerador resultado
    const denom = rand(3, 8), a = rand(1, denom - 2), b = rand(1, denom - a - 1);
    const op = pick(['+', '-'] as const);
    const ans = op === '+' ? a + b : a - b;
    return { question: `${a}/${denom} ${op} ${b}/${denom} = ?/${denom} (¿el numerador?)`, answer: ans, hint: `Mismo denominador: ${a}${op}${b}=${ans}` };
  }
  if (level === 3) {
    // Suma/resta denominadores distintos, multiplicación de fracciones
    const type = pick(['diff_denom','multiply','simplify'] as const);
    if (type === 'diff_denom') {
      // Result is always integer for simplicity
      const pairs = [[1,2,1,4],[1,3,1,6],[2,3,1,3],[3,4,1,4],[1,2,1,6],[2,5,1,5]] as [number,number,number,number][];
      const [n1,d1,n2,d2] = pick(pairs);
      const lcm = d1*d2/gcd(d1,d2);
      const ans = (n1*(lcm/d1) + n2*(lcm/d2));
      return { question: `${n1}/${d1} + ${n2}/${d2} = ? (numerador sobre ${lcm})`, answer: ans, hint: `MCM=${lcm}: ${n1*(lcm/d1)}/${lcm}+${n2*(lcm/d2)}/${lcm}=${ans}/${lcm}` };
    }
    if (type === 'multiply') {
      // (a/b)×(c/d) → result as decimal
      const pairs = [[1,2,1,2,0.25],[2,3,3,4,0.5],[1,4,4,1,1],[3,4,2,3,0.5],[1,3,3,2,0.5]] as [number,number,number,number,number][];
      const [a,b,c,d,ans] = pick(pairs);
      return { question: `(${a}/${b}) × (${c}/${d}) = ?`, answer: ans, hint: `Numeradores: ${a}×${c}=${a*c}. Denominadores: ${b}×${d}=${b*d}. Simplifica: ${ans}` };
    }
    // Fracciones de un entero con denominador mayor
    const denom = rand(4, 10), numer = rand(1, denom-1), mult = rand(3, 12);
    return { question: `${numer}/${denom} de ${denom*mult} = ?`, answer: numer*mult, hint: `${denom*mult}÷${denom}×${numer}=${mult}×${numer}=${numer*mult}` };
  }
  // Level 4: división de fracciones, números mixtos, comparación
  const type = pick(['divide','mixed','compare'] as const);
  if (type === 'divide') {
    const divPairs = [[3,4,1,2,1.5],[2,3,1,3,2],[5,6,1,3,2.5],[1,2,1,4,2],[3,5,3,10,2]] as [number,number,number,number,number][];
    const [a,b,c,d,ans] = pick(divPairs);
    return { question: `(${a}/${b}) ÷ (${c}/${d}) = ?`, answer: ans, hint: `Invertir y multiplicar: ${a}/${b}×${d}/${c}=${a*d}/${b*c}=${ans}` };
  }
  if (type === 'mixed') {
    // Número mixto → fracción impropia
    const w = rand(1,4), n = rand(1,5), d = rand(2,6);
    return { question: `${w} y ${n}/${d} como fracción impropia: ?/${d} (numerador)`, answer: w*d+n, hint: `${w}×${d}+${n}=${w*d+n}` };
  }
  // Comparación: qué fracción es mayor (responde el numerador mayor como pista)
  const d1 = rand(2,5), n1 = rand(1,d1-1), d2 = rand(2,5), n2 = rand(1,d2-1);
  const v1 = n1/d1, v2 = n2/d2;
  return { question: `¿Es mayor ${n1}/${d1} o ${n2}/${d2}? (responde 1 si ${n1}/${d1}, 2 si ${n2}/${d2})`, answer: v1 >= v2 ? 1 : 2, hint: `${n1}/${d1}=${round2(v1)}, ${n2}/${d2}=${round2(v2)}` };
}

// ── Clock Time ────────────────────────────────────────────────────────────────

function clockTime(level: ProblemLevel) {
  if (level === 1) {
    const h = rand(1, 12), m = pick([0, 15, 30, 45]);
    return { question: `¿Cuántos minutos pasaron desde las ${h}:00?`, answer: m, visual: { type: 'clock' as const, hours: h, minutes: m } as ProblemVisual };
  }
  if (level === 2) {
    const h = rand(1, 11), m = pick([5,10,15,20,25,30,35,40,45,50]);
    return { question: `Son las ${h}:${String(m).padStart(2,'0')}. ¿Minutos para las ${h+1}:00?`, answer: 60-m, visual: { type: 'clock' as const, hours: h, minutes: m } as ProblemVisual };
  }
  if (level === 3) {
    const h1 = rand(1, 10), m1 = pick([0, 15, 30, 45]);
    const addH = rand(0, 2), addM = pick([15, 30, 45]);
    const total = addH * 60 + addM;
    const endMin = h1 * 60 + m1 + total;
    const h2 = Math.floor(endMin / 60) % 12 || 12, m2 = endMin % 60;
    return { question: `De ${h1}:${String(m1).padStart(2,'0')} a ${h2}:${String(m2).padStart(2,'0')}, ¿cuántos minutos?`, answer: total, visual: { type: 'clock' as const, hours: h1, minutes: m1 } as ProblemVisual };
  }
  const h1 = rand(6, 10), m1 = pick([0, 15, 30]);
  const durH = rand(1, 4), durM = pick([0, 15, 30, 45]);
  return { question: `Clase desde ${h1}:${String(m1).padStart(2,'0')}, dura ${durH}h ${durM}min. ¿Total minutos?`, answer: durH*60+durM, visual: { type: 'clock' as const, hours: h1, minutes: m1 } as ProblemVisual };
}

// ── Calendar Math ─────────────────────────────────────────────────────────────

const MONTHS = ['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre'];
const DAYS_IN = [31,28,31,30,31,30,31,31,30,31,30,31];

function calendarMath(level: ProblemLevel) {
  if (level === 1) {
    const i = rand(0, 11);
    return { question: `¿Cuántos días tiene ${MONTHS[i]}?`, answer: DAYS_IN[i] };
  }
  if (level === 2) {
    const weeks = rand(2, 20);
    return rand(0, 1) === 0
      ? { question: `¿Cuántos días son ${weeks} semanas?`, answer: weeks * 7 }
      : { question: `¿Cuántas semanas completas en ${weeks*7+rand(1,6)} días?`, answer: weeks };
  }
  if (level === 3) {
    const mi = rand(0, 10), d1 = rand(1, DAYS_IN[mi] - 15), d2 = rand(d1+5, d1+15);
    return { question: `¿Días del ${d1} al ${d2} de ${MONTHS[mi]}?`, answer: d2-d1 };
  }
  const mi = rand(0, 10), d1 = rand(1, DAYS_IN[mi]-20), add = rand(5, 40);
  const d2raw = d1 + add;
  if (d2raw <= DAYS_IN[mi]) return { question: `Hoy es ${d1} de ${MONTHS[mi]}, ¿qué día será en ${add} días?`, answer: d2raw };
  return { question: `Hoy es ${d1} de ${MONTHS[mi]}, ¿qué día de ${MONTHS[mi+1]} será en ${add} días?`, answer: d2raw - DAYS_IN[mi] };
}

// ── Money & Finances ──────────────────────────────────────────────────────────

function moneyMath(level: ProblemLevel) {
  if (level === 1) {
    const type = pick(['change','tip10','bills'] as const);
    if (type === 'change') {
      const cents = pick([25,50,75,99,30,45,60,80,15,35]);
      const price = rand(1,19) + cents/100;
      const pays  = Math.ceil(price / 5) * 5;
      return { question: `Compraste $${price.toFixed(2)}, pagas $${pays}. ¿Cambio?`, answer: round2(pays-price), hint: `${pays}−${price.toFixed(2)}=${round2(pays-price)}` };
    }
    if (type === 'tip10') {
      const bill = pick([20,30,40,50,60,80,100,120,150,200]);
      return { question: `Cuenta $${bill}. Propina 10%. ¿Cuánto dejas?`, answer: bill/10, hint: `10% = mover el punto decimal: ${bill}÷10=$${bill/10}` };
    }
    // Bills: how much total
    const tens = rand(1,5), fives = rand(0,3), ones = rand(0,4);
    const total = tens*10 + fives*5 + ones;
    return { question: `Tienes ${tens} billete(s) de $10, ${fives} de $5 y ${ones} de $1. ¿Total?`, answer: total, hint: `${tens}×10 + ${fives}×5 + ${ones} = ${total}` };
  }

  if (level === 2) {
    const type = pick(['tip15','tip20','discount','split2'] as const);
    if (type === 'tip15') {
      const bill = pick([20,40,60,80,100,120,160,200]);
      const tip  = round2(bill * 0.15);
      return { question: `Cuenta $${bill}. Propina 15%. ¿Propina?`, answer: tip, hint: `10%=$${bill/10} + 5%=$${bill/20} → $${tip}` };
    }
    if (type === 'tip20') {
      const bill = pick([25,30,45,50,60,75,90,100,150]);
      const tip  = round2(bill * 0.20);
      return { question: `Cuenta $${bill}. Propina 20%. ¿Propina?`, answer: tip, hint: `20% = ${bill}÷5 = $${tip}` };
    }
    if (type === 'discount') {
      const price = pick([20,30,40,50,60,80,100,120,150,200]);
      const disc  = pick([10,20,25,50]);
      const final = round2(price*(1-disc/100));
      return { question: `Precio $${price}, descuento ${disc}%. ¿Precio final?`, answer: final, hint: `$${price} × ${1-disc/100} = $${final}` };
    }
    // Split between 2
    const bill = pick([30,40,50,60,80,100,120]); const ppl = 2;
    const each = round2(bill/ppl);
    return { question: `Cuenta $${bill} entre ${ppl} personas iguales. ¿Cada quien?`, answer: each, hint: `$${bill}÷${ppl}=$${each}` };
  }

  if (level === 3) {
    const type = pick(['tip18','split_tip','double_disc','deal','markup'] as const);
    if (type === 'tip18') {
      const bill = pick([50,60,80,100,120,150,200]);
      const tip  = round2(bill * 0.18);
      return { question: `Cuenta $${bill}. Propina 18%. ¿Propina?`, answer: tip, hint: `18% = 10%+5%+3% → $${bill/10}+$${bill/20}+$${round2(bill*0.03)}=$${tip}` };
    }
    if (type === 'split_tip') {
      const ppl  = pick([3,4,5]);
      const base = ppl * pick([10,15,20,25]);
      const tip  = pick([15,20]);
      const total = round2(base*(1+tip/100));
      const each  = round2(total/ppl);
      return { question: `Cuenta $${base}, ${ppl} personas, propina ${tip}%. ¿Cada quien?`, answer: each, hint: `Total=$${total}÷${ppl}=$${each}` };
    }
    if (type === 'double_disc') {
      const price = pick([100,200,150,80,120]);
      const d1 = pick([20,30,10]), d2 = pick([10,5,15]);
      const after1 = round2(price*(1-d1/100));
      const final  = round2(after1*(1-d2/100));
      return { question: `$${price}, primero ${d1}% off, luego ${d2}% off adicional. ¿Final?`, answer: final, hint: `$${price}→$${after1}→$${final}` };
    }
    if (type === 'deal') {
      // Buy X get 1 free — effective price per unit
      const unit = pick([5,8,10,12,15,20]);
      const qty  = pick([3,4,5]);
      const pay  = (qty-1)*unit;
      return { question: `Compra ${qty-1} y lleva ${qty} (1 gratis). Precio unitario $${unit}. ¿Total a pagar?`, answer: pay, hint: `Pagas ${qty-1} unidades: ${qty-1}×$${unit}=$${pay}` };
    }
    // Markup
    const cost = pick([20,30,40,50,60,80,100]);
    const markup = pick([25,50,100,20,40]);
    const sell = round2(cost*(1+markup/100));
    return { question: `Costo $${cost}, margen de ganancia ${markup}%. ¿Precio de venta?`, answer: sell, hint: `$${cost}×${1+markup/100}=$${sell}` };
  }

  // Level 4: comparar precios por unidad, presupuesto, puntos de lealtad, vuelto exacto, propina rara
  const type = pick(['unitprice','budget','loyalty','exact_change','tip19'] as const);
  if (type === 'unitprice') {
    const [q1,p1,q2,p2] = pick([
      [6,3.00,8,3.60],[3,2.70,5,4.00],[12,7.20,9,5.85],[4,1.80,7,2.94],
    ]);
    const u1 = round2(p1/q1), u2 = round2(p2/q2);
    const cheaper = u1 < u2 ? q1 : q2;
    return { question: `Paquete A: ${q1} und por $${p1}. Paquete B: ${q2} und por $${p2}. ¿Cuál es más barato por unidad? (escribe el tamaño)`, answer: cheaper, hint: `A=$${u1}/und, B=$${u2}/und → elige $${Math.min(u1,u2)}/und` };
  }
  if (type === 'budget') {
    const budget = pick([50,80,100,120,150]);
    const spent1 = pick([15,20,25,30,35]);
    const spent2 = pick([10,15,18,22,28]);
    const left = budget - spent1 - spent2;
    return { question: `Presupuesto $${budget}. Gastaste $${spent1} y luego $${spent2}. ¿Te queda?`, answer: left, hint: `${budget}−${spent1}−${spent2}=${left}` };
  }
  if (type === 'loyalty') {
    const purchase = pick([50,80,100,120,150,200]);
    const pct = pick([3,5,2,4]);
    const pts = Math.round(purchase * pct / 100 * 100);
    return { question: `Compra $${purchase}. Ganas ${pct}% en puntos (1 punto = $0.01). ¿Cuántos puntos?`, answer: pts, hint: `${purchase}×${pct}%=$${purchase*pct/100} → ${pts} puntos` };
  }
  if (type === 'exact_change') {
    const price = rand(20,60) + pick([0.37,0.63,0.49,0.78,0.15,0.82]);
    const pays  = Math.ceil(price);
    const change = round2(pays - price);
    return { question: `Cuentas exactas: artículo $${price.toFixed(2)}, pagas $${pays}. ¿Cambio exacto en centavos?`, answer: Math.round(change*100), hint: `${pays}−$${price.toFixed(2)}=$${change} = ${Math.round(change*100)}¢` };
  }
  // tip 19% (tricky mental)
  const bill = pick([50,80,100,120,150,200]);
  const tip  = round2(bill * 0.19);
  return { question: `Cuenta $${bill}. Propina 19%. ¿Propina?`, answer: tip, hint: `20%=$${bill*0.2} menos 1%=$${bill*0.01} → $${tip}` };
}

// ── Medidas & Conversiones ────────────────────────────────────────────────────

function converting(level: ProblemLevel) {
  if (level === 1) {
    // Metric — length, mass, volume (easy ×1000 / ÷1000)
    return mkq([
      { q: `3 km = ? m`,    a: 3000, hint: `1 km = 1000 m` },
      { q: `5 kg = ? g`,    a: 5000, hint: `1 kg = 1000 g` },
      { q: `2000 m = ? km`, a: 2,    hint: `÷1000` },
      { q: `500 g = ? kg`,  a: 0.5,  hint: `÷1000` },
      { q: `7 km = ? m`,    a: 7000, hint: `×1000` },
      { q: `2.5 kg = ? g`,  a: 2500, hint: `×1000` },
      { q: `1500 m = ? km`, a: 1.5,  hint: `÷1000` },
      { q: `250 g = ? kg`,  a: 0.25, hint: `÷1000` },
      { q: `4 L = ? mL`,    a: 4000, hint: `1 L = 1000 mL` },
      { q: `2500 mL = ? L`, a: 2.5,  hint: `÷1000` },
    ]);
  }
  if (level === 2) {
    // Metric mixed units + time + area basics
    return mkq([
      { q: `2 m = ? cm`,           a: 200,   hint: `1 m = 100 cm` },
      { q: `150 cm = ? m`,         a: 1.5,   hint: `÷100` },
      { q: `3 m = ? mm`,           a: 3000,  hint: `1 m = 1000 mm` },
      { q: `2 horas = ? minutos`,  a: 120,   hint: `1 h = 60 min` },
      { q: `90 min = ? horas`,     a: 1.5,   hint: `÷60` },
      { q: `1 hora = ? segundos`,  a: 3600,  hint: `60 min × 60 s` },
      { q: `5000 cm² = ? m²`,      a: 0.5,   hint: `1 m² = 10000 cm²` },
      { q: `3 m² = ? cm²`,         a: 30000, hint: `×10000` },
      { q: `2 toneladas = ? kg`,   a: 2000,  hint: `1 t = 1000 kg` },
      { q: `1500 kg = ? toneladas`, a: 1.5,  hint: `÷1000` },
    ]);
  }
  if (level === 3) {
    // Imperial ↔ metric + temperature + speed
    return mkq([
      { q: `0°C = ?°F`,          a: 32,              hint: `°F = °C×9/5+32` },
      { q: `100°C = ?°F`,        a: 212,             hint: `100×1.8+32` },
      { q: `37°C = ?°F`,         a: 99,              hint: `37×1.8+32 ≈ 99` },
      { q: `-40°C = ?°F`,        a: -40,             hint: `−40×1.8+32 = −40 (igual en ambas)` },
      { q: `1 kg ≈ ? libras`,    a: 2,               hint: `1 kg ≈ 2.205 lb ≈ 2` },
      { q: `10 kg ≈ ? libras`,   a: 22,              hint: `10×2.205 ≈ 22 lb` },
      { q: `1 milla = ? km`,     a: 1.6,             hint: `1 mi ≈ 1.609 km ≈ 1.6` },
      { q: `100 km = ? millas`,  a: 62,              hint: `÷1.609 ≈ 62 mi` },
      { q: `1 pie = ? cm`,       a: 30,              hint: `1 ft ≈ 30.48 cm ≈ 30` },
      { q: `1 pulgada = ? cm`,   a: 2.54,            hint: `1 in = 2.54 cm (exacto)` },
      { q: `60 km/h = ? m/s`,    a: round2(60/3.6),  hint: `÷3.6 ≈ 16.67` },
      { q: `10 m/s = ? km/h`,    a: 36,              hint: `×3.6` },
    ]);
  }
  // Level 4: speed+distance, volumes, energy, pressure, combined
  return mkq([
    { q: `v=90 km/h, t=2 h → distancia (km)?`,    a: 180,  hint: `d=v×t=90×2` },
    { q: `d=150 km, t=2 h → velocidad (km/h)?`,   a: 75,   hint: `v=d/t=150/2` },
    { q: `d=120 km, v=60 km/h → tiempo (h)?`,     a: 2,    hint: `t=d/v=120/60` },
    { q: `72 km/h = ? m/s`,                        a: 20,   hint: `÷3.6 = 20` },
    { q: `1 galón = ? litros`,                     a: 3.79, hint: `1 gal ≈ 3.785 L ≈ 3.79` },
    { q: `5 galones = ? litros`,                   a: 19,   hint: `5×3.785 ≈ 19 L` },
    { q: `1 libra = ? gramos`,                     a: 454,  hint: `1 lb ≈ 453.6 g ≈ 454 g` },
    { q: `68°F = ?°C`,                             a: 20,   hint: `°C=(68−32)÷1.8=36÷1.8=20` },
    { q: `1 kJ = ? J`,                             a: 1000, hint: `1 kilo = 1000` },
    { q: `1 atm = ? Pa`,                           a: 101325, hint: `1 atm = 101325 Pa` },
  ]);
}

// ── Chemistry ─────────────────────────────────────────────────────────────────

const ATOMS: Record<string, number> = {
  H:1, He:4, Li:7, Be:9, B:11, C:12, N:14, O:16, F:19, Ne:20,
  Na:23, Mg:24, Al:27, Si:28, P:31, S:32, Cl:35, Ar:40,
  K:39, Ca:40, Fe:56, Cu:64, Zn:65, Ag:108, Au:197, Pb:207,
};

const MOLECULES = [
  { formula: 'H₂O', name: 'agua', mass: 18 }, { formula: 'CO₂', name: 'dióxido de carbono', mass: 44 },
  { formula: 'NaCl', name: 'sal de mesa', mass: 58 }, { formula: 'O₂', name: 'oxígeno', mass: 32 },
  { formula: 'N₂', name: 'nitrógeno', mass: 28 }, { formula: 'H₂', name: 'hidrógeno', mass: 2 },
  { formula: 'CH₄', name: 'metano', mass: 16 }, { formula: 'NH₃', name: 'amoniaco', mass: 17 },
  { formula: 'HCl', name: 'ácido clorhídrico', mass: 36 }, { formula: 'C₆H₁₂O₆', name: 'glucosa', mass: 180 },
  { formula: 'CaCO₃', name: 'carbonato de calcio', mass: 100 }, { formula: 'H₂SO₄', name: 'ácido sulfúrico', mass: 98 },
  { formula: 'NaOH', name: 'hidróxido de sodio', mass: 40 },
];

function chemistry(level: ProblemLevel) {
  if (level === 1) {
    const [sym, mass] = pick(Object.entries(ATOMS));
    return { question: `Masa atómica del ${sym} (u.m.a.)`, answer: mass, hint: `Tabla periódica: ${sym} → ${mass} u.m.a.` };
  }
  if (level === 2) {
    const mol = pick(MOLECULES.filter(m => m.mass <= 58));
    return { question: `Masa molar de ${mol.formula} (${mol.name}) en g/mol`, answer: mol.mass, hint: `Suma las masas atómicas de la fórmula` };
  }
  if (level === 3) {
    const mol = pick(MOLECULES);
    return { question: `Masa molar de ${mol.formula} en g/mol`, answer: mol.mass, hint: `${mol.formula} (${mol.name}): ${mol.mass} g/mol` };
  }
  const mol = pick(MOLECULES), moles = rand(1, 5);
  return { question: `${moles} mol de ${mol.formula} (${mol.name}). ¿Gramos?`, answer: moles*mol.mass, hint: `g = mol × M = ${moles}×${mol.mass} = ${moles*mol.mass} g` };
}

// ── Physics & Aerospace ───────────────────────────────────────────────────────

function physics(level: ProblemLevel) {
  if (level === 1) {
    // Cinemática básica: d=v×t, v=d/t, t=d/v
    const type = pick(['dvt','acc','free'] as const);
    if (type === 'dvt') {
      const v = pick([20,30,40,50,60,80,100]), t = rand(1, 5);
      const variant = rand(0, 2);
      if (variant === 0) return { question: `v=${v} km/h durante ${t} h → distancia (km)?`, answer: v*t, hint: `d=v×t=${v}×${t}` };
      if (variant === 1) return { question: `d=${v*t} km a ${v} km/h → tiempo (h)?`, answer: t, hint: `t=d÷v=${v*t}÷${v}` };
      return { question: `d=${v*t} km en ${t} h → velocidad (km/h)?`, answer: v, hint: `v=d÷t=${v*t}÷${t}` };
    }
    if (type === 'acc') {
      // a = Δv/t, basic
      return mkq([
        { q: `a=Δv/t. Δv=20 m/s, t=4 s → a (m/s²)?`, a: 5,   hint: `20÷4=5` },
        { q: `a=Δv/t. Δv=30 m/s, t=6 s → a (m/s²)?`, a: 5,   hint: `30÷6=5` },
        { q: `a=3 m/s², t=5 s → Δv (m/s)?`,           a: 15,  hint: `Δv=a×t=3×5=15` },
        { q: `a=2 m/s², Δv=16 m/s → t (s)?`,          a: 8,   hint: `t=Δv÷a=16÷2=8` },
      ]);
    }
    // Free fall basics
    return mkq([
      { q: `Caída libre: g=10 m/s². Después de 3 s, ¿v (m/s)?`, a: 30,  hint: `v=g×t=10×3=30` },
      { q: `Caída libre: t=4 s. ¿v final (m/s)?`,                a: 40,  hint: `v=10×4=40` },
      { q: `Objeto lanzado a 20 m/s hacia arriba. ¿t hasta v=0?`, a: 2,  hint: `t=v₀÷g=20÷10=2` },
      { q: `Caída libre desde h=45 m. ¿t para tocar suelo (s)?`,  a: 3,  hint: `h=½gt²→t=√(2h/g)=√9=3` },
    ]);
  }

  if (level === 2) {
    // Fuerza, peso, densidad, velocidad relativa
    return mkq([
      { q: `F=m×a. m=5 kg, a=3 m/s² → F (N)?`,           a: 15,  hint: `F=5×3=15` },
      { q: `F=m×a. m=10 kg, a=9.8 m/s² → F (N)?`,        a: 98,  hint: `F=10×9.8=98` },
      { q: `F=50 N, m=10 kg → aceleración (m/s²)?`,       a: 5,   hint: `a=F÷m=50÷10=5` },
      { q: `F=60 N, a=3 m/s² → masa (kg)?`,               a: 20,  hint: `m=F÷a=60÷3=20` },
      { q: `Peso 8 kg (g=10) → fuerza (N)?`,               a: 80,  hint: `F=m×g=8×10=80` },
      { q: `70 kg en la Luna (g=1.6) → peso (N)?`,        a: 112, hint: `70×1.6=112` },
      { q: `Densidad agua=1000 kg/m³, V=2 m³ → masa (kg)?`, a: 2000, hint: `m=ρ×V=1000×2` },
      { q: `m=500 kg, ρ=250 kg/m³ → V (m³)?`,             a: 2,   hint: `V=m÷ρ=500÷250=2` },
      { q: `Tren A: 60 km/h. Tren B hacia él: 40 km/h. ¿Vel. relativa?`, a: 100, hint: `Suma: 60+40=100 km/h` },
    ]);
  }

  if (level === 3) {
    // Energía, potencia, trabajo, presión
    return mkq([
      { q: `Ek=½mv². m=2 kg, v=3 m/s → Ek (J)?`,          a: 9,   hint: `½×2×9=9` },
      { q: `Ek=½mv². m=4 kg, v=5 m/s → Ek (J)?`,          a: 50,  hint: `½×4×25=50` },
      { q: `Ep=mgh. m=3, h=10, g=10 → Ep (J)?`,           a: 300, hint: `3×10×10=300` },
      { q: `Ep=500 J, m=5 kg, g=10 → altura (m)?`,        a: 10,  hint: `h=500÷(5×10)=10` },
      { q: `Ek=200 J, m=4 kg → velocidad (m/s)?`,         a: 10,  hint: `v=√(2×200÷4)=√100=10` },
      { q: `Potencia=100 W, t=5 s → energía (J)?`,        a: 500, hint: `E=P×t=100×5` },
      { q: `P=F/A. F=200 N, A=0.04 m² → P (Pa)?`,        a: 5000,hint: `200÷0.04=5000` },
      { q: `Trabajo W=F×d. F=30 N, d=5 m → W (J)?`,      a: 150, hint: `30×5=150` },
    ]);
  }

  // Level 4: orbital, eléctrica, termodinámica, aeroespacial
  return mkq([
    { q: `Kepler T²=a³. a=4 UA → T (años)?`,                  a: 8,    hint: `T=√(4³)=√64=8` },
    { q: `v orbital ≈ √(g·r), g=10, r=6.4M m → v (km/s)?`,   a: 8,    hint: `√(64M)≈8000 m/s=8 km/s` },
    { q: `Hubble v=H×d. H=70, d=100 Mpc → v (km/s)?`,        a: 7000, hint: `70×100=7000` },
    { q: `Ohm V=I×R. I=3 A, R=10 Ω → V (V)?`,                a: 30,   hint: `3×10=30` },
    { q: `I=V/R. V=120 V, R=15 Ω → I (A)?`,                  a: 8,    hint: `120÷15=8` },
    { q: `P eléctrica=V×I. V=12 V, I=5 A → P (W)?`,          a: 60,   hint: `12×5=60` },
    { q: `Q=m×c×ΔT. m=2, c=4200, ΔT=1 → Q (J)?`,            a: 8400, hint: `2×4200×1=8400` },
    { q: `Escape Earth: v_esc≈11.2 km/s. ¿El doble?`,        a: 22,   hint: `11.2×2≈22.4≈22` },
  ]);
}

// ── Computing (binary, octal, hex, boolean, shifts, ASCII, two's complement) ──

function computing(level: ProblemLevel) {
  if (level === 1) {
    // Binary ↔ decimal (4-bit) and octal intro
    const type = pick(['bin2dec','dec2bin','oct2dec'] as const);
    if (type === 'bin2dec') {
      const n = rand(1, 15);
      const bin = n.toString(2).padStart(4, '0');
      return { question: `Binario 0b${bin} = ? (decimal)`, answer: n, hint: `${bin.split('').map((b,i)=>`${b}×2^${3-i}`).join('+')}=${n}` };
    }
    if (type === 'dec2bin') {
      const n = rand(1, 15);
      return { question: `${n} en binario (4 bits)?`, answer: parseInt(n.toString(2)), hint: `${n} = ${n.toString(2).padStart(4,'0')}` };
    }
    // Octal: small numbers (0-7)
    const n = rand(1, 7);
    return { question: `Octal 0o${n} = ? (decimal)`, answer: n, hint: `Dígitos 0-7, valor directo: ${n}` };
  }

  if (level === 2) {
    // Hex, octal multi-digit, and bit concepts
    const type = pick(['hex2dec','dec2hex','oct','byte'] as const);
    if (type === 'hex2dec') {
      const h = pick([10,11,12,13,14,15,16,17,31,32,48,64,127,255]);
      return { question: `0x${h.toString(16).toUpperCase()} = ? (decimal)`, answer: h, hint: `A=10 B=11 C=12 D=13 E=14 F=15` };
    }
    if (type === 'dec2hex') {
      const h = pick([10,11,12,13,14,15,16,32,48,64,255]);
      return { question: `${h} en hexadecimal? (responde el número decimal que representa)`, answer: h, hint: `${h} = 0x${h.toString(16).toUpperCase()}` };
    }
    if (type === 'oct') {
      // Octal 2-digit
      const n = pick([8,9,10,12,15,16,24,56,63]);
      return { question: `Octal 0o${n.toString(8)} = ? (decimal)`, answer: n, hint: `${n.toString(8).split('').map((d,i,a)=>`${d}×8^${a.length-1-i}`).join('+')}=${n}` };
    }
    // Byte concepts
    return mkq([
      { q: `1 byte = ? bits`, a: 8, hint: `1 Byte = 8 bits` },
      { q: `1 KB = ? bytes`, a: 1024, hint: `2^10 = 1024 bytes` },
      { q: `1 MB = ? KB`, a: 1024, hint: `2^10 = 1024 KB` },
      { q: `Máx valor 8 bits sin signo = ?`, a: 255, hint: `2^8−1 = 255` },
      { q: `Máx valor 4 bits = ?`, a: 15, hint: `2^4−1 = 15 = 1111₂` },
      { q: `1 GB = ? MB`, a: 1024, hint: `2^10 = 1024 MB` },
    ]);
  }

  if (level === 3) {
    // Bit shifts, NOT, binary addition, ASCII basics
    const type = pick(['shift','not','add','ascii'] as const);
    if (type === 'shift') {
      const n = pick([1,2,3,4,6,8,12]);
      const dir = pick(['left','right'] as const);
      const res = dir === 'left' ? n << 1 : n >> 1;
      return {
        question: dir === 'left' ? `${n} << 1 = ? (decimal)` : `${n} >> 1 = ? (decimal)`,
        answer: res,
        hint: dir === 'left' ? `Shift izq × 2: ${n}×2=${res}` : `Shift der ÷ 2: ${n}÷2=${res}`,
      };
    }
    if (type === 'not') {
      const n = pick([5,3,9,12,6,10]);
      return {
        question: `NOT 4-bit de ${n} = ? (decimal)`,
        answer: 15 - n,
        hint: `NOT ${n.toString(2).padStart(4,'0')} = ${(15-n).toString(2).padStart(4,'0')} = ${15-n}`,
      };
    }
    if (type === 'add') {
      return mkq([
        { q: `0b0011 + 0b0101 = 0b?`, a: parseInt('1000',2), hint: `3+5=8→1000₂` },
        { q: `0b0110 + 0b0111 = 0b?`, a: parseInt('1101',2), hint: `6+7=13→1101₂` },
        { q: `0b1001 + 0b0110 = 0b?`, a: parseInt('1111',2), hint: `9+6=15→1111₂` },
        { q: `0b1100 + 0b0011 = 0b?`, a: parseInt('1111',2), hint: `12+3=15→1111₂` },
      ]);
    }
    // ASCII
    return mkq([
      { q: `ASCII de 'A' = ?`, a: 65,  hint: `'A'=65, 'B'=66, ..., 'Z'=90` },
      { q: `ASCII de 'a' = ?`, a: 97,  hint: `'a'=97, mayúsculas empiezan en 65` },
      { q: `ASCII de '0' = ?`, a: 48,  hint: `'0'=48, '1'=49, ..., '9'=57` },
      { q: `ASCII de 'Z' = ?`, a: 90,  hint: `'A'=65, 'Z'=65+25=90` },
      { q: `Carácter ASCII 65 = ? (responde número)`, a: 65, hint: `65 = 'A'` },
      { q: `ASCII espacio (' ') = ?`, a: 32, hint: `espacio = 32 en ASCII` },
    ]);
  }

  // Level 4: AND/OR/XOR, two's complement, hex↔binary, Boolean algebra
  const type = pick(['bitop','twoscomp','hex2bin','bool'] as const);
  if (type === 'bitop') {
    const a = rand(1, 15), b = rand(1, 15);
    const op = pick(['AND','OR','XOR'] as const);
    const result = op === 'AND' ? a & b : op === 'OR' ? a | b : a ^ b;
    return {
      question: `${a} ${op} ${b} = ? (decimal)`,
      answer: result,
      hint: `${a}=${a.toString(2).padStart(4,'0')}, ${b}=${b.toString(2).padStart(4,'0')}, ${op}=${result.toString(2).padStart(4,'0')}=${result}`,
    };
  }
  if (type === 'twoscomp') {
    // Two's complement of 4-bit numbers
    return mkq([
      { q: `Complemento a 2 de 0001 (4 bits) = ? (decimal con signo)`, a: -1,  hint: `NOT 0001=1110, +1=1111=-1` },
      { q: `Complemento a 2 de 0010 = ? (decimal con signo)`,          a: -2,  hint: `NOT 0010=1101, +1=1110=-2` },
      { q: `Complemento a 2 de 0011 = ?`,                              a: -3,  hint: `NOT+1=1101=-3` },
      { q: `Rango de entero con signo de 8 bits: mín = ?`,             a: -128, hint: `−2^7=−128` },
      { q: `Rango de entero con signo de 8 bits: máx = ?`,             a: 127, hint: `2^7−1=127` },
    ]);
  }
  if (type === 'hex2bin') {
    // Hex ↔ binary direct (each hex digit = 4 bits)
    return mkq([
      { q: `0xA en binario (4 bits) = 0b?`, a: parseInt('1010',2), hint: `A=10=1010₂` },
      { q: `0xF en binario = 0b?`,          a: parseInt('1111',2), hint: `F=15=1111₂` },
      { q: `0b1100 en hex = 0x? (decimal)`, a: 12,                 hint: `1100₂=12=0xC` },
      { q: `0b1010 en hex (decimal)`,       a: 10,                 hint: `1010₂=10=0xA` },
      { q: `0xFF = ? (decimal)`,            a: 255,                hint: `F×16+F=15×16+15=255` },
      { q: `0x1F = ? (decimal)`,            a: 31,                 hint: `1×16+15=31` },
    ]);
  }
  // Boolean algebra simplification results
  return mkq([
    { q: `A AND (A OR B) = ? si A=1,B=0`, a: 1, hint: `A AND (1 OR 0)=1 AND 1=1` },
    { q: `NOT(NOT A) si A=1 = ?`,         a: 1, hint: `Doble negación = A` },
    { q: `A XOR A = ?`,                   a: 0, hint: `Todo XOR consigo mismo = 0` },
    { q: `A AND 0 = ?`,                   a: 0, hint: `Cualquier AND 0 = 0` },
    { q: `A OR NOT(A) = ?`,               a: 1, hint: `Complemento: A ∨ ¬A = 1` },
    { q: `4 << 2 = ? (decimal)`,          a: 16, hint: `4×2²=4×4=16` },
    { q: `16 >> 2 = ? (decimal)`,         a: 4,  hint: `16÷2²=16÷4=4` },
  ]);
}

// ── Trigonometry ─────────────────────────────────────────────────────────────

// Common angles with exact values (×100 to keep integers where possible)
const TRIG_TABLE: Record<number, { sin: number; cos: number; tan: number | null }> = {
  0:   { sin: 0,    cos: 1,    tan: 0    },
  30:  { sin: 50,   cos: 87,   tan: 58   }, // ×100: sin=0.5, cos=0.866, tan=0.577
  45:  { sin: 71,   cos: 71,   tan: 100  }, // ×100: sin≈cos≈0.707, tan=1
  60:  { sin: 87,   cos: 50,   tan: 173  }, // ×100: sin=0.866, cos=0.5, tan=1.73
  90:  { sin: 100,  cos: 0,    tan: null },
  120: { sin: 87,   cos: -50,  tan: -173 },
  135: { sin: 71,   cos: -71,  tan: -100 },
  150: { sin: 50,   cos: -87,  tan: -58  },
  180: { sin: 0,    cos: -100, tan: 0    },
};

function trigonometry(level: ProblemLevel) {
  if (level === 1) {
    // sin/cos of 0, 30, 45, 60, 90 — answer as ratio ×10 (rounded)
    const angles = [0, 30, 45, 60, 90];
    const angle = pick(angles);
    const fn = pick(['sin','cos'] as const);
    const val = TRIG_TABLE[angle][fn] as number;
    const nice = Math.round(val) / 100;
    return {
      question: `${fn}(${angle}°) = ? (redondeado a 2 decimales)`,
      answer: Math.round(nice * 100) / 100,
      hint: `Tabla de ángulos comunes: ${fn}(${angle}°) = ${nice}`,
    };
  }
  if (level === 2) {
    // Pythagorean identity: sin²+cos²=1, find missing
    const angle = pick([30, 45, 60]);
    const t = TRIG_TABLE[angle];
    const sinVal = Math.round(t.sin) / 100;
    const cosVal = Math.round(t.cos) / 100;
    const variant = pick([0, 1, 2] as const);
    if (variant === 0) return { question: `Si sin(x)=${sinVal}, ¿cos²(x)?`, answer: Math.round((1 - sinVal*sinVal)*100)/100, hint: `sin²+cos²=1 → cos²=1−${sinVal}²` };
    if (variant === 1) return { question: `tan(${angle}°) = sin÷cos = ?`, answer: Math.round((sinVal/cosVal)*100)/100, hint: `tan = ${sinVal}÷${cosVal}` };
    return { question: `¿Cuánto es sin²(${angle}°) + cos²(${angle}°)?`, answer: 1, hint: `Identidad de Pitágoras: siempre igual a 1` };
  }
  if (level === 3) {
    return mkq([
      { q: `180° en radianes = ?π`, a: 1, hint: `180° = π rad → 1π` },
      { q: `90° en radianes = ?π`, a: 0.5, hint: `90° = π/2 rad → 0.5π` },
      { q: `360° en radianes = ?π`, a: 2, hint: `360° = 2π rad → 2π` },
      { q: `π/6 radianes = ?°`, a: 30, hint: `π/6 × 180/π = 30°` },
      { q: `π/4 radianes = ?°`, a: 45, hint: `π/4 × 180/π = 45°` },
      { q: `2π/3 radianes = ?°`, a: 120, hint: `2π/3 × 180/π = 120°` },
      { q: `Ángulo con sin(x)=0.5. ¿x (grados)?`, a: 30, hint: `sin⁻¹(0.5) = 30°` },
      { q: `Ángulo con cos(x)=0.5. ¿x (grados)?`, a: 60, hint: `cos⁻¹(0.5) = 60°` },
    ]);
  }
  return mkq([
    { q: `Triángulo: a=8, b=6, C=90°. ¿c?`, a: 10, hint: `c²=64+36=100→c=10` },
    { q: `a=5, A=30°, B=90°. ¿b? (ley senos)`, a: 10, hint: `b=a×sinB/sinA=5×1/0.5=10` },
    { q: `Ley cosenos: b=4,c=5,A=60°. ¿a²?`, a: 21, hint: `16+25−2×4×5×0.5=21` },
    { q: `sin(A)/a=sin(B)/b. A=45°,a=√2,b=1. ¿sin(B)?`, a: 0.5, hint: `sin(B)=1×(√2/2)/√2=0.5` },
    { q: `¿Para qué ángulo tan(x)=1? (grados)`, a: 45, hint: `tan(45°)=1` },
  ]);
}

// ── Logarithms ────────────────────────────────────────────────────────────────

function logarithms(level: ProblemLevel) {
  if (level === 1) {
    // log₁₀ of powers of 10
    const exp = rand(0, 4);
    return { question: `log₁₀(${Math.pow(10, exp)}) = ?`, answer: exp, hint: `log₁₀(10^n) = n` };
  }
  if (level === 2) {
    // log₂ small values
    const exp = rand(1, 5);
    return { question: `log₂(${Math.pow(2, exp)}) = ?`, answer: exp, hint: `log₂(2^n) = n` };
  }
  if (level === 3) {
    return mkq([
      { q: `log₃(81) = ?`, a: 4, hint: `3^4 = 81` },
      { q: `log₅(125) = ?`, a: 3, hint: `5^3 = 125` },
      { q: `log₂(64) = ?`, a: 6, hint: `2^6 = 64` },
      { q: `log₁₀(0.01) = ?`, a: -2, hint: `10^(-2) = 0.01` },
      { q: `log(100×10) = ?`, a: 3, hint: `log(1000) = 3` },
      { q: `log(1000/10) = ?`, a: 2, hint: `log(100) = 2` },
      { q: `log₁₀(10³) = ?`, a: 3, hint: `n×log(10)=3×1=3` },
    ]);
  }
  return mkq([
    { q: `ln(e) = ?`, a: 1, hint: `ln(e^1) = 1` },
    { q: `ln(e²) = ?`, a: 2, hint: `ln(e^n) = n` },
    { q: `ln(1) = ?`, a: 0, hint: `e^0=1 → ln(1)=0` },
    { q: `log₂(8) = ?`, a: 3, hint: `2^3=8` },
    { q: `log₁₀(1000) − log₁₀(10) = ?`, a: 2, hint: `3−1=2` },
    { q: `Si log(x) = 2, ¿x?`, a: 100, hint: `x=10²=100` },
    { q: `Si ln(x) = 0, ¿x?`, a: 1, hint: `e^0=1` },
  ]);
}

// ── Sequences & Series ────────────────────────────────────────────────────────

function sequences(level: ProblemLevel) {
  if (level === 1) {
    // Arithmetic: next term
    const a = rand(1, 20), d = rand(1, 10);
    const terms = [a, a+d, a+2*d, a+3*d];
    return {
      question: `Secuencia: ${terms.join(', ')}, __ ¿Siguiente?`,
      answer: a + 4*d,
      hint: `Diferencia común d=${d}. Siguiente = ${a+3*d}+${d}`,
    };
  }
  if (level === 2) {
    // Geometric: next term
    const a = rand(1, 5), r = rand(2, 4);
    const terms = [a, a*r, a*r*r, a*r*r*r];
    return {
      question: `Secuencia: ${terms.join(', ')}, __ ¿Siguiente?`,
      answer: a * Math.pow(r, 4),
      hint: `Razón común r=${r}. Siguiente = ${a*r*r*r}×${r}`,
    };
  }
  if (level === 3) {
    const arith = Array.from({length:4}, () => {
      const a = rand(1,10), d = rand(1,8), n = rand(5,15);
      return { q: `Aritmética: a₁=${a}, d=${d}. ¿Término ${n}?`, a: a+(n-1)*d, hint: `aₙ=a₁+(n-1)×d=${a}+${n-1}×${d}=${a+(n-1)*d}` };
    });
    return mkq([
      ...arith,
      { q: `Fibonacci: 1,1,2,3,5,8,13,__ ?`, a: 21, hint: `13+8=21` },
      { q: `Fibonacci: 1,1,2,3,5,8,13,21,__ ?`, a: 34, hint: `21+13=34` },
    ]);
  }
  const arithSums = Array.from({length:4}, () => {
    const a = rand(1,10), d = rand(1,5), n = rand(4,10);
    const sum = n*(2*a+(n-1)*d)/2;
    return { q: `Suma ${n} términos: a₁=${a}, d=${d}. Sₙ=?`, a: sum, hint: `Sₙ=n/2×(2a+(n-1)d)=${sum}` };
  });
  const geoSums = Array.from({length:3}, () => {
    const a = rand(1,3), r = rand(2,3), n = rand(3,5);
    const sum = Math.round(a*(Math.pow(r,n)-1)/(r-1));
    return { q: `Suma geométrica: a=${a}, r=${r}, n=${n}`, a: sum, hint: `S=a(rⁿ-1)/(r-1)=${sum}` };
  });
  return mkq([...arithSums, ...geoSums]);
}

// ── Number Theory ─────────────────────────────────────────────────────────────

function numberTheory(level: ProblemLevel) {
  if (level === 1) {
    const type = pick(['prime','divisibility','roman'] as const);
    if (type === 'prime') {
      const primes = [2,3,5,7,11,13,17,19,23,29,31,37,41,43,47];
      const nonPrimes = [4,6,8,9,10,12,14,15,16,18,20,21,22,24,25];
      const isPrime = rand(0,1) === 0;
      const n = isPrime ? pick(primes) : pick(nonPrimes);
      return { question: `¿Es ${n} primo? (1=Sí, 0=No)`, answer: isPrime ? 1 : 0, hint: isPrime ? `${n} solo divisible por 1 y ${n}` : `${n} es divisible por ${n%2===0?2:3}` };
    }
    if (type === 'divisibility') {
      return mkq([
        { q: `¿Es 84 divisible entre 4? (1=Sí 0=No)`,  a: 1, hint: `Regla del 4: últimas 2 cifras (84÷4=21) ✓` },
        { q: `¿Es 135 divisible entre 3? (1=Sí 0=No)`, a: 1, hint: `Regla del 3: suma dígitos 1+3+5=9, divisible por 3 ✓` },
        { q: `¿Es 246 divisible entre 6? (1=Sí 0=No)`, a: 1, hint: `Divisible por 2 y 3: par ✓, 2+4+6=12 ✓` },
        { q: `¿Es 125 divisible entre 5? (1=Sí 0=No)`, a: 1, hint: `Termina en 5 ✓` },
        { q: `¿Es 73 divisible entre 2? (1=Sí 0=No)`,  a: 0, hint: `Termina en 3 (impar) → no es divisible por 2` },
        { q: `¿Es 200 divisible entre 8? (1=Sí 0=No)`, a: 1, hint: `Regla del 8: últimas 3 cifras 200÷8=25 ✓` },
      ]);
    }
    // Numeración romana — básico
    return mkq([
      { q: `IV en decimal = ?`,   a: 4,   hint: `IV = 5−1 = 4` },
      { q: `IX en decimal = ?`,   a: 9,   hint: `IX = 10−1 = 9` },
      { q: `XL en decimal = ?`,   a: 40,  hint: `XL = 50−10 = 40` },
      { q: `XIV en decimal = ?`,  a: 14,  hint: `XIV = 10+4 = 14` },
      { q: `XXI en decimal = ?`,  a: 21,  hint: `XXI = 20+1 = 21` },
      { q: `VII en decimal = ?`,  a: 7,   hint: `VII = 5+1+1 = 7` },
    ]);
  }
  if (level === 2) {
    const type = pick(['gcdlcm','roman_adv','divisibility2'] as const);
    if (type === 'gcdlcm') {
      const a = rand(2, 20), b = rand(2, 20);
      const g = gcd(a, b), l = (a * b) / g;
      return pick([
        { question: `MCD(${a}, ${b}) = ?`, answer: g, hint: `Factores comunes de ${a} y ${b}` },
        { question: `MCM(${a}, ${b}) = ?`, answer: l, hint: `${a}×${b}÷MCD=${a*b}÷${g}=${l}` },
      ]);
    }
    if (type === 'roman_adv') {
      return mkq([
        { q: `XC en decimal = ?`,    a: 90,  hint: `XC = 100−10 = 90` },
        { q: `CD en decimal = ?`,    a: 400, hint: `CD = 500−100 = 400` },
        { q: `XLIV en decimal = ?`,  a: 44,  hint: `XL=40, IV=4 → 44` },
        { q: `XCIX en decimal = ?`,  a: 99,  hint: `XC=90, IX=9 → 99` },
        { q: `CCXL en decimal = ?`,  a: 240, hint: `CC=200, XL=40 → 240` },
        { q: `4 en romano (I=1,V=5,X=10): responde 4`,  a: 4, hint: `IV` },
      ]);
    }
    return mkq([
      { q: `¿Cuántos divisores tiene 12?`,  a: 6,  hint: `1,2,3,4,6,12 → 6 divisores` },
      { q: `¿Cuántos divisores tiene 36?`,  a: 9,  hint: `1,2,3,4,6,9,12,18,36 → 9 divisores` },
      { q: `¿Cuántos divisores tiene 16?`,  a: 5,  hint: `1,2,4,8,16 → 5 divisores` },
      { q: `¿Cuántos divisores tiene 30?`,  a: 8,  hint: `1,2,3,5,6,10,15,30 → 8 divisores` },
    ]);
  }
  if (level === 3) {
    // Factorización prima, múltiplos comunes
    const composites = [12,18,24,30,36,48,60,72,84,100,120,126];
    const n = pick(composites);
    const factor = [2,3,5,7].find(p => n % p === 0) ?? n;
    const type = pick(['prime_factors','roman_full','multiples'] as const);
    if (type === 'prime_factors') {
      return { question: `¿Cuántos factores primos distintos tiene ${n}?`, answer: new Set([2,3,5,7,11,13].filter(p => n % p === 0)).size, hint: `Factoriza ${n}: empieza con ${factor}` };
    }
    if (type === 'roman_full') {
      return mkq([
        { q: `MCMXCIX en decimal = ?`, a: 1999, hint: `M=1000, CM=900, XC=90, IX=9 → 1999` },
        { q: `MMXXIV en decimal = ?`,  a: 2024, hint: `MM=2000, XX=20, IV=4 → 2024` },
        { q: `CDXLIV en decimal = ?`,  a: 444,  hint: `CD=400, XL=40, IV=4 → 444` },
        { q: `DCCC en decimal = ?`,    a: 800,  hint: `D=500, CCC=300 → 800` },
      ]);
    }
    // Múltiplos comunes
    const a = rand(2,6), b = rand(2,6), g = gcd(a,b), l = a*b/g;
    return { question: `¿Cuál es el menor múltiplo común de ${a} y ${b}?`, answer: l, hint: `MCM(${a},${b})=${l}` };
  }
  // Level 4: aritmética modular
  const m = pick([5,7,9,11,12,13]);
  const a = rand(10, 99), b = rand(10, 99);
  const op = pick(['sum','product'] as const);
  const result = op === 'sum' ? (a + b) % m : (a * b) % m;
  return { question: `(${a} ${op === 'sum' ? '+' : '×'} ${b}) mod ${m} = ?`, answer: result, hint: `${op === 'sum' ? a+b : a*b}÷${m}: resto=${result}` };
}

// ── Statistics & Probability ──────────────────────────────────────────────────

function statistics(level: ProblemLevel) {
  if (level === 1) {
    // Mean of small dataset
    const n = rand(3, 6);
    const data = Array.from({length: n}, () => rand(1, 20));
    const mean = Math.round(data.reduce((s,v) => s+v, 0) / n * 10) / 10;
    return {
      question: `Media de: ${data.join(', ')}`,
      answer: mean,
      hint: `Suma(${data.join('+')}=${data.reduce((s,v)=>s+v,0)}) ÷ ${n} = ${mean}`,
    };
  }
  if (level === 2) {
    // Median and mode
    const variant = pick(['median','mode'] as const);
    if (variant === 'median') {
      const n = pick([5, 7]); // odd for clean median
      const data = Array.from({length: n}, () => rand(1, 20)).sort((a,b) => a-b);
      const mid = data[Math.floor(n/2)];
      return { question: `Mediana de: ${data.join(', ')}`, answer: mid, hint: `Valor central (ya ordenados): posición ${Math.floor(n/2)+1}` };
    }
    const base = rand(1, 10), rep = rand(3, 5);
    const others = Array.from({length: 4}, () => rand(1, 15)).filter(v => v !== base);
    const data = [...others.slice(0,3), ...Array(rep).fill(base)].sort((a,b) => a-b);
    return { question: `Moda de: ${data.join(', ')}`, answer: base, hint: `El que más se repite (${rep} veces) es ${base}` };
  }
  if (level === 3) {
    // Basic probability
    const total = pick([6, 8, 10, 12, 20]);
    const favourable = rand(1, total - 1);
    const simplified = favourable / gcd(favourable, total);
    const denom = total / gcd(favourable, total);
    return {
      question: `Bolsa con ${total} bolitas, ${favourable} rojas. P(roja) = ?/${denom}`,
      answer: Math.round(simplified),
      hint: `P = ${favourable}/${total} = ${simplified}/${denom}`,
    };
  }
  return mkq([
    { q: `C(5,2) = 5!/(2!×3!) = ?`, a: 10, hint: `(5×4)/(2×1) = 10` },
    { q: `P(5,2) = 5×4 = ?`, a: 20, hint: `P(n,r)=n!/(n-r)!=5×4=20` },
    { q: `C(6,3) = ?`, a: 20, hint: `(6×5×4)/(3×2×1)=120/6=20` },
    { q: `P(4,2) = ?`, a: 12, hint: `4×3=12` },
    { q: `P(2 ases seguidos, con reposición) de 52 = ?/169`, a: 1, hint: `(4/52)²=16/2704=1/169` },
    { q: `¿Formas de ordenar 4 libros? P(4,4)`, a: 24, hint: `4!=4×3×2×1=24` },
  ]);
}

// ── Financial Math (advanced) ─────────────────────────────────────────────────

function financialMath(level: ProblemLevel) {
  if (level === 1) {
    // Simple interest: I = P×r×t
    const P = rand(1, 10) * 100, r = pick([5, 10, 15, 20]) / 100, t = rand(1, 5);
    const I = Math.round(P * r * t);
    return {
      question: `Interés simple: $${P}, tasa ${r*100}%/año, ${t} año${t>1?'s':''}. ¿Interés?`,
      answer: I,
      hint: `I = P×r×t = ${P}×${r}×${t} = $${I}`,
    };
  }
  if (level === 2) {
    // Compound interest: A = P(1+r)^t (round)
    const P = rand(1, 10) * 100, r = pick([5, 10]) / 100, t = pick([2, 3]);
    const A = Math.round(P * Math.pow(1 + r, t));
    return {
      question: `Interés compuesto: $${P}, tasa ${r*100}%/año, ${t} años. ¿Monto final?`,
      answer: A,
      hint: `A = P×(1+r)^t = ${P}×${1+r}^${t} ≈ $${A}`,
    };
  }
  if (level === 3) {
    return mkq([
      { q: `ROI: inversión $500, ganancia $150. ROI = ?%`, a: 30, hint: `150/500×100=30%` },
      { q: `ROI: inversión $1000, ganancia $250. ROI = ?%`, a: 25, hint: `250/1000×100=25%` },
      { q: `Inflación 8%/año: $100 en 2 años = ?$`, a: 117, hint: `100×1.08²≈117` },
      { q: `Regla del 72: ¿años para duplicar al 8%?`, a: 9, hint: `72÷8=9 años` },
      { q: `Regla del 72: ¿años para duplicar al 6%?`, a: 12, hint: `72÷6=12 años` },
    ]);
  }
  return mkq([
    { q: `Break-even: CF=$600, P=$10, CV=$4. ¿Unidades?`, a: 100, hint: `CF/(P-CV)=600/6=100` },
    { q: `Break-even: CF=$800, P=$20, CV=$12. ¿Unidades?`, a: 100, hint: `800/8=100` },
    { q: `Margen bruto: ingresos $1000, costo $600. ¿Margen%?`, a: 40, hint: `400/1000×100=40%` },
    { q: `Depreciación lineal: $5000, vida 5 años. ¿$/año?`, a: 1000, hint: `5000÷5=1000` },
    { q: `TEA de 1% mensual ≈ ?%`, a: 13, hint: `1.01^12-1≈12.7%≈13%` },
  ]);
}

// ── Vedic Math ────────────────────────────────────────────────────────────────

function vedicBy11(level: ProblemLevel) {
  const a = rand(level <= 2 ? 10 : 100, level <= 2 ? 99 : 999);
  return { question: `${a} × 11`, answer: a * 11, hint: `Truco ×11: AB→A,(A+B),B. Ej: 23×11=253` };
}
function vedicSquareEnding5(level: ProblemLevel) {
  const n = rand(1, [9, 9, 19, 29][level - 1]), base = n * 10 + 5;
  return { question: `${base}²`, answer: base * base, hint: `X5²: dec×(dec+1) luego +25. Ej:35²→3×4=12→1225` };
}
function vedicNearBase(level: ProblemLevel) {
  const [base, maxDiff] = level <= 2 ? [10, 3] : [100, 15];
  const a = rand(1, maxDiff), b = rand(1, maxDiff);
  const x = base - a, y = base - b;
  return { question: `${x} × ${y}`, answer: x * y, hint: `Nikhilam(base ${base}): (${base-a-b}|${String(a*b).padStart(level<=2?1:2,'0')})=${x*y}` };
}
function vedicComplement(level: ProblemLevel) {
  const base = [10, 100, 1000, 10000][level - 1];
  const n = rand(Math.floor(base * 0.1), base - 1);
  return { question: `${base} − ${n}`, answer: base - n, hint: `Todo de 9, último de 10: cada dígito de 9, el último de 10` };
}
function vedicDoubleHalf(level: ProblemLevel) {
  const tricks = [{ mult: 5, hint: '×5=×10÷2' },{ mult: 25, hint: '×25=×100÷4' },{ mult: 50, hint: '×50=×100÷2' },{ mult: 15, hint: '×15=×10+mitad' }];
  const t = tricks[rand(0, Math.min(level, tricks.length) - 1)];
  const a = rand(2, [50, 100, 200, 500][level - 1]);
  return { question: `${a} × ${t.mult}`, answer: a * t.mult, hint: t.hint };
}
const VEDIC_ALL = [vedicBy11, vedicSquareEnding5, vedicNearBase, vedicComplement, vedicDoubleHalf];
function vedic(level: ProblemLevel) {
  const pool = level === 1 ? [vedicBy11, vedicComplement, vedicDoubleHalf]
    : level === 2 ? [vedicBy11, vedicSquareEnding5, vedicComplement, vedicDoubleHalf]
    : VEDIC_ALL;
  return pick(pool)(level);
}

// ── Negative Numbers ──────────────────────────────────────────────────────────

function negatives(level: ProblemLevel, complexity = 0) {
  if (complexity > 0) return buildExpression('neg', level, complexity);
  if (level === 1) {
    // Subtraction to negatives, adding negatives — number line intuition
    const type = pick(['sub_neg','neg_plus','neg_neg'] as const);
    if (type === 'sub_neg') {
      const a = rand(1, 5), b = rand(a + 1, a + 7);
      return { question: `${a} − ${b} = ?`, answer: a - b, hint: `${a}−${b}=${a-b}. En la recta numérica: parte en ${a} y retrocede ${b}` };
    }
    if (type === 'neg_plus') {
      const neg = -rand(1, 5), pos = rand(1, 8);
      return { question: `${neg} + ${pos} = ?`, answer: neg + pos, hint: `Mueve ${pos} pasos a la derecha desde ${neg}: resultado ${neg+pos}` };
    }
    const a = rand(1, 5), b = rand(1, 5);
    return { question: `−${a} + (−${b}) = ?`, answer: -(a + b), hint: `Sumar negativos: −${a}−${b} = −${a+b}` };
  }
  if (level === 2) {
    // Multiplicación/división con negativos + reglas de signos
    const type = pick(['mul','div','signs'] as const);
    if (type === 'mul') {
      const a = rand(2, 7), b = rand(2, 7), sign = pick([-1, 1]);
      return { question: `${sign < 0 ? '−' : ''}${a} × ${b} = ?`, answer: sign * a * b, hint: `${sign < 0 ? 'negativo' : 'positivo'} × positivo = ${sign < 0 ? 'negativo' : 'positivo'}: ${sign*a*b}` };
    }
    if (type === 'div') {
      const b = rand(2, 6), c = rand(2, 6), sign = pick([-1, 1]);
      return { question: `${sign < 0 ? '−' : ''}${b * c} ÷ ${b} = ?`, answer: sign * c, hint: `${sign*b*c}÷${b}=${sign*c}` };
    }
    return mkq([
      { q: `(−3) × (−4) = ?`,  a: 12,  hint: `(−)×(−) = (+): 3×4=12` },
      { q: `(−5) × 2 = ?`,     a: -10, hint: `(−)×(+) = (−): 5×2=10 → −10` },
      { q: `(−12) ÷ (−3) = ?`, a: 4,   hint: `(−)÷(−) = (+): 12÷3=4` },
      { q: `18 ÷ (−6) = ?`,    a: -3,  hint: `(+)÷(−) = (−): 18÷6=3 → −3` },
      { q: `(−7) × (−7) = ?`,  a: 49,  hint: `(−)×(−) = (+): 7×7=49` },
      { q: `(−24) ÷ 4 = ?`,    a: -6,  hint: `(−)÷(+) = (−): 24÷4=6 → −6` },
    ]);
  }
  if (level === 3) {
    // Orden de operaciones, potencias de negativos
    return mkq([
      { q: `2 − (−3) = ?`,      a: 5,   hint: `Restar negativo = sumar: 2+3=5` },
      { q: `−5 − (−8) = ?`,     a: 3,   hint: `−5+8=3` },
      { q: `(−4)² = ?`,         a: 16,  hint: `(−4)×(−4)=16 (par → positivo)` },
      { q: `−4² = ?`,           a: -16, hint: `−(4²)=−16. ¡No es lo mismo que (−4)²!` },
      { q: `3×(−2)+5 = ?`,      a: -1,  hint: `Primero ×: −6+5=−1` },
      { q: `(−3)³ = ?`,         a: -27, hint: `(−3)×(−3)×(−3)=9×(−3)=−27 (impar → negativo)` },
      { q: `−2×(3−7) = ?`,      a: 8,   hint: `−2×(−4)=8` },
      { q: `(−1)¹⁰⁰ = ?`,       a: 1,   hint: `Potencia par de negativo = positivo` },
    ]);
  }
  // Level 4: valor absoluto, expresiones complejas
  return mkq([
    { q: `|−8| = ?`,           a: 8,  hint: `Valor absoluto: distancia al 0, siempre ≥ 0` },
    { q: `|3 − 7| = ?`,        a: 4,  hint: `|−4|=4` },
    { q: `−|−5| = ?`,          a: -5, hint: `|−5|=5, luego aplicamos el − exterior: −5` },
    { q: `(−2)⁴ = ?`,          a: 16, hint: `(−2)×(−2)×(−2)×(−2)=4×4=16` },
    { q: `−3×(4−7) = ?`,       a: 9,  hint: `−3×(−3)=9` },
    { q: `|−4| + |−6| = ?`,    a: 10, hint: `4+6=10` },
    { q: `|5| − |−8| = ?`,     a: -3, hint: `5−8=−3` },
    { q: `(−2)⁵ = ?`,          a: -32,hint: `Potencia impar de negativo = negativo: −32` },
  ]);
}

// ── Decimal Numbers ───────────────────────────────────────────────────────────

function decimals(level: ProblemLevel, complexity = 0) {
  if (complexity > 0) return decimalExpr(level, complexity);
  if (level === 1) {
    // Suma/resta decimales sencillos, valor posicional
    const type = pick(['add','sub','place'] as const);
    if (type === 'add') {
      const a = rand(1, 9), ca = rand(1, 9), b = rand(1, 7), cb = rand(0, 9);
      const n1 = a + ca / 10, n2 = b + cb / 10;
      return { question: `${n1} + ${n2} = ?`, answer: round2(n1 + n2), hint: `Alinea las décimas: ${n1}+${n2}=${round2(n1+n2)}` };
    }
    if (type === 'sub') {
      const a = rand(3, 9), ca = rand(1, 9), b = rand(1, a - 1), cb = rand(0, ca - 1 >= 0 ? ca - 1 : 0);
      const n1 = a + ca / 10, n2 = b + cb / 10;
      return { question: `${n1} − ${n2} = ?`, answer: round2(n1 - n2), hint: `${n1}−${n2}=${round2(n1-n2)}` };
    }
    return mkq([
      { q: `¿Cuántas décimas en 3.7?`,       a: 37,   hint: `3.7 = 3 unidades + 7 décimas = 37 décimas` },
      { q: `¿Cuántas centésimas en 2.45?`,   a: 245,  hint: `2.45 = 245 centésimas` },
      { q: `4 décimas = ? (decimal)`,         a: 0.4,  hint: `4 ÷ 10 = 0.4` },
      { q: `15 centésimas = ? (decimal)`,     a: 0.15, hint: `15 ÷ 100 = 0.15` },
      { q: `¿Cuántas décimas en 0.8?`,        a: 8,    hint: `0.8 = 8 décimas` },
      { q: `25 centésimas = ? (decimal)`,     a: 0.25, hint: `25 ÷ 100 = 0.25` },
    ]);
  }
  if (level === 2) {
    // Multiplicación decimal × entero, división decimal ÷ entero
    const type = pick(['mul_int','div_int','compare'] as const);
    if (type === 'mul_int') {
      const d = pick([0.2, 0.3, 0.4, 0.5, 1.5, 2.5, 0.25]);
      const n = rand(2, 8);
      return { question: `${d} × ${n} = ?`, answer: round2(d * n), hint: `${d}×${n}=${round2(d*n)}` };
    }
    if (type === 'div_int') {
      const d = pick([0.4, 0.6, 0.8, 1.5, 2.4, 3.6, 4.8]);
      const n = pick([2, 3, 4]);
      return { question: `${d} ÷ ${n} = ?`, answer: round2(d / n), hint: `${d}÷${n}=${round2(d/n)}` };
    }
    return mkq([
      { q: `0.5 × 0.5 = ?`,  a: 0.25, hint: `5×5=25, dos decimales → 0.25` },
      { q: `0.2 × 0.3 = ?`,  a: 0.06, hint: `2×3=6, dos decimales → 0.06` },
      { q: `1.5 × 2 = ?`,    a: 3,    hint: `15×2=30, un decimal → 3.0` },
      { q: `0.4 × 0.5 = ?`,  a: 0.2,  hint: `4×5=20, dos decimales → 0.20=0.2` },
      { q: `2.5 × 4 = ?`,    a: 10,   hint: `25×4=100, un decimal → 10.0` },
    ]);
  }
  if (level === 3) {
    // División decimal entre decimal, operaciones mixtas
    return mkq([
      { q: `2.4 ÷ 0.4 = ?`,   a: 6,    hint: `Multiplica ambos por 10: 24÷4=6` },
      { q: `1.5 ÷ 0.5 = ?`,   a: 3,    hint: `15÷5=3` },
      { q: `0.6 ÷ 0.2 = ?`,   a: 3,    hint: `6÷2=3` },
      { q: `3.6 ÷ 0.9 = ?`,   a: 4,    hint: `36÷9=4` },
      { q: `0.1 × 0.1 = ?`,   a: 0.01, hint: `1×1=1, dos decimales → 0.01` },
      { q: `1.2 × 1.5 = ?`,   a: 1.8,  hint: `12×15=180, dos decimales → 1.80` },
      { q: `4.5 ÷ 0.9 = ?`,   a: 5,    hint: `45÷9=5` },
      { q: `0.8 ÷ 0.04 = ?`,  a: 20,   hint: `80÷4=20` },
    ]);
  }
  // Level 4: fracciones ↔ decimales, decimales periódicos
  return mkq([
    { q: `1/4 como decimal = ?`,         a: 0.25,  hint: `1÷4=0.25` },
    { q: `3/4 como decimal = ?`,         a: 0.75,  hint: `3÷4=0.75` },
    { q: `1/8 como decimal = ?`,         a: 0.125, hint: `1÷8=0.125` },
    { q: `5/8 como decimal = ?`,         a: 0.625, hint: `5÷8=0.625` },
    { q: `1/3 ≈ ? (2 decimales)`,        a: 0.33,  hint: `1÷3=0.333... ≈ 0.33` },
    { q: `2/3 ≈ ? (2 decimales)`,        a: 0.67,  hint: `2÷3=0.666... ≈ 0.67` },
    { q: `0.375 = ?/8 (numerador)`,      a: 3,     hint: `0.375 = 3/8` },
    { q: `¿Cuántas milésimas en 1.024?`, a: 1024,  hint: `1.024 = 1024 milésimas` },
  ]);
}

// ── Proportionality & Rule of Three ──────────────────────────────────────────

function proportionality(level: ProblemLevel) {
  if (level === 1) {
    // Razón directa simple: si 2→6, entonces 5→?
    const factor = rand(2, 6);
    const a = rand(1, 5), b = rand(2, 8);
    return {
      question: `Si ${a} → ${a * factor}, ¿a qué corresponde ${b}?`,
      answer: b * factor,
      hint: `Factor de proporcionalidad: ×${factor}. Entonces ${b}×${factor}=${b*factor}`,
    };
  }
  if (level === 2) {
    // Regla de tres directa con contexto
    const type = pick(['price','speed','recipe','map'] as const);
    if (type === 'price') {
      const unit = rand(2, 8), qty1 = rand(2, 5), qty2 = rand(2, 7);
      return { question: `${qty1} kg cuestan $${qty1*unit}. ¿Cuánto cuestan ${qty2} kg?`, answer: qty2*unit, hint: `$${unit}/kg × ${qty2} = $${qty2*unit}` };
    }
    if (type === 'speed') {
      const spd = pick([60, 80, 100, 120]), t1 = rand(1, 3), t2 = rand(2, 5);
      return { question: `En ${t1}h recorres ${spd*t1} km. ¿Cuántos km en ${t2}h al mismo ritmo?`, answer: spd*t2, hint: `${spd} km/h × ${t2}h = ${spd*t2} km` };
    }
    if (type === 'recipe') {
      const base = rand(2, 4), mult = rand(2, 3), ingr = pick([100,150,200,250,300,400]);
      return { question: `Receta para ${base} personas usa ${ingr}g. ¿Para ${base*mult} personas?`, answer: ingr*mult, hint: `×${mult}: ${ingr}×${mult}=${ingr*mult}g` };
    }
    const scale = pick([100, 200, 500, 1000]), cm = rand(2, 8);
    return { question: `Mapa escala 1:${scale}. ${cm}cm en el mapa = ?cm reales`, answer: cm*scale, hint: `${cm}×${scale}=${cm*scale}cm` };
  }
  if (level === 3) {
    // Proporcionalidad inversa, variación porcentual
    const type = pick(['inverse','pct_change','missing'] as const);
    if (type === 'inverse') {
      const w1 = rand(2, 5), d1 = rand(4, 10);
      const w2 = w1 * 2;
      return { question: `${w1} obreros tardan ${d1} días. ¿Cuántos días tardan ${w2} obreros? (proporcionalidad inversa)`, answer: d1/2, hint: `Inv: ${w1}×${d1}=${w2}×? → ?=${w1*d1}÷${w2}=${d1/2}` };
    }
    if (type === 'pct_change') {
      const base = pick([50, 80, 100, 120, 200]);
      const pct = pick([10, 20, 25, 50]);
      const up = pick([true, false]);
      const result = round2(base * (up ? 1 + pct/100 : 1 - pct/100));
      return { question: `$${base} ${up ? 'sube' : 'baja'} un ${pct}%. ¿Nuevo valor?`, answer: result, hint: `${base}×${up ? 1+pct/100 : 1-pct/100}=${result}` };
    }
    // Encontrar el valor que falta en una proporción: a/b = c/?
    const a = rand(2, 6), b = rand(2, 6), c = rand(2, 6);
    const d = Math.round(b * c / a);
    if (a * d !== b * c) {
      return { question: `${a}/10 = ${b}/? (proporción)`, answer: b * 10 / a, hint: `Proporciones: producto cruzado ${a}×?=${b}×10 → ?=${b*10/a}` };
    }
    return { question: `${a}/${b} = ${c}/? (proporción)`, answer: d, hint: `Producto cruzado: ${a}×?=${b}×${c} → ?=${b*c/a}=${d}` };
  }
  // Level 4: regla de tres compuesta, escalas, tipos de cambio
  return mkq([
    { q: `3 obreros en 8 días. ¿Obreros para hacerlo en 6 días?`,      a: 4,   hint: `3×8=24 obra total → 24÷6=4 obreros` },
    { q: `Escala 1:50000. 4cm → ? km`,                                  a: 2,   hint: `4×50000=200000cm=2km` },
    { q: `1€ = 1.1$. ¿200€ en dólares?`,                               a: 220, hint: `200×1.1=220$` },
    { q: `Mezcla: 2 partes agua + 3 partes zumo = 500ml. ¿ml de zumo?`, a: 300, hint: `3/5×500=300ml` },
    { q: `A 80 km/h tardo 3h. ¿Tiempo a 120 km/h? (inverso, en h)`,    a: 2,   hint: `80×3=240km → 240÷120=2h` },
    { q: `Si 5 máquinas producen 100 en 4h, ¿cuánto producen 5 máq en 8h?`, a: 200, hint: `100÷4×8=200` },
  ]);
}

// ── Entry point ───────────────────────────────────────────────────────────────

type GenResult = { question: string; answer: number; visual?: ProblemVisual; hint?: string; terms?: number };

const GENERATORS: Record<CategoryId, (l: ProblemLevel, complexity?: number) => GenResult> = {
  addition, subtraction, multiplication, division,
  percentage, power, squareRoot, fractions,
  decimals, negatives,
  algebra, proportionality, geometry, trigonometry, logarithms, sequences,
  numberTheory, vedic,
  clockTime, calendarMath, moneyMath, financialMath, converting,
  statistics, chemistry, physics, computing,
};

// Time is derived from the generated problem itself: a base amount plus SEC_PER_TERM
// for every unit of expression weight beyond a plain 2-operand problem, then scaled
// by the accuracy multiplier (mastered → faster, struggling → more lenient).
export function generateProblem(
  category: CategoryId,
  level: ProblemLevel,
  complexity: number,
  baseTime: number,
  accMul: number,
): Problem {
  const { question, answer, visual, hint, terms } = GENERATORS[category](level, complexity);
  const extra = Math.max(0, (terms ?? 2) - 2);
  const timeLimit = Math.max(3, Math.round((baseTime + SEC_PER_TERM * extra) * accMul));
  return { id: uid(), category, question, answer, level, timeLimit, visual, hint };
}
