import { createPortal } from 'react-dom'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useGameStore } from '../store/gameStore'
import { Button } from './ui/Button'
import { modalBackdropVariants, modalPanelVariants } from '../animations/variants'

type GameMenuProps = {
  open: boolean
  onClose: () => void
}

export function GameMenu({ open, onClose }: GameMenuProps) {
  const navigate = useNavigate()
  const { resetGame, clearGame } = useGameStore()

  const handleRestart = () => {
    resetGame()
    onClose()
  }

  const handleHome = () => {
    clearGame()
    navigate('/')
  }

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-40 flex items-center justify-center"
          variants={modalBackdropVariants}
          initial="hidden"
          animate="visible"
          exit="hidden"
        >
          <div className="absolute inset-0 bg-black/70" onClick={onClose} />

          <motion.div
            className="relative z-10 flex flex-col items-center gap-6 px-10 py-10 mx-6 border border-[var(--color-border-subtle)] bg-[#111]"
            variants={modalPanelVariants}
            initial="hidden"
            animate="visible"
            exit="hidden"
          >
            <p
              className="text-title"
              style={{ fontSize: '1.5rem', letterSpacing: '0.06em' }}
            >
              Game Menu
            </p>

            <div className="flex flex-col items-center gap-3 w-full max-w-xs">
              <Button variant="secondary" onClick={handleRestart} className="w-full">
                Restart
              </Button>
              <Button variant="secondary" onClick={handleHome} className="w-full">
                Home
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  )
}
