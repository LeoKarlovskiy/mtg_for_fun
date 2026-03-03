# Implementation Plan: Dragon's Table
### For claude-flow multi-agent execution

**Version:** 0.1 | **Date:** 2026-03-02
**Source documents:** `PRD.md`, `STYLE_GUIDE.md`, `ARCHITECTURE.md`
**App root:** `/workspaces/mtg_for_fun/app/`
**Docs root:** `/workspaces/mtg_for_fun/MTG_test/Docs/POC/`

> **Note on workspace root:** The workspace root (`/workspaces/mtg_for_fun/`) contains
> varlock env tooling (`env.d.ts`, `.env.schema`) that declares `ImportMetaEnv`. To avoid
> a TypeScript conflict with Vite's own `ImportMetaEnv` declarations, the Vite project
> is scaffolded into `app/` as a clean subdirectory.

---

## Dependency Graph

```
Phase 0: Scaffold
    │
    ├── Phase 1A: Game Logic ──────┐
    │                             │
    └── Phase 1B: Stores ─────────┤
                                  │
              Phase 2A: UI Primitives ──────┐
              Phase 2B: Game Components ────┤
                                            │
                        Phase 3A: App Shell ──────────────┐
                        Phase 3B: Landing + History Page ─┤
                        Phase 3C: Setup Page ─────────────┤
                        Phase 3D: Game + Win Pages ────────┤
                                                           │
                                    Phase 4: Integration ──┘
                                        │
                                    Phase 5: Vercel Deploy
```

Phases 1A/1B run in parallel. Phases 2A/2B run in parallel after Phase 1. Phases 3A/3B/3C/3D run in parallel after Phase 2. Phase 4 is sequential and blocks deploy.

---

## Agent Quick-Reference

| Agent ID | Phase | Runs after | Parallelisable |
|---|---|---|---|
| `scaffold` | 0 | — | No |
| `game-logic` | 1A | scaffold | With `stores` |
| `stores` | 1B | scaffold | With `game-logic` |
| `ui-primitives` | 2A | game-logic + stores | With `game-components` |
| `game-components` | 2B | game-logic + stores | With `ui-primitives` |
| `shell` | 3A | ui-primitives + game-components | With 3B, 3C, 3D |
| `landing-history` | 3B | ui-primitives + game-components | With 3A, 3C, 3D |
| `setup-page` | 3C | ui-primitives + game-components | With 3A, 3B, 3D |
| `game-win-pages` | 3D | ui-primitives + game-components | With 3A, 3B, 3C |
| `integration` | 4 | All Phase 3 agents | No |
| `deploy` | 5 | integration | No |

---

## Shared Context (read by ALL agents)

Every agent must read these files before starting work:

- `/workspaces/mtg_for_fun/MTG_test/Docs/POC/PRD.md`
- `/workspaces/mtg_for_fun/MTG_test/Docs/POC/STYLE_GUIDE.md`
- `/workspaces/mtg_for_fun/MTG_test/Docs/POC/ARCHITECTURE.md`

### Key conventions all agents must follow

- **App root:** all file paths below are relative to `/workspaces/mtg_for_fun/app/`
- **TypeScript strict mode** — no `any`, no implicit `any`
- **No icon libraries** — unicode or inline SVG only (per style guide)
- **No external HTTP calls** — all data is localStorage only
- **Tailwind CSS v3** — className strings only, no `@apply` except in `index.css`
- **Imports:** use relative paths (no path aliases configured)
- **Framer Motion:** import from `framer-motion`, not `motion/react`
- **Every interactive element** must have a `focus-visible` ring in `gold-bright`

---

## Phase 0 — Scaffold

**Agent:** `scaffold`
**Runs after:** nothing (first)
**Outputs:** A buildable Vite project with typed stubs for all src files

### Task

Scaffold a fresh Vite + React + TypeScript project into `/workspaces/mtg_for_fun/app/` and configure every tool the downstream agents depend on. Do not implement any business logic — only stubs.

#### Step 1 — Create the project

```bash
cd /workspaces/mtg_for_fun
npm create vite@latest app -- --template react-ts
cd app
```

Remove Vite boilerplate that won't be used:
- `src/App.css`
- `src/assets/react.svg`
- The contents of `src/App.tsx` (replace with stub)
- The contents of `src/main.tsx` (replace with stub)

#### Step 2 — Install dependencies

```bash
npm install react-router-dom@^6 zustand@^5 framer-motion@^11
npm install -D tailwindcss@^3 postcss@^8 autoprefixer@^10
npm install -D vite-plugin-pwa@^0.21
npm install -D vitest@^2 @testing-library/react@^16 @testing-library/user-event@^14 @testing-library/jest-dom@^6 jsdom@^25
npx tailwindcss init -p
```

#### Step 3 — Write config files

**`vite.config.ts`** — Vite + React + PWA plugin (exact config from `ARCHITECTURE.md` § PWA Configuration, with `includeAssets` updated to `['favicon.ico']` since stone.png is optional):

```ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico'],
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

**`vitest.config.ts`**:

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

**`tailwind.config.ts`** — copy verbatim from `STYLE_GUIDE.md` § Tailwind Config Extension.

**`postcss.config.js`** (already created by `tailwindcss init -p`, confirm it has `tailwindcss` and `autoprefixer` plugins).

**`tsconfig.json`** — keep Vite's generated config; ensure `"strict": true` is set and `"jsx": "react-jsx"`.

**`vercel.json`** — place at `app/vercel.json` (this is the app root for Vercel):

```json
{
  "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
}
```

#### Step 4 — Write `index.html`

Replace Vite's generated `index.html` with one that includes:
- `<title>Dragon's Table</title>`
- Google Fonts preconnect + stylesheet (exact link from `STYLE_GUIDE.md` § Fonts)
- The existing `<div id="root"></div>` and `<script type="module" src="/src/main.tsx"></script>`

