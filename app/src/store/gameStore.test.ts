import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useGameStore } from './gameStore'
import type { PlayerSetup } from '../types'

vi.mock('../lib/elimination', () => ({
  isEliminatedByLife: (life: number) => life <= 0,
  isEliminatedByCommander: (damage: Record<string, number>) =>
    Object.values(damage).some((d) => d >= 21),
  isEliminated: (square: { life: number; commanderDamage: Record<string, number> }) =>
    square.life <= 0 || Object.values(square.commanderDamage).some((d) => d >= 21),
  findWinner: (squares: Array<{ isEliminated: boolean }>) => {
    const alive = squares.filter((s) => !s.isEliminated)
    return alive.length === 1 ? alive[0] : null
  },
}))

function makePlayers(count: number): PlayerSetup[] {
  return Array.from({ length: count }, (_, i) => ({ name: `Player ${i + 1}` }))
}

function startTestGame(playerCount = 2, life = 40) {
  useGameStore.getState().startGame(makePlayers(playerCount), life, '2-top-bottom')
  return useGameStore.getState().game!.players.map((p) => p.id)
}

beforeEach(() => {
  useGameStore.setState({ game: null })
})

describe('startGame', () => {
  it('sets game status to active', () => {
    startTestGame()
    expect(useGameStore.getState().game?.status).toBe('active')
  })

  it('sets players to the specified starting life', () => {
    startTestGame(2, 40)
    const players = useGameStore.getState().game!.players
    expect(players.every((p) => p.life === 40)).toBe(true)
  })
})

describe('adjustLife', () => {
  it('increases life by the given delta', () => {
    const [p1] = startTestGame(2, 40)
    useGameStore.getState().adjustLife(p1, 5)
    const player = useGameStore.getState().game!.players.find((p) => p.id === p1)!
    expect(player.life).toBe(45)
  })

  it('decreases life by the given delta', () => {
    const [p1] = startTestGame(2, 40)
    useGameStore.getState().adjustLife(p1, -1)
    const player = useGameStore.getState().game!.players.find((p) => p.id === p1)!
    expect(player.life).toBe(39)
  })

  it('clamps life at 0', () => {
    const [p1] = startTestGame(2, 1)
    useGameStore.getState().adjustLife(p1, -5)
    const player = useGameStore.getState().game!.players.find((p) => p.id === p1)!
    expect(player.life).toBe(0)
  })

  it('clamps life at 100', () => {
    const [p1] = startTestGame(2, 98)
    useGameStore.getState().adjustLife(p1, 5)
    const player = useGameStore.getState().game!.players.find((p) => p.id === p1)!
    expect(player.life).toBe(100)
  })

  it('triggers elimination when life reaches 0', () => {
    const [p1] = startTestGame(2, 1)
    useGameStore.getState().adjustLife(p1, -1)
    const player = useGameStore.getState().game!.players.find((p) => p.id === p1)!
    expect(player.isEliminated).toBe(true)
  })
})

describe('addCommanderDamage', () => {
  it('decreases target life by 1 when commander damage is added', () => {
    const [p1, p2] = startTestGame(2, 40)
    useGameStore.getState().addCommanderDamage(p1, p2)
    const player = useGameStore.getState().game!.players.find((p) => p.id === p1)!
    expect(player.life).toBe(39)
    expect(player.commanderDamage[p2]).toBe(1)
  })

  it('clamps life at 0 when commander damage is applied below zero', () => {
    const [p1, p2] = startTestGame(2, 1)
    useGameStore.getState().addCommanderDamage(p1, p2)
    const player = useGameStore.getState().game!.players.find((p) => p.id === p1)!
    expect(player.life).toBe(0)
  })

  it('eliminates a player after 21 commander damage from one source', () => {
    const [p1, p2] = startTestGame(2, 40)
    for (let i = 0; i < 21; i++) {
      useGameStore.getState().addCommanderDamage(p1, p2)
    }
    const player = useGameStore.getState().game!.players.find((p) => p.id === p1)!
    expect(player.isEliminated).toBe(true)
    expect(player.commanderDamage[p2]).toBe(21)
  })

  it('does not affect the life of other players', () => {
    const [p1, p2] = startTestGame(2, 40)
    useGameStore.getState().addCommanderDamage(p1, p2)
    const other = useGameStore.getState().game!.players.find((p) => p.id === p2)!
    expect(other.life).toBe(40)
  })
})

describe('elimination', () => {
  it('sets eliminationOrder to 1 for the first eliminated player', () => {
    const [p1] = startTestGame(2, 1)
    useGameStore.getState().adjustLife(p1, -1)
    const player = useGameStore.getState().game!.players.find((p) => p.id === p1)!
    expect(player.eliminationOrder).toBe(1)
  })

  it('detects a win when only one player remains', () => {
    const [p1] = startTestGame(2, 1)
    useGameStore.getState().adjustLife(p1, -1)
    expect(useGameStore.getState().game?.status).toBe('complete')
  })
})

describe('resetGame', () => {
  it('restores all players to starting life', () => {
    const [p1] = startTestGame(2, 40)
    useGameStore.getState().adjustLife(p1, -10)
    useGameStore.getState().resetGame()
    const players = useGameStore.getState().game!.players
    expect(players.every((p) => p.life === 40)).toBe(true)
  })

  it('clears isEliminated flags', () => {
    const [p1] = startTestGame(2, 1)
    useGameStore.getState().adjustLife(p1, -1)
    useGameStore.getState().resetGame()
    const players = useGameStore.getState().game!.players
    expect(players.every((p) => !p.isEliminated)).toBe(true)
  })
})

describe('clearGame', () => {
  it('sets game to null', () => {
    startTestGame()
    useGameStore.getState().clearGame()
    expect(useGameStore.getState().game).toBeNull()
  })
})
