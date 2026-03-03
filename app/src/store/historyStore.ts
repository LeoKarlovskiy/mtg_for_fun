import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { GameHistory } from '../types'

interface HistoryStore {
  games: GameHistory[]
  addGame: (game: GameHistory) => void
  clearHistory: () => void
}

export const useHistoryStore = create<HistoryStore>()(
  persist(
    (set): HistoryStore => ({
      games: [],
      addGame: (game) =>
        set((state) => ({ games: [game, ...state.games].slice(0, 20) })),
      clearHistory: () => set({ games: [] }),
    }),
    { name: 'mtg-history' }
  )
)