#### Step 5 — Write `src/index.css`

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@import './styles/tokens.css';
```

#### Step 6 — Create `src/styles/tokens.css`

Copy verbatim from `STYLE_GUIDE.md` § Design Tokens — CSS Custom Properties. Include all `:root` CSS custom properties.

#### Step 7 — Create `src/animations/variants.ts`

Copy verbatim from `STYLE_GUIDE.md` § Animation Specs. Include:
- `lifeDeltaVariants`
- `eliminationVariants`
- `eliminationFlash`
- `winOverlayVariants`
- `winTitleVariants`
- `winGlowVariants`
- `pageVariants`

All properly typed as `Variants` from framer-motion.

#### Step 8 — Create `src/types/index.ts`

Implement exactly the types from `PRD.md` § Data Model, plus add:

```ts
export type PlayerSetup = {
  name: string
  avatar?: string  // base64
}

export type LifeDelta = 1 | 5 | -1 | -5
```

#### Step 9 — Create `src/test/setup.ts`

```ts
import '@testing-library/jest-dom'
```

#### Step 10 — Create typed stubs for all remaining src files

Create minimal TypeScript stubs (valid exports, no implementation) so the project compiles. Downstream agents will replace stubs with real code.

**`src/lib/elimination.ts`** stub:
```ts
import type { Square } from '../types'
export const isEliminatedByLife = (_life: number): boolean => false
export const isEliminatedByCommander = (_damage: Record<string, number>): boolean => false
export const isEliminated = (_square: Square): boolean => false
export const findWinner = (_squares: Square[]): Square | null => null
```

**`src/lib/imageUtils.ts`** stub:
```ts
export async function processAvatar(_file: File, _maxSize?: number): Promise<string> {
  return ''
}
```

**`src/store/gameStore.ts`** stub:
```ts
import { create } from 'zustand'
import type { Game, PlayerSetup } from '../types'
interface GameStore {
  game: Game | null
  startGame: (players: PlayerSetup[], startingLife: number) => void
  adjustLife: (playerId: string, delta: number) => void
  addCommanderDamage: (targetId: string, sourceId: string) => void
  resetGame: () => void
  clearGame: () => void
}
export const useGameStore = create<GameStore>(() => ({
  game: null,
  startGame: () => {},
  adjustLife: () => {},
  addCommanderDamage: () => {},
  resetGame: () => {},
  clearGame: () => {},
}))
```

**`src/store/historyStore.ts`** stub:
```ts
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { GameHistory } from '../types'
interface HistoryStore {
  games: GameHistory[]
  addGame: (game: GameHistory) => void
  clearHistory: () => void
}
export const useHistoryStore = create<HistoryStore>()(
  persist(() => ({ games: [], addGame: () => {}, clearHistory: () => {} }), { name: 'mtg-history' })
)
```

**`src/components/ui/Button.tsx`** stub:
```tsx
export const Button = ({ children }: { children: React.ReactNode }) => <button>{children}</button>
```

**`src/components/ui/PageTransition.tsx`** stub:
```tsx
export const PageTransition = ({ children }: { children: React.ReactNode }) => <>{children}</>
```

**`src/components/PlayerAvatar.tsx`** stub:
```tsx
export const PlayerAvatar = () => <div />
```

**`src/components/LifeControls.tsx`** stub:
```tsx
export const LifeControls = () => <div />
```

**`src/components/CommanderDamage.tsx`** stub:
```tsx
export const CommanderDamage = () => <div />
```

**`src/components/Square.tsx`** stub:
```tsx
export const Square = () => <div />
```

All five pages (`Landing.tsx`, `Setup.tsx`, `Game.tsx`, `Win.tsx`, `History.tsx`) stub:
```tsx
// src/pages/Landing.tsx
export default function Landing() { return <div>Landing</div> }
// (same pattern for each page)
```

**`src/App.tsx`** stub — minimal router:
```tsx
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Landing from './pages/Landing'
import Setup from './pages/Setup'
import Game from './pages/Game'
import Win from './pages/Win'
import History from './pages/History'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/setup" element={<Setup />} />
        <Route path="/game" element={<Game />} />
        <Route path="/win" element={<Win />} />
        <Route path="/history" element={<History />} />
      </Routes>
    </BrowserRouter>
  )
}
```

**`src/main.tsx`**:
```tsx
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
```

#### Step 11 — Create placeholder PWA icons

Create two 1×1 transparent PNG placeholders at `public/icons/icon-192.png` and `public/icons/icon-512.png`. These are required for vite-plugin-pwa not to error at build time. Real icons will be provided before production deploy.

Use a minimal base64-encoded 1×1 transparent PNG written as a binary file, or copy any existing small image and rename it. The Phase 5 agent will replace these.

#### Step 12 — Verify scaffold compiles

```bash
cd /workspaces/mtg_for_fun/app
npm run build
```

Must exit 0. Type errors in stubs must be fixed before completing this phase. Do not proceed until build is clean.

### Done criteria

- `npm run build` in `app/` exits 0
- All stub files exist at their specified paths with valid TypeScript exports
- No `any` type errors

---

## Phase 1A — Game Logic

**Agent:** `game-logic`
**Runs after:** Phase 0 (scaffold)
**Runs parallel with:** Phase 1B (stores)
**Working directory:** `/workspaces/mtg_for_fun/app`

### Reads

- `src/types/index.ts`
- `ARCHITECTURE.md` § Game Logic, § Avatar Image Processing

### Writes

- `src/lib/elimination.ts` (replace stub)
- `src/lib/imageUtils.ts` (replace stub)
- `src/lib/elimination.test.ts` (new)
- `src/lib/imageUtils.test.ts` (new)

### Task

#### `src/lib/elimination.ts`

Implement the pure functions exactly as specified in `ARCHITECTURE.md` § Game Logic. No side effects, no store imports.

```ts
import type { Square } from '../types'

