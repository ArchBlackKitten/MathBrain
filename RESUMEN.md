# MathBrain — Resumen técnico completo

## Qué es

Aplicación web de entrenamiento matemático adaptativo. Corre completamente en el navegador (sin backend), usa `localStorage` para persistencia. Stack: **React 19 + TypeScript + Vite + Tailwind CSS v4**.

Repositorio: https://github.com/ArchBlackKitten/MathBrain

---

## Arquitectura

```
src/
  components/
    App.tsx           — Pantallas y navegación global
    Game.tsx          — Motor del juego, timer, feedback, prompt de distracción
    Menu.tsx          — Menú principal: Práctica Libre / A Consciencia
    Stats.tsx         — Estadísticas, gráfica de actividad, racha
    Summary.tsx       — Resumen al final de sesión
    ProfileSelect.tsx — Gestión de perfiles
    ProfileSetup.tsx  — Crear nuevo perfil
    SettingsPanel.tsx — Idioma, colores, sonidos
    VisualDisplay.tsx — Ayudas visuales (cuadrículas emoji, barra de fracción, reloj)
    ColoredMath.tsx   — Colorea símbolos matemáticos
    Abacus.tsx        — Ábaco interactivo de apoyo
  engine/
    adaptive.ts       — Algoritmo sweet-spot, pesos, recomendaciones, penalizaciones
    problems.ts       — 27 generadores de problemas (uno por categoría × 4 niveles)
    storage.ts        — localStorage, perfiles, historial de sesiones
    meta.ts           — Etiquetas, íconos, colores, secciones de categorías
    settings.ts       — Persistencia de configuración
  types/index.ts      — Tipos TypeScript (CategoryId, UserProfile, Problem, etc.)
  i18n.ts             — Español / English
```

---

## 27 Categorías de matemáticas (6 secciones)

### Aritmética
- Suma, Resta, Multiplicación, División

### Números
- Porcentaje, Fracciones, **Decimales** (nuevo), **Números Negativos** (nuevo), Potencias, Raíz Cuadrada

### Álgebra & Análisis
- Álgebra, **Proporcionalidad** (nuevo, incluye regla de tres), Geometría, Trigonometría, Logaritmos, Sucesiones

### Teoría & Mental
- Teoría de Números (primos, MCD/MCM, numeración romana, divisibilidad, aritmética modular)
- Mente Védica

### Uso Cotidiano
- Tiempo · Reloj, Calendario, Dinero & Propinas, Finanzas & Inversión, Medidas & Unidades

### Ciencia & Tecnología
- Estadística & Probabilidad, Química, Física & Espacio, Computación

---

## Contenido por categoría clave

**Computación** — binario↔decimal, octal, hexadecimal, bytes/KB/MB, bit shifts (<<, >>), ASCII (A=65), AND/OR/XOR, complemento a dos, álgebra booleana

**Medidas** — métrico, imperial (kg↔libras, km↔millas, pulgadas, galones), °C↔°F, km/h↔m/s, d=v×t

**Física** — cinemática (d,v,t), caída libre, aceleración, F=ma, energía (Ek, Ep), termodinámica, electricidad (Ohm, P=VI), leyes de Kepler, velocidad orbital, velocidad de escape

**Geometría** — perímetros, áreas, ángulos de triángulos (suma 180°), ángulos suplementarios/complementarios, ángulos interiores de polígonos regulares, ejes de simetría, circunferencia/área del círculo, volumen, Teorema de Pitágoras, pendiente entre puntos

**Proporcionalidad** — razón directa, regla de tres con contexto (precio, velocidad, receta, mapa), proporcionalidad inversa (obreros×días), variación porcentual, proporción a/b=c/d, escalas, tipos de cambio

**Decimales** — suma/resta, valor posicional (décimas, centésimas), multiplicación decimal×entero, división decimal, fracciones↔decimales, decimales periódicos

**Números Negativos** — recta numérica, reglas de signos, multiplicación/división con negativos, potencias de negativos, valor absoluto, orden de operaciones

---

## Motor adaptativo (adaptive.ts)

### Sweet-spot algorithm
El objetivo es mantener al usuario en la zona donde falla lo justo para aprender óptimamente (70–80% de aciertos).

```
Nivel sube rápido:  ≥92% en 5 intentos del nuevo nivel
Nivel sube normal:  ≥84% en 8 intentos
Nivel sube lento:   ≥77% en 15 intentos  ← sweet spot, no se apresura
Nivel baja:         <35% en 5 intentos
```

### Pesos de selección de categoría
Las categorías que más necesitas aparecen más frecuentemente:
```
acc < 40%  → peso 3.5× (aparece mucho más)
acc < 55%  → peso 2.5×
acc < 65%  → peso 1.8×
acc > 92%  → peso 0.65× (dominada, pero no desaparece)
acc > 82%  → peso 0.80×
en rango   → peso 1.0×  (normal)
```

### Tiempo límite adaptativo
```
acc > 90%  → 50% del tiempo base (más desafiante)
acc > 80%  → 70% del tiempo base
acc > 70%  → 85% del tiempo base
acc < 40%  → 140% del tiempo base (más holgado)
acc < 55%  → 120% del tiempo base
```

