# PRD: MTG Commander Life Tracker

**Version:** 0.2
**Date:** 2026-03-03
**Status:** Live — https://mtg-for-fun.vercel.app

---

## Overview

A web-based life tracker for Magic: The Gathering Commander (EDH) games. Supports 2–6 players, tracks life totals and commander damage, and celebrates the last player standing.

---

## Problem

Commander groups at a table need a shared, reliable way to track life totals and commander damage without pen and paper. Existing apps are cluttered or don't handle commander damage intuitively.

---

## Goal

Deliver a fast, responsive web app that gets players into a game in under 60 seconds and makes eliminations and wins feel satisfying.

---

## Scope

**In scope (v0.1 — initial build):**
- Player setup (2–6 players, custom avatar, custom names, starting life selection, adaptive orientation of the table setting)
- Life total tracking with +/- controls (+/-1 and +/5)
- Commander damage tracking (always visible, per opponent)
- Elimination logic (life ≤ 0 or commander damage ≥ 21)
- Win state with celebratory animation
- Game history saved to localStorage

**In scope (v0.2 — post-MVP iterations):**
- Commander damage auto-deducts 1 life point from the target player on each +1
- Win state shown as an inline modal ("claims the throne") instead of a separate page; options to restart or go home
- Orientation picker in Setup: 10 layout variants across 2–6 players using CSS grid + per-player rotation
- In-game menu button (☰): stop game at any time with Restart or Home options
- Fullscreen toggle button: hides browser chrome using the Fullscreen API (desktop + Android + iOS PWA)
- Wake lock toggle button (☀): keeps the device screen on during play; user-controlled
- Back gesture prevention: swipe-back / hardware back is blocked during a game; navigation only via in-game controls

**Out of scope (this version):**
- Poison / infect counters
- Turn tracker
- Social sharing
- Backend / accounts
- Native mobile app

---

## Core Entities

| Entity | Description |
|---|---|
| **Game** | One session of play. Ephemeral at runtime, result persisted to history on completion. |
| **Square** | A player's tile on the game screen. Displays life, avatar, name, and commander damage. |
| **Player** | The person behind a Square. Defined at setup with name and optional avatar. |
| **CommanderDamage** | A per-player map of damage received from each other player's commander. |

---

## Rules

| Rule | Value |
|---|---|
| Starting life | 40 |
| Maximum life | 100 |
| Minimum life | 0 |
| Commander damage loss threshold | 21 (from a single source) |
| Minimum players | 2 |
| Maximum players | 6 |

---

## Screens

### 1. Landing
- "New Game" button
- "History" link

### 2. Setup
- Add players (name + optional avatar upload)
- Remove players
- Starting life selection (20, 30 or 40)
- Orientation at the table (facing each other or side by side, adaptive to a selected number of players)
- "Start Game" enabled when 2–6 players are added

### 3. Game
- Grid of Squares, all starting at selected life total
- Each Square displays:
  - Avatar and name
  - Current life total
  - +5 / +1 / -1 / -5 buttons
  - Commander damage section (always visible): one +1 counter per opponent; each +1 also deducts 1 life from the target
- Eliminated players: Square visually marked, remains visible
- Game ends automatically when one Square remains
- Floating utility controls (bottom-right):
  - **☀ Wake lock toggle** — keep screen on (default on) / allow sleep
  - **⛶ Fullscreen toggle** — hide browser chrome (shown on supported platforms only)
  - **☰ Game menu** — opens stop-game modal with Restart and Home options
- Back gesture / hardware back button blocked; exit only via menu

### 4. Win (inline modal)
- Overlay modal appears on the Game screen when a winner is detected — no page navigation
- Shows winner name + "claims the throne." with golden glow animation
- Two actions:
  - **Start another** — reset same players and life totals, continue on Game screen
  - **Home screen** — clear game state, return to Landing

### 5. History
- List of completed games, newest first
- Each entry shows: date, player names, final life totals, winner

---

## Elimination Logic

A player is eliminated when **either** condition is met:

1. Life total reaches 0 or below
2. Commander damage from any single opponent reaches 21

Eliminated squares remain visible on the game screen for the remainder of the game.

---

## Data Model

```ts
type Square = {
  id: string
  name: string
  avatar?: string                          // base64 encoded image
  life: number                             // 40 → max 100, min -10
  commanderDamage: Record<string, number>  // sourcePlayerId → damage dealt to this player
  isEliminated: boolean
  eliminationOrder?: number
}

type Game = {
  id: string
  startedAt: number
  endedAt?: number
  startingLife: number           // stored for reset
  orientationId: string          // layout variant selected at setup
  players: Square[]
  winner?: string
  status: 'active' | 'complete'
}

type GameHistory = {
  id: string
  date: number
  players: {
    name: string
    avatar?: string
    finalLife: number
    isWinner: boolean
  }[]
}
```

