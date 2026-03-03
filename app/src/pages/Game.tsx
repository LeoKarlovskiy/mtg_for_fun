import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useGameStore } from '../store/gameStore'
import { Square } from '../components/Square'
import { PageTransition } from '../components/ui/PageTransition'

const GRID_CLASSES: Record<number, string> = {
  2: 'grid-cols-2 grid-rows-1',
  3: 'grid-cols-2 grid-rows-2',
  4: 'grid-cols-2 grid-rows-2',
  5: 'grid-cols-2 grid-rows-3',
  6: 'grid-cols-3 grid-rows-2',
}

export default function Game() {
  const navigate = useNavigate()
  const game = useGameStore(s => s.game)

  // Wake lock
  useEffect(() => {
    let wakeLock: WakeLockSentinel | null = null
    navigator.wakeLock?.request('screen').then(wl => { wakeLock = wl }).catch(() => {})
    return () => { wakeLock?.release().catch(() => {}) }
  }, [])

  // Navigate to win when complete
  useEffect(() => {
    if (game?.status === 'complete') navigate('/win')
  }, [game?.status, navigate])

  if (!game) return null

  const gridClass = GRID_CLASSES[game.players.length] ?? 'grid-cols-2 grid-rows-2'
  const isGameActive = game.status === 'active'

  const opponents = (playerId: string) =>
    game.players
      .filter(p => p.id !== playerId)
      .map(p => ({ id: p.id, name: p.name }))

  return (
    <PageTransition>
      <div className={`grid ${gridClass} gap-2 p-2 min-h-screen bg-bg-base`}>
        {game.players.map(player => (
          <div key={player.id} className="relative border border-[var(--color-border-subtle)] rounded-sm overflow-hidden">
            <Square
              square={player}
              opponents={opponents(player.id)}
              isGameActive={isGameActive}
            />
          </div>
        ))}
      </div>
    </PageTransition>
  )
}
