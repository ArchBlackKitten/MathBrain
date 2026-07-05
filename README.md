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

Solo necesitas hacer esto una vez (o cuando alguien agregue nuevas dependencias).

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

## Categorías de matemáticas

| Sección | Categorías |
|---|---|
| **Aritmética** | Suma, Resta, Multiplicación, División |
| **Números** | Porcentaje, Fracciones, Potencias, Raíz Cuadrada |
| **Álgebra & Análisis** | Álgebra, Geometría, Trigonometría, Logaritmos, Sucesiones |
| **Teoría & Mental** | Teoría de Números, Mente Védica |
| **Uso Cotidiano** | Reloj, Calendario, Dinero & Propinas, Finanzas & Inversión, Medidas & Unidades |
| **Ciencia & Tecnología** | Estadística & Probabilidad, Química, Física & Espacio, Computación |

**Computación** incluye: binario, octal, hexadecimal, bytes/KB/MB, bit shifts, ASCII, AND/OR/XOR, complemento a dos, álgebra booleana.

**Medidas** incluye: métrico, imperial (libras, millas, pulgadas, galones), temperatura °C↔°F, velocidad km/h↔m/s.

**Física** incluye: cinemática (d=v×t), caída libre, aceleración, fuerza, energía, presión, electricidad, aeroespacial.

---

## Cómo funciona

### Niveles adaptativos
La app detecta tu sweet spot y sube o baja de nivel automáticamente:
- **92%+ en 5 problemas** → avance rápido (nivel muy fácil)
- **84%+ en 8 problemas** → avance normal
- **77%+ en 15 problemas** → avance lento (estás en el sweet spot)
- **<35% en 5 problemas** → baja de nivel

### Penalización por abandono
Si no practicas una categoría en **5 días** y está en nivel >1, baja un nivel automáticamente al abrir la app. En modo práctica no puedes ignorar esto.

### Prompt de distracción
Si el tiempo expira y no escribiste nada, aparece "¿Estabas distraído?" — presiona **A** (sí, no cuenta) o **N** (no, cuenta como error).

### Dos modos de juego
- **Click en una categoría** → modo individual, puedes elegir el nivel manualmente
- **Botón "Practicar"** → modo práctica multi-categoría, la app elige los niveles por ti

### Racha diaria
Estilo Duolingo — practica cada día para mantener la racha 🔥

---

## Estructura del proyecto

```
src/
  components/     # UI — Game, Menu, Stats, Settings, ProfileSelect...
  engine/
    adaptive.ts   # Algoritmo sweet-spot, avance/retroceso de nivel
    problems.ts   # Generadores de problemas por categoría y nivel
    storage.ts    # localStorage, perfiles, historial
    meta.ts       # Etiquetas, colores, íconos, secciones
  types/          # Tipos TypeScript
  i18n.ts         # Español / English
```

---

## Stack

- **React 19** + TypeScript
- **Vite 8**
- **Tailwind CSS v4**
- **localStorage** — sin backend, todo corre en el navegador
