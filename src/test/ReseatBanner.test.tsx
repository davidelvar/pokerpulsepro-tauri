import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { ReseatBanner } from '../components/ReseatBanner'
import type { Tournament, Player } from '../types'

// Mock react-i18next: return the key (with no interpolation) so we can assert on
// stable strings.
vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}))

const createPlayer = (id: string, overrides: Partial<Player> = {}): Player => ({
  id,
  name: `Player ${id}`,
  buyins: 1,
  rebuys: 0,
  addons: 0,
  eliminated: false,
  placement: null,
  tableNumber: null,
  seatNumber: null,
  ...overrides,
})

const baseTournament = (players: Player[], tableCount: number): Tournament => ({
  id: 't',
  name: 'Test',
  buyin_amount: 100,
  rebuy_amount: 100,
  rebuy_chips: 10000,
  addon_amount: 100,
  addon_chips: 10000,
  starting_chips: 10000,
  players,
  blind_structure: [],
  current_level: 0,
  time_remaining_seconds: 0,
  is_running: false,
  currency_symbol: '$',
  tableCount,
  seatsPerTable: 9,
})

const seatedAt = (table: number, count: number, prefix: string) =>
  Array.from({ length: count }, (_, i) =>
    createPlayer(`${prefix}${i}`, { tableNumber: table, seatNumber: i + 1 })
  )

describe('ReseatBanner', () => {
  it('renders nothing for a single table', () => {
    const t = baseTournament(seatedAt(1, 6, 'a'), 1)
    const { container } = render(<ReseatBanner tournament={t} setTournament={vi.fn()} />)
    expect(container).toBeEmptyDOMElement()
  })

  it('renders nothing when tables are balanced', () => {
    const t = baseTournament([...seatedAt(1, 4, 'a'), ...seatedAt(2, 4, 'b')], 2)
    const { container } = render(<ReseatBanner tournament={t} setTournament={vi.fn()} />)
    expect(container).toBeEmptyDOMElement()
  })

  it('shows the prompt when tables differ by more than one player', () => {
    const t = baseTournament([...seatedAt(1, 5, 'a'), ...seatedAt(2, 1, 'b')], 2)
    render(<ReseatBanner tournament={t} setTournament={vi.fn()} />)
    expect(screen.getByText('players.reseatTitle')).toBeInTheDocument()
    expect(screen.getByText('players.rebalanceNow')).toBeInTheDocument()
  })

  it('rebalances tables when Rebalance is clicked', () => {
    const players = [...seatedAt(1, 5, 'a'), ...seatedAt(2, 1, 'b')]
    const t = baseTournament(players, 2)
    const setTournament = vi.fn()
    render(<ReseatBanner tournament={t} setTournament={setTournament} />)

    fireEvent.click(screen.getByText('players.rebalanceNow'))

    expect(setTournament).toHaveBeenCalledTimes(1)
    const updated: Tournament = setTournament.mock.calls[0][0]
    const t1 = updated.players.filter(p => p.tableNumber === 1).length
    const t2 = updated.players.filter(p => p.tableNumber === 2).length
    expect(Math.abs(t1 - t2)).toBeLessThanOrEqual(1)
  })

  it('hides after dismiss and stays hidden until the headcounts change', () => {
    const t = baseTournament([...seatedAt(1, 5, 'a'), ...seatedAt(2, 1, 'b')], 2)
    const { container, rerender } = render(
      <ReseatBanner tournament={t} setTournament={vi.fn()} />
    )
    expect(screen.getByText('players.reseatTitle')).toBeInTheDocument()

    fireEvent.click(screen.getByLabelText('players.reseatDismiss'))
    expect(container).toBeEmptyDOMElement()

    // Same headcounts: stays dismissed.
    rerender(<ReseatBanner tournament={t} setTournament={vi.fn()} />)
    expect(container).toBeEmptyDOMElement()
  })

  it('reappears when an elimination changes the imbalance after dismissal', () => {
    const players = [...seatedAt(1, 5, 'a'), ...seatedAt(2, 1, 'b')]
    const t = baseTournament(players, 2)
    const { container, rerender } = render(
      <ReseatBanner tournament={t} setTournament={vi.fn()} />
    )
    fireEvent.click(screen.getByLabelText('players.reseatDismiss'))
    expect(container).toBeEmptyDOMElement()

    // Eliminate a player at table 1 -> headcounts change -> banner returns.
    const nextPlayers = players.map(p =>
      p.id === 'a4' ? { ...p, eliminated: true, placement: 6 } : p
    )
    rerender(<ReseatBanner tournament={baseTournament(nextPlayers, 2)} setTournament={vi.fn()} />)
    expect(screen.getByText('players.reseatTitle')).toBeInTheDocument()
  })
})
