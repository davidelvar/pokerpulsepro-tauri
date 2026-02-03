import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { Timer } from '../components/Timer'
import type { Tournament } from '../types'

// Mock i18n
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, options?: any) => {
      const translations: Record<string, string> = {
        'timer.players': 'Players',
        'timer.prizePool': 'Prize Pool',
        'timer.averageStack': 'Average Stack',
        'timer.level': 'Level',
        'timer.blinds': 'Blinds',
        'timer.ante': 'Ante',
        'timer.break': 'BREAK',
        'timer.nextLevel': 'Next Level',
        'timer.start': 'Start',
        'timer.pause': 'Pause',
        'timer.resume': 'Resume',
        'timer.previous': 'Previous',
        'timer.next': 'Next',
        'timer.addMinute': '+1 Min',
        'timer.removeMinute': '-1 Min',
        'timer.tournamentComplete': 'Tournament Complete!',
        'timer.goBackLevel': 'Go Back',
        'timer.recordWinner': 'Record Winner',
        'timer.newTournament': 'New Tournament',
        'timer.playersRemaining': 'Players Remaining',
        'timer.finalPrizePool': 'Final Prize Pool',
        'timer.finalBlinds': 'Final Blinds',
        'modal.submit': 'Submit',
        'modal.cancel': 'Cancel',
      }
      if (options?.count !== undefined) {
        return translations[key]?.replace('{{count}}', options.count) || key
      }
      return translations[key] || key
    },
  }),
}))