export const isEliminatedByLife = (life: number): boolean => life <= 0

export const isEliminatedByCommander = (damage: Record<string, number>): boolean =>
  Object.values(damage).some(d => d >= 21)

export const isEliminated = (square: Square): boolean =>
  isEliminatedByLife(square.life) || isEliminatedByCommander(square.commanderDamage)

export const findWinner = (squares: Square[]): Square | null => {
  const alive = squares.filter(s => !s.isEliminated)
  return alive.length === 1 ? alive[0] : null
}
```

#### `src/lib/imageUtils.ts`

Implement `processAvatar(file, maxSize = 200)` using the browser Canvas API.

Pipeline: `File → Image element → Canvas (drawImage, maintain aspect ratio, crop to square or letterbox as preferred) → toDataURL('image/jpeg', 0.8)`.

Requirements:
- Output must be a valid `data:image/jpeg;base64,...` string
- Max dimension in either axis: `maxSize`
- Preserve aspect ratio (do not stretch)
- Must work in a browser environment (Canvas API)

#### `src/lib/elimination.test.ts`

Write Vitest unit tests covering all of the following:

| Test | Input | Expected |
|---|---|---|
| `isEliminatedByLife` with life = 0 | 0 | `true` |
| `isEliminatedByLife` with life = -5 | -5 | `true` |
| `isEliminatedByLife` with life = 1 | 1 | `false` |
| `isEliminatedByCommander` — single source at 21 | `{ p2: 21 }` | `true` |
| `isEliminatedByCommander` — single source at 20 | `{ p2: 20 }` | `false` |
| `isEliminatedByCommander` — multiple sources none ≥ 21 | `{ p2: 15, p3: 10 }` | `false` |
| `isEliminated` — life = 0, no commander | various | `true` |
| `isEliminated` — life = 10, commander at 21 | various | `true` |
| `isEliminated` — alive | life = 25, all commander < 21 | `false` |
| `findWinner` — one alive | 3 players, 2 eliminated | returns alive player |
| `findWinner` — two alive | 3 players, 1 eliminated | returns `null` |
| `findWinner` — all alive | 4 players, none eliminated | returns `null` |
| `findWinner` — none alive | all eliminated | returns `null` |

#### `src/lib/imageUtils.test.ts`

`processAvatar` uses the Canvas API which is not available in jsdom. Mock `document.createElement('canvas')` and `HTMLImageElement` using vi.spyOn / mock implementations. Test:
- Returns a string starting with `data:image/jpeg;base64,`
- Called with a valid File object (create with `new File([''], 'test.jpg', { type: 'image/jpeg' })`)

### Done criteria

```bash
npm test -- src/lib
```
All tests pass. Zero TypeScript errors in these files.

---

## Phase 1B — Stores

**Agent:** `stores`
**Runs after:** Phase 0 (scaffold)
**Runs parallel with:** Phase 1A (game-logic)
**Working directory:** `/workspaces/mtg_for_fun/app`

### Reads

- `src/types/index.ts`
- `ARCHITECTURE.md` § State Architecture

### Writes

- `src/store/gameStore.ts` (replace stub)
- `src/store/historyStore.ts` (replace stub)
- `src/store/gameStore.test.ts` (new)
- `src/store/historyStore.test.ts` (new)

### Task

#### `src/store/gameStore.ts`

Full implementation. Import and use `isEliminated` and `findWinner` from `../lib/elimination`. The store does NOT call `historyStore.addGame` directly — instead expose a `game` field with `status: 'complete'` and let the Win page component call `historyStore.addGame`. This avoids circular store dependencies.

Interface:

```ts
interface GameStore {
  game: Game | null
  startGame: (players: PlayerSetup[], startingLife: number) => void
  adjustLife: (playerId: string, delta: number) => void
  addCommanderDamage: (targetId: string, sourceId: string) => void
  resetGame: () => void   // Play Again: reset all players to starting life, clear commanderDamage, clear isEliminated
  clearGame: () => void   // New Game: set game to null
}
```

Rules:
- `startGame`: generate a UUID (`crypto.randomUUID()`) for the game id and for each player id. Set `startedAt: Date.now()`. Set `status: 'active'`. Each player's `commanderDamage` is initialised to `{}` (other player IDs will be added on first damage).
- `adjustLife`: clamp life to minimum 0, maximum 100. After updating, call internal `_checkElimination` for that player.
- `addCommanderDamage`: increments `commanderDamage[sourceId]` by 1 on the target player. After updating, call internal `_checkElimination` for the target player.
- `_checkElimination` (internal, not in interface): if `isEliminated(player)` and `!player.isEliminated`, mark `isEliminated: true`, set `eliminationOrder` to current count of eliminated players + 1. Then call `_checkWin`.
- `_checkWin` (internal): if `findWinner(game.players)` returns a player, set `game.winner = player.id`, `game.status = 'complete'`, `game.endedAt = Date.now()`.
- `resetGame`: set all players' `life` back to the game's `startingLife` value (store it on the `Game` object), clear `commanderDamage`, clear `isEliminated`, clear `eliminationOrder`, clear `winner`, set `status: 'active'`, clear `endedAt`. Add `startingLife: number` field to the `Game` type in `src/types/index.ts`.
- `clearGame`: set `game: null`.

#### `src/store/historyStore.ts`

Full implementation using Zustand `persist` middleware with `localStorage` and key `'mtg-history'`.

```ts
interface HistoryStore {
  games: GameHistory[]
  addGame: (game: GameHistory) => void
  clearHistory: () => void
}
```

`addGame`: prepend new game to front of array, then slice to max 20 entries (`games.slice(0, 20)`). This keeps newest first and enforces the 20-game cap.

#### `src/store/gameStore.test.ts`

Test using `create` from zustand directly (or import `useGameStore` and call `getState()`). Test:

| Test | Description |
|---|---|
| `startGame` sets status active | After startGame with 2 players, `game.status === 'active'` |
| `startGame` sets correct life | Players start with specified life total |
| `adjustLife` increases/decreases life | +5 and -1 work correctly |
| `adjustLife` clamps at 0 | Life cannot go below 0 |
| `adjustLife` clamps at 100 | Life cannot go above 100 |
| `adjustLife` at 0 triggers elimination | Setting life to 0 sets `isEliminated: true` |
| `addCommanderDamage` increments | Calling 21 times eliminates player |
| Elimination sets eliminationOrder | First eliminated gets order 1 |
| Win detected when one player remains | After all but one eliminated, `game.status === 'complete'` |
| `resetGame` restores starting life | All players back to starting life |
| `clearGame` sets game to null | `game === null` |

#### `src/store/historyStore.test.ts`

Test:
- `addGame` adds to the front of the array
- `addGame` with 21 games caps at 20 (oldest dropped)
- `clearHistory` empties the array
- Persistence: use `localStorage` mock to verify Zustand persist writes to `'mtg-history'`

Note: Reset localStorage between tests with `localStorage.clear()` in `beforeEach`.

### Done criteria

```bash
npm test -- src/store
```
All tests pass. Zero TypeScript errors.

---

## Phase 2A — UI Primitives

**Agent:** `ui-primitives`
**Runs after:** Phase 1A + Phase 1B complete
**Runs parallel with:** Phase 2B (game-components)
**Working directory:** `/workspaces/mtg_for_fun/app`

### Reads

- `src/types/index.ts`
- `src/animations/variants.ts`
- `STYLE_GUIDE.md` § Buttons, § Typography, § Accessibility Notes

### Writes

- `src/components/ui/Button.tsx` (replace stub)
- `src/components/ui/PageTransition.tsx` (replace stub)
- `src/components/PlayerAvatar.tsx` (replace stub)

### Task

#### `src/components/ui/Button.tsx`

Three variants: `primary`, `secondary`, `life`. Accept `variant`, `onClick`, `disabled`, `children`, `type` props. Use CSS classes from `STYLE_GUIDE.md` § Buttons. All buttons must have `focus-visible:ring-2 focus-visible:ring-gold-bright` (Tailwind classes).

No Framer Motion on this component — keep it simple.

#### `src/components/ui/PageTransition.tsx`

A wrapper `<motion.div>` that applies `pageVariants` from `src/animations/variants.ts` as `initial`, `animate`, and `exit`. Used by every page to animate in/out.

```tsx
import { motion } from 'framer-motion'
import { pageVariants } from '../../animations/variants'

