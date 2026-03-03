import { useLocation, BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'
import { useGameStore } from './store/gameStore'
import Landing from './pages/Landing'
import Setup from './pages/Setup'
import Game from './pages/Game'
import Win from './pages/Win'
import History from './pages/History'
import type { ReactNode } from 'react'

type RequireGameProps = {
  require: 'active' | 'complete' | 'started'
  children: ReactNode
}

function RequireGame({ require, children }: RequireGameProps) {
  const status = useGameStore(s => s.game?.status ?? null)
  if (require === 'active' && status !== 'active') return <Navigate to="/" replace />
  if (require === 'complete' && status !== 'complete') return <Navigate to="/" replace />
  if (require === 'started' && status === null) return <Navigate to="/" replace />
  return <>{children}</>
}

function AnimatedRoutes() {
  const location = useLocation()
  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<Landing />} />
        <Route path="/setup" element={<Setup />} />
        <Route
          path="/game"
          element={
            <RequireGame require="started">
              <Game />
            </RequireGame>
          }
        />
        <Route
          path="/win"
          element={
            <RequireGame require="complete">
              <Win />
            </RequireGame>
          }
        />
        <Route path="/history" element={<History />} />
      </Routes>
    </AnimatePresence>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AnimatedRoutes />
    </BrowserRouter>
  )
}
