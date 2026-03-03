# Software Architecture Plan: MTG Commander Life Tracker ("Dragon's Table")

**Version:** 0.2
**Date:** 2026-03-03
**Status:** Live — https://mtg-for-fun.vercel.app
**Deployment target:** Vercel (static SPA)

---

## Decisions Log

| Decision | Choice | Rationale |
|---|---|---|
| Routing | React Router v6 | URL-based; supports browser back/forward |
| PWA | Yes — vite-plugin-pwa | Offline play at the table; installable to home screen |
| Avatar storage | Resize to 200×200 + base64 in localStorage | Simplest path; compressed to ~20 KB per avatar |
| Testing | Vitest + React Testing Library | Vite-native; unit-test game logic and store actions |
| Win UI | Inline portal modal on `/game` (not a `/win` route) | Avoids route guard conflict; game state stays mounted when status becomes `'complete'` |
| Modal rendering | `createPortal(…, document.body)` | `PageTransition` applies CSS `transform` which creates a new stacking context, trapping `position: fixed` descendants |
| Orientation | `lib/orientations.ts` with CSS grid-template-areas + per-slot rotation | Pure CSS; no layout library; easily extended |
| Floating controls | Sibling of `PageTransition` (not a descendant) | Avoids transform stacking-context issue; `position: fixed` works correctly |
| Back gesture block | `pushState` + `popstate` listener | No React Router dependency; works on all platforms |
| Vercel config | Root-level `vercel.json` with `buildCommand: "cd app && ..."` | App is in a subdirectory; Vercel must be told where to build from |

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
│   │   └── index.ts                ← Square, Game (+ startingLife, orientationId), GameHistory
│   │
│   ├── store/
│   │   ├── gameStore.ts            ← active game (Zustand, in-memory)
│   │   └── historyStore.ts         ← completed games (Zustand + persist middleware)
│   │
│   ├── lib/
│   │   ├── elimination.ts          ← pure elimination/win logic
│   │   ├── imageUtils.ts           ← avatar resize + base64 encode (Canvas API)
│   │   └── orientations.ts         ← 10 layout variants for 2–6 players (CSS grid + rotation)
│   │
│   ├── animations/
│   │   └── variants.ts             ← all Framer Motion variants
│   │
│   ├── components/
│   │   ├── Square.tsx              ← player tile
│   │   ├── LifeControls.tsx        ← +5/+1/-1/-5 buttons
│   │   ├── CommanderDamage.tsx     ← per-opponent damage counters
│   │   ├── PlayerAvatar.tsx        ← avatar display + upload input
│   │   ├── WinModal.tsx            ← portal modal shown on game completion
│   │   ├── GameMenu.tsx            ← portal modal for stop-game actions (Restart / Home)
│   │   └── ui/
│   │       ├── Button.tsx          ← primary / secondary / life variants
│   │       └── PageTransition.tsx  ← Framer Motion page wrapper
│   │
│   ├── pages/
│   │   ├── Landing.tsx
│   │   ├── Setup.tsx               ← includes orientation picker
│   │   ├── Game.tsx                ← includes floating controls + back-gesture trap
│   │   └── History.tsx
│   │   (Win.tsx removed — win state handled by WinModal portal)
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
      <Route path="/game"    element={<RequireGame require="started"><Game /></RequireGame>} />
      <Route path="/history" element={<History />} />
    </Routes>
  </AnimatePresence>
</BrowserRouter>
```

The `/win` route was removed. Win state is handled by `WinModal` rendered inside the `/game` route, which stays mounted when `game.status` becomes `'complete'`.

### Route guards

| Route | Guard | Redirect |
|---|---|---|
| `/game` | `require="started"` — redirect if `game === null` | `/` |

`RequireGame` has three guard types: `'active'` (only allows active games), `'complete'` (only allows completed), and `'started'` (allows both active and complete, redirects only when `game` is `null`). The game route uses `'started'` so the WinModal can render when the game ends without being ejected by the guard.

Implemented as a lightweight `<RequireGame>` wrapper component — no external auth library needed.

---

## State Architecture

### `gameStore.ts` — active game, in-memory only

Zustand store. Not persisted. Cleared on "New Game".

```ts
interface GameStore {
  game: Game | null

  // Setup → Game
  startGame: (players: PlayerSetup[], startingLife: number, orientationId: string) => void

  // In-game actions
  adjustLife: (playerId: string, delta: number) => void
  addCommanderDamage: (targetId: string, sourceId: string) => void
  // ^ also deducts 1 life from target atomically

