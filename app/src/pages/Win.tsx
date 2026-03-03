import { useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useGameStore } from '../store/gameStore'
import { useHistoryStore } from '../store/historyStore'
import { PageTransition } from '../components/ui/PageTransition'
import { Button } from '../components/ui/Button'
import { winOverlayVariants, winTitleVariants, winGlowVariants } from '../animations/variants'

export default function Win() {
  const navigate = useNavigate()
  const game = useGameStore(s => s.game)
  const { resetGame, clearGame } = useGameStore()
  const addGame = useHistoryStore(s => s.addGame)
  const saved = useRef(false)

  // Save to history exactly once
  useEffect(() => {
    if (!game || saved.current) return
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
  }, [game, addGame])

  if (!game) return null

  const winnerPlayer = game.players.find(p => p.id === game.winner)
  const winnerName = winnerPlayer?.name ?? 'Unknown'

  const handlePlayAgain = () => {
    resetGame()
    navigate('/game')
  }

  const handleNewGame = () => {
    clearGame()
    navigate('/')
  }

  return (
    <PageTransition>
      <motion.div
        className="min-h-screen bg-bg-base flex flex-col items-center justify-center gap-10 px-6"
        variants={winOverlayVariants}
        initial="initial"
        animate="animate"
      >
        <motion.div
          className="text-center"
          variants={winGlowVariants}
          initial="initial"
          animate="animate"
        >
          <motion.h1
            className="text-title"
            style={{ fontSize: '4rem', letterSpacing: '0.08em' }}
            variants={winTitleVariants}
            initial="initial"
            animate="animate"
          >
            Victory
          </motion.h1>
          <p className="font-body italic text-[var(--color-text-secondary)] mt-2" style={{ fontSize: '1rem' }}>
            The dragon has spoken.
          </p>
          <p className="font-serif text-gold-bright font-semibold mt-6" style={{ fontSize: '1.75rem' }}>
            ♛ {winnerName}
          </p>
        </motion.div>

        <div className="flex flex-col items-center gap-4 w-full max-w-xs">
          <Button variant="primary" onClick={handlePlayAgain} className="w-full">
            Play Again
          </Button>
          <Button variant="secondary" onClick={handleNewGame} className="w-full">
            New Game
          </Button>
        </div>
      </motion.div>
    </PageTransition>
  )
}
