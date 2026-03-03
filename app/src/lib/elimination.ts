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
