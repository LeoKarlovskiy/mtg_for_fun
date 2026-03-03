# Style Guide: MTG Life Tracker
**MTG Commander Life Tracker — Visual Design System**

Version: 0.1 | Date: 2026-02-27

---

## Design Principles

1. **Dark and commanding** — every screen should feel like a stone hall lit by dragonfire
2. **Readable at a distance** — this is a table game; numbers must be legible across a table
3. **Weight and drama** — interactions have impact; nothing feels cheap or accidental
4. **Gold over everything** — gold is the reward color; it marks winners, highlights, and glory

---

## Color Palette

### Design Tokens — CSS Custom Properties

Add to `src/index.css` or a `src/styles/tokens.css` file:

```css
:root {
  /* Backgrounds */
  --color-bg-base:        #0d0d0d;   /* near-black, the void */
  --color-bg-surface:     #1a1818;   /* stone surface, card backgrounds */
  --color-bg-raised:      #231f1f;   /* elevated elements, modals */
  --color-bg-overlay:     rgba(0, 0, 0, 0.72);

  /* Stone texture overlay — apply as a pseudo-element */
  --stone-texture-opacity: 0.04;

  /* Dragon Red */
  --color-red-ember:      #CC2200;   /* active, interactive */
  --color-red-deep:       #8B0000;   /* borders, danger states */
  --color-red-flare:      #FF4422;   /* explosion flash, impact */
  --color-red-dim:        #4A1010;   /* eliminated player tint */

  /* Aged Gold */
  --color-gold-bright:    #D4A017;   /* primary accent, highlights */
  --color-gold-muted:     #B8860B;   /* borders, secondary */
  --color-gold-dim:       #6B5000;   /* inactive gold, disabled states */
  --color-gold-glow:      rgba(212, 160, 23, 0.35); /* glow shadow */

  /* Text */
  --color-text-primary:   #F5ECD7;   /* parchment white */
  --color-text-secondary: #B0A090;   /* subdued labels */
  --color-text-disabled:  #5C5048;
  --color-text-gold:      #D4A017;
  --color-text-danger:    #FF4422;

  /* Borders */
  --color-border-card:    #B8860B;   /* player tile outer border */
  --color-border-inner:   #4A3800;   /* inner border / filigree line */
  --color-border-subtle:  #2A2020;   /* dividers, low-contrast edges */

  /* Life total specific */
  --color-life-high:      #F5ECD7;   /* 21–100 */
  --color-life-mid:       #D4A017;   /* 1–20 */
  --color-life-low:       #CC2200;   /* 0 and below */
}
```

### Tailwind Config Extension

In `tailwind.config.ts`:

```ts
import type { Config } from 'tailwindcss'

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: {
          base:    '#0d0d0d',
          surface: '#1a1818',
          raised:  '#231f1f',
        },
        red: {
          ember: '#CC2200',
          deep:  '#8B0000',
          flare: '#FF4422',
          dim:   '#4A1010',
        },
        gold: {
          bright: '#D4A017',
          muted:  '#B8860B',
          dim:    '#6B5000',
        },
        parchment: '#F5ECD7',
      },
      fontFamily: {
        display: ['Cinzel Decorative', 'Cinzel', 'serif'],
        serif:   ['Cinzel', 'IM Fell English', 'serif'],
        body:    ['IM Fell English', 'Georgia', 'serif'],
      },
      boxShadow: {
        'card':       '0 0 0 1px #B8860B, 0 0 0 3px #4A3800, 0 4px 24px rgba(0,0,0,0.8)',
        'card-hover': '0 0 0 1px #D4A017, 0 0 0 3px #6B5000, 0 0 20px rgba(212,160,23,0.25)',
        'gold-glow':  '0 0 12px rgba(212,160,23,0.5)',
        'red-glow':   '0 0 16px rgba(204,34,0,0.6)',
        'life':       '0 0 24px rgba(212,160,23,0.3)',
      },
      backgroundImage: {
        'stone': "url('/textures/stone.png')",  /* optional texture asset */
      },
    },
  },
} satisfies Config
```

---

## Typography

### Fonts

Import in `index.html` `<head>`:

```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600;700;900&family=Cinzel+Decorative:wght@400;700&family=IM+Fell+English:ital@0;1&display=swap" rel="stylesheet">
```

### Type Scale

| Role | Font | Weight | Size | Usage |
|---|---|---|---|---|
| **Life Total** | Cinzel | 900 | `6rem` (96px) | The life number on each Square |
| **Player Name** | Cinzel | 600 | `1.25rem` | Name on player tile |
| **Screen Title** | Cinzel Decorative | 700 | `2.5rem` | Landing, Win screen headings |
| **Section Label** | Cinzel | 400 | `0.75rem` | "Commander Damage", labels — all-caps, tracked |
| **Body / History** | IM Fell English | 400 | `1rem` | History entries, descriptive text |
| **Button** | Cinzel | 600 | `0.875rem` | All CTA buttons — all-caps |
| **Commander Damage Number** | Cinzel | 700 | `1.5rem` | Damage counters |