export function PageTransition({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      className="min-h-screen"
    >
      {children}
    </motion.div>
  )
}
```

#### `src/components/PlayerAvatar.tsx`

Two modes:
1. **Display mode** (`src?: string`): shows the base64 image in a circular frame, or a placeholder (player initial inside a styled circle) if no src.
2. **Upload mode** (`onUpload?: (file: File) => void`): includes a hidden `<input type="file" accept="image/*">` that triggers `onUpload` on change.

Props:
```ts
type PlayerAvatarProps = {
  src?: string
  name: string
  size?: 'sm' | 'md' | 'lg'
  onUpload?: (file: File) => void
}
```

Sizes: `sm` = 2rem, `md` = 3.5rem, `lg` = 5rem. Style using inline styles or Tailwind arbitrary values. Border: gold `#B8860B`, 1px solid.

### Done criteria

TypeScript compiles cleanly for these three files. No prop type errors.

---

## Phase 2B — Game Components

**Agent:** `game-components`
**Runs after:** Phase 1A + Phase 1B complete
**Runs parallel with:** Phase 2A (ui-primitives)
**Working directory:** `/workspaces/mtg_for_fun/app`

### Reads

- `src/types/index.ts`
- `src/store/gameStore.ts`
- `src/animations/variants.ts`
- `STYLE_GUIDE.md` § Player Square, § Commander Damage Section, § Buttons (life variant), § Animation Specs, § Iconography

### Writes

- `src/components/LifeControls.tsx` (replace stub)
- `src/components/CommanderDamage.tsx` (replace stub)
- `src/components/Square.tsx` (replace stub)

### Task

#### `src/components/LifeControls.tsx`

Four buttons: `+5`, `+1`, `-1`, `-5`. Uses `variant="life"` from Button (or implement inline for game-specific styling).

Props:
```ts
type LifeControlsProps = {
  playerId: string
  disabled?: boolean
}
```

On click: calls `useGameStore.getState().adjustLife(playerId, delta)`. Buttons are disabled when `disabled` is true (player is eliminated or game is over).

#### `src/components/CommanderDamage.tsx`

Displays one counter per opponent (i.e., every player except `selfId`). Each counter shows the opponent's name (truncated to ~8 chars) and the damage total. A `+1` button increments commander damage from that opponent against the displayed player.

