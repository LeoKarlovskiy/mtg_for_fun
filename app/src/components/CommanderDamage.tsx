import { useGameStore } from '../store/gameStore'

type CommanderDamageProps = {
  targetPlayerId: string
  opponents: { id: string; name: string }[]
  commanderDamage: Record<string, number>
  disabled?: boolean
}

export function CommanderDamage({ targetPlayerId, opponents, commanderDamage, disabled = false }: CommanderDamageProps) {
  if (opponents.length === 0) return null

  return (
    <div className="commander-damage flex-wrap">
      {opponents.map((opp) => {
        const dmg = commanderDamage[opp.id] ?? 0
        const danger = dmg >= 15
        return (
          <div key={opp.id} className="cmd-counter">
            <span className="text-label" style={{ fontSize: '0.6rem' }}>
              {opp.name.slice(0, 8)}
            </span>
            <span className="cmd-counter__value" data-danger={danger ? 'true' : undefined}>
              {dmg}
            </span>
            <div className="flex gap-0.5">
              <button
                type="button"
                disabled={disabled || dmg === 0}
                onClick={() => !disabled && useGameStore.getState().removeCommanderDamage(targetPlayerId, opp.id)}
                className={[
                  'text-xs text-[var(--color-text-secondary)]',
                  'border border-[var(--color-border-subtle)] rounded-sm w-5 h-5',
                  'hover:text-gold-bright hover:border-gold-muted',
                  'focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-gold-bright',
                  'disabled:opacity-30 disabled:cursor-not-allowed transition-all',
                ].join(' ')}
              >
                −
              </button>
              <button
                type="button"
                disabled={disabled}
                onClick={() => !disabled && useGameStore.getState().addCommanderDamage(targetPlayerId, opp.id)}
                className={[
                  'text-xs text-[var(--color-text-secondary)]',
                  'border border-[var(--color-border-subtle)] rounded-sm w-5 h-5',
                  'hover:text-gold-bright hover:border-gold-muted',
                  'focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-gold-bright',
                  'disabled:opacity-30 disabled:cursor-not-allowed transition-all',
                ].join(' ')}
              >
                +
              </button>
            </div>
          </div>
        )
      })}
    </div>
  )
}
