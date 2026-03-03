# PRD: MTG Commander Life Tracker

**Version:** 0.1
**Date:** 2026-02-27
**Status:** Draft

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

**In scope:**
- Player setup (2–6 players, custom avatar, custom names, starting life selection, adaptive orientation of the table setting)
- Life total tracking with +/- controls (+/-1 and +/5)
- Commander damage tracking (always visible, per opponent)
- Elimination logic (life ≤ 0 or commander damage ≥ 21)
- Win state with celebratory animation
- Game history saved to localStorage

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
- Grid of Squares, all starting at 40 life
- Each Square displays:
  - Avatar and name
  - Current life total
  - +5 / +1 / -1 / -5 buttons
  - Commander damage section (always visible): one +1 counter per opponent
- Eliminated players: Square visually marked, remains visible
- Game ends automatically when one Square remains

### 4. Win
- Full-screen celebratory animation for the winner
- Final standings: players listed in elimination order with their final life total
- Two actions:
  - **Play Again** — reset same players to 40 life, return to Game screen
  - **New Game** — clear all state, return to Setup screen

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