Props:
```ts
type CommanderDamageProps = {
  targetPlayerId: string  // whose Square this is on
  opponents: { id: string; name: string }[]
  commanderDamage: Record<string, number>
  disabled?: boolean
}
```

On `+1` click: calls `useGameStore.getState().addCommanderDamage(targetPlayerId, opponentId)`.

When any individual damage counter reaches ≥ 15, apply `data-danger="true"` styling (red color per style guide).

#### `src/components/Square.tsx`

The main player tile. Composed of `PlayerAvatar`, life total display, `LifeControls`, and `CommanderDamage`.

Props:
```ts
type SquareProps = {
  square: Square
  opponents: { id: string; name: string }[]
  isGameActive: boolean
}
```

Implement:
- Outer div with `player-square` styles from `STYLE_GUIDE.md` § Player Square (translate CSS to Tailwind classes where possible, or use CSS custom property `var()` references in className strings via arbitrary values)
- `data-eliminated` attribute when `square.isEliminated === true`
- Life total: `motion.div` with `lifeDeltaVariants`. Track animation state with local `useState('idle')`. On life change (via `useEffect` comparing previous and current life), trigger increase/decrease variant, reset to idle after 300ms.
- Life total color: `data-state` attribute — `"mid"` when life ≤ 20 and > 0, `"low"` when life ≤ 0. Use CSS custom properties from tokens.
- Eliminated overlay: when `isEliminated`, show a semi-transparent red overlay with the dagger glyph `†` centered (use `AnimatePresence` + `eliminationVariants`)

### Done criteria

TypeScript compiles cleanly. No missing prop types.

---

## Phase 3A — App Shell

**Agent:** `shell`
**Runs after:** Phase 2A + Phase 2B complete
**Runs parallel with:** 3B, 3C, 3D
**Working directory:** `/workspaces/mtg_for_fun/app`

### Reads

- `src/store/gameStore.ts`
- `src/animations/variants.ts`
- All stub page files

### Writes

- `src/App.tsx` (replace stub)

### Task

Implement the full `App.tsx`. Requirements:

1. `BrowserRouter` wraps everything
2. Use `useLocation()` inside the router and pass it as `key` to `<Routes>` — this is required for `AnimatePresence` exit animations to trigger on route change
3. `<AnimatePresence mode="wait">` wraps `<Routes>`
4. Route guards:
   - `/game`: redirect to `/` if `useGameStore(s => s.game)` is null or `status !== 'active'`
   - `/win`: redirect to `/` if `useGameStore(s => s.game?.status)` is not `'complete'`
   - Implement as a `<RequireGame>` component that takes a `require` prop: `'active' | 'complete'`
5. All five routes registered (Landing, Setup, Game, Win, History)

```tsx
// RequireGame — redirect if game state doesn't match requirement
function RequireGame({ require, children }: { require: 'active' | 'complete'; children: React.ReactNode }) {
  const status = useGameStore(s => s.game?.status ?? null)
  if (require === 'active' && status !== 'active') return <Navigate to="/" replace />
  if (require === 'complete' && status !== 'complete') return <Navigate to="/" replace />
  return <>{children}</>
}
```

### Done criteria

`npm run build` exits 0.

---

## Phase 3B — Landing & History Pages

**Agent:** `landing-history`
**Runs after:** Phase 2A + Phase 2B complete
**Runs parallel with:** 3A, 3C, 3D
**Working directory:** `/workspaces/mtg_for_fun/app`

### Reads

- `src/components/ui/Button.tsx`
- `src/components/ui/PageTransition.tsx`
- `src/store/historyStore.ts`
- `src/types/index.ts`
- `STYLE_GUIDE.md` § Landing, § History, § Typography, § Color Palette

### Writes

- `src/pages/Landing.tsx` (replace stub)
- `src/pages/History.tsx` (replace stub)

### Task

#### `src/pages/Landing.tsx`

Per `STYLE_GUIDE.md` § Landing:
- Full-screen `bg-bg-base` (`#0d0d0d`)
- Title: "Dragon's Table" in `Cinzel Decorative`, 700 weight, gold color with text-shadow glow
- Subtitle (optional, flavor text): small, `IM Fell English`, italic, parchment color
- "New Game" `<Button variant="primary">` → `useNavigate()` to `/setup`
- "History" `<Button variant="secondary">` or text link → navigate to `/history`
- Center content vertically and horizontally
- Wrap in `<PageTransition>`

#### `src/pages/History.tsx`

- Fetch `useHistoryStore(s => s.games)`
- If no games: centered message "No games yet. Your legend begins at the table."
- Map over games (newest first — already ordered by historyStore):
  - Card per game: `bg-bg-surface border border-border-subtle rounded-lg p-4`
  - Date formatted as e.g. "2 Mar 2026, 9:41pm" using `new Date(game.date).toLocaleString()`
  - Players listed: winner name in gold with `♛` prefix; others in parchment; eliminated shown in dim text
  - Final life total next to each name
- "Clear History" `<Button variant="secondary">` at bottom → calls `useHistoryStore.getState().clearHistory()`
- "← Back" link → navigate to `/`
- Wrap in `<PageTransition>`

### Done criteria

TypeScript compiles cleanly. Components render without runtime errors.

---

## Phase 3C — Setup Page

**Agent:** `setup-page`
**Runs after:** Phase 2A + Phase 2B complete
**Runs parallel with:** 3A, 3B, 3D
**Working directory:** `/workspaces/mtg_for_fun/app`

### Reads

- `src/types/index.ts`
- `src/store/gameStore.ts`
- `src/components/ui/Button.tsx`
- `src/components/ui/PageTransition.tsx`
- `src/components/PlayerAvatar.tsx`
- `src/lib/imageUtils.ts`
- `STYLE_GUIDE.md` § Setup, § Typography, § Buttons

