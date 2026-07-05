# MathBrain 🧠

Entrenador de matemáticas adaptativo. Practica desde aritmética básica hasta álgebra, trigonometría, computación binaria, física, finanzas y más — con niveles que se ajustan solos a tu nivel real.

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
| **Potencias** | Cuadrados del 1 al 10 | Cubos, potencias de 2 | Potencias negativas, fraccionales | Leyes de exponentes, notación científica |
| **Raíz cuadrada** | √ de cuadrados perfectos hasta 100 | √ hasta 400 | √ de fracciones, simplificación | Raíces cúbicas, raíces no perfectas aproximadas |

---

### 📐 Álgebra & Análisis

| Categoría | Nivel 1 | Nivel 2 | Nivel 3 | Nivel 4 |
|---|---|---|---|---|
| **Álgebra** | Ecuaciones lineales simples (`x + 3 = 7`) | Ecuaciones con multiplicación/división (`3x = 12`) | Sistemas de 2 ecuaciones, despeje | Ecuaciones cuadráticas, factorización |
| **Geometría** | Perímetro de rectángulos y triángulos | Área de rectángulos, triángulos, círculos | Volumen de cubos y cilindros | Teorema de Pitágoras, diagonales, geometría analítica |
| **Trigonometría** | sin/cos/tan de ángulos comunes (0°, 30°, 45°, 60°, 90°) | Identidad pitagórica sin²+cos²=1, calcular tan | Conversión grados ↔ radianes | Ley de senos, ley de cosenos |
| **Logaritmos** | log₁₀ de potencias de 10 | log₂ de potencias de 2, log₁₀ general | ln (logaritmo natural), propiedades (producto, cociente) | Cambio de base, ecuaciones logarítmicas |
| **Sucesiones** | Sucesiones aritméticas simples (hallar el siguiente término) | Sucesiones geométricas, Fibonacci | Suma de serie aritmética (Σ fórmula) | Suma de serie geométrica, series infinitas |

---

### 🧠 Teoría & Mental

| Categoría | Nivel 1 | Nivel 2 | Nivel 3 | Nivel 4 |
|---|---|---|---|---|
| **Teoría de Números** | Números primos hasta 30, par/impar | MCD y MCM de números pequeños | Aritmética modular (resto de divisiones) | Teorema de Fermat, criptografía básica, factorización |
| **Mente Védica** | Multiplicación por 11, cuadrados terminados en 5 | Multiplicación cruzada 2×2, complementos a 100 | Cuadrados de números cercanos a 100, división por 9 | Técnicas combinadas, cálculo mental rápido |

---

### 🕐 Uso Cotidiano

| Categoría | Nivel 1 | Nivel 2 | Nivel 3 | Nivel 4 |
|---|---|---|---|---|
| **Reloj** | Leer la hora en punto y media | Calcular diferencias de minutos | Zonas horarias, conversión 12h↔24h | Duraciones complejas, sumas de tiempos |
| **Calendario** | Días de la semana, meses | ¿Qué día cae X fecha? Días entre fechas | Semanas, bisiesto, trimestres | Plazos en meses, cálculos de fechas laborales |
| **Dinero & Propinas** | Contar billetes y monedas | Calcular cambio, propinas del 10%/15% | Propinas del 18%/20%, dividir cuenta entre varias personas | Descuentos acumulados, conversión de monedas |
| **Finanzas & Inversión** | Interés simple (I = P×r×t) | Interés compuesto anual | ROI, regla del 72, inflación | Break-even, margen bruto, depreciación, TEA |
| **Medidas & Unidades** | km↔m, kg↔g, L↔mL (métrico básico) | m↔cm, horas↔minutos, toneladas, áreas | °C↔°F, kg↔libras, km↔millas, pulgadas, km/h↔m/s | d=v×t, galones↔litros, libras→gramos, kJ, atm↔Pa |

---

### 🔬 Ciencia & Tecnología

| Categoría | Nivel 1 | Nivel 2 | Nivel 3 | Nivel 4 |
|---|---|---|---|---|
| **Estadística & Probabilidad** | Media, mediana, moda de listas pequeñas | Desviación media, rango, probabilidad simple | Probabilidad condicional, regla del producto | Combinaciones C(n,r), permutaciones P(n,r), distribución |
| **Química** | Masas atómicas de elementos comunes (H, C, O, Fe…) | Masa molar de moléculas simples (H₂O, CO₂, NaCl…) | Masa molar de moléculas complejas (glucosa, H₂SO₄…) | Estequiometría: g = mol × M |
| **Física & Espacio** | Cinemática: d=v×t, v=d/t, t=d/v; aceleración; caída libre | F=ma, peso (F=mg), densidad, velocidad relativa | Energía cinética Ek=½mv², potencial Ep=mgh, trabajo, presión | Leyes de Kepler, velocidad orbital, Ley de Hubble, Ohm, termodinámica, velocidad de escape |
| **Computación** | Binario↔decimal (4 bits), decimal→binario, octal básico | Hexadecimal↔decimal, octal 2 dígitos, bytes/KB/MB/GB | Bit shifts (<<, >>), NOT, suma binaria, valores ASCII | AND/OR/XOR, complemento a dos, hex↔binario directo, álgebra booleana |

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

- **Niveles adaptativos** por categoría — cada una avanza o retrocede de forma independiente
- **Penalización por abandono** — no practicar durante 5 días baja el nivel; en modo práctica no puedes corregirlo manualmente
- **Prompt de distracción** — si el tiempo expira sin respuesta, presiona `A` (sí, estaba distraído — no cuenta) o `N` (cuenta como error)
- **Racha diaria** estilo Duolingo con récord personal 🔥
- **Gráfica de actividad** de los últimos 30 días + proyección de XP a 30 días
- **Dos modos de juego:**
  - Click en una categoría → modo individual, puedes elegir el nivel manualmente
  - Botón "Practicar" → modo práctica multi-categoría, la app elige los niveles por ti
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
    problems.ts       # Generadores de problemas por categoría y nivel (24 cats)
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
