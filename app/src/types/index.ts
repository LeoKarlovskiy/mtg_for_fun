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
  startingLife: number
  orientationId: string
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
