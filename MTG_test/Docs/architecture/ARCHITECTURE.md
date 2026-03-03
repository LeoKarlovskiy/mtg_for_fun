# Software Architecture Plan: MTG Commander Life Tracker ("Dragon's Table")

**Version:** 0.1
**Date:** 2026-03-02
**Status:** Draft — pending implementation
**Deployment target:** Vercel (static SPA)

---

## Decisions Log

| Decision | Choice | Rationale |
|---|---|---|
| Routing | React Router v6 | URL-based; supports browser back/forward |
| PWA | Yes — vite-plugin-pwa | Offline play at the table; installable to home screen |
| Avatar storage | Resize to 200×200 + base64 in localStorage | Simplest path; compressed to ~20 KB per avatar |
| Testing | Vitest + React Testing Library | Vite-native; unit-test game logic and store actions |

---

## Full Dependency List

### Runtime dependencies

```json
{
  "react": "^18.3",
  "react-dom": "^18.3",
  "react-router-dom": "^6.26",
  "zustand": "^5.0",
  "framer-motion": "^11.0"
}
```

> **Note on Tailwind CSS:** The style guide (`STYLE_GUIDE.md`) is written for **Tailwind CSS v3** (`tailwind.config.ts` + PostCSS). Tailwind v4 uses a CSS-first config and is incompatible with the existing config. Pin to **v3.x** for this prototype.

```json
{
  "tailwindcss": "^3.4",
  "postcss": "^8.4",
  "autoprefixer": "^10.4"
}
```

### Development dependencies

```json
{
  "vite": "^5.4",
  "vite-plugin-pwa": "^0.21",
  "@vitejs/plugin-react": "^4.3",
  "typescript": "^5.5",
  "vitest": "^2.1",
  "@testing-library/react": "^16.0",
  "@testing-library/user-event": "^14.5",
  "@testing-library/jest-dom": "^6.5",
  "jsdom": "^25.0"
}
```

---

## Project Structure

```
mtg-for-fun/
├── public/
│   ├── textures/
│   │   └── stone.png               ← tileable dark stone texture (optional)
│   ├── icons/
│   │   ├── icon-192.png            ← required for PWA manifest
│   │   └── icon-512.png            ← required for PWA manifest
│   └── favicon.ico
│
├── src/
│   ├── types/
│   │   └── index.ts                ← Square, Game, GameHistory (from PRD)
│   │
│   ├── store/
│   │   ├── gameStore.ts            ← active game (Zustand, in-memory)
│   │   └── historyStore.ts         ← completed games (Zustand + persist middleware)
│   │
│   ├── lib/
│   │   ├── elimination.ts          ← pure elimination/win logic
│   │   └── imageUtils.ts           ← avatar resize + base64 encode (Canvas API)
│   │
│   ├── animations/
│   │   └── variants.ts             ← all Framer Motion variants (from STYLE_GUIDE.md)
│   │
│   ├── components/
│   │   ├── Square.tsx              ← player tile
│   │   ├── LifeControls.tsx        ← +5/+1/-1/-5 buttons
│   │   ├── CommanderDamage.tsx     ← per-opponent damage counters
│   │   ├── PlayerAvatar.tsx        ← avatar display + upload input
│   │   └── ui/
│   │       ├── Button.tsx          ← primary / secondary / life variants
│   │       └── PageTransition.tsx  ← Framer Motion page wrapper
│   │
│   ├── pages/
│   │   ├── Landing.tsx
│   │   ├── Setup.tsx
│   │   ├── Game.tsx
│   │   ├── Win.tsx
│   │   └── History.tsx
│   │
│   ├── styles/
│   │   └── tokens.css              ← CSS custom properties (from STYLE_GUIDE.md)
│   │
│   ├── App.tsx                     ← BrowserRouter + AnimatePresence + Routes
│   ├── main.tsx
│   └── index.css                   ← Tailwind directives + @import tokens.css
│
├── tailwind.config.ts              ← from STYLE_GUIDE.md
├── tsconfig.json
├── vite.config.ts                  ← Vite + React plugin + PWA plugin
├── vercel.json                     ← SPA rewrite rule
└── vitest.config.ts
```