### Penalización por abandono
Si no practicas una categoría en ≥5 días y está en nivel >1: baja un nivel automáticamente al abrir la app. En modo práctica, este nivel no se puede cambiar manualmente.

### Sistema de recomendaciones (`getCategoryPriorities`)
Cada categoría recibe una puntuación 0–1:
```
score = neglect_score    × 0.35  (días sin practicar / 7, cap 1)
      + struggle_score   × 0.40  (cuánto bajo de 70% de aciertos)
      + new_score        × 0.20  (nunca practicada)
      + sweet_spot_score × 0.05  (actualmente en zona óptima)
```
Las top 5–6 se muestran como recomendaciones en Práctica Libre.

---

## Modos de juego

### Práctica Libre (🎲)
- La app elige categorías y niveles por el algoritmo adaptativo
- Muestra panel "La app recomienda" con las categorías más urgentes
- No se muestra el nivel durante el juego — el sistema es interno
- 10 problemas por sesión

### Práctica a Consciencia (🎯)
- El usuario selecciona qué categorías practicar
- Puede activar/desactivar secciones enteras
- El algoritmo sigue adaptando el nivel dentro de las categorías elegidas
- Botón sticky con conteo de categorías seleccionadas

### Categoría Individual
- Click directo en una categoría desde el menú
- El usuario puede cambiar el nivel manualmente (selector visible)
- Útil para explorar o practicar algo específico sin restricciones

---

## Mecánicas de usuario

- **Racha diaria** estilo Duolingo con récord personal (🔥)
- **XP**: +10 por respuesta correcta, +2 por incorrecta
- **Historial** de 90 días de actividad con XP/día
- **Gráfica de barras** de los últimos 30 días + proyección de XP a 30 días
- **Prompt de distracción**: si el tiempo expira sin ninguna respuesta, pregunta "¿Estabas distraído?" — tecla A (sí, no cuenta) / N (no, cuenta como error)
- **Múltiples perfiles** con avatares emoji
- **Export/Import** de perfiles en JSON
- **Ábaco** como herramienta de apoyo durante el juego

---

## Feature pendiente (no implementada)

**Explicaciones paso a paso + visuales animados** al fallar una respuesta (estilo Khan Academy + app de pago descrita por la usuaria).

Diseño propuesto:
- Añadir `steps?: string[]` y `explainVisual?: ExplainVisual` al tipo `Problem` en `types/index.ts`
- `ExplainVisual` types: `bar` (porcentaje/propinas), `fraction`, `dotgrid` (multiplicación), `numberline` (suma/resta), `split` (divisiones de cuenta)
- Componente `ExplainPanel.tsx`: modal slide-up con visual animado + pasos apareciendo uno a uno
- Los generadores de las categorías principales incluirían arrays de `steps`
- En `Game.tsx`: wrong answers no auto-avanzan, esperan que el usuario toque "Continuar →"

---

## Tipos TypeScript clave

```typescript
export type CategoryId = 'addition' | 'subtraction' | 'multiplication' | 'division'
  | 'percentage' | 'power' | 'squareRoot' | 'fractions' | 'decimals' | 'negatives'
  | 'algebra' | 'proportionality' | 'geometry' | 'trigonometry' | 'logarithms' | 'sequences'
  | 'numberTheory' | 'vedic'
  | 'clockTime' | 'calendarMath' | 'moneyMath' | 'financialMath' | 'converting'
  | 'statistics' | 'chemistry' | 'physics' | 'computing';

export type ProblemLevel = 1 | 2 | 3 | 4;

export interface CategoryStats {
  attempts: number; correct: number; totalTimeMs: number;
  recentResults: boolean[];   // ventana deslizante de 20
  level: ProblemLevel;
  weight: number;             // calculado por calcWeight()
  baseTime: number;           // tiempo base en segundos
  unlocked: boolean;
  lastPracticed: number;      // timestamp ms, 0 = nunca
  attemptsAtLevel: number;    // se reinicia al cambiar de nivel
}

export interface UserProfile {
  id: string; name: string; avatar: string;
  categories: Record<CategoryId, CategoryStats>;
  totalSessions: number; totalProblems: number; xp: number;
  createdAt: number; lastPlayed: number;
  streak: number; bestStreak: number; lastPlayedDate: string;
  history: DayRecord[];  // hasta 90 días
}
```

---

## Sesión de práctica (flujo)

1. Usuario elige modo (Libre / Consciencia / Individual)
2. `nextProblem(profile, filter?)` selecciona categoría por peso, genera problema al nivel actual con tiempo adaptativo
3. Usuario responde (o se acaba el tiempo)
4. Si tiempo expira sin respuesta → prompt de distracción (A/N)
5. `applyResult()` actualiza: attempts, correct, recentResults, lastPracticed, weight, XP
6. `shouldAdvanceLevel()` / `shouldDropLevel()` evalúan si cambiar nivel
7. Después de 10 problemas → pantalla de resumen → `applySessionToProfile()` actualiza racha + historial
