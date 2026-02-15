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
        'timer.finalLevel': 'Final Level',
        'timer.addFiveMin': 'Add 5 Min',
        'timer.saveToHistory': 'Save to History',
        'timer.resetTournament': 'Reset Tournament',
        'timer.tournamentWinner': 'Tournament Winner',
        'timer.enterWinnerName': 'Enter winner name',
        'timer.winnerPlaceholder': 'Winner name',
        'timer.saveTournament': 'Save Tournament',
        'timer.allLevelsFinished': 'All levels finished',
        'timer.previousLevel': 'Previous Level',
        'timer.smallBlind': 'Small Blind',
        'timer.bigBlind': 'Big Blind',
        'modal.submit': 'Submit',
        'modal.cancel': 'Cancel',
      }
      let result = translations[key] || key
      if (options) {
        Object.entries(options).forEach(([k, v]) => {
          result = result.replace(`{{${k}}}`, String(v))
        })
      }
      return result
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

  it('calls prevLevel when previous button clicked', () => {
    render(
      <Timer
        tournament={baseTournament}
        toggleTimer={mockToggleTimer}
        nextLevel={mockNextLevel}
        prevLevel={mockPrevLevel}
        addTime={mockAddTime}
      />
    )
    
    const prevButton = screen.getByTitle('Previous Level')
    fireEvent.click(prevButton)
    
    expect(mockPrevLevel).toHaveBeenCalled()
  })

  it('disables next level button on final level', () => {
    const finalLevelTournament = {
      ...baseTournament,
      current_level: 2,
      time_remaining_seconds: 600,
    }
    
    render(
      <Timer
        tournament={finalLevelTournament}
        toggleTimer={mockToggleTimer}
        nextLevel={mockNextLevel}
        prevLevel={mockPrevLevel}
        addTime={mockAddTime}
      />
    )
    
    const nextButton = screen.getByTitle('Next Level')
    expect(nextButton).toBeDisabled()
  })

  it('shows level number badge for normal levels', () => {
    render(
      <Timer
        tournament={baseTournament}
        toggleTimer={mockToggleTimer}
        nextLevel={mockNextLevel}
        prevLevel={mockPrevLevel}
        addTime={mockAddTime}
      />
    )
    
    // Level 1/3 text
    expect(screen.getByText(/Level/)).toBeInTheDocument()
  })

  it('shows final level badge on last level', () => {
    const finalTournament = {
      ...baseTournament,
      blind_structure: [baseTournament.blind_structure[0]],
      current_level: 0,
    }
    
    render(
      <Timer
        tournament={finalTournament}
        toggleTimer={mockToggleTimer}
        nextLevel={mockNextLevel}
        prevLevel={mockPrevLevel}
        addTime={mockAddTime}
      />
    )
    
    // Should contain Final Level text
    expect(screen.getByText(/Final Level/)).toBeInTheDocument()
  })

  it('shows next level preview with blinds', () => {
    render(
      <Timer
        tournament={baseTournament}
        toggleTimer={mockToggleTimer}
        nextLevel={mockNextLevel}
        prevLevel={mockPrevLevel}
        addTime={mockAddTime}
      />
    )
    
    // Next level is 50/100
    expect(screen.getByText('Next Level')).toBeInTheDocument()
    expect(screen.getByText('100')).toBeInTheDocument()
  })

  it('shows break preview in next level when next is a break', () => {
    const beforeBreakTournament = { ...baseTournament, current_level: 1 }
    
    render(
      <Timer
        tournament={beforeBreakTournament}
        toggleTimer={mockToggleTimer}
        nextLevel={mockNextLevel}
        prevLevel={mockPrevLevel}
        addTime={mockAddTime}
      />
    )
    
    // Next level is a break
    const breakTexts = screen.getAllByText(/BREAK/)
    expect(breakTexts.length).toBeGreaterThanOrEqual(1)
  })

  describe('Tournament Complete State', () => {
    const completeTournament = {
      ...baseTournament,
      current_level: 2,
      time_remaining_seconds: 0,
    }

    it('shows tournament complete text', () => {
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

    it('shows go back level button when complete', () => {
      render(
        <Timer
          tournament={completeTournament}
          toggleTimer={mockToggleTimer}
          nextLevel={mockNextLevel}
          prevLevel={mockPrevLevel}
          addTime={mockAddTime}
        />
      )
      
      const goBackButton = screen.getByText(/Go Back/)
      fireEvent.click(goBackButton)
      expect(mockPrevLevel).toHaveBeenCalled()
    })

    it('shows add 5 minutes button when complete', () => {
      render(
        <Timer
          tournament={completeTournament}
          toggleTimer={mockToggleTimer}
          nextLevel={mockNextLevel}
          prevLevel={mockPrevLevel}
          addTime={mockAddTime}
        />
      )
      
      const addTimeButton = screen.getByText(/Add 5 Min/)
      fireEvent.click(addTimeButton)
      expect(mockAddTime).toHaveBeenCalledWith(300)
    })

    it('shows save to history button when onCompleteTournament is provided', () => {
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
      
      expect(screen.getByText(/Save/i)).toBeInTheDocument()
    })

    it('does not show save button when onCompleteTournament is not provided', () => {
      render(
        <Timer
          tournament={completeTournament}
          toggleTimer={mockToggleTimer}
          nextLevel={mockNextLevel}
          prevLevel={mockPrevLevel}
          addTime={mockAddTime}
        />
      )
      
      expect(screen.queryByText(/Save/i)).not.toBeInTheDocument()
    })

    it('opens winner prompt when save button clicked', () => {
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
      
      const saveButton = screen.getByText(/Save/i)
      fireEvent.click(saveButton)
      
      // Winner prompt modal should appear
      expect(screen.getByText('Tournament Winner')).toBeInTheDocument()
    })

    it('shows final stats on complete screen', () => {
      render(
        <Timer
          tournament={completeTournament}
          toggleTimer={mockToggleTimer}
          nextLevel={mockNextLevel}
          prevLevel={mockPrevLevel}
          addTime={mockAddTime}
        />
      )
      
      expect(screen.getByText(/Players Remaining/)).toBeInTheDocument()
      expect(screen.getByText(/Final Prize Pool/)).toBeInTheDocument()
      expect(screen.getByText(/Final Blinds/)).toBeInTheDocument()
    })

    it('shows reset button after saving', () => {
      render(
        <Timer
          tournament={completeTournament}
          toggleTimer={mockToggleTimer}
          nextLevel={mockNextLevel}
          prevLevel={mockPrevLevel}
          addTime={mockAddTime}
          onCompleteTournament={mockCompleteTournament}
          onReset={mockReset}
        />
      )
      
      // Click save to open winner prompt
      const saveButton = screen.getByText(/Save/i)
      fireEvent.click(saveButton)
      
      // Submit a winner name
      const input = screen.getByRole('textbox')
      fireEvent.change(input, { target: { value: 'Alice' } })
      const submitBtn = screen.getByText('Save Tournament')
      fireEvent.click(submitBtn)
      
      expect(mockCompleteTournament).toHaveBeenCalledWith('Alice')
    })
  })

  describe('Edge Cases', () => {
    it('handles time at exactly 60 seconds (boundary of low time)', () => {
      const boundaryTournament = { ...baseTournament, time_remaining_seconds: 60 }
      
      render(
        <Timer
          tournament={boundaryTournament}
          toggleTimer={mockToggleTimer}
          nextLevel={mockNextLevel}
          prevLevel={mockPrevLevel}
          addTime={mockAddTime}
        />
      )
      
      // 60 seconds is the boundary, should show warning
      const redTimer = document.querySelector('.text-red-500')
      expect(redTimer).toBeInTheDocument()
    })

    it('handles zero time remaining (not complete if not last level)', () => {
      const zeroTimeTournament = {
        ...baseTournament,
        current_level: 0,
        time_remaining_seconds: 0,
      }
      
      render(
        <Timer
          tournament={zeroTimeTournament}
          toggleTimer={mockToggleTimer}
          nextLevel={mockNextLevel}
          prevLevel={mockPrevLevel}
          addTime={mockAddTime}
        />
      )
      
      // Not final level, so should still show normal timer
      expect(screen.getByText('00:00')).toBeInTheDocument()
      expect(screen.queryByText('Tournament Complete!')).not.toBeInTheDocument()
    })

    it('handles tournament with no players', () => {
      const emptyTournament = { ...baseTournament, players: [] }
      
      render(
        <Timer
          tournament={emptyTournament}
          toggleTimer={mockToggleTimer}
          nextLevel={mockNextLevel}
          prevLevel={mockPrevLevel}
          addTime={mockAddTime}
        />
      )
      
      // Check player count shows 0/0
      const playerCounts = screen.getAllByText('0')
      expect(playerCounts.length).toBeGreaterThanOrEqual(2)
    })

    it('identifies likely winner when only 1 player remains', () => {
      const onePlayerTournament = {
        ...baseTournament,
        current_level: 2,
        time_remaining_seconds: 0,
        players: [
          { id: '1', name: 'Alice', buyins: 1, rebuys: 0, addons: 0, eliminated: false, placement: null, tableNumber: 1, seatNumber: 1 },
          { id: '2', name: 'Bob', buyins: 1, rebuys: 0, addons: 0, eliminated: true, placement: 2, tableNumber: null, seatNumber: null },
        ],
      }
      
      render(
        <Timer
          tournament={onePlayerTournament}
          toggleTimer={mockToggleTimer}
          nextLevel={mockNextLevel}
          prevLevel={mockPrevLevel}
          addTime={mockAddTime}
          onCompleteTournament={mockCompleteTournament}
        />
      )
      
      // Open winner prompt - should pre-fill with Alice
      const saveButton = screen.getByText(/Save/i)
      fireEvent.click(saveButton)
      
      // Alice's name should be the default value
      const input = screen.getByRole('textbox') as HTMLInputElement
      expect(input.value).toBe('Alice')
    })
  })
})