### CSS Utility Classes

```css
.text-life {
  font-family: 'Cinzel', serif;
  font-weight: 900;
  font-size: 6rem;
  line-height: 1;
  letter-spacing: -0.02em;
  color: var(--color-text-primary);
  text-shadow: 0 0 24px rgba(212, 160, 23, 0.3);
  transition: color 0.4s ease;
}

.text-life[data-state="mid"]  { color: var(--color-life-mid);  }
.text-life[data-state="low"]  { color: var(--color-life-low);  text-shadow: 0 0 24px rgba(204,34,0,0.5); }

.text-label {
  font-family: 'Cinzel', serif;
  font-size: 0.7rem;
  font-weight: 400;
  letter-spacing: 0.15em;
  text-transform: uppercase;
  color: var(--color-text-secondary);
}

.text-title {
  font-family: 'Cinzel Decorative', serif;
  font-weight: 700;
  color: var(--color-gold-bright);
  text-shadow: 0 0 16px rgba(212,160,23,0.4);
}
```

---

## Component Specs

### Player Square (Tile)

The primary game element. Styled like an MTG card with an ornate gold frame.

```
┌─────────────────────────────┐  ← outer border: gold (#B8860B), 1px
│ ┌─────────────────────────┐ │  ← inner border: dark gold (#4A3800), 1px
│ │  [avatar]  Player Name  │ │
│ │                         │ │
│ │           40            │ │  ← life total, large
│ │                         │ │
│ │  [−]              [+]   │ │  ← life controls
│ │                         │ │
│ │  ── COMMANDER DAMAGE ── │ │
│ │  P2: 0   P3: 0   P4: 0  │ │
│ └─────────────────────────┘ │
└─────────────────────────────┘
```

**Base styles:**
```css
.player-square {
  background-color: var(--color-bg-surface);
  border: 1px solid var(--color-border-card);
  outline: 3px solid var(--color-border-inner);
  outline-offset: -4px;
  border-radius: 8px;
  box-shadow: var(--shadow-card);
  position: relative;
  overflow: hidden;
}

/* Stone texture overlay */
.player-square::before {
  content: '';
  position: absolute;
  inset: 0;
  background-image: url('/textures/stone.png');
  opacity: 0.04;
  pointer-events: none;
}
```

**Eliminated state:**
```css
.player-square[data-eliminated="true"] {
  border-color: var(--color-red-deep);
  outline-color: var(--color-red-dim);
  filter: saturate(0.3) brightness(0.6);
}

.player-square[data-eliminated="true"]::after {
  content: '';
  position: absolute;
  inset: 0;
  background: rgba(139, 0, 0, 0.15);
  pointer-events: none;
}
```

---

### Buttons

**Primary (Start Game, Play Again):**
```css
.btn-primary {
  font-family: 'Cinzel', serif;
  font-weight: 600;
  font-size: 0.875rem;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: #0d0d0d;
  background: linear-gradient(135deg, #D4A017 0%, #B8860B 60%, #D4A017 100%);
  border: 1px solid #D4A017;
  padding: 0.75rem 2rem;
  border-radius: 4px;
  box-shadow: 0 0 12px rgba(212,160,23,0.4), inset 0 1px 0 rgba(255,255,255,0.1);
  transition: box-shadow 0.2s ease, transform 0.1s ease;
}

.btn-primary:hover {
  box-shadow: 0 0 20px rgba(212,160,23,0.65);
  transform: translateY(-1px);
}

.btn-primary:active {
  transform: translateY(0);
  box-shadow: 0 0 8px rgba(212,160,23,0.4);
}
```

**Secondary (New Game, History):**
```css
.btn-secondary {
  font-family: 'Cinzel', serif;
  font-weight: 400;
  font-size: 0.875rem;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--color-gold-bright);
  background: transparent;
  border: 1px solid var(--color-gold-muted);
  padding: 0.75rem 2rem;
  border-radius: 4px;
  transition: border-color 0.2s, color 0.2s;
}

.btn-secondary:hover {
  border-color: var(--color-gold-bright);
  color: #F5ECD7;
}
```

**Life Control (+/−):**
```css
.btn-life {
  width: 2.5rem;
  height: 2.5rem;
  font-family: 'Cinzel', serif;
  font-size: 1.25rem;
  color: var(--color-text-secondary);
  background: transparent;
  border: 1px solid var(--color-border-subtle);
  border-radius: 3px;
  transition: color 0.15s, border-color 0.15s, box-shadow 0.15s;
}

.btn-life:hover {
  color: var(--color-gold-bright);
  border-color: var(--color-gold-muted);
  box-shadow: 0 0 8px rgba(212,160,23,0.3);
}

.btn-life:active {
  color: var(--color-red-flare);
  border-color: var(--color-red-ember);
}
```

---

### Commander Damage Section

Within each Square, always visible at the bottom.

