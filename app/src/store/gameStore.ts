import { create } from 'zustand'
import type { Game, PlayerSetup, Square } from '../types'
import { isEliminated, findWinner } from '../lib/elimination'

interface GameStore {
  game: Game | null
  startGame: (players: PlayerSetup[], startingLife: number) => void
  adjustLife: (playerId: string, delta: number) => void
  addCommanderDamage: (targetId: string, sourceId: string) => void
  resetGame: () => void
  clearGame: () => void
}

export const useGameStore = create<GameStore>((set, get) => {
  const _checkWin = (players: Square[]): Partial<Game> => {
    const winner = findWinner(players)
    if (winner) {
      return { winner: winner.id, status: 'complete', endedAt: Date.now() }
    }
    return {}
  }

  const _checkElimination = (playerId: string): void => {
    const { game } = get()
    if (!game) return

    const playerIndex = game.players.findIndex(p => p.id === playerId)
    if (playerIndex === -1) return

    const player = game.players[playerIndex]
    if (player.isEliminated) return

    if (isEliminated(player)) {
      const eliminatedCount = game.players.filter(p => p.isEliminated).length
      const updatedPlayers = game.players.map((p, i) =>
        i === playerIndex
          ? { ...p, isEliminated: true, eliminationOrder: eliminatedCount + 1 }
          : p
      )
      const winUpdate = _checkWin(updatedPlayers)
      set({ game: { ...game, players: updatedPlayers, ...winUpdate } })
    }
  }

  return {
    game: null,

    startGame: (players, startingLife) => {
      const squares: Square[] = players.map(p => ({
        id: crypto.randomUUID(),
        name: p.name,
        avatar: p.avatar,
        life: startingLife,
        commanderDamage: {},
        isEliminated: false,
      }))
      set({
        game: {
          id: crypto.randomUUID(),
          startedAt: Date.now(),
          startingLife,
          players: squares,
          status: 'active',
        },
      })
    },

    adjustLife: (playerId, delta) => {
      const { game } = get()
      if (!game) return
      set({
        game: {
          ...game,
          players: game.players.map(p =>
            p.id === playerId
              ? { ...p, life: Math.min(100, Math.max(0, p.life + delta)) }
              : p
          ),
        },
      })
      _checkElimination(playerId)
    },

    addCommanderDamage: (targetId, sourceId) => {
      const { game } = get()
      if (!game) return
      set({
        game: {
          ...game,
          players: game.players.map(p =>
            p.id === targetId
              ? {
                  ...p,
                  life: Math.max(0, p.life - 1),
                  commanderDamage: {
                    ...p.commanderDamage,
                    [sourceId]: (p.commanderDamage[sourceId] ?? 0) + 1,
                  },
                }
              : p
          ),
        },
      })
      _checkElimination(targetId)
    },

    resetGame: () => {
      const { game } = get()
      if (!game) return
      set({
        game: {
          ...game,
          players: game.players.map(p => ({
            ...p,
            life: game.startingLife,
            commanderDamage: {},
            isEliminated: false,
            eliminationOrder: undefined,
          })),
          winner: undefined,
          status: 'active',
          endedAt: undefined,
        },
      })
    },

    clearGame: () => set({ game: null }),
  }
})