### Writes

- `src/pages/Setup.tsx` (replace stub)

### Task

Local state (no store — this is pre-game setup):

```ts
type PlayerDraft = { id: string; name: string; avatar?: string }
const [players, setPlayers] = useState<PlayerDraft[]>([{ id: crypto.randomUUID(), name: '' }])
const [startingLife, setStartingLife] = useState<20 | 30 | 40>(40)
```

UI requirements:

1. **Title**: "Assemble Your Party" — Cinzel Decorative, gold
2. **Player rows** (minimum 2 shown, up to 6 max):
   - `PlayerAvatar` in upload mode (calls `processAvatar(file)` and sets `player.avatar`)
   - Name input: `bg-transparent border-b border-gold-muted text-parchment font-serif focus:border-gold-bright outline-none` (verbatim from style guide)
   - Remove button (`×`) — disabled when only 2 players remain
3. **"Add Player"** button — disabled when 6 players already added
4. **Starting life selector**: Three toggle buttons for 20, 30, 40. Active selection highlighted in gold.
5. **"Begin"** / "Start Game" primary button:
   - Disabled until all player name fields are non-empty AND at least 2 players
   - On click: calls `useGameStore.getState().startGame(players, startingLife)` then navigates to `/game`
6. **"← Back"** link → navigate to `/`
7. Wrap in `<PageTransition>`

### Done criteria

TypeScript compiles cleanly. "Begin" is disabled correctly. Avatar upload calls `processAvatar`.

---

## Phase 3D — Game & Win Pages

**Agent:** `game-win-pages`
**Runs after:** Phase 2A + Phase 2B complete
**Runs parallel with:** 3A, 3B, 3C
**Working directory:** `/workspaces/mtg_for_fun/app`

### Reads

- `src/types/index.ts`
- `src/store/gameStore.ts`
- `src/store/historyStore.ts`
- `src/components/Square.tsx`
- `src/components/ui/Button.tsx`
- `src/components/ui/PageTransition.tsx`
- `src/animations/variants.ts`
- `STYLE_GUIDE.md` § Layout (game grid), § Win State, § Animation Specs

### Writes

- `src/pages/Game.tsx` (replace stub)
- `src/pages/Win.tsx` (replace stub)

### Task

#### `src/pages/Game.tsx`

Requirements:
1. **Screen Wake Lock**: on mount, request `navigator.wakeLock?.request('screen')`, release on unmount (per `ARCHITECTURE.md` § Screen Wake Lock)
2. **Grid layout**: derive CSS grid layout from player count. Map from count to Tailwind `grid-cols-*` + `grid-rows-*` classes per `STYLE_GUIDE.md` § Layout. Handle 2–6 players:
   - 2: `grid-cols-2 grid-rows-1`
   - 3: custom — 2 top + 1 bottom centered (use CSS Grid `grid-template-areas` via inline style or a CSS class)
   - 4: `grid-cols-2 grid-rows-2`
   - 5: 2 top + 3 bottom
   - 6: `grid-cols-3 grid-rows-2` or `grid-cols-2 grid-rows-3`
3. Render one `<Square>` per player. Pass `opponents` as all other players' `{ id, name }`.
4. When `game.status === 'complete'`, navigate to `/win` automatically using `useEffect`.
5. Wrap in `<PageTransition>`.

#### `src/pages/Win.tsx`

Requirements:
1. On mount (once): call `useHistoryStore.getState().addGame(...)` to persist the result. Use a `useRef` flag to ensure this is only called once even in React StrictMode double-invocation.
   - Build `GameHistory` from `game` in the store.
2. **Win overlay animation**: Use `winOverlayVariants`, `winTitleVariants`, `winGlowVariants` from `src/animations/variants.ts`. Full-screen dark overlay with slow golden glow. Winner name with `♛` crown glyph.
3. **Final standings**: players listed in elimination order (1st eliminated first, winner last). Show final life, a `†` for eliminated, `♛` for winner.
4. **"Play Again" button** (primary): calls `useGameStore.getState().resetGame()` then navigates to `/game`
5. **"New Game" button** (secondary): calls `useGameStore.getState().clearGame()` then navigates to `/setup`
6. Wrap in `<PageTransition>`.

### Done criteria

TypeScript compiles cleanly. `npm run build` exits 0 after both pages are written.

---

## Phase 4 — Integration & Local Build

**Agent:** `integration`
**Runs after:** All Phase 3 agents complete
**Working directory:** `/workspaces/mtg_for_fun/app`

### Task

#### Step 1 — TypeScript audit

Run:
```bash
npx tsc --noEmit
```

Fix all type errors across the codebase. Common issues to look for:
- Stub files that were overwritten but left partial types
- Missing imports between Phase 1/2/3 agents' files
- Mismatched prop types between components and their usages in pages
- `game.startingLife` must exist on `Game` type (added by stores agent) — verify types/index.ts was updated

#### Step 2 — Test suite

Run:
```bash
npm test
```

All tests must pass. If any test references a function signature that was changed by another agent, update the test to match.

#### Step 3 — Production build

Run:
```bash
npm run build
```

Must exit 0 with no warnings about missing chunks or unresolved imports.

#### Step 4 — Smoke check

Run:
```bash
npm run preview
```

Open in browser and manually verify:
- Landing page renders with correct fonts and colors
- Navigating to `/setup` works
- Adding 2 players and clicking "Begin" navigates to `/game`
- Life total buttons update correctly
- History page shows completed games

#### Step 5 — Final checklist

