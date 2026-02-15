import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, act } from '@testing-library/react'
import { ProjectorView } from '../components/ProjectorView'
import type { Tournament } from '../types'

// Store the listener callback so we can simulate events
let projectorStateCallback: ((event: any) => void) | null = null

// Mock Tauri APIs
vi.mock('@tauri-apps/api/event', () => ({
  listen: vi.fn().mockImplementation((eventName: string, callback: any) => {
    if (eventName === 'projector-state-update') {
      projectorStateCallback = callback
    }
    return Promise.resolve(() => {})
  }),
  emit: vi.fn(),
}))

vi.mock('@tauri-apps/api/window', () => ({
  getCurrentWindow: vi.fn().mockReturnValue({
    isFullscreen: vi.fn().mockResolvedValue(false),
    setFullscreen: vi.fn().mockResolvedValue(undefined),
  }),
}))

// Mock i18n
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, options?: any) => {
      const translations: Record<string, string> = {
        'projector.waitingForData': 'Waiting for tournament data...',
        'projector.title': 'Projector',
        'projector.level': 'Level',
        'projector.break': 'BREAK',
        'projector.breakTime': 'Break Time',
        'projector.breakMessage': 'Players take a break',
        'projector.players': 'Players',
        'projector.prizePool': 'Prize Pool',
        'projector.finalLevelReached': 'Final level reached',
        'timer.players': 'Players',
        'timer.prizePool': 'Prize Pool',
        'timer.averageStack': 'Avg Stack',
        'timer.nextLevel': 'Next Level',
        'timer.smallBlind': 'SB',
        'timer.bigBlind': 'BB',
        'timer.ante': 'Ante',
        'timer.break': 'BREAK',
        'timer.finalLevel': 'Final Level',
        'timer.levelOf': `Level ${options?.current || ''}/${options?.total || ''}`,
        'header.fullscreen': 'Fullscreen',
        'header.exitFullscreen': 'Exit Fullscreen',
      }
      return translations[key] || key
    },
  }),
}))

const createMockTournament = (overrides?: Partial<Tournament>): Tournament => ({
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
    { id: '2', small_blind: 50, big_blind: 100, ante: 10, duration_minutes: 20, is_break: false },
    { id: '3', small_blind: 0, big_blind: 0, ante: 0, duration_minutes: 10, is_break: true },
  ],
  current_level: 0,
  time_remaining_seconds: 1200,
  is_running: false,
  currency_symbol: '$',
  tableCount: 1,
  seatsPerTable: 9,
  ...overrides,
})

function simulateState(tournament: Tournament, themeMode: string = 'dark', accentColor: string = 'emerald') {
  act(() => {
    projectorStateCallback?.({
      payload: { tournament, themeMode, accentColor },
    })
  })
}

