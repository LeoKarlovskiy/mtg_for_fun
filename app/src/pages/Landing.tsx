import { useNavigate } from 'react-router-dom'
import { PageTransition } from '../components/ui/PageTransition'
import { Button } from '../components/ui/Button'

export default function Landing() {
  const navigate = useNavigate()
  return (
    <PageTransition>
      <div className="min-h-screen bg-bg-base flex flex-col items-center justify-center gap-8 px-6" style={{ paddingTop: 'env(safe-area-inset-top)' }}>
        <div className="text-center">
          <h1 className="text-title" style={{ fontSize: '3rem', letterSpacing: '0.05em' }}>
            Dragon's Table
          </h1>
          <p className="font-body italic text-[var(--color-text-secondary)] mt-3" style={{ fontSize: '1rem' }}>
            "Let the dragons settle who shall reign."
          </p>
        </div>
        <div className="flex flex-col items-center gap-4 w-full max-w-xs">
          <Button variant="primary" onClick={() => navigate('/setup')}>
            New Game
          </Button>
          <Button variant="secondary" onClick={() => navigate('/history')}>
            History ◈
          </Button>
        </div>
      </div>
    </PageTransition>
  )
}
