import { useGameStore } from '../store/gameStore'

type LifeControlsProps = {
  playerId: string
  disabled?: boolean
}

export function LifeControls({ playerId, disabled = false }: LifeControlsProps) {
  const adjust = (delta: number) => {
    if (!disabled) useGameStore.getState().adjustLife(playerId, delta)
  }

  const btnClass = [
    'w-10 h-10 font-serif text-xl',
    'text-[var(--color-text-secondary)]',
    'bg-transparent border border-[var(--color-border-subtle)] rounded-sm',
    'transition-all',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-bright',
    'hover:text-gold-bright hover:border-gold-muted hover:shadow-[0_0_8px_rgba(212,160,23,0.3)]',
    'active:text-red-flare active:border-red-ember',
    'disabled:opacity-30 disabled:cursor-not-allowed',
  ].join(' ')

  return (
    <div className="flex items-center justify-center gap-2">
      <button className={btnClass} onClick={() => adjust(-5)} disabled={disabled} type="button">－5</button>
      <button className={btnClass} onClick={() => adjust(-1)} disabled={disabled} type="button">－</button>
      <button className={btnClass} onClick={() => adjust(1)}  disabled={disabled} type="button">＋</button>
      <button className={btnClass} onClick={() => adjust(5)}  disabled={disabled} type="button">＋5</button>
    </div>
  )
}
