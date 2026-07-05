# MathBrain 🧠

Entrenador de matemáticas adaptativo. Practica desde aritmética básica hasta álgebra, trigonometría, computación binaria, física, finanzas y más — con niveles que se ajustan solos a tu nivel real. **27 categorías · 6 secciones · curriculum de primaria y secundaria española.**

---

## Requisitos

- [Node.js](https://nodejs.org/) v18 o superior (incluye npm)

Verifica tu versión:
```bash
node -v   # debe decir v18.x.x o mayor
npm -v
```

---

## Instalación (primera vez)

```bash
# 1. Entra a la carpeta del proyecto
cd ~/Projects/mathbrain

# 2. Instala las dependencias
npm install
```

Solo necesitas hacer esto una vez (o cuando se agreguen nuevas dependencias).

---

## Iniciar en modo desarrollo

```bash
npm run dev
```

Abre el navegador en **http://localhost:5173**
(si ese puerto está ocupado, la terminal mostrará el que usó, ej. 5174)

---

## Construir para producción

```bash
npm run build
```

Los archivos listos quedan en `dist/`. Para previsualizarlos:
```bash
npm run preview
```

---

## Temario completo por categoría

### 🔢 Aritmética

| Categoría | Nivel 1 | Nivel 2 | Nivel 3 | Nivel 4 |
|---|---|---|---|---|
| **Suma** | Números hasta 20, con ayuda visual de puntos | Números hasta 100 | Números hasta 1000, decimales | Fracciones, negativos, sumas en cadena |
| **Resta** | Números hasta 20, con ayuda visual | Números hasta 100 | Números hasta 1000, decimales | Negativos, fracciones, resta en cadena |
| **Multiplicación** | Tablas 1–5 con cuadrícula visual | Tablas 1–10 (visual si factores ≤5) | Tablas hasta 12, por decenas | Multiplicación de 2 cifras, mentales avanzados |
| **División** | Divisiones exactas simples, con grupos visuales | Divisiones hasta 100 | Divisiones con decimales | División larga, residuos, fracciones |

---

### 🔣 Números

| Categoría | Nivel 1 | Nivel 2 | Nivel 3 | Nivel 4 |
|---|---|---|---|---|
| **Porcentaje** | % de cantidades redondas (50%, 25%, 10%) | % de cualquier número | Variaciones porcentuales, descuentos | Interés compuesto, porcentajes encadenados |
| **Fracciones** | Fracciones simples con barra visual (½, ⅓, ¼…) | Suma y resta de fracciones mismo denominador | Denominadores distintos, simplificación | Multiplicación y división de fracciones |
| **Decimales** *(nuevo)* | Valor posicional (décimas, centésimas), suma/resta | Multiplicación decimal × entero | División decimal, decimal ÷ decimal | Fracciones ↔ decimales, decimales periódicos |
| **Negativos** *(nuevo)* | Recta numérica, suma/resta con negativos | Reglas de signos (−×−=+), mult/div con negativos | Potencias de negativos, orden de operaciones | Valor absoluto, ecuaciones con negativos |
| **Potencias** | Cuadrados del 1 al 10 | Cubos, potencias de 2 | Potencias negativas, fraccionales | Leyes de exponentes, notación científica |
| **Raíz cuadrada** | √ de cuadrados perfectos hasta 100 | √ hasta 400 | √ de fracciones, simplificación | Raíces cúbicas, raíces no perfectas aproximadas |

---

### 📐 Álgebra & Análisis

| Categoría | Nivel 1 | Nivel 2 | Nivel 3 | Nivel 4 |
|---|---|---|---|---|
| **Álgebra** | Ecuaciones lineales simples (`x + 3 = 7`) | Ecuaciones con multiplicación/división (`3x = 12`) | Sistemas de 2 ecuaciones, despeje | Ecuaciones cuadráticas, factorización |
| **Proporcionalidad** *(nuevo)* | Razón directa, comparar ratios | Regla de tres (precio, velocidad, receta, mapa) | Proporcionalidad inversa (obreros×días), variación % | Proporción compuesta, escalas, tipos de cambio |
| **Geometría** | Perímetro y ángulos (triángulos, polígonos), ejes de simetría | Área de rectángulos, triángulos, círculos, ángulos suplementarios/complementarios | Volumen de cubos y cilindros, ángulos interiores de polígonos | Teorema de Pitágoras, pendiente entre dos puntos, geometría analítica |
| **Trigonometría** | sin/cos/tan de ángulos comunes (0°, 30°, 45°, 60°, 90°) | Identidad pitagórica sin²+cos²=1, calcular tan | Conversión grados ↔ radianes | Ley de senos, ley de cosenos |
| **Logaritmos** | log₁₀ de potencias de 10 | log₂ de potencias de 2, log₁₀ general | ln (logaritmo natural), propiedades (producto, cociente) | Cambio de base, ecuaciones logarítmicas |
| **Sucesiones** | Sucesiones aritméticas simples (hallar el siguiente término) | Sucesiones geométricas, Fibonacci | Suma de serie aritmética (Σ fórmula) | Suma de serie geométrica, series infinitas |

---

### 🧠 Teoría & Mental

| Categoría | Nivel 1 | Nivel 2 | Nivel 3 | Nivel 4 |
|---|---|---|---|---|
| **Teoría de Números** | Números primos, par/impar, numeración romana (I–M) | MCD y MCM de números pequeños, reglas de divisibilidad (2,3,4,5,6,8) | Aritmética modular, número de divisores | Teorema de Fermat, criptografía básica, factorización |
| **Mente Védica** | Multiplicación por 11, cuadrados terminados en 5 | Multiplicación cruzada 2×2, complementos a 100 | Cuadrados de números cercanos a 100, división por 9 | Técnicas combinadas, cálculo mental rápido |

---

### 🕐 Uso Cotidiano

| Categoría | Nivel 1 | Nivel 2 | Nivel 3 | Nivel 4 |
|---|---|---|---|---|
| **Reloj** | Leer la hora en punto y media | Calcular diferencias de minutos | Zonas horarias, conversión 12h↔24h | Duraciones complejas, sumas de tiempos |
| **Calendario** | Días de la semana, meses | ¿Qué día cae X fecha? Días entre fechas | Semanas, bisiesto, trimestres | Plazos en meses, cálculos de fechas laborales |
| **Dinero & Propinas** | Contar billetes y monedas, cambio exacto en céntimos | Calcular cambio, propinas del 10%/15%, precio unitario | Propinas del 18%/20%, dividir cuenta + propina entre varias personas, descuento doble | Puntos de fidelidad, compra X lleva Y gratis, comparación de precio por unidad, presupuesto |
| **Finanzas & Inversión** | Interés simple (I = P×r×t) | Interés compuesto anual | ROI, regla del 72, inflación | Break-even, margen bruto, depreciación, TEA |
| **Medidas & Unidades** | km↔m, kg↔g, L↔mL (métrico básico) | m↔cm, horas↔minutos, toneladas, áreas | °C↔°F, kg↔libras, km↔millas, pulgadas, km/h↔m/s | d=v×t, galones↔litros, libras→gramos, kJ, atm↔Pa |

---

### 🔬 Ciencia & Tecnología

| Categoría | Nivel 1 | Nivel 2 | Nivel 3 | Nivel 4 |
|---|---|---|---|---|
| **Estadística & Probabilidad** | Media, mediana, moda de listas pequeñas | Desviación media, rango, probabilidad simple | Probabilidad condicional, regla del producto | Combinaciones C(n,r), permutaciones P(n,r), distribución |
| **Química** | Masas atómicas de elementos comunes (H, C, O, Fe…) | Masa molar de moléculas simples (H₂O, CO₂, NaCl…) | Masa molar de moléculas complejas (glucosa, H₂SO₄…) | Estequiometría: g = mol × M |
| **Física & Espacio** | Cinemática: d=v×t; aceleración a=Δv/t; caída libre g=9.8 m/s² | F=ma, peso (F=mg), densidad, velocidad relativa | Energía cinética Ek=½mv², potencial Ep=mgh, trabajo, termodinámica Q=mcΔT | Leyes de Kepler, velocidad orbital, Ley de Hubble, Ohm P=VI, velocidad de escape |
| **Computación** | Binario↔decimal (4 bits), decimal→binario | Hexadecimal↔decimal, octal, bytes/KB/MB/GB, ASCII (A=65) | Bit shifts (<<, >>), suma binaria, complemento a dos | AND/OR/XOR, hex↔binario directo, álgebra booleana |

---

## Cómo funciona el sistema adaptativo

```
Precisión ≥ 92% en 5 problemas  →  sube de nivel rápido
Precisión ≥ 84% en 8 problemas  →  sube de nivel normal
Precisión ≥ 77% en 15 problemas →  sube de nivel lento  ← sweet spot
Precisión  < 35% en 5 problemas →  baja de nivel
Sin practicar ≥ 5 días          →  baja de nivel (penalización)
```

El objetivo es mantenerte en el **sweet spot**: la zona donde fallas lo justo para que el cerebro trabaje y aprenda de verdad, sin ser ni muy fácil ni frustrante.

---

## Características

- **27 categorías** organizadas en 6 secciones: Aritmética, Números, Álgebra & Análisis, Teoría & Mental, Uso Cotidiano, Ciencia & Tecnología
- **Niveles adaptativos** por categoría — cada una avanza o retrocede de forma independiente
- **Tres modos de práctica:**
  - 🎲 **Práctica Libre** — la app elige categorías y niveles; muestra panel de recomendaciones con las categorías más urgentes (⏰ olvidada, 💪 batallando, ✨ nueva)
  - 🎯 **A Consciencia** — tú seleccionas qué categorías practicar (individualmente o por sección); el algoritmo adapta el nivel dentro de tu selección
  - 📚 **Individual** — click directo en una categoría con selector de nivel manual
- **Sistema de recomendaciones inteligentes** — puntúa cada categoría por abandono, dificultad y novedad para sugerirte qué practicar primero
- **Penalización por abandono** — no practicar durante 5 días baja el nivel automáticamente; en modo práctica no puedes corregirlo manualmente
- **Prompt de distracción** — si el tiempo expira sin respuesta, presiona `A` (sí, estaba distraído — no cuenta) o `N` (cuenta como error)
- **Racha diaria** estilo Duolingo con récord personal 🔥
- **Gráfica de actividad** de los últimos 30 días + proyección de XP a 30 días
- **Ábaco interactivo** de apoyo durante el juego
- **Múltiples perfiles** con avatares
- **Export/Import** de perfiles en JSON

---

## Estructura del proyecto

```
src/
  components/
    Game.tsx          # Motor del juego, prompt de distracción, feedback
    Menu.tsx          # Menú principal con categorías por sección
    Stats.tsx         # Estadísticas, gráfica de actividad, racha
    Summary.tsx       # Resumen al final de cada sesión
    ProfileSelect.tsx # Gestión de perfiles
    SettingsPanel.tsx # Configuración (idioma, colores, sonidos)
    VisualDisplay.tsx # Ayudas visuales (cuadrículas, barras)
    ColoredMath.tsx   # Colorea símbolos matemáticos
    Abacus.tsx        # Ábaco interactivo de apoyo
  engine/
    adaptive.ts       # Algoritmo sweet-spot, avance/retroceso, penalizaciones
    problems.ts       # Generadores de problemas por categoría y nivel (27 cats)
    storage.ts        # localStorage, perfiles, historial de sesiones
    meta.ts           # Etiquetas, colores, íconos, secciones
  types/index.ts      # Tipos TypeScript
  i18n.ts             # Español / English
```

---

## Stack

- **React 19** + TypeScript
- **Vite 8**
- **Tailwind CSS v4**
- **localStorage** — sin backend, todo corre en el navegador
