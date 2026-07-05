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

// ── Basic Arithmetic ──────────────────────────────────────────────────────────

function addition(level: ProblemLevel) {
  const max = [10, 50, 200, 999][level - 1];
  const a = rand(1, max), b = rand(1, max);
  return { question: `${a} + ${b}`, answer: a + b };
}

function subtraction(level: ProblemLevel) {
  const max = [10, 50, 200, 999][level - 1];
  let a = rand(1, max), b = rand(1, max);
  if (b > a) [a, b] = [b, a];
  return { question: `${a} − ${b}`, answer: a - b };
}

function multiplication(level: ProblemLevel) {
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

function division(level: ProblemLevel) {
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
    const w = rand(2, 15), h = rand(2, 15);
    return { question: `Perímetro de rectángulo ${w} × ${h}`, answer: 2*(w+h), hint: `P = 2×(${w}+${h}) = ${2*(w+h)}` };
  }
  if (level === 2) {
    const shape = pick(['rect','tri','square'] as const);
    if (shape === 'square') {
      const s = rand(2, 15);
      return { question: `Área de cuadrado, lado ${s}`, answer: s*s, hint: `A = lado² = ${s}² = ${s*s}` };
    }
    if (shape === 'rect') {
      const w = rand(2, 20), h = rand(2, 20);
      return { question: `Área de rectángulo ${w} × ${h}`, answer: w*h, hint: `A = ${w}×${h} = ${w*h}` };
    }
    const b = rand(2, 20), h = rand(2, 20) * 2;
    return { question: `Área triángulo, base ${b}, altura ${h}`, answer: (b*h)/2, hint: `A = base×altura÷2 = ${b*h/2}` };
  }
  if (level === 3) {
    const shape = pick(['circle','volume'] as const);
    if (shape === 'circle') {
      const r = rand(1, 10);
      const area = Math.round(3.14159 * r * r);
      return { question: `Área del círculo, radio ${r} (π≈3.14, redondea)`, answer: area, hint: `A = π×r² ≈ 3.14×${r}² ≈ ${area}` };
    }
    const l = rand(2, 10), w = rand(2, 10), h = rand(2, 10);
    return { question: `Volumen de caja ${l}×${w}×${h}`, answer: l*w*h, hint: `V = l×w×h = ${l*w*h}` };
  }
  // Level 4: Pythagorean theorem
  const triples: [number,number,number][] = [[3,4,5],[5,12,13],[8,15,17],[7,24,25],[6,8,10],[9,12,15]];
  const [a, b, c] = pick(triples);
  const k = rand(1, 3);
  return {
    question: `Triángulo rectángulo: catetos ${a*k} y ${b*k}. ¿Hipotenusa?`,
    answer: c*k,
    hint: `c = √(${a*k}²+${b*k}²) = √${(a*k)**2+(b*k)**2} = ${c*k}`,
  };
}

// ── Fractions ─────────────────────────────────────────────────────────────────

