import type { CategoryId } from '../types';

export const CATEGORY_LABEL: Record<CategoryId, string> = {
  // Core arithmetic
  addition:       'Suma',
  subtraction:    'Resta',
  multiplication: 'Multiplicación',
  division:       'División',
  percentage:     'Porcentaje',
  power:          'Potencias',
  squareRoot:     'Raíz Cuadrada',
  fractions:      'Fracciones',
  // Algebra & higher
  algebra:        'Álgebra',
  geometry:       'Geometría',
  trigonometry:   'Trigonometría',
  logarithms:     'Logaritmos',
  sequences:      'Sucesiones',
  // Number theory & mental math
  numberTheory:   'Teoría de Números',
  vedic:          'Mente Védica',
  // Applied / everyday
  clockTime:      'Tiempo · Reloj',
  calendarMath:   'Calendario',
  moneyMath:      'Dinero & Propinas',
  financialMath:  'Finanzas & Inversión',
  converting:     'Medidas & Unidades',
  // Science & tech
  statistics:     'Estadística',
  chemistry:      'Química',
  physics:        'Física & Espacio',
  computing:      'Computación',
};

export const CATEGORY_ICON: Record<CategoryId, string> = {
  addition:       '+',
  subtraction:    '−',
  multiplication: '×',
  division:       '÷',
  percentage:     '%',
  power:          'xⁿ',
  squareRoot:     '√',
  fractions:      '½',
  algebra:        '𝑥',
  geometry:       '△',
  trigonometry:   'sin',
  logarithms:     'log',
  sequences:      '∑',
  numberTheory:   '𝑝',
  vedic:          '🧘',
  clockTime:      '🕐',
  calendarMath:   '📅',
  moneyMath:      '💵',
  financialMath:  '📈',
  converting:     '⚖️',
  statistics:     '📊',
  chemistry:      '⚗️',
  physics:        '🚀',
  computing:      '💻',
};