```css
.commander-damage {
  border-top: 1px solid var(--color-border-subtle);
  padding-top: 0.5rem;
  margin-top: 0.75rem;
  display: flex;
  gap: 0.75rem;
  justify-content: center;
}

.cmd-counter {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
}

.cmd-counter__value {
  font-family: 'Cinzel', serif;
  font-weight: 700;
  font-size: 1.25rem;
  color: var(--color-text-primary);
}

/* Warn when approaching 21 */
.cmd-counter__value[data-danger="true"] {
  color: var(--color-red-ember);
  text-shadow: 0 0 8px rgba(204,34,0,0.5);
}
```

---

## Animation Specs (Framer Motion)

### Life Total Change

Triggered on every +/− interaction. Brief scale + color flash.

```ts
// variants for the life number
export const lifeDeltaVariants = {
  idle: { scale: 1 },
  increase: {
    scale: [1, 1.15, 1],
    transition: { duration: 0.25, ease: 'easeOut' }
  },
  decrease: {
    scale: [1, 0.9, 1],
    transition: { duration: 0.2, ease: 'easeIn' }
  },
}
```

### Elimination — Fire Burst

When a player hits 0 / -10 / 21 commander damage.

```ts
export const eliminationVariants = {
  alive: { opacity: 1, scale: 1 },
  eliminated: {
    opacity: [1, 1, 0.4],
    scale: [1, 1.05, 0.97],
    transition: { duration: 0.6, ease: 'easeInOut' }
  },
}

// Overlay flash — red fire burst
export const eliminationFlash = {
  initial: { opacity: 0 },
  animate: {
    opacity: [0, 0.8, 0],
    scale: [0.8, 1.2, 1.4],
    transition: { duration: 0.5, ease: 'easeOut' }
  },
}
```

**Usage note:** Pair with a full-bleed red overlay (`bg-red-ember/70`) that animates in and out over 500ms using `AnimatePresence`.

### Win State — Dark and Regal

Slow golden glow, throne claimed.

```ts
export const winOverlayVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { duration: 1.2, ease: 'easeInOut' }
  },
}

export const winTitleVariants = {
  hidden: { opacity: 0, y: 30, scale: 0.9 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 1.0, delay: 0.4, ease: [0.22, 1, 0.36, 1] }
  },
}

export const winGlowVariants = {
  dim: { boxShadow: '0 0 0px rgba(212,160,23,0)' },
  glow: {
    boxShadow: [
      '0 0 20px rgba(212,160,23,0.1)',
      '0 0 60px rgba(212,160,23,0.5)',
      '0 0 40px rgba(212,160,23,0.3)',
    ],
    transition: { duration: 2.5, repeat: Infinity, repeatType: 'mirror', ease: 'easeInOut' }
  },
}
```

### Screen Transitions

```ts
export const pageVariants = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' } },
  exit:    { opacity: 0, y: -8, transition: { duration: 0.25 } },
}
```

---

## Layout

### Game Grid

| Players | Layout |
|---|---|
| 2 | 1 × 2 (side by side, landscape) |
| 3 | 2 top + 1 bottom centered |
| 4 | 2 × 2 grid |
| 5 | 2 top + 3 bottom |
| 6 | 2 × 3 grid |

Base grid class: `grid gap-3 p-4 min-h-screen bg-bg-base`

Player tiles should fill their grid cell. Use `aspect-[3/4]` as the base tile ratio.

---

## Iconography

No icon libraries. Use unicode or inline SVG only, to stay in-theme.

| Purpose | Glyph / SVG |
|---|---|
| Add life | `＋` (fullwidth plus) |
| Remove life | `－` (fullwidth minus) |
| Eliminated | `✦` or `†` (dagger) |
| Winner crown | `♛` |
| History | `◈` |
| Dragon / branding | Custom SVG recommended |

---

## Screen-Specific Notes

### Landing
- Full-screen `bg-bg-base` with optional subtle vignette
- Title: "Dragon's Table" or game name in `Cinzel Decorative`, gold, with gold-glow text-shadow
- Single large "New Game" primary button centered
- "History" as a secondary text link below

### Setup
- Dark card (`bg-bg-surface`) centered on screen
- Player rows: avatar thumbnail, name input (styled input with gold bottom-border), remove button
- Input style: `bg-transparent border-b border-gold-muted text-parchment font-serif focus:border-gold-bright outline-none`

### History
- List items use `bg-bg-surface border border-border-subtle` cards
- Winner name in gold, other players in parchment, eliminated in dim text
- Dates in `text-label` style

---

## Accessibility Notes

- All interactive elements must have `:focus-visible` rings in `gold-bright`
- Life total font size must not go below `4rem` on smallest supported viewport
- Eliminated squares must remain in DOM (not hidden) per PRD spec

---

## Asset Checklist

- [ ] `/public/textures/stone.png` — tileable dark stone texture (optional but recommended)
- [ ] `/public/favicon.ico` — dragon or flame icon
- [ ] Google Fonts loaded in `index.html`
- [ ] Framer Motion installed: `npm install framer-motion`
- [ ] Tailwind config updated with extended theme (see above)