Verify:
- [ ] `vercel.json` exists in `app/`
- [ ] `public/icons/icon-192.png` and `icon-512.png` exist (even as placeholders)
- [ ] `public/favicon.ico` exists (create a minimal one if missing)
- [ ] Google Fonts link is in `index.html`
- [ ] `npm run build` exits 0
- [ ] `npm test` exits 0

### Done criteria

- `npx tsc --noEmit` exits 0
- `npm test` exits 0
- `npm run build` exits 0
- `npm run preview` serves the app without console errors

---

## Phase 5 — Vercel Deploy

**Agent:** `deploy`
**Runs after:** Phase 4 integration complete
**Working directory:** `/workspaces/mtg_for_fun/app`

### Pre-deploy checklist

Before deploying, confirm with the user:
- [ ] Real PWA icons have been placed in `public/icons/` (or confirm placeholder icons are acceptable for initial deploy)
- [ ] The app is connected to a GitHub/GitLab repository (Vercel deploys from a git remote)

### Option A — Vercel CLI (immediate)

```bash
npm install -g vercel
cd /workspaces/mtg_for_fun/app
vercel
```

When prompted:
- **Set up and deploy:** Yes
- **Which scope:** user's scope
- **Link to existing project:** No (first deploy)
- **Project name:** `dragons-table` (or user's choice)
- **In which directory is your code located?** `./` (already in `app/`)
- **Build command:** `npm run build` (Vercel auto-detects Vite)
- **Output directory:** `dist`
- **Override settings:** No

After first deploy:
```bash
vercel --prod
```

### Option B — Git integration (recommended for ongoing deploys)

1. Push `app/` (or the whole repo) to GitHub
2. In Vercel dashboard: Import Project → select repo
3. **Root Directory:** set to `app` (since the Vite project is in the subdirectory)
4. **Framework Preset:** Vite (auto-detected)
5. **Build Command:** `npm run build`
6. **Output Directory:** `dist`
7. Click Deploy

### Done criteria

- Production URL is live
- Navigating directly to `/history` (not via the app) returns the app (SPA rewrite is working)
- PWA installs on mobile Chrome/Safari

---

## File Ownership Matrix

| File | Owner agent |
|---|---|
| `vite.config.ts` | scaffold |
| `tailwind.config.ts` | scaffold |
| `vitest.config.ts` | scaffold |
| `vercel.json` | scaffold |
| `index.html` | scaffold |
| `src/index.css` | scaffold |
| `src/main.tsx` | scaffold |
| `src/types/index.ts` | scaffold (base) + stores (add `startingLife`) |
| `src/styles/tokens.css` | scaffold |
| `src/animations/variants.ts` | scaffold |
| `src/test/setup.ts` | scaffold |
| `src/lib/elimination.ts` | game-logic |
| `src/lib/imageUtils.ts` | game-logic |
| `src/lib/elimination.test.ts` | game-logic |
| `src/lib/imageUtils.test.ts` | game-logic |
| `src/store/gameStore.ts` | stores |
| `src/store/historyStore.ts` | stores |
| `src/store/gameStore.test.ts` | stores |
| `src/store/historyStore.test.ts` | stores |
| `src/components/ui/Button.tsx` | ui-primitives |
| `src/components/ui/PageTransition.tsx` | ui-primitives |
| `src/components/PlayerAvatar.tsx` | ui-primitives |
| `src/components/LifeControls.tsx` | game-components |
| `src/components/CommanderDamage.tsx` | game-components |
| `src/components/Square.tsx` | game-components |
| `src/App.tsx` | shell |
| `src/pages/Landing.tsx` | landing-history |
| `src/pages/History.tsx` | landing-history |
| `src/pages/Setup.tsx` | setup-page |
| `src/pages/Game.tsx` | game-win-pages |
| `src/pages/Win.tsx` | game-win-pages |

---

## Type Contract: `src/types/index.ts`

The final `types/index.ts` must export these types (scaffold creates the base; stores agent adds `startingLife`):

```ts
export type Square = {
  id: string
  name: string
  avatar?: string
  life: number
  commanderDamage: Record<string, number>
  isEliminated: boolean
  eliminationOrder?: number
}

export type Game = {
  id: string
  startedAt: number
  endedAt?: number
  startingLife: number          // added by stores agent
  players: Square[]
  winner?: string
  status: 'active' | 'complete'
}

export type GameHistory = {
  id: string
  date: number
  players: {
    name: string
    avatar?: string
    finalLife: number
    isWinner: boolean
    eliminationOrder?: number
  }[]
}

export type PlayerSetup = {
  name: string
  avatar?: string
}

export type LifeDelta = 1 | 5 | -1 | -5
```

---

## Known Risks & Mitigations

| Risk | Mitigation |
|---|---|
| Stub imports cause Phase 1+ agents to fail TypeScript | Scaffold agent must produce clean-compiling stubs before completing Phase 0 |
| `game.startingLife` added mid-plan creates type drift | File ownership matrix is explicit; integration agent reconciles in Phase 4 |
| `AnimatePresence` exit animations not firing | Shell agent must pass `location` as `key` to `<Routes>` |
| Win page calling `addGame` twice in React StrictMode | `game-win-pages` agent must use a `useRef` guard |
| PWA build fails due to missing icon files | Scaffold agent creates placeholder PNGs in Phase 0 |
| Commander damage counter layout breaks at 5+ opponents | `game-components` agent must test layout with 5 opponent counters visible |

---

## Post-MVP Iterations

> This section records all changes made after the initial v0.1 build was live on Vercel.
> Each iteration lists the files changed, the reason, and the commit reference.

---

### Iteration 1 — Commander damage life deduction (2026-03-02)

**Commit:** `49fdeaf`
**Files:** `src/store/gameStore.ts`, `src/store/gameStore.test.ts`

**Change:** `addCommanderDamage` now atomically applies both the commander damage increment and a `-1` life deduction to the target player in a single `set()` call.

**Reason:** MTG rules: every point of commander damage is also direct damage. Previously the two trackers were decoupled, requiring manual life adjustment after each commander damage.

**Tests added:** 3 new tests covering life deduction on commander damage, life clamping at 0, and no side-effects on other players' life totals.

---

### Bug Fix — Vercel 404 on deployment (2026-03-02)

**Commit:** `5c49616`
**Files:** `vercel.json` (moved to repo root)

**Problem:** App deployed but all routes returned 404. The `vercel.json` was inside `app/` but Vercel reads config from the repo root. Additionally the build command and output directory had to be explicitly set since the Vite project lives in a subdirectory.

**Fix:** Moved `vercel.json` to repo root with:
```json
{
  "buildCommand": "cd app && npm install && npm run build",
  "outputDirectory": "app/dist",
  "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
}
```

---

### Iteration 2 — Win modal replacing Win page (2026-03-02)

**Commits:** `0b98257`, `ccdceda`, `21fd127`
**Files created:** `src/components/WinModal.tsx`
**Files modified:** `src/App.tsx`, `src/animations/variants.ts`

**Change:** Removed the `/win` route. Win state now shows an inline portal modal over the game screen with the message "[Player] claims the throne." and two buttons: "Start another" (resets game) and "Home screen" (clears game + navigates to `/`).

**Bug 1 — Modal not visible:**
`PageTransition` applies a CSS `transform` (y-offset animation), which creates a new stacking context. Any `position: fixed` descendant is trapped within that ancestor's bounds, so the modal was invisible (positioned relative to the transformed element, not the viewport).
Fix: render the modal via `createPortal(…, document.body)`.

**Bug 2 — Page redirected before modal could show:**
The `RequireGame` guard on `/game` had `require="active"`. The instant `game.status` changed to `'complete'`, the guard fired and redirected to `/`, unmounting the modal before it appeared.
Fix: added a `'started'` guard type to `RequireGame` that only redirects when `game === null`, allowing both active and complete games to stay on the game route.

**Variants added:** `modalBackdropVariants`, `modalPanelVariants` to `src/animations/variants.ts`.

---

### Iteration 3 — Orientation picker (2026-03-02)

**Commit:** `b4c7ed6`
**Files created:** `src/lib/orientations.ts`
**Files modified:** `src/types/index.ts`, `src/store/gameStore.ts`, `src/store/gameStore.test.ts`, `src/pages/Setup.tsx`, `src/pages/Game.tsx`

**Change:** Added a player-card orientation system. 10 layout definitions span 2–6 player counts, each specifying CSS `grid-template-areas`/`columns`/`rows` and a per-player rotation in degrees. Setup screen shows a visual picker with mini grid diagrams. Game screen renders tiles at the specified `gridArea` with a rotation wrapper `div`.

**Type change:** `Game.orientationId: string` added. `startGame` updated to accept `orientationId` as a third argument.

---

### Iteration 4 — In-game controls: menu, fullscreen, wake lock (2026-03-03)

**Commits:** `888d68f`, `0406d23`, `5a3f60a`
**Files created:** `src/components/GameMenu.tsx`
**Files modified:** `src/pages/Game.tsx`

**Changes:**

1. **GameMenu:** New portal modal component. Opened by a hamburger button. "Restart" calls `resetGame()` and closes; "Home" calls `clearGame()` + `navigate('/')`. Backdrop click dismisses.

2. **Wake lock toggle:** Replaced the auto-on `useEffect` wake lock with a user-controlled toggle button (☀). Defaults to on. State managed via `useState(true)` + `useRef<WakeLockSentinel>`.

3. **Fullscreen toggle:** Button calls `requestFullscreen` with `webkitRequestFullscreen` as fallback. State tracked via `fullscreenchange` and `webkitfullscreenchange` events. Hidden via `FULLSCREEN_SUPPORTED` flag when unsupported.

**Bug fix — Fullscreen on Android Chrome:**
The unprefixed `requestFullscreen` was failing silently on Android Chrome, which still required the `webkit` prefix. Fixed by adding webkit-prefixed helpers (`requestFullscreen`, `exitFullscreen`, `getFullscreenElement`) with TypeScript intersection types for the prefixed properties.

**Bug fix — Fullscreen button missing on iOS PWA:**
The `FULLSCREEN_SUPPORTED` check correctly returned `false` for all iOS browsers (WebKit restriction). But iOS 16.4+ supports `requestFullscreen` when running as an installed home-screen PWA. Fixed by adding `isStandalonePWA()` detection (via `display-mode: standalone` media query + `navigator.standalone`) and including it in the `FULLSCREEN_SUPPORTED` condition.

**Architecture note:** The floating controls div is a **sibling** of `<PageTransition>` in the JSX return, not a descendant. This avoids the transform stacking-context trap. `GameMenu` still uses `createPortal` for the same reason as `WinModal`.

---

### Iteration 5 — Back gesture prevention (2026-03-03)

**Commit:** `b618a69`
**Files modified:** `src/pages/Game.tsx`

**Change:** Added a `useEffect` that pushes a dummy `history` entry on mount and re-pushes on every `popstate` event, trapping the user on the game screen. The listener is cleaned up on unmount (only reached after explicit `navigate('/')` via menu or win modal).

**Reason:** On iOS (PWA and browser) and Android, a swipe-back / hardware back button would navigate away from a live game, losing all state. The only intended exit paths are the in-game menu and the win modal.
