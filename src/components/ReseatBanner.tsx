import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { Tournament } from '../types'
import { getTableInfo, getTableBalanceSuggestions, autoBalanceTables } from '../utils'

interface ReseatBannerProps {
  tournament: Tournament
  setTournament: (t: Tournament) => void
}

// App-wide banner that nudges the organizer to rebalance tables once enough
// players have been eliminated to leave the occupied tables uneven. Shows on any
// tab so it's visible while running the timer. Dismissible, but reappears when
// the imbalance changes (e.g. another elimination).
export function ReseatBanner({ tournament, setTournament }: ReseatBannerProps) {
  const { t } = useTranslation()
  const [dismissedSignature, setDismissedSignature] = useState<string | null>(null)

  const suggestions = getTableBalanceSuggestions(
    tournament.players,
    tournament.tableCount,
    tournament.seatsPerTable
  )
  const tables = getTableInfo(tournament.players, tournament.tableCount, tournament.seatsPerTable)

  // A signature of the current per-table headcounts. When it changes, a prior
  // dismissal no longer applies.
  const signature = tables.map((table) => table.players.length).join(',')

  if (suggestions.length === 0 || signature === dismissedSignature) {
    return null
  }

  const occupied = tables.filter((table) => table.players.length > 0)
  const maxSize = Math.max(...occupied.map((table) => table.players.length))
  const minSize = Math.min(...occupied.map((table) => table.players.length))
  const biggest = occupied.find((table) => table.players.length === maxSize)!
  const smallest = occupied.reduce((a, b) => (b.players.length < a.players.length ? b : a))

  const handleRebalance = () => {
    setTournament({
      ...tournament,
      players: autoBalanceTables(tournament.players, tournament.tableCount, tournament.seatsPerTable),
    })
    setDismissedSignature(null)
  }

  return (
    <div className="flex items-center gap-3 px-6 py-2.5 bg-amber-500/10 border-b border-amber-500/30 text-sm">
      <span className="text-lg leading-none">⚖️</span>
      <div className="flex-1 min-w-0">
        <span className="font-semibold text-amber-500">{t('players.reseatTitle')}</span>
        <span className="text-themed-secondary ml-2">
          {t('players.reseatDetail', {
            bigTable: biggest.tableNumber,
            bigCount: maxSize,
            smallTable: smallest.tableNumber,
            smallCount: minSize,
          })}
        </span>
      </div>
      <button onClick={handleRebalance} className="btn btn-primary text-xs py-1.5 whitespace-nowrap">
        {t('players.rebalanceNow')}
      </button>
      <button
        onClick={() => setDismissedSignature(signature)}
        className="btn btn-ghost p-1 text-themed-muted hover:text-themed-primary"
        title={t('players.reseatDismiss')}
        aria-label={t('players.reseatDismiss')}
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  )
}