describe('Timer Component', () => {
  const mockToggleTimer = vi.fn()
  const mockNextLevel = vi.fn()
  const mockPrevLevel = vi.fn()
  const mockAddTime = vi.fn()
  const mockCompleteTournament = vi.fn()
  const mockReset = vi.fn()

  const baseTournament: Tournament = {
    id: 'test-tournament',
    name: 'Test Tournament',
    buyin_amount: 100,
    rebuy_amount: 50,
    rebuy_chips: 5000,
    addon_amount: 50,
    addon_chips: 5000,
    starting_chips: 10000,
    players: [
      { id: '1', name: 'Player 1', buyins: 1, rebuys: 0, addons: 0, eliminated: false, placement: null, tableNumber: 1, seatNumber: 1 },
      { id: '2', name: 'Player 2', buyins: 1, rebuys: 0, addons: 0, eliminated: false, placement: null, tableNumber: 1, seatNumber: 2 },
      { id: '3', name: 'Player 3', buyins: 1, rebuys: 0, addons: 0, eliminated: true, placement: 3, tableNumber: null, seatNumber: null },
    ],
    blind_structure: [
      { id: '1', small_blind: 25, big_blind: 50, ante: 0, duration_minutes: 20, is_break: false },
      { id: '2', small_blind: 50, big_blind: 100, ante: 0, duration_minutes: 20, is_break: false },
      { id: '3', small_blind: 0, big_blind: 0, ante: 0, duration_minutes: 10, is_break: true },
    ],
    current_level: 0,
    time_remaining_seconds: 1200,
    is_running: false,
    currency_symbol: '$',
    tableCount: 1,
    seatsPerTable: 9,
  }

  beforeEach(() => {
    mockToggleTimer.mockClear()
    mockNextLevel.mockClear()
    mockPrevLevel.mockClear()
    mockAddTime.mockClear()
    mockCompleteTournament.mockClear()
    mockReset.mockClear()
  })

  it('renders player count correctly', () => {
    render(
      <Timer
        tournament={baseTournament}
        toggleTimer={mockToggleTimer}
        nextLevel={mockNextLevel}
        prevLevel={mockPrevLevel}
        addTime={mockAddTime}
      />
    )
    
    // 2 active players out of 3 total
    expect(screen.getByText('2')).toBeInTheDocument()
    expect(screen.getByText('/ 3')).toBeInTheDocument()
  })

  it('renders prize pool', () => {
    render(
      <Timer
        tournament={baseTournament}
        toggleTimer={mockToggleTimer}
        nextLevel={mockNextLevel}
        prevLevel={mockPrevLevel}
        addTime={mockAddTime}
      />
    )
    
    expect(screen.getByText('$300')).toBeInTheDocument()
  })

  it('renders current blind level', () => {
    render(
      <Timer
        tournament={baseTournament}
        toggleTimer={mockToggleTimer}
        nextLevel={mockNextLevel}
        prevLevel={mockPrevLevel}
        addTime={mockAddTime}
      />
    )
    
    // Level 1 blinds: 25/50 - shown in large text (text-6xl)
    const largeBlinds = document.querySelectorAll('.text-6xl.font-bold')
    expect(largeBlinds.length).toBeGreaterThanOrEqual(2)
    expect(screen.getByText('25')).toBeInTheDocument()
  })

  it('calls toggleTimer when play button clicked', () => {
    render(
      <Timer
        tournament={baseTournament}
        toggleTimer={mockToggleTimer}
        nextLevel={mockNextLevel}
        prevLevel={mockPrevLevel}
        addTime={mockAddTime}
      />
    )
    
    // Find the large play button (w-20 h-20)
    const playButton = document.querySelector('.w-20.h-20')
    if (playButton) fireEvent.click(playButton)
    
    expect(mockToggleTimer).toHaveBeenCalled()
  })

  it('shows pause icon when timer is running', () => {
    const runningTournament = { ...baseTournament, is_running: true }
    
    render(
      <Timer
        tournament={runningTournament}
        toggleTimer={mockToggleTimer}
        nextLevel={mockNextLevel}
        prevLevel={mockPrevLevel}
        addTime={mockAddTime}
      />
    )
    
    // Timer has running class
    expect(document.querySelector('.timer-running')).toBeInTheDocument()
  })

  it('calls nextLevel when next button clicked', () => {
    render(
      <Timer
        tournament={baseTournament}
        toggleTimer={mockToggleTimer}
        nextLevel={mockNextLevel}
        prevLevel={mockPrevLevel}
        addTime={mockAddTime}
      />
    )
    
    // Find button with "Next Level" title
    const nextButton = screen.getByTitle('Next Level')
    fireEvent.click(nextButton)
    
    expect(mockNextLevel).toHaveBeenCalled()
  })

  it('calls addTime with positive value when +1m clicked', () => {
    render(
      <Timer
        tournament={baseTournament}
        toggleTimer={mockToggleTimer}
        nextLevel={mockNextLevel}
        prevLevel={mockPrevLevel}
        addTime={mockAddTime}
      />
    )
    
    const addButton = screen.getByText('+1m')
    fireEvent.click(addButton)
    
    expect(mockAddTime).toHaveBeenCalledWith(60)
  })

  it('calls addTime with negative value when -1m clicked', () => {
    render(
      <Timer
        tournament={baseTournament}
        toggleTimer={mockToggleTimer}
        nextLevel={mockNextLevel}
        prevLevel={mockPrevLevel}
        addTime={mockAddTime}
      />
    )
    
    const removeButton = screen.getByText('-1m')
    fireEvent.click(removeButton)
    
    expect(mockAddTime).toHaveBeenCalledWith(-60)
  })

  it('calls addTime with 5 minutes when +5m clicked', () => {
    render(
      <Timer
        tournament={baseTournament}
        toggleTimer={mockToggleTimer}
        nextLevel={mockNextLevel}
        prevLevel={mockPrevLevel}
        addTime={mockAddTime}
      />
    )
    
    const addButton = screen.getByText('+5m')
    fireEvent.click(addButton)
    
    expect(mockAddTime).toHaveBeenCalledWith(300)
  })

  it('shows BREAK indicator during break level', () => {
    const breakTournament = { ...baseTournament, current_level: 2 }
    
    render(
      <Timer
        tournament={breakTournament}
        toggleTimer={mockToggleTimer}
        nextLevel={mockNextLevel}
        prevLevel={mockPrevLevel}
        addTime={mockAddTime}
      />
    )
    
    // BREAK appears with emoji
    expect(screen.getByText(/BREAK/)).toBeInTheDocument()
  })

  it('shows low time warning when under 60 seconds', () => {
    const lowTimeTournament = { ...baseTournament, time_remaining_seconds: 30 }
    
    render(
      <Timer
        tournament={lowTimeTournament}
        toggleTimer={mockToggleTimer}
        nextLevel={mockNextLevel}
        prevLevel={mockPrevLevel}
        addTime={mockAddTime}
      />
    )
    
    // Timer should have warning styling (text-red class)
    const timerDisplay = document.querySelector('.text-red-500')
    expect(timerDisplay).toBeInTheDocument()
  })

  it('shows tournament complete screen when finished', () => {
    const completeTournament = {
      ...baseTournament,
      current_level: 2,
      time_remaining_seconds: 0,
    }
    
    render(
      <Timer
        tournament={completeTournament}
        toggleTimer={mockToggleTimer}
        nextLevel={mockNextLevel}
        prevLevel={mockPrevLevel}
        addTime={mockAddTime}
        onCompleteTournament={mockCompleteTournament}
      />
    )
    
    expect(screen.getByText('Tournament Complete!')).toBeInTheDocument()
  })

  it('displays next level info section', () => {
    render(
      <Timer
        tournament={baseTournament}
        toggleTimer={mockToggleTimer}
        nextLevel={mockNextLevel}
        prevLevel={mockPrevLevel}
        addTime={mockAddTime}
      />
    )
    
    // Next level section should be present
    expect(screen.getByText('Next Level')).toBeInTheDocument()
  })

  it('formats time correctly as 20:00', () => {
    render(
      <Timer
        tournament={baseTournament}
        toggleTimer={mockToggleTimer}
        nextLevel={mockNextLevel}
        prevLevel={mockPrevLevel}
        addTime={mockAddTime}
      />
    )
    
    // 1200 seconds = 20:00
    expect(screen.getByText('20:00')).toBeInTheDocument()
  })

  it('renders average stack correctly', () => {
    render(
      <Timer
        tournament={baseTournament}
        toggleTimer={mockToggleTimer}
        nextLevel={mockNextLevel}
        prevLevel={mockPrevLevel}
        addTime={mockAddTime}
      />
    )
    
    // Average stack for 2 active players with 30000 total chips = 15000
    expect(screen.getByText('15,000')).toBeInTheDocument()
  })

  it('shows stats labels', () => {
    render(
      <Timer
        tournament={baseTournament}
        toggleTimer={mockToggleTimer}
        nextLevel={mockNextLevel}
        prevLevel={mockPrevLevel}
        addTime={mockAddTime}
      />
    )
    
    expect(screen.getByText('Players')).toBeInTheDocument()
    expect(screen.getByText('Prize Pool')).toBeInTheDocument()
    expect(screen.getByText('Average Stack')).toBeInTheDocument()
  })
})