export const CATEGORY_COLOR: Record<CategoryId, { text: string; bg: string; border: string; bar: string }> = {
  addition:       { text: 'text-blue-400',     bg: 'bg-blue-500/15',     border: 'border-blue-500/30',     bar: 'bg-blue-500'     },
  subtraction:    { text: 'text-cyan-400',     bg: 'bg-cyan-500/15',     border: 'border-cyan-500/30',     bar: 'bg-cyan-500'     },
  multiplication: { text: 'text-violet-400',   bg: 'bg-violet-500/15',   border: 'border-violet-500/30',   bar: 'bg-violet-500'   },
  division:       { text: 'text-orange-400',   bg: 'bg-orange-500/15',   border: 'border-orange-500/30',   bar: 'bg-orange-500'   },
  percentage:     { text: 'text-emerald-400',  bg: 'bg-emerald-500/15',  border: 'border-emerald-500/30',  bar: 'bg-emerald-500'  },
  power:          { text: 'text-amber-400',    bg: 'bg-amber-500/15',    border: 'border-amber-500/30',    bar: 'bg-amber-500'    },
  squareRoot:     { text: 'text-rose-400',     bg: 'bg-rose-500/15',     border: 'border-rose-500/30',     bar: 'bg-rose-500'     },
  fractions:      { text: 'text-pink-400',     bg: 'bg-pink-500/15',     border: 'border-pink-500/30',     bar: 'bg-pink-500'     },
  algebra:        { text: 'text-indigo-400',   bg: 'bg-indigo-500/15',   border: 'border-indigo-500/30',   bar: 'bg-indigo-500'   },
  geometry:       { text: 'text-lime-400',     bg: 'bg-lime-500/15',     border: 'border-lime-500/30',     bar: 'bg-lime-500'     },
  trigonometry:   { text: 'text-teal-400',     bg: 'bg-teal-500/15',     border: 'border-teal-500/30',     bar: 'bg-teal-500'     },
  logarithms:     { text: 'text-purple-400',   bg: 'bg-purple-500/15',   border: 'border-purple-500/30',   bar: 'bg-purple-500'   },
  sequences:      { text: 'text-fuchsia-300',  bg: 'bg-fuchsia-500/15',  border: 'border-fuchsia-500/30',  bar: 'bg-fuchsia-500'  },
  numberTheory:   { text: 'text-sky-400',      bg: 'bg-sky-500/15',      border: 'border-sky-500/30',      bar: 'bg-sky-500'      },
  vedic:          { text: 'text-fuchsia-400',  bg: 'bg-fuchsia-500/10',  border: 'border-fuchsia-500/25',  bar: 'bg-fuchsia-600'  },
  clockTime:      { text: 'text-sky-300',      bg: 'bg-sky-500/10',      border: 'border-sky-500/25',      bar: 'bg-sky-600'      },
  calendarMath:   { text: 'text-teal-300',     bg: 'bg-teal-500/10',     border: 'border-teal-500/25',     bar: 'bg-teal-600'     },
  moneyMath:      { text: 'text-yellow-400',   bg: 'bg-yellow-500/15',   border: 'border-yellow-500/30',   bar: 'bg-yellow-500'   },
  financialMath:  { text: 'text-green-300',    bg: 'bg-green-500/10',    border: 'border-green-500/25',    bar: 'bg-green-600'    },
  converting:     { text: 'text-stone-400',    bg: 'bg-stone-500/15',    border: 'border-stone-500/30',    bar: 'bg-stone-500'    },
  statistics:     { text: 'text-violet-300',   bg: 'bg-violet-500/10',   border: 'border-violet-500/25',   bar: 'bg-violet-600'   },
  chemistry:      { text: 'text-green-400',    bg: 'bg-green-500/15',    border: 'border-green-500/30',    bar: 'bg-green-500'    },
  physics:        { text: 'text-red-400',      bg: 'bg-red-500/15',      border: 'border-red-500/30',      bar: 'bg-red-500'      },
  computing:      { text: 'text-slate-300',    bg: 'bg-slate-500/15',    border: 'border-slate-500/30',    bar: 'bg-slate-400'    },
};

export const CATEGORY_ORDER: CategoryId[] = [
  'addition', 'subtraction', 'multiplication', 'division',
  'percentage', 'fractions', 'power', 'squareRoot',
  'algebra', 'geometry', 'trigonometry', 'logarithms', 'sequences',
  'numberTheory', 'vedic',
  'clockTime', 'calendarMath', 'moneyMath', 'financialMath', 'converting',
  'statistics', 'chemistry', 'physics', 'computing',
];

export interface CategorySection {
  id: string;
  label: string;
  labelEn: string;
  categories: CategoryId[];
}

export const CATEGORY_SECTIONS: CategorySection[] = [
  {
    id: 'arithmetic',
    label: 'Aritmética',
    labelEn: 'Arithmetic',
    categories: ['addition', 'subtraction', 'multiplication', 'division'],
  },
  {
    id: 'numbers',
    label: 'Números',
    labelEn: 'Numbers',
    categories: ['percentage', 'fractions', 'power', 'squareRoot'],
  },
  {
    id: 'algebra',
    label: 'Álgebra & Análisis',
    labelEn: 'Algebra & Analysis',
    categories: ['algebra', 'geometry', 'trigonometry', 'logarithms', 'sequences'],
  },
  {
    id: 'theory',
    label: 'Teoría & Mental',
    labelEn: 'Theory & Mental',
    categories: ['numberTheory', 'vedic'],
  },
  {
    id: 'everyday',
    label: 'Uso Cotidiano',
    labelEn: 'Everyday Use',
    categories: ['clockTime', 'calendarMath', 'moneyMath', 'financialMath', 'converting'],
  },
  {
    id: 'science',
    label: 'Ciencia & Tecnología',
    labelEn: 'Science & Tech',
    categories: ['statistics', 'chemistry', 'physics', 'computing'],
  },
];
