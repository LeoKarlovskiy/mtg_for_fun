import { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useGameStore } from '../store/gameStore'
import { useHistoryStore } from '../store/historyStore'
import { Button } from './ui/Button'
import { modalBackdropVariants, modalPanelVariants, winGlowVariants } from '../animations/variants'

type WinModalProps = {
  open: boolean
}

export function WinModal({ open }: WinModalProps) {
  const navigate = useNavigate()
  const game = useGameStore(s => s.game)
  const { resetGame, clearGame } = useGameStore()
  const addGame = useHistoryStore(s => s.addGame)
  const saved = useRef(false)

  useEffect(() => {
    if (!open || !game || saved.current) return
    saved.current = true
    addGame({
      id: game.id,
      date: game.endedAt ?? Date.now(),
      players: game.players.map(p => ({
        name: p.name,
        avatar: p.avatar,
        finalLife: p.life,
        isWinner: p.id === game.winner,
        eliminationOrder: p.eliminationOrder,
      })),
    })
  }, [open, game, addGame])

  if (!game) return null

  const winnerName = game.players.find(p => p.id === game.winner)?.name ?? 'Unknown'

  const handleStartAnother = () => {
    saved.current = false
    resetGame()
  }

  const handleHome = () => {
    clearGame()
    navigate('/')
  }

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center"
          variants={modalBackdropVariants}
          initial="hidden"
          animate="visible"
          exit="hidden"
        >
          <div className="absolute inset-0 bg-black/80" />

          <motion.div
            className="relative z-10 flex flex-col items-center gap-8 px-10 py-12 mx-6 border border-[var(--color-border-subtle)] bg-[#111]"
            variants={modalPanelVariants}
            initial="hidden"
            animate="visible"
            exit="hidden"
          >
            <motion.div
              className="text-center"
              variants={winGlowVariants}
              initial="dim"
              animate="glow"
            >
              <p className="text-title" style={{ fontSize: '2.25rem', letterSpacing: '0.06em' }}>
                {winnerName}
              </p>
              <p className="font-body italic text-[var(--color-text-secondary)] mt-3" style={{ fontSize: '1.1rem' }}>
                claims the throne.
              </p>
            </motion.div>

            <div className="flex flex-col items-center gap-3 w-full max-w-xs">
              <Button variant="primary" onClick={handleStartAnother} className="w-full">
                Start another
              </Button>
              <Button variant="secondary" onClick={handleHome} className="w-full">
                Home screen
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  )
}