---

## Tech Stack

| Layer | Choice |
|---|---|
| Framework | React + TypeScript |
| Build tool | Vite |
| Styling | Tailwind CSS |
| State management | Zustand |
| Animation | Framer Motion |
| Persistence | localStorage |

No backend. No authentication. No external API dependencies.

---

## File Structure

```
src/
  types/index.ts
  store/
    gameStore.ts        ← active game state (Zustand)
    historyStore.ts     ← completed games (localStorage)
  components/
    Square.tsx
    LifeControls.tsx
    CommanderDamage.tsx
    PlayerAvatar.tsx
  pages/
    Landing.tsx
    Setup.tsx
    Game.tsx
    Win.tsx
    History.tsx
  App.tsx
  main.tsx
```

---

## Success Criteria

- Players can start a game in under 60 seconds
- Life and commander damage update instantly on interaction
- Elimination is visually clear to everyone at the table
- Win state is satisfying and unambiguous
- Game result appears in history immediately after the win screen

---

## Iteration Log

### Iteration 1 — Commander damage life deduction (2026-03-02)

**Commit:** `49fdeaf`

Added automatic life deduction when recording commander damage. Each +1 commander damage now simultaneously reduces the target player's life by 1. Both mutations are applied atomically in `addCommanderDamage` inside `gameStore.ts`. Tests updated to cover the new behavior.

---

### Iteration 2 — Win modal (2026-03-02)

**Commits:** `0b98257`, `ccdceda`, `21fd127`

Replaced the dedicated `/win` route with an inline portal modal that appears over the game screen. Displays "[Player] claims the throne." with a golden glow animation and two action buttons: "Start another" and "Home screen."

**Bug fixes:**
- `WinModal` was invisible because `PageTransition` applies a CSS `transform` which creates a new stacking context, trapping `position: fixed` children. Fixed by rendering the modal via `createPortal(…, document.body)`.
- `RequireGame` route guard on `/game` had `require="active"`, so the moment `game.status` became `'complete'` the guard redirected to `/` before the modal could render. Fixed by adding a `'started'` guard type that only redirects when `game` is `null`.

---

### Iteration 3 — Orientation picker (2026-03-02)

**Commit:** `b4c7ed6`

Added a player-card orientation system. A new `lib/orientations.ts` defines 10 layout variants across 2–6 players, each specifying CSS `grid-template-areas`/`columns`/`rows` and a per-player rotation (0°/90°/180°/270°). The Setup screen shows a visual picker with mini diagrams. The Game screen renders each tile in its slot with a rotation wrapper div.

`orientationId: string` added to the `Game` type and stored on game start.

---

### Iteration 4 — In-game controls: menu, fullscreen, wake lock (2026-03-03)

**Commits:** `888d68f`, `0406d23`, `5a3f60a`

Added a floating three-button control bar to the game screen (bottom-right, `position: fixed`, sibling of `PageTransition` to avoid transform stacking-context issues):

- **Game menu (☰):** Opens a portal modal (`GameMenu.tsx`) with Restart and Home buttons. Restart calls `resetGame()`; Home calls `clearGame()` + navigates to `/`.
- **Fullscreen toggle:** Uses the Fullscreen API with `webkitRequestFullscreen` as a fallback for Android Chrome/Brave. Hidden on platforms where the API is unsupported (iOS regular browser). In iOS PWA standalone mode the button is shown and uses `requestFullscreen` which iOS 16.4+ supports for installed home-screen apps.
- **Wake lock toggle (☀):** Replaced the previous always-on automatic wake lock with a user-controlled toggle. Defaults to on. Releases/re-requests the `WakeLockSentinel` on each toggle.

**Bug fix:** Fullscreen button hidden on iOS browsers (Safari, Chrome, Brave all use WebKit which doesn't expose `requestFullscreen` for arbitrary elements in the regular browser context). Detected via `FULLSCREEN_SUPPORTED` at module load time, with additional `isStandalonePWA()` check to show the button when running as an installed PWA.

---

### Iteration 5 — Back gesture prevention (2026-03-03)

**Commit:** `b618a69`

Prevented the browser back gesture (swipe back on iOS, hardware back button on Android) from exiting the game screen mid-session. On mount, a dummy `pushState` entry is added and a `popstate` listener re-pushes on every back event, keeping the user on the game screen. The listener is cleaned up on unmount, which only happens after explicit navigation via the game menu or win modal.