---

## Routing

React Router v6 with `BrowserRouter`. All routes render inside `AnimatePresence` to enable page transition animations.

```tsx
// App.tsx
<BrowserRouter>
  <AnimatePresence mode="wait">
    <Routes location={location} key={location.pathname}>
      <Route path="/"        element={<Landing />} />
      <Route path="/setup"   element={<Setup />} />
      <Route path="/game"    element={<Game />} />
      <Route path="/win"     element={<Win />} />
      <Route path="/history" element={<History />} />
    </Routes>
  </AnimatePresence>
</BrowserRouter>
```

### Route guards

| Route | Guard |
|---|---|
| `/game` | Redirect to `/` if `gameStore.game` is null |
| `/win` | Redirect to `/` if `gameStore.game?.status !== 'complete'` |

Implemented as a lightweight `<RequireGame>` wrapper component — no external auth library needed.

---

## State Architecture

### `gameStore.ts` — active game, in-memory only

Zustand store. Not persisted. Cleared on "New Game".

```ts
interface GameStore {
  game: Game | null

  // Setup → Game
  startGame: (players: PlayerSetup[], startingLife: number) => void

  // In-game actions
  adjustLife: (playerId: string, delta: number) => void
  addCommanderDamage: (targetId: string, sourceId: string) => void

  // Internal — called by adjustLife / addCommanderDamage after mutation
  checkElimination: (playerId: string) => void

  // End of game
  resetGame: () => void    // Play Again: reset life totals, same players
  clearGame: () => void    // New Game: clear everything
}
```

`adjustLife` and `addCommanderDamage` both call `checkElimination` internally after updating state. If `findWinner` returns a player, the store sets `game.status = 'complete'` and calls the history store's `addGame`.

### `historyStore.ts` — completed games, persisted

Zustand store with `persist` middleware. Writes to `localStorage` under key `'mtg-history'`.

```ts
interface HistoryStore {
  games: GameHistory[]
  addGame: (game: GameHistory) => void
  clearHistory: () => void
}
```

**Storage cap:** Keep the 20 most recent games. `addGame` trims the array to 20 after inserting. This prevents localStorage overflow over time (~130 KB per game × 20 = ~2.6 MB, well within the 5 MB limit).

### localStorage key map

| Key | Store | Contents |
|---|---|---|
| `'mtg-history'` | historyStore | `GameHistory[]` (serialized by Zustand persist) |

No other keys. The active game is in-memory only.

---

## Game Logic (`src/lib/elimination.ts`)

Pure functions — no store dependencies. Fully unit-testable.

```ts
export const isEliminatedByLife = (life: number): boolean =>
  life <= 0

export const isEliminatedByCommander = (damage: Record<string, number>): boolean =>
  Object.values(damage).some(d => d >= 21)

export const isEliminated = (square: Square): boolean =>
  isEliminatedByLife(square.life) || isEliminatedByCommander(square.commanderDamage)

export const findWinner = (squares: Square[]): Square | null => {
  const alive = squares.filter(s => !s.isEliminated)
  return alive.length === 1 ? alive[0] : null
}
```

`gameStore` imports these and calls them after every state mutation.

---

## Avatar Image Processing (`src/lib/imageUtils.ts`)

No external library. Uses the browser Canvas API.

```ts
// Resize to maxWidth × maxHeight (preserving aspect ratio), then encode as base64 JPEG
export async function processAvatar(file: File, maxSize = 200): Promise<string>
```

Pipeline: `File → HTMLImageElement → Canvas (drawImage scaled) → toDataURL('image/jpeg', 0.8)`.