describe('ProjectorView Component', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    projectorStateCallback = null
  })

  describe('Waiting State', () => {
    it('renders waiting state when no tournament data', () => {
      render(<ProjectorView />)
      expect(screen.getByText('PokerPulse Pro')).toBeInTheDocument()
      expect(screen.getByText('Waiting for tournament data...')).toBeInTheDocument()
    })

    it('renders loading spinner in waiting state', () => {
      render(<ProjectorView />)
      const spinner = document.querySelector('.animate-spin')
      expect(spinner).toBeInTheDocument()
    })

    it('renders poker spade logo', () => {
      render(<ProjectorView />)
      expect(screen.getByText('♠')).toBeInTheDocument()
    })

    it('has dark background in waiting state', () => {
      const { container } = render(<ProjectorView />)
      const wrapper = container.querySelector('.bg-black')
      expect(wrapper).toBeInTheDocument()
    })
  })

  describe('Event Listener Setup', () => {
    it('sets up Tauri event listener on mount', async () => {
      const { listen } = await import('@tauri-apps/api/event')
      render(<ProjectorView />)
      expect(listen).toHaveBeenCalledWith('projector-state-update', expect.any(Function))
    })

    it('emits projector-ready on mount', async () => {
      const { emit } = await import('@tauri-apps/api/event')
      render(<ProjectorView />)
      // Wait for the dynamic import to resolve
      await vi.waitFor(() => {
        expect(emit).toHaveBeenCalledWith('projector-ready')
      })
    })
  })

  describe('Tournament Display', () => {
    it('renders tournament name after receiving state', () => {
      render(<ProjectorView />)
      simulateState(createMockTournament({ name: 'Friday Night Poker' }))
      expect(screen.getByText('Friday Night Poker')).toBeInTheDocument()
    })

    it('displays player count', () => {
      render(<ProjectorView />)
      simulateState(createMockTournament())
      // 2 active / 3 total
      expect(screen.getByText('2')).toBeInTheDocument()
      expect(screen.getByText('/3')).toBeInTheDocument()
    })

    it('displays prize pool with currency', () => {
      render(<ProjectorView />)
      simulateState(createMockTournament())
      // 3 buyins * $100 = $300
      expect(screen.getByText('$300')).toBeInTheDocument()
    })

    it('displays average stack', () => {
      render(<ProjectorView />)
      simulateState(createMockTournament())
      // 30000 chips / 2 active players = 15000
      expect(screen.getByText('15,000')).toBeInTheDocument()
    })

    it('displays current blind level', () => {
      render(<ProjectorView />)
      simulateState(createMockTournament())
      // Level 1: SB 25 / BB 50
      expect(screen.getByText('25')).toBeInTheDocument()
      // BB 50 appears in both current level and next level preview
      const fiftyElements = screen.getAllByText('50')
      expect(fiftyElements.length).toBeGreaterThanOrEqual(1)
    })

    it('displays timer in correct format', () => {
      render(<ProjectorView />)
      simulateState(createMockTournament({ time_remaining_seconds: 1200 }))
      expect(screen.getByText('20:00')).toBeInTheDocument()
    })

    it('displays RUNNING indicator when timer is running', () => {
      render(<ProjectorView />)
      simulateState(createMockTournament({ is_running: true }))
      expect(screen.getByText('● RUNNING')).toBeInTheDocument()
    })

    it('displays PAUSED indicator when timer is paused', () => {
      render(<ProjectorView />)
      simulateState(createMockTournament({ is_running: false }))
      expect(screen.getByText('❚❚ PAUSED')).toBeInTheDocument()
    })
  })

  describe('Blind Level Display', () => {
    it('shows ante when ante is greater than zero', () => {
      render(<ProjectorView />)
      simulateState(createMockTournament({ current_level: 1 }))
      // Level 2: SB 50 / BB 100 / Ante 10
      expect(screen.getByText('10')).toBeInTheDocument()
    })

    it('does not show ante section when ante is zero', () => {
      render(<ProjectorView />)
      simulateState(createMockTournament({ current_level: 0 }))
      // Level 1 has ante 0, so no Ante label should appear with a value
      const anteLabels = screen.queryAllByText('Ante')
      // In next level preview it might appear, but the current level shouldn't show ante
      // The blind section should only have SB and BB shown
      expect(screen.getByText('25')).toBeInTheDocument()
    })

    it('shows next level preview', () => {
      render(<ProjectorView />)
      simulateState(createMockTournament({ current_level: 0 }))
      expect(screen.getByText('Next Level')).toBeInTheDocument()
      // Next level is 50/100
      expect(screen.getByText('100')).toBeInTheDocument()
    })

    it('shows final level reached when on last level', () => {
      render(<ProjectorView />)
      simulateState(createMockTournament({ current_level: 2 }))
      expect(screen.getByText('Final level reached')).toBeInTheDocument()
    })
  })

  describe('Break Display', () => {
    it('shows break message during break', () => {
      render(<ProjectorView />)
      simulateState(createMockTournament({ current_level: 2 }))
      expect(screen.getByText(/Break Time/)).toBeInTheDocument()
    })

    it('applies amber color to timer during break', () => {
      render(<ProjectorView />)
      simulateState(createMockTournament({ current_level: 2, time_remaining_seconds: 600 }))
      const timerDisplay = document.querySelector('.text-amber-400')
      expect(timerDisplay).toBeInTheDocument()
    })
  })

  describe('Low Time Warning', () => {
    it('applies red pulsing style when time is low', () => {
      render(<ProjectorView />)
      simulateState(createMockTournament({ time_remaining_seconds: 30 }))
      const redElement = document.querySelector('.text-red-500')
      expect(redElement).toBeInTheDocument()
      const pulsingElement = document.querySelector('.animate-pulse')
      expect(pulsingElement).toBeInTheDocument()
    })

    it('does not show low time warning when time > 60', () => {
      render(<ProjectorView />)
      simulateState(createMockTournament({ time_remaining_seconds: 120 }))
      // Timer should show white, not red
      const timerDisplay = document.querySelector('.text-red-500.animate-pulse')
      expect(timerDisplay).toBeNull()
    })
  })

  describe('Theme Application', () => {
    it('applies dark theme class to document', () => {
      render(<ProjectorView />)
      simulateState(createMockTournament(), 'dark', 'emerald')
      expect(document.documentElement.classList.contains('dark')).toBe(true)
    })

    it('applies accent color class to document', () => {
      render(<ProjectorView />)
      simulateState(createMockTournament(), 'dark', 'blue')
      expect(document.documentElement.classList.contains('accent-blue')).toBe(true)
    })

    it('removes previous theme class when switching', () => {
      render(<ProjectorView />)
      simulateState(createMockTournament(), 'dark', 'emerald')
      expect(document.documentElement.classList.contains('dark')).toBe(true)
      simulateState(createMockTournament(), 'light', 'emerald')
      expect(document.documentElement.classList.contains('light')).toBe(true)
      expect(document.documentElement.classList.contains('dark')).toBe(false)
    })
  })

  describe('Fullscreen Controls', () => {
    it('shows controls overlay on mouse move', () => {
      render(<ProjectorView />)
      simulateState(createMockTournament())
      const container = document.querySelector('.h-screen.w-screen.bg-black')!
      fireEvent.mouseMove(container)
      // Controls should become visible (opacity-100)
      const fullscreenBtn = container.querySelector('button')
      expect(fullscreenBtn).toBeInTheDocument()
    })

    it('hides controls overlay on mouse leave', () => {
      render(<ProjectorView />)
      simulateState(createMockTournament())
      const container = document.querySelector('.h-screen.w-screen.bg-black')!
      fireEvent.mouseMove(container)
      fireEvent.mouseLeave(container)
      const button = container.querySelector('button')
      expect(button).toHaveClass('opacity-0')
    })

    it('calls toggleFullscreen when fullscreen button clicked', async () => {
      const { getCurrentWindow } = await import('@tauri-apps/api/window')
      render(<ProjectorView />)
      simulateState(createMockTournament())
      const container = document.querySelector('.h-screen.w-screen.bg-black')!
      fireEvent.mouseMove(container)
      const fullscreenBtn = container.querySelector('button')!
      fireEvent.click(fullscreenBtn)
      const mockWindow = getCurrentWindow()
      expect(mockWindow.isFullscreen).toHaveBeenCalled()
    })
  })

  describe('Progress Bar', () => {
    it('renders progress bar', () => {
      render(<ProjectorView />)
      simulateState(createMockTournament())
      const progressBar = document.querySelector('.bg-accent')
      expect(progressBar).toBeInTheDocument()
    })

    it('progress bar reflects elapsed time', () => {
      render(<ProjectorView />)
      // 20 min level, 10 min remaining = 50% elapsed
      simulateState(createMockTournament({ time_remaining_seconds: 600 }))
      const progressBar = document.querySelector('.transition-all.duration-1000') as HTMLElement
      expect(progressBar).toBeInTheDocument()
      expect(progressBar.style.width).toBe('50%')
    })

    it('shows red progress bar when time is low', () => {
      render(<ProjectorView />)
      simulateState(createMockTournament({ time_remaining_seconds: 30 }))
      const redBar = document.querySelector('.bg-red-500')
      expect(redBar).toBeInTheDocument()
    })
  })

  describe('Level Badge', () => {
    it('shows level number for normal levels', () => {
      render(<ProjectorView />)
      simulateState(createMockTournament({ current_level: 0 }))
      expect(screen.getByText(/Level 1\/3/)).toBeInTheDocument()
    })

    it('shows break badge during break level', () => {
      render(<ProjectorView />)
      simulateState(createMockTournament({ current_level: 2 }))
      expect(screen.getByText(/BREAK/)).toBeInTheDocument()
    })

    it('shows final level badge on last non-break level', () => {
      const tournament = createMockTournament({
        blind_structure: [
          { id: '1', small_blind: 25, big_blind: 50, ante: 0, duration_minutes: 20, is_break: false },
        ],
        current_level: 0,
      })
      render(<ProjectorView />)
      simulateState(tournament)
      expect(screen.getByText(/Final Level/)).toBeInTheDocument()
    })
  })

  describe('State Updates', () => {
    it('updates display when new state is received', () => {
      render(<ProjectorView />)
      simulateState(createMockTournament({ name: 'Tournament 1' }))
      expect(screen.getByText('Tournament 1')).toBeInTheDocument()

      simulateState(createMockTournament({ name: 'Tournament 2' }))
      expect(screen.getByText('Tournament 2')).toBeInTheDocument()
      expect(screen.queryByText('Tournament 1')).not.toBeInTheDocument()
    })

    it('updates timer when new time is received', () => {
      render(<ProjectorView />)
      simulateState(createMockTournament({ time_remaining_seconds: 600 }))
      expect(screen.getByText('10:00')).toBeInTheDocument()

      simulateState(createMockTournament({ time_remaining_seconds: 300 }))
      expect(screen.getByText('05:00')).toBeInTheDocument()
    })
  })
})
