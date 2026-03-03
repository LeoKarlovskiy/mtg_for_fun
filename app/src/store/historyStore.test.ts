import { describe, it, expect, beforeEach } from 'vitest'
import { useHistoryStore } from './historyStore'
import type { GameHistory } from '../types'

function makeGame(n: number): GameHistory {
  return {
    id: `game-${n}`,
    date: Date.now() + n,
    players: [
      { name: `Player ${n}`, finalLife: 40, isWinner: true },
    ],
  }
}

beforeEach(() => {
  localStorage.clear()
  useHistoryStore.setState({ games: [] })
})

describe('addGame', () => {
  it('adds a game to the front of the array (newest first)', () => {
    useHistoryStore.getState().addGame(makeGame(1))
    useHistoryStore.getState().addGame(makeGame(2))
    const { games } = useHistoryStore.getState()
    expect(games[0].id).toBe('game-2')
    expect(games[1].id).toBe('game-1')
  })

  it('caps the array at 20 entries, dropping the oldest', () => {
    for (let i = 1; i <= 21; i++) {
      useHistoryStore.getState().addGame(makeGame(i))
    }
    const { games } = useHistoryStore.getState()
    expect(games).toHaveLength(20)
    expect(games[0].id).toBe('game-21')
    expect(games.find((g) => g.id === 'game-1')).toBeUndefined()
  })
})

describe('clearHistory', () => {
  it('empties the games array', () => {
    useHistoryStore.getState().addGame(makeGame(1))
    useHistoryStore.getState().clearHistory()
    expect(useHistoryStore.getState().games).toHaveLength(0)
  })
})
