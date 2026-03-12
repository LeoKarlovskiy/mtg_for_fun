import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useGameStore } from '../store/gameStore'
import { processAvatar } from '../lib/imageUtils'
import { getOrientationsForCount, defaultOrientation } from '../lib/orientations'
import type { OrientationDef } from '../lib/orientations'
import { PageTransition } from '../components/ui/PageTransition'
import { Button } from '../components/ui/Button'
import { PlayerAvatar } from '../components/PlayerAvatar'

type PlayerDraft = { id: string; name: string; avatar?: string }

function OrientationOption({
  orientation,
  selected,
  onSelect,
}: {
  orientation: OrientationDef
  selected: boolean
  onSelect: () => void
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={[
        'flex flex-col items-center gap-2 p-2 rounded-sm border transition-all',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-bright',
        selected
          ? 'border-gold-bright bg-[rgba(212,160,23,0.08)]'
          : 'border-[var(--color-border-subtle)] hover:border-gold-muted',
      ].join(' ')}
      style={{ width: '90px' }}
    >
      {/* Mini diagram */}
      <div
        style={{
          width: '64px',
          height: '48px',
          display: 'grid',
          gridTemplateAreas: orientation.gridStyle.gridTemplateAreas,
          gridTemplateColumns: orientation.gridStyle.gridTemplateColumns,
          gridTemplateRows: orientation.gridStyle.gridTemplateRows,
          gap: '2px',
        }}
      >
        {orientation.slots.map((slot, i) => (
          <div
            key={i}
            style={{
              gridArea: slot.gridArea,
              background: 'rgba(212,160,23,0.15)',
              border: '1px solid rgba(212,160,23,0.35)',
              borderRadius: '2px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <span
              style={{
                transform: `rotate(${slot.rotation}deg)`,
                display: 'block',
                fontSize: '7px',
                color: 'var(--color-gold-bright, #D4A017)',
                fontFamily: 'serif',
                fontWeight: 700,
                lineHeight: 1,
              }}
            >
              P{i + 1}
            </span>
          </div>
        ))}
      </div>
      {/* Label */}
      <span
        className="text-center font-serif"
        style={{
          fontSize: '9px',
          color: selected ? 'var(--color-gold-bright, #D4A017)' : 'var(--color-text-secondary)',
          lineHeight: 1.3,
        }}
      >
        {orientation.label}
      </span>
    </button>
  )
}

export default function Setup() {
  const navigate = useNavigate()
  const [players, setPlayers] = useState<PlayerDraft[]>([
    { id: crypto.randomUUID(), name: '' },
    { id: crypto.randomUUID(), name: '' },
  ])
  const [startingLife, setStartingLife] = useState<20 | 30 | 40>(40)
  const [orientationId, setOrientationId] = useState(() => defaultOrientation(2).id)

  // Reset orientation when player count changes
  useEffect(() => {
    setOrientationId(defaultOrientation(players.length).id)
  }, [players.length])

  const canStart = players.length >= 2 && players.every(p => p.name.trim().length > 0)

  const addPlayer = () => {
    if (players.length >= 6) return
    setPlayers(prev => [...prev, { id: crypto.randomUUID(), name: '' }])
  }

  const removePlayer = (id: string) => {
    if (players.length <= 2) return
    setPlayers(prev => prev.filter(p => p.id !== id))
  }

  const updateName = (id: string, name: string) => {
    setPlayers(prev => prev.map(p => p.id === id ? { ...p, name } : p))
  }

  const handleAvatar = async (id: string, file: File) => {
    const avatar = await processAvatar(file)
    setPlayers(prev => prev.map(p => p.id === id ? { ...p, avatar } : p))
  }

  const handleStart = () => {
    useGameStore.getState().startGame(
      players.map(p => ({ name: p.name.trim(), avatar: p.avatar })),
      startingLife,
      orientationId,
    )
    navigate('/game')
  }

  const lifeOptions: (20 | 30 | 40)[] = [20, 30, 40]

  return (
    <PageTransition>
      <div className="min-h-screen bg-bg-base flex flex-col items-center justify-start px-4 pb-8" style={{ paddingTop: 'calc(env(safe-area-inset-top) + 2rem)' }}>
        <div className="w-full max-w-md">
          <button
            onClick={() => navigate('/')}
            className="text-[var(--color-text-secondary)] hover:text-parchment mb-6 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-bright"
          >
            ← Back
          </button>

          <h2 className="text-title text-center mb-8" style={{ fontSize: '2rem' }}>
            Assemble Your Party
          </h2>

          {/* Player rows */}
          <div className="flex flex-col gap-4 mb-6">
            {players.map(player => (
              <div key={player.id} className="flex items-center gap-3">
                <PlayerAvatar
                  src={player.avatar}
                  name={player.name || '?'}
                  size="md"
                  onUpload={file => handleAvatar(player.id, file)}
                />
                <input
                  type="text"
                  value={player.name}
                  onChange={e => updateName(player.id, e.target.value)}
                  placeholder="Player name"
                  maxLength={20}
                  className="flex-1 bg-transparent border-b border-gold-muted text-parchment font-serif focus:border-gold-bright outline-none pb-1 placeholder:text-[var(--color-text-disabled)]"
                />
                <button
                  onClick={() => removePlayer(player.id)}
                  disabled={players.length <= 2}
                  className="text-[var(--color-text-secondary)] hover:text-red-flare disabled:opacity-20 transition-colors text-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-bright"
                  type="button"
                >
                  ×
                </button>
              </div>
            ))}
          </div>

          {/* Add player */}
          <Button
            variant="secondary"
            onClick={addPlayer}
            disabled={players.length >= 6}
            className="w-full mb-8"
          >
            + Add Player
          </Button>

          {/* Starting life selector */}
          <div className="mb-8">
            <p className="text-label text-center mb-3">Starting Life</p>
            <div className="flex justify-center gap-3">
              {lifeOptions.map(life => (
                <button
                  key={life}
                  type="button"
                  onClick={() => setStartingLife(life)}
                  className={[
                    'w-16 h-10 font-serif font-semibold rounded-sm border transition-all',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-bright',
                    startingLife === life
                      ? 'border-gold-bright text-gold-bright bg-[rgba(212,160,23,0.1)]'
                      : 'border-[var(--color-border-subtle)] text-[var(--color-text-secondary)] hover:border-gold-muted',
                  ].join(' ')}
                >
                  {life}
                </button>
              ))}
            </div>
          </div>

          {/* Orientation picker */}
          <div className="mb-8">
            <p className="text-label text-center mb-3">Orientation</p>
            <div className="flex flex-wrap justify-center gap-3">
              {getOrientationsForCount(players.length).map(o => (
                <OrientationOption
                  key={o.id}
                  orientation={o}
                  selected={orientationId === o.id}
                  onSelect={() => setOrientationId(o.id)}
                />
              ))}
            </div>
          </div>

          {/* Start button */}
          <Button
            variant="primary"
            onClick={handleStart}
            disabled={!canStart}
            className="w-full"
          >
            Begin
          </Button>
        </div>
      </div>
    </PageTransition>
  )
}
