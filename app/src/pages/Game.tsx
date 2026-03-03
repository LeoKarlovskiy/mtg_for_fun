import { useEffect } from 'react'
import { useGameStore } from '../store/gameStore'
import { getOrientation, defaultOrientation } from '../lib/orientations'
import { Square } from '../components/Square'
import { PageTransition } from '../components/ui/PageTransition'
import { WinModal } from '../components/WinModal'

export default function Game() {
  const game = useGameStore(s => s.game)

  // Wake lock
  useEffect(() => {
    let wakeLock: WakeLockSentinel | null = null
    navigator.wakeLock?.request('screen').then(wl => { wakeLock = wl }).catch(() => {})
    return () => { wakeLock?.release().catch(() => {}) }
  }, [])

  if (!game) return null

  const orientation = getOrientation(game.orientationId) ?? defaultOrientation(game.players.length)
  const isGameActive = game.status === 'active'

  const opponents = (playerId: string) =>
    game.players
      .filter(p => p.id !== playerId)
      .map(p => ({ id: p.id, name: p.name }))

  return (
    <PageTransition>
      <div
        className="gap-2 p-2 min-h-screen bg-bg-base"
        style={{
          display: 'grid',
          gridTemplateAreas: orientation.gridStyle.gridTemplateAreas,
          gridTemplateColumns: orientation.gridStyle.gridTemplateColumns,
          gridTemplateRows: orientation.gridStyle.gridTemplateRows,
        }}
      >
        {game.players.map((player, i) => {
          const slot = orientation.slots[i]
          return (
            <div
              key={player.id}
              style={{ gridArea: slot.gridArea, position: 'relative', overflow: 'hidden' }}
              className="border border-[var(--color-border-subtle)] rounded-sm"
            >
              <div
                style={{
                  width: '100%',
                  height: '100%',
                  transform: `rotate(${slot.rotation}deg)`,
                  transformOrigin: 'center center',
                }}
              >
                <Square
                  square={player}
                  opponents={opponents(player.id)}
                  isGameActive={isGameActive}
                />
              </div>
            </div>
          )
        })}
      </div>
      <WinModal open={game.status === 'complete'} />
    </PageTransition>
  )
}