Result is a `data:image/jpeg;base64,...` string stored directly on `Square.avatar`.

---

## Animation

All Framer Motion variants live in `src/animations/variants.ts` (already specified in `STYLE_GUIDE.md`). Components import from this single file.

| Variant | Trigger |
|---|---|
| `lifeDeltaVariants` | Every +/− life tap |
| `eliminationVariants` + `eliminationFlash` | Player hits 0 life or 21 commander damage |
| `winOverlayVariants` + `winTitleVariants` + `winGlowVariants` | Win screen mount |
| `pageVariants` | Every route change (via `AnimatePresence`) |

---

## PWA Configuration (`vite.config.ts`)

```ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'textures/stone.png'],
      manifest: {
        name: "Dragon's Table",
        short_name: 'MTG Tracker',
        description: 'Commander life tracker',
        display: 'standalone',
        orientation: 'any',
        background_color: '#0d0d0d',
        theme_color: '#D4A017',
        icons: [
          { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
        ],
      },
      workbox: {
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com/,
            handler: 'CacheFirst',
            options: { cacheName: 'google-fonts' },
          },
        ],
      },
    }),
  ],
})
```

**PWA icons are required** — at minimum `icon-192.png` and `icon-512.png` must exist in `public/icons/` before deploying.

---

## Screen Wake Lock

Because players leave a device on the table for the duration of a game, the browser's auto-sleep will interrupt play. The Game screen should request a Screen Wake Lock on mount and release it on unmount.

```ts
// In Game.tsx
useEffect(() => {
  let wakeLock: WakeLockSentinel | null = null
  navigator.wakeLock?.request('screen').then(wl => { wakeLock = wl })
  return () => { wakeLock?.release() }
}, [])
```

No external library needed. Supported in Chrome, Edge, and Safari 16.4+. Falls back silently if unavailable.

---

## Vercel Deployment (`vercel.json`)

Required for SPA routing — without this, any direct URL (e.g. `/history`) returns a 404.

```json
{
  "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
}
```

No other Vercel configuration is needed. The project builds to a static bundle (`vite build`) and Vercel serves it as a CDN-cached static site.

---

## Testing (`vitest.config.ts`)

```ts
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    globals: true,
  },
})
```

`src/test/setup.ts`:
```ts
import '@testing-library/jest-dom'
```

### Priority test targets

| Module | What to test |
|---|---|
| `lib/elimination.ts` | All elimination and win conditions |
| `store/gameStore.ts` | `adjustLife`, `addCommanderDamage`, elimination trigger, win trigger |
| `store/historyStore.ts` | `addGame` persists; 20-game cap enforced |
| `lib/imageUtils.ts` | Output is valid base64; dimensions within bounds |

Component tests (React Testing Library) are secondary for a prototype — focus on the pure logic first.

---

## Known Constraints

| Constraint | Detail |
|---|---|
| localStorage limit | ~5 MB per origin. With 20-game cap + 6 compressed avatars, peak usage ~3 MB. |
| Google Fonts at runtime | Fonts require a network request on first load. Cached by the PWA service worker thereafter. |
| PWA icons | Must be provided before deploy. Minimum: 192 × 512 px PNG pair. |
| Tailwind v3 | Pin to v3.x. The existing style guide config is incompatible with Tailwind v4's CSS-first approach. |
| React Router + AnimatePresence | `location` must be passed to `<Routes>` as a key prop for exit animations to fire. |

---

## Build & Deploy Checklist

- [ ] `public/icons/icon-192.png` and `icon-512.png` created
- [ ] `public/textures/stone.png` sourced (optional but in style guide)
- [ ] `public/favicon.ico` created
- [ ] Google Fonts loaded in `index.html` `<head>`
- [ ] `vercel.json` present at repo root
- [ ] `vite build` runs clean with no type errors
- [ ] PWA audit passes in Lighthouse (score ≥ 90)
