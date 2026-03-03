import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { Square as SquareData } from '../types'
import { lifeDeltaVariants, eliminationFlash } from '../animations/variants'
import { PlayerAvatar } from './PlayerAvatar'
import { LifeControls } from './LifeControls'
import { CommanderDamage } from './CommanderDamage'

type SquareProps = {
  square: SquareData
  opponents: { id: string; name: string }[]
  isGameActive: boolean
}

export function Square({ square, opponents, isGameActive }: SquareProps) {
  const [lifeAnim, setLifeAnim] = useState<'idle' | 'increase' | 'decrease'>('idle')
  const prevLife = useRef(square.life)

  useEffect(() => {
    if (square.life !== prevLife.current) {
      setLifeAnim(square.life > prevLife.current ? 'increase' : 'decrease')
      prevLife.current = square.life
      const t = setTimeout(() => setLifeAnim('idle'), 300)
      return () => clearTimeout(t)
    }
  }, [square.life])

  const lifeState = square.life <= 0 ? 'low' : square.life <= 20 ? 'mid' : undefined
  const disabled = square.isEliminated || !isGameActive

  return (
    <div
      className="player-square flex flex-col items-center justify-between p-3 gap-2 h-full"
      data-eliminated={square.isEliminated ? 'true' : undefined}
    >
      {/* Header: avatar + name */}
      <div className="flex items-center gap-2 w-full">
        <PlayerAvatar src={square.avatar} name={square.name} size="sm" />
        <span
          className="font-serif font-semibold text-parchment truncate"
          style={{ fontSize: '1.1rem' }}
        >
          {square.name}
        </span>
      </div>

      {/* Life total */}
      <motion.div
        className="text-life select-none"
        data-state={lifeState}
        variants={lifeDeltaVariants}
        animate={lifeAnim}
      >
        {square.life}
      </motion.div>

      {/* Life controls */}
      <LifeControls playerId={square.id} disabled={disabled} />

      {/* Commander damage */}
      <div className="w-full">
        <p className="text-label text-center mb-1">Commander Damage</p>
        <CommanderDamage
          targetPlayerId={square.id}
          opponents={opponents}
          commanderDamage={square.commanderDamage}
          disabled={disabled}
        />
      </div>

      {/* Elimination overlay */}
      <AnimatePresence>
        {square.isEliminated && (
          <motion.div
            key="elim-overlay"
            variants={eliminationFlash}
            initial="initial"
            animate="animate"
            className="absolute inset-0 flex items-center justify-center"
            style={{ background: 'rgba(139,0,0,0.35)', pointerEvents: 'none' }}
          >
            <span style={{ fontSize: '4rem', color: 'var(--color-red-flare)', opacity: 0.8 }}>†</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
