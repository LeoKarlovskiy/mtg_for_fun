import { describe, it, expect } from 'vitest'
import type { Square } from '../types'
import {
  isEliminatedByLife,
  isEliminatedByCommander,
  isEliminated,
  findWinner,
} from './elimination'

function makeSquare(overrides: Partial<Square> & { life: number; commanderDamage: Record<string, number> }): Square {
  return {
    id: overrides.id ?? 'p1',
    name: overrides.name ?? 'Player',
    life: overrides.life,
    commanderDamage: overrides.commanderDamage,
    isEliminated: overrides.isEliminated ?? false,
    avatar: overrides.avatar,
    eliminationOrder: overrides.eliminationOrder,
  }
}

describe('isEliminatedByLife', () => {
  it('returns true when life is 0', () => {
    expect(isEliminatedByLife(0)).toBe(true)
  })

  it('returns true when life is -5', () => {
    expect(isEliminatedByLife(-5)).toBe(true)
  })

  it('returns false when life is 1', () => {
    expect(isEliminatedByLife(1)).toBe(false)
  })
})

describe('isEliminatedByCommander', () => {
  it('returns true when a single source has exactly 21 damage', () => {
    expect(isEliminatedByCommander({ p2: 21 })).toBe(true)
  })

  it('returns false when a single source has 20 damage', () => {
    expect(isEliminatedByCommander({ p2: 20 })).toBe(false)
  })

  it('returns false when multiple sources are all below 21', () => {
    expect(isEliminatedByCommander({ p2: 15, p3: 10 })).toBe(false)
  })
})

describe('isEliminated', () => {
  it('returns true when life is 0 and no commander damage', () => {
    const square = makeSquare({ life: 0, commanderDamage: {} })
    expect(isEliminated(square)).toBe(true)
  })

  it('returns true when life is 10 but commander damage from p2 is 21', () => {
    const square = makeSquare({ life: 10, commanderDamage: { p2: 21 } })
    expect(isEliminated(square)).toBe(true)
  })

  it('returns false when player is alive (life=25, commander damage below 21)', () => {
    const square = makeSquare({ life: 25, commanderDamage: { p2: 5 } })
    expect(isEliminated(square)).toBe(false)
  })
})

describe('findWinner', () => {
  it('returns the lone surviving player when two of three are eliminated', () => {
    const squares: Square[] = [
      makeSquare({ id: 'p1', life: 0, commanderDamage: {}, isEliminated: true }),
      makeSquare({ id: 'p2', life: 40, commanderDamage: {}, isEliminated: false }),
      makeSquare({ id: 'p3', life: 0, commanderDamage: {}, isEliminated: true }),
    ]
    const winner = findWinner(squares)
    expect(winner).not.toBeNull()
    expect(winner?.id).toBe('p2')
  })

  it('returns null when two of three players are still alive', () => {
    const squares: Square[] = [
      makeSquare({ id: 'p1', life: 40, commanderDamage: {}, isEliminated: false }),
      makeSquare({ id: 'p2', life: 40, commanderDamage: {}, isEliminated: false }),
      makeSquare({ id: 'p3', life: 0, commanderDamage: {}, isEliminated: true }),
    ]
    expect(findWinner(squares)).toBeNull()
  })

  it('returns null when all four players are alive', () => {
    const squares: Square[] = [
      makeSquare({ id: 'p1', life: 40, commanderDamage: {}, isEliminated: false }),
      makeSquare({ id: 'p2', life: 40, commanderDamage: {}, isEliminated: false }),
      makeSquare({ id: 'p3', life: 40, commanderDamage: {}, isEliminated: false }),
      makeSquare({ id: 'p4', life: 40, commanderDamage: {}, isEliminated: false }),
    ]
    expect(findWinner(squares)).toBeNull()
  })

  it('returns null when all players are eliminated', () => {
    const squares: Square[] = [
      makeSquare({ id: 'p1', life: 0, commanderDamage: {}, isEliminated: true }),
      makeSquare({ id: 'p2', life: 0, commanderDamage: {}, isEliminated: true }),
    ]
    expect(findWinner(squares)).toBeNull()
  })
})
