import { useState, useEffect } from 'react'
import type { Tournament } from '../types'
import { calculatePrizePool, formatCurrency, getEliminatedPlayers } from '../utils'

interface PrizesProps {
  tournament: Tournament
}

const PAYOUT_TEMPLATES: Record<number, number[]> = {
  2: [65, 35],
  3: [50, 30, 20],
  4: [45, 27, 18, 10],
  5: [40, 25, 15, 12, 8],
  6: [35, 22, 15, 12, 9, 7],
  7: [32, 20, 14, 11, 9, 8, 6],
  8: [30, 18, 13, 10, 9, 8, 7, 5],
}

export function Prizes({ tournament }: PrizesProps) {
  const [paidPlaces, setPaidPlaces] = useState(3)
  const [percentages, setPercentages] = useState<number[]>([50, 30, 20])

  const prizePool = calculatePrizePool(tournament)
  const eliminatedPlayers = getEliminatedPlayers(tournament.players)

  useEffect(() => {
    const template = PAYOUT_TEMPLATES[paidPlaces] || PAYOUT_TEMPLATES[3]
    setPercentages(template)
  }, [paidPlaces])

  const updatePercentage = (index: number, value: number) => {
    const newPercentages = [...percentages]
    newPercentages[index] = value
    setPercentages(newPercentages)
  }

  const totalPercentage = percentages.reduce((sum, p) => sum + p, 0)
  const isValid = Math.abs(totalPercentage - 100) < 0.01

  const payouts = percentages.map((pct, i) => ({
    place: i + 1,
    percentage: pct,
    amount: Math.floor(prizePool * pct / 100),
  }))

  const placeLabels = ['🥇', '🥈', '🥉', '4th', '5th', '6th', '7th', '8th']

  return (
    <div className="max-w-4xl mx-auto">
      {/* Prize Pool Summary */}
      <div className="card p-8 mb-6 text-center">
        <div className="text-themed-muted text-sm mb-2">Total Prize Pool</div>
        <div className="text-5xl font-bold text-accent mb-4">
          {formatCurrency(prizePool, tournament.currency_symbol)}
        </div>
        <div className="flex justify-center gap-8 text-sm">
          <div>
            <span className="text-themed-muted">Buy-ins: </span>
            <span className="text-themed-primary">
              {tournament.players.reduce((s, p) => s + p.buyins, 0)} × {formatCurrency(tournament.buyin_amount, tournament.currency_symbol)}
            </span>
          </div>
          <div>
            <span className="text-themed-muted">Rebuys: </span>
            <span className="text-themed-primary">
              {tournament.players.reduce((s, p) => s + p.rebuys, 0)} × {formatCurrency(tournament.rebuy_amount, tournament.currency_symbol)}
            </span>
          </div>
          <div>
            <span className="text-themed-muted">Add-ons: </span>
            <span className="text-themed-primary">
              {tournament.players.reduce((s, p) => s + p.addons, 0)} × {formatCurrency(tournament.addon_amount, tournament.currency_symbol)}
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6">
        {/* Payout Structure */}
        <div className="card p-6">
          <h3 className="text-lg font-semibold text-themed-primary mb-4">Payout Structure</h3>
          
          {/* Places Selector */}
          <div className="mb-6">
            <label className="text-sm text-themed-muted mb-2 block">Paid Places</label>
            <div className="flex gap-2">
              {[2, 3, 4, 5, 6, 7, 8].map((n) => (
                <button
                  key={n}
                  onClick={() => setPaidPlaces(n)}
                  className={`w-10 h-10 rounded-lg font-medium transition-colors ${
                    paidPlaces === n
                      ? 'bg-accent text-white'
                      : 'bg-themed-tertiary text-themed-secondary hover:opacity-80'
                  }`}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>

          {/* Percentage Inputs */}
          <div className="space-y-3">
            {payouts.map((payout, index) => (
              <div key={index} className="flex items-center gap-4">
                <span className="w-8 text-lg">{placeLabels[index]}</span>
                <div className="flex-1 flex items-center gap-3">
                  <input
                    type="number"
                    value={percentages[index]}
                    onChange={(e) => updatePercentage(index, parseFloat(e.target.value) || 0)}
                    className="input w-20 text-center"
                    min="0"
                    max="100"
                    step="1"
                  />
                  <span className="text-themed-muted">%</span>
                  <div className="flex-1 h-2 bg-themed-tertiary rounded-full overflow-hidden">
                    <div
                      className="h-full bg-accent transition-all duration-300"
                      style={{ width: `${percentages[index]}%` }}
                    />
                  </div>
                </div>
                <span className="w-24 text-right font-semibold text-accent">
                  {formatCurrency(payout.amount, tournament.currency_symbol)}
                </span>
              </div>
            ))}
          </div>

          {/* Validation */}
          <div className={`mt-4 text-sm ${isValid ? 'text-accent' : 'text-red-400'}`}>
            Total: {totalPercentage.toFixed(1)}%
            {!isValid && ' (must equal 100%)'}
          </div>
        </div>

        {/* Results / Standings */}
        <div className="card p-6">
          <h3 className="text-lg font-semibold text-themed-primary mb-4">Final Standings</h3>
          
          {eliminatedPlayers.length > 0 ? (
            <div className="space-y-2">
              {eliminatedPlayers.slice(0, 8).map((player) => {
                const payout = payouts.find(p => p.place === player.placement)
                return (
                  <div
                    key={player.id}
                    className={`flex items-center justify-between p-3 rounded-lg ${
                      payout ? 'bg-accent/10 border border-accent/20' : 'bg-themed-tertiary/50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-lg w-8">
                        {player.placement && player.placement <= 3 
                          ? placeLabels[player.placement - 1]
                          : `#${player.placement}`
                        }
                      </span>
                      <span className="font-medium text-themed-primary">{player.name}</span>
                    </div>
                    {payout && (
                      <span className="font-semibold text-accent">
                        {formatCurrency(payout.amount, tournament.currency_symbol)}
                      </span>
                    )}
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="text-center py-8 text-themed-muted">
              <div className="text-4xl mb-3">🏆</div>
              <p>No eliminations yet</p>
              <p className="text-sm mt-1">Final standings will appear here as players are eliminated</p>
            </div>
          )}
        </div>
      </div>

      {/* Payout Summary Cards */}
      <div className="grid grid-cols-3 gap-4 mt-6">
        {payouts.slice(0, 3).map((payout, index) => (
          <div
            key={index}
            className={`card p-6 text-center ${
              index === 0 
                ? 'bg-gradient-to-br from-amber-500/10 to-amber-600/5 border-amber-500/30' 
                : index === 1
                ? 'bg-gradient-to-br from-zinc-400/10 to-zinc-500/5 border-zinc-400/30'
                : 'bg-gradient-to-br from-orange-600/10 to-orange-700/5 border-orange-600/30'
            }`}
          >
            <div className="text-4xl mb-2">{placeLabels[index]}</div>
            <div className="text-2xl font-bold text-themed-primary mb-1">
              {formatCurrency(payout.amount, tournament.currency_symbol)}
            </div>
            <div className="text-sm text-themed-muted">{payout.percentage}% of pool</div>
          </div>
        ))}
      </div>
    </div>
  )
}
