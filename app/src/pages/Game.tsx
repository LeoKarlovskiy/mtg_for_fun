import { useState, useEffect, useRef } from 'react'
import { useGameStore } from '../store/gameStore'
import { getOrientation, defaultOrientation } from '../lib/orientations'
import { Square } from '../components/Square'
import { PageTransition } from '../components/ui/PageTransition'
import { WinModal } from '../components/WinModal'
import { GameMenu } from '../components/GameMenu'

// webkit-prefixed fullscreen types (Android Chrome, older browsers)
type FSElement = HTMLElement & { webkitRequestFullscreen?: () => void }
type FSDocument = Document & {
  webkitFullscreenElement?: Element | null
  webkitExitFullscreen?: () => void
}

function getFullscreenElement() {
  return document.fullscreenElement ?? (document as FSDocument).webkitFullscreenElement ?? null
}

function requestFullscreen(): boolean {
  const el = document.documentElement as FSElement
  if (el.requestFullscreen) { el.requestFullscreen().catch(() => {}); return true }
  if (el.webkitRequestFullscreen) { el.webkitRequestFullscreen(); return true }
  return false
}

function exitFullscreen() {
  const doc = document as FSDocument
  if (document.exitFullscreen) { document.exitFullscreen().catch(() => {}) }
  else if (doc.webkitExitFullscreen) { doc.webkitExitFullscreen() }
}

// iOS never truly supports fullscreen (hide button entirely on iOS)
const IS_IOS =
  /iPhone|iPad|iPod/.test(navigator.userAgent) ||
  (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)

const FULLSCREEN_SUPPORTED =
  !IS_IOS &&
  !!(
    (document.documentElement as FSElement).requestFullscreen ||
    (document.documentElement as FSElement).webkitRequestFullscreen
  )

export default function Game() {
  const game = useGameStore(s => s.game)
  const [menuOpen, setMenuOpen] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [wakeLockActive, setWakeLockActive] = useState(true)
  const wakeLockRef = useRef<WakeLockSentinel | null>(null)

  // Prevent browser back gesture — navigation only via menu/win modal
  useEffect(() => {
    window.history.pushState(null, '', window.location.href)
    const handlePopState = () => {
      window.history.pushState(null, '', window.location.href)
    }
    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [])

  // Wake lock — controlled by toggle
  useEffect(() => {
    if (!wakeLockActive) {
      wakeLockRef.current?.release().catch(() => {})
      wakeLockRef.current = null
      return
    }
    navigator.wakeLock?.request('screen').then(wl => { wakeLockRef.current = wl }).catch(() => {})
    return () => { wakeLockRef.current?.release().catch(() => {}) }
  }, [wakeLockActive])

  // Fullscreen change listener — covers both standard and webkit events
  useEffect(() => {
    const handler = () => setIsFullscreen(!!getFullscreenElement())
    document.addEventListener('fullscreenchange', handler)
    document.addEventListener('webkitfullscreenchange', handler)
    return () => {
      document.removeEventListener('fullscreenchange', handler)
      document.removeEventListener('webkitfullscreenchange', handler)
    }
  }, [])

  const toggleFullscreen = () => {
    if (!getFullscreenElement()) {
      requestFullscreen()
    } else {
      exitFullscreen()
    }
  }

  if (!game) return null

  const orientation = getOrientation(game.orientationId) ?? defaultOrientation(game.players.length)
  const isGameActive = game.status === 'active'

  const opponents = (playerId: string) =>
    game.players
      .filter(p => p.id !== playerId)
      .map(p => ({ id: p.id, name: p.name }))

  return (
    <>
      <PageTransition>
        <div
          className="gap-2 p-2 min-h-screen bg-bg-base"
          style={{
            display: 'grid',
            paddingTop: 'calc(env(safe-area-inset-top) + 0.5rem)',
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

      {/* Floating controls — sibling of PageTransition, unaffected by its transform */}
      <div className="fixed right-3 z-50 flex gap-2" style={{ bottom: 'calc(env(safe-area-inset-bottom) + 0.75rem)', pointerEvents: 'auto' }}>
        {/* Wake lock toggle */}
        <button
          type="button"
          onClick={() => setWakeLockActive(v => !v)}
          title={wakeLockActive ? 'Screen lock prevented — tap to allow' : 'Screen may lock — tap to prevent'}
          style={{ touchAction: 'manipulation' }}
          className={[
            'w-11 h-11 flex items-center justify-center rounded-sm border transition-colors',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-bright',
            wakeLockActive
              ? 'border-gold-muted text-gold-bright'
              : 'border-[var(--color-border-subtle)] text-[var(--color-text-secondary)] hover:text-gold-bright hover:border-gold-muted',
          ].join(' ')}
        >
          {/* Sun icon */}
          <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
            <circle cx="8" cy="8" r="2.5" />
            <line x1="8" y1="1" x2="8" y2="3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            <line x1="8" y1="13" x2="8" y2="15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            <line x1="1" y1="8" x2="3" y2="8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            <line x1="13" y1="8" x2="15" y2="8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            <line x1="2.93" y1="2.93" x2="4.34" y2="4.34" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            <line x1="11.66" y1="11.66" x2="13.07" y2="13.07" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            <line x1="11.66" y1="4.34" x2="13.07" y2="2.93" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            <line x1="2.93" y1="13.07" x2="4.34" y2="11.66" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </button>

        {/* Fullscreen toggle — hidden on iOS Safari where the API is unsupported */}
        {FULLSCREEN_SUPPORTED && <button
          type="button"
          onClick={toggleFullscreen}
          title={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
          style={{ touchAction: 'manipulation' }}
          className={[
            'w-11 h-11 flex items-center justify-center rounded-sm border transition-colors',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-bright',
            'border-[var(--color-border-subtle)] text-[var(--color-text-secondary)] hover:text-gold-bright hover:border-gold-muted',
          ].join(' ')}
        >
          {isFullscreen ? (
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
              <path d="M5 1v4H1" />
              <path d="M15 5h-4V1" />
              <path d="M1 11h4v4" />
              <path d="M11 15v-4h4" />
            </svg>
          ) : (
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
              <path d="M1 5V1h4" />
              <path d="M11 1h4v4" />
              <path d="M15 11v4h-4" />
              <path d="M5 15H1v-4" />
            </svg>
          )}
        </button>}

        {/* Game menu */}
        <button
          type="button"
          onClick={() => setMenuOpen(true)}
          title="Game menu"
          style={{ touchAction: 'manipulation' }}
          className={[
            'w-11 h-11 flex items-center justify-center rounded-sm border transition-colors',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-bright',
            'border-[var(--color-border-subtle)] text-[var(--color-text-secondary)] hover:text-gold-bright hover:border-gold-muted',
          ].join(' ')}
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
            <rect y="2" width="16" height="1.5" rx="0.75" />
            <rect y="7.25" width="16" height="1.5" rx="0.75" />
            <rect y="12.5" width="16" height="1.5" rx="0.75" />
          </svg>
        </button>
      </div>

      <GameMenu open={menuOpen} onClose={() => setMenuOpen(false)} />
    </>
  )
}
