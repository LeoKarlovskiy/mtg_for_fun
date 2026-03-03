import { useNavigate } from 'react-router-dom'
import { useHistoryStore } from '../store/historyStore'
import { PageTransition } from '../components/ui/PageTransition'
import { Button } from '../components/ui/Button'

export default function History() {
  const navigate = useNavigate()
  const { games, clearHistory } = useHistoryStore()

  return (
    <PageTransition>
      <div className="min-h-screen bg-bg-base px-4 py-8">
        <div className="max-w-md mx-auto">
          <button
            onClick={() => navigate('/')}
            className="text-[var(--color-text-secondary)] hover:text-parchment mb-6 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-bright"
          >
            ← Back
          </button>

          <h2 className="text-title text-center mb-8" style={{ fontSize: '2rem' }}>
            Battle History
          </h2>

          {games.length === 0 ? (
            <p className="text-center text-[var(--color-text-secondary)] font-body italic">
              No battles recorded yet.
            </p>
          ) : (
            <div className="flex flex-col gap-4">
              {games.map((game) => {
                const winner = game.players.find(p => p.isWinner)
                return (
                  <div key={game.id} className="border border-[var(--color-border-subtle)] rounded-sm p-4 bg-bg-raised">
                    <div className="flex justify-between items-start mb-2">
                      <span className="text-label">{new Date(game.date).toLocaleDateString()}</span>
                      <span className="text-label">{game.players.length}P</span>
                    </div>
                    <div className="flex flex-col gap-1">
                      {winner && (
                        <p className="font-serif text-gold-bright font-semibold">
                          ♛ {winner.name} wins
                        </p>
                      )}
                      <div className="flex flex-wrap gap-2 mt-1">
                        {game.players.map((p) => (
                          <span
                            key={p.name}
                            className={[
                              'text-xs font-serif',
                              p.isWinner ? 'text-parchment' : 'text-[var(--color-text-secondary)]',
                            ].join(' ')}
                          >
                            {p.name} ({p.finalLife})
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {games.length > 0 && (
            <Button variant="secondary" onClick={clearHistory} className="w-full mt-6">
              Clear History
            </Button>
          )}
        </div>
      </div>
    </PageTransition>
  )
}