  // End of game
  resetGame: () => void    // Restart: reset life totals, same players
  clearGame: () => void    // Home: clear everything
}
```

`adjustLife` and `addCommanderDamage` both call `_checkElimination` internally after updating state. If `findWinner` returns a player, the store sets `game.status = 'complete'`. History persistence is handled by `WinModal` (not the store) to avoid circular dependencies.

`startGame` now accepts `orientationId: string` and stores it on the `Game` object. `addCommanderDamage` atomically applies both the damage increment and a `-1` life deduction to the target player.

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

All Framer Motion variants live in `src/animations/variants.ts`. Components import from this single file.

| Variant | Trigger |
|---|---|
| `lifeDeltaVariants` | Every +/− life tap |
| `eliminationVariants` + `eliminationFlash` | Player hits 0 life or 21 commander damage |
| `winGlowVariants` | WinModal mount — perpetual golden glow on winner name |
| `modalBackdropVariants` + `modalPanelVariants` | WinModal and GameMenu open/close |
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

## Orientations (`src/lib/orientations.ts`)

Defines 10 `OrientationDef` objects covering 2–6 player counts. Each definition includes:

```ts
type SlotConfig = { rotation: 0 | 90 | 180 | 270; gridArea: string }
type OrientationDef = {
  id: string
  label: string
  playerCount: number
  gridStyle: {
    gridTemplateAreas: string
    gridTemplateColumns: string
    gridTemplateRows: string
  }
  slots: SlotConfig[]
}
```

The Setup page renders a mini visual picker using each definition's `gridStyle` and `slots`. The Game page applies `gridStyle` as inline CSS and wraps each player tile in a `transform: rotate(Xdeg)` div.

Rotation convention: Bottom-facing = 0°, Right-facing = 90°, Top-facing = 180°, Left-facing = 270°.

---

## Win Modal (`src/components/WinModal.tsx`)

Rendered via `createPortal(…, document.body)` to escape the stacking context created by `PageTransition`'s CSS `transform`. Appears as a `position: fixed` overlay with `z-index: 50`.

Saves the completed game to `historyStore.addGame` exactly once per game via a `useRef(saved)` guard (safe against React StrictMode double-invocation).

---

## Game Menu (`src/components/GameMenu.tsx`)

Same portal pattern as WinModal (`z-index: 40`, below WinModal). Opened by the hamburger button in the floating controls bar. Backdrop click dismisses without action.

---

## Floating Controls

Three icon buttons (`w-9 h-9`) rendered as a `position: fixed` div — a **sibling** of `<PageTransition>` in the JSX tree, not a descendant. This is critical: placing them inside `PageTransition` would trap `position: fixed` within the transformed ancestor's stacking context.

```
<>
  <PageTransition>…game grid + WinModal…</PageTransition>
  <div className="fixed bottom-3 right-3 z-30 flex gap-2">
    {/* wake lock, fullscreen, menu buttons */}
  </div>
  <GameMenu … />
</>
```

---

## Screen Wake Lock

Wake lock is now **user-controlled** (toggle button) rather than automatic. Defaults to `true` (on). Managed via `useState` + `useRef<WakeLockSentinel>` in `Game.tsx`.

```ts
useEffect(() => {
  if (!wakeLockActive) {
    wakeLockRef.current?.release().catch(() => {})
    wakeLockRef.current = null
    return
  }
  navigator.wakeLock?.request('screen').then(wl => { wakeLockRef.current = wl }).catch(() => {})
  return () => { wakeLockRef.current?.release().catch(() => {}) }
}, [wakeLockActive])
```

No external library needed. Supported in Chrome, Edge, and Safari 16.4+. Falls back silently if unavailable.

---

## Fullscreen API

Uses `requestFullscreen` with `webkitRequestFullscreen` as a fallback for Android Chrome/Brave. State is tracked via `fullscreenchange` and `webkitfullscreenchange` events.

Support detection at module load time:

```ts
const FULLSCREEN_SUPPORTED =
  isStandalonePWA() ||     // iOS 16.4+ PWA standalone supports it
  !!(el.requestFullscreen || el.webkitRequestFullscreen)
```

The fullscreen button is hidden entirely when unsupported (iOS browsers in regular tab context).

---

## Back Gesture Prevention

On game mount, a dummy `pushState` entry is injected and a `popstate` listener re-pushes on every back event:

```ts
useEffect(() => {
  window.history.pushState(null, '', window.location.href)
  const handler = () => window.history.pushState(null, '', window.location.href)
  window.addEventListener('popstate', handler)
  return () => window.removeEventListener('popstate', handler)
}, [])
```

The listener is cleaned up when the component unmounts (after `navigate('/')` from menu or win modal). Intentional exits via React Router's `navigate()` are push operations and do not fire `popstate`, so they are unaffected.

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