function fractions(level: ProblemLevel) {
  if (level <= 2) {
    const denom = rand(2, level === 1 ? 5 : 8);
    const numer = rand(1, denom - 1);
    return {
      question: `¿Cuántas partes están marcadas?`,
      answer: numer,
      visual: { type: 'fraction-bar' as const, active: numer, total: denom } as ProblemVisual,
      hint: `Fracción ${numer}/${denom}: hay ${numer} partes activas de ${denom}`,
    };
  }
  const denom = rand(2, level === 3 ? 6 : 10);
  const numer = rand(1, denom - 1);
  const mult  = rand(2, level === 3 ? 8 : 15);
  const whole = denom * mult;
  return {
    question: `¿Cuánto es ${numer}/${denom} de ${whole}?`,
    answer: numer * mult,
    visual: { type: 'fraction-bar' as const, active: numer, total: denom } as ProblemVisual,
    hint: `(${whole}÷${denom})×${numer} = ${mult}×${numer} = ${numer*mult}`,
  };
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
    const price = rand(1, 9) + rand(0, 9) * 0.1, pays = Math.ceil(price);
    return { question: `Artículo: $${price.toFixed(2)}. Pagas $${pays.toFixed(2)}. ¿Cambio?`, answer: round2(pays-price), hint: `Cambio = ${pays}−${price.toFixed(2)}` };
  }
  if (level === 2) {
    const bill = rand(10, 80)*5, tip = pick([10,15,20]);
    return { question: `Cuenta: $${bill}. Propina ${tip}%. ¿Propina?`, answer: round2(bill*tip/100), hint: `${tip}% de ${bill} = $${round2(bill*tip/100)}` };
  }
  if (level === 3) {
    const price = rand(20, 200)*5, disc = pick([10,15,20,25,30,50]);
    return { question: `Precio: $${price}. Descuento ${disc}%. ¿Precio final?`, answer: round2(price*(1-disc/100)), hint: `${price}×${1-disc/100} = $${round2(price*(1-disc/100))}` };
  }
  const ppl = rand(2,6), bill = rand(5,20)*ppl*5, tip = pick([10,15,20]);
  const total = round2(bill*(1+tip/100)), each = round2(total/ppl);
  return { question: `Cuenta $${bill}, ${ppl} personas, propina ${tip}%. ¿Cada uno?`, answer: each, hint: `Total=$${total}÷${ppl}=$${each}` };
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
    // Is this number prime?
    const primes = [2,3,5,7,11,13,17,19,23,29,31,37,41,43,47];
    const nonPrimes = [4,6,8,9,10,12,14,15,16,18,20,21,22,24,25];
    const isPrime = rand(0,1) === 0;
    const n = isPrime ? pick(primes) : pick(nonPrimes);
    return {
      question: `¿Es ${n} un número primo? (responde 1=Sí, 0=No)`,
      answer: isPrime ? 1 : 0,
      hint: isPrime ? `${n} sólo es divisible por 1 y por sí mismo` : `${n} es divisible por ${n > 2 ? (n % 2 === 0 ? 2 : 3) : 1}`,
    };
  }
  if (level === 2) {
    // GCD / LCM
    const a = rand(2, 20), b = rand(2, 20);
    const g = gcd(a, b), l = (a * b) / g;
    return pick([
      { question: `MCD(${a}, ${b}) = ?`, answer: g, hint: `Máximo Común Divisor: factores comunes` },
      { question: `MCM(${a}, ${b}) = ?`, answer: l, hint: `Mínimo Común Múltiplo = ${a}×${b}÷MCD(${a},${b}) = ${l}` },
    ]);
  }
  if (level === 3) {
    // Prime factorization
    const composites = [12,18,24,30,36,48,60,72,84,100,120,126];
    const n = pick(composites);
    // Compute smallest prime factor for hint
    const factor = [2,3,5,7].find(p => n % p === 0) ?? n;
    return {
      question: `¿Cuántos factores primos distintos tiene ${n}?`,
      answer: new Set([2,3,5,7,11,13].filter(p => n % p === 0)).size,
      hint: `Factoriza ${n}: empieza dividiendo por ${factor}`,
    };
  }
  // Level 4: modular arithmetic
  const m = pick([5,7,9,11,12,13]);
  const a = rand(10, 99), b = rand(10, 99);
  const op = pick(['sum','product'] as const);
  const result = op === 'sum' ? (a + b) % m : (a * b) % m;
  return {
    question: `(${a} ${op === 'sum' ? '+' : '×'} ${b}) mod ${m} = ?`,
    answer: result,
    hint: `${op === 'sum' ? a+b : a*b} ÷ ${m} = ... resto ${result}`,
  };
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

// ── Entry point ───────────────────────────────────────────────────────────────

type GenResult = { question: string; answer: number; visual?: ProblemVisual; hint?: string };

const GENERATORS: Record<CategoryId, (l: ProblemLevel) => GenResult> = {
  addition, subtraction, multiplication, division,
  percentage, power, squareRoot, fractions,
  algebra, geometry, trigonometry, logarithms, sequences,
  numberTheory, vedic,
  clockTime, calendarMath, moneyMath, financialMath, converting,
  statistics, chemistry, physics, computing,
};

export function generateProblem(category: CategoryId, level: ProblemLevel, timeLimit: number): Problem {
  const { question, answer, visual, hint } = GENERATORS[category](level);
  return { id: uid(), category, question, answer, level, timeLimit, visual, hint };
}
