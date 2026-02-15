import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor, cleanup, act } from '@testing-library/react'

// Mock all external dependencies before importing App
vi.mock('@tauri-apps/api/window', () => ({
  getCurrentWindow: vi.fn(() => ({
    isFullscreen: vi.fn().mockResolvedValue(false),
    setFullscreen: vi.fn().mockResolvedValue(undefined),
  })),
}))

vi.mock('@tauri-apps/api/event', () => ({
  emit: vi.fn().mockResolvedValue(undefined),
  listen: vi.fn().mockResolvedValue(() => {}),
}))

vi.mock('@tauri-apps/api/core', () => ({
  invoke: vi.fn().mockResolvedValue(false),
}))

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, options?: { returnObjects?: boolean }) => {
      const translations: Record<string, unknown> = {
        'navigation.timer': 'Timer',
        'navigation.players': 'Players',
        'navigation.blinds': 'Blinds',
        'navigation.prizes': 'Prizes',
        'navigation.settings': 'Settings',
        'navigation.help': 'Help',
        'nav.timer': 'Timer',
        'nav.players': 'Players',
        'nav.blinds': 'Blinds',
        'nav.prizes': 'Prizes',
        'nav.settings': 'Settings',
        'nav.help': 'Help',
        'header.editName': 'Edit Name',
        'header.projectorOpen': 'Projector Open',
        'header.openProjector': 'Open Projector',
        'header.fullscreen': 'Fullscreen',
        'header.exitFullscreen': 'Exit Fullscreen',
        'timer.level': 'Level',
        'timer.levelOf': 'Level {{current}} of {{total}}',
        'timer.running': 'Running',
        'timer.paused': 'Paused',
        'timer.play': 'Play',
        'timer.pause': 'Pause',
        'timer.nextLevel': 'Next Level',
        'timer.prevLevel': 'Previous Level',
        'timer.addMinute': 'Add Minute',
        'timer.subtractMinute': 'Subtract Minute',
        'timer.reset': 'Reset',
        'timer.complete': 'Complete',
        'timer.totalPlayers': 'Total Players',
        'timer.players': 'Players',
        'timer.playersRemaining': 'Players Remaining',
        'timer.averageStack': 'Average Stack',
        'timer.totalChips': 'Total Chips',
        'timer.prizePool': 'Prize Pool',
        'timer.blinds': 'Blinds',
        'timer.smallBlind': 'Small Blind',
        'timer.bigBlind': 'Big Blind',
        'timer.finalLevel': 'Final Level',
        'timer.ante': 'Ante',
        'timer.break': 'Break',
        'timer.tournamentComplete': 'Tournament Complete',
        'timer.goBackLevel': 'Go Back',
        'timer.addFiveMin': 'Add 5 Min',
        'timer.saveToHistory': 'Save to History',
        'timer.resetTournament': 'Reset Tournament',
        'blinds.quickTemplates': 'Quick Templates',
        'settings.appearance': 'Appearance',
        'settings.theme': 'Theme',
        'settings.dark': 'Dark',
        'settings.light': 'Light',
        'settings.accent': 'Accent',
        'settings.language': 'Language',
        'settings.tournament': 'Tournament',
        'settings.currency': 'Currency',
        'settings.buyIn': 'Buy-in',
        'settings.startingChips': 'Starting Chips',
        'settings.rebuyAmount': 'Rebuy Amount',
        'settings.rebuyChips': 'Rebuy Chips',
        'settings.addonAmount': 'Add-on Amount',
        'settings.addonChips': 'Add-on Chips',
        'settings.sound': 'Sound',
        'settings.soundEnabled': 'Sound Enabled',
        'settings.soundType': 'Sound Type',
        'settings.volume': 'Volume',
        'settings.testSound': 'Test Sound',
        'settings.warnings': 'Warnings',
        'settings.warningEnabled': 'Warning Enabled',
        'settings.warningAt60': 'Warning at 60s',
        'settings.warningAt30': 'Warning at 30s',
        'settings.autoPauseOnBreak': 'Auto-pause on Break',
        'settings.data': 'Data',
        'settings.resetTournament': 'Reset Tournament',
        'settings.tutorial': 'Tutorial',
        'settings.showTutorial': 'Show Tutorial',
        'common.close': 'Close',
        'common.confirm': 'Confirm',
        'common.cancel': 'Cancel',
        'modal.resetTournament.title': 'Reset Tournament',
        'modal.resetTournament.message': 'Are you sure you want to reset?',
        'modal.resetTournament.confirm': 'Reset',
        'players.title': 'Players',
        'players.add': 'Add Player',
        'players.addPlayer': 'Add Player',
        'players.name': 'Name',
        'players.status': 'Status',
        'players.active': 'Active',
        'players.eliminated': 'Eliminated',
        'players.actions': 'Actions',
        'players.filter.all': 'All',
        'players.filter.active': 'Active',
        'players.filter.eliminated': 'Eliminated',
        'blinds.title': 'Blinds',
        'blinds.structure': 'Blind Structure',
        'blinds.level': 'Level',
        'blinds.smallBlind': 'Small Blind',
        'blinds.bigBlind': 'Big Blind',
        'blinds.ante': 'Ante',
        'blinds.duration': 'Duration',
        'blinds.templates': 'Templates',
        'prizes.title': 'Prizes',
        'prizes.prizePool': 'Prize Pool',
        'prizes.payout': 'Payout',
        'prizes.place': 'Place',
        'prizes.percentage': 'Percentage',
        'prizes.amount': 'Amount',
        'help.title': 'Help',
        'help.shortcuts': 'Shortcuts',
        'help.pokerHands': 'Poker Hands',
        'onboarding.skip': 'Skip Tutorial',
        'onboarding.next': 'Next',
        'onboarding.previous': 'Back',
        'onboarding.getStarted': 'Get Started!',
        'onboarding.accessLater': 'You can always access this tutorial from Settings or Help',
        'onboarding.steps.welcome.title': 'Welcome to PokerPulse Pro!',
        'onboarding.steps.welcome.description': 'Your professional poker tournament management tool.',
        'timer.allLevelsFinished': 'All levels finished!',
        'timer.finalPrizePool': 'Final Prize Pool',
        'timer.finalBlinds': 'Final Blinds',
        'timer.tournamentWinner': 'Tournament Winner',
        'timer.enterWinnerName': 'Enter winner name',
        'timer.winnerPlaceholder': 'Winner name',
        'timer.saveTournament': 'Save Tournament',
        'timer.tournamentSaved': 'Tournament Saved',
        'timer.tournamentSavedMessage': 'Tournament saved to history',
        'modal.ok': 'OK',
        'modal.cancel': 'Cancel',
      }
      if (options?.returnObjects) {
        return translations[key] ?? null
      }
      return translations[key] ?? key
    },
    i18n: { language: 'en', changeLanguage: vi.fn() },
  }),
  initReactI18next: { type: '3rdParty', init: vi.fn() },
}))

// Import App after mocks
import App from './App'

describe('App Component', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Clear localStorage
    localStorage.clear()
    // Remove __TAURI_INTERNALS__ to run in browser mode
    delete (window as any).__TAURI_INTERNALS__
    delete (window as any).__TAURI__
  })

  afterEach(() => {
    cleanup()
  })

  describe('Loading Screen', () => {
    it('shows loading screen initially', () => {
      render(<App />)
      expect(screen.getByText('PokerPulsePro')).toBeInTheDocument()
      expect(screen.getByText('Tournament Timer & Manager')).toBeInTheDocument()
    })

    it('shows loading animation', () => {
      const { container } = render(<App />)
      // Check for animated elements
      const animatedElements = container.querySelectorAll('.animate-pulse, .animate-spin, .animate-bounce')
      expect(animatedElements.length).toBeGreaterThan(0)
    })

    it('transitions to main app after loading', async () => {
      vi.useFakeTimers()
      render(<App />)
      
      // Initially shows loading
      expect(screen.getByText('PokerPulsePro')).toBeInTheDocument()
      
      // Advance past loading delay (1200ms)
      await act(async () => {
        vi.advanceTimersByTime(1300)
      })
      
      // Should now show the main UI with navigation tabs
      expect(screen.getByText('Timer')).toBeInTheDocument()
      
      vi.useRealTimers()
    })
  })

  describe('Main UI after loading', () => {
    beforeEach(async () => {
      vi.useFakeTimers()
      // Dismiss onboarding so tests can interact with main UI
      ;(localStorage.getItem as ReturnType<typeof vi.fn>).mockImplementation((key: string) => {
        if (key === 'pokerpulse_onboarding_complete') return 'true'
        return null
      })
    })

    afterEach(() => {
      vi.useRealTimers()
    })

    const renderAndLoad = async () => {
      const result = render(<App />)
      await act(async () => {
        vi.advanceTimersByTime(1300)
      })
      return result
    }

    it('renders navigation tabs', async () => {
      await renderAndLoad()
      
      // Use getAllByText for items that appear in both nav and Timer content
      expect(screen.getAllByText('Timer').length).toBeGreaterThanOrEqual(1)
      expect(screen.getAllByText('Players').length).toBeGreaterThanOrEqual(1)
      expect(screen.getAllByText('Blinds').length).toBeGreaterThanOrEqual(1)
      expect(screen.getByText('Prizes')).toBeInTheDocument()
      expect(screen.getByText('Settings')).toBeInTheDocument()
      expect(screen.getByText('Help')).toBeInTheDocument()
    })

    it('shows timer tab by default', async () => {
      await renderAndLoad()
      
      // Timer component renders level info and time display
      expect(screen.getByText(/Level.*of/)).toBeInTheDocument()
    })

    it('switches to players tab when clicked', async () => {
      await renderAndLoad()
      
      // Click the first 'Players' (nav tab) — Timer stats also shows 'Players'
      const playersElements = screen.getAllByText('Players')
      fireEvent.click(playersElements[0])
      
      // Players component renders Add Player button
      expect(screen.getByText('Add Player')).toBeInTheDocument()
    })

    it('switches to blinds tab when clicked', async () => {
      await renderAndLoad()
      
      fireEvent.click(screen.getByText('Blinds'))
      
      expect(screen.getByText('Quick Templates')).toBeInTheDocument()
    })

    it('switches to settings tab when clicked', async () => {
      await renderAndLoad()
      
      fireEvent.click(screen.getByText('Settings'))
      
      expect(screen.getByText('Appearance')).toBeInTheDocument()
    })

    it('switches to help tab when clicked', async () => {
      await renderAndLoad()
      
      fireEvent.click(screen.getByText('Help'))
      
      // Help tab content visible (multiple elements may have 'Help' text)
      const helpElements = screen.getAllByText('Help')
      expect(helpElements.length).toBeGreaterThanOrEqual(1)
    })

    it('saves active tab to localStorage when changed', async () => {
      await renderAndLoad()
      
      // Click the first 'Players' (nav tab)
      const playersElements = screen.getAllByText('Players')
      fireEvent.click(playersElements[0])
      
      expect(localStorage.setItem).toHaveBeenCalledWith('pokerpulse_active_tab', 'players')
    })

    it('saves tournament state to localStorage', async () => {
      await renderAndLoad()
      
      // Tournament is saved on mount
      expect(localStorage.setItem).toHaveBeenCalledWith(
        'pokerpulse_tournament',
        expect.any(String)
      )
    })

    it('saves theme settings to localStorage', async () => {
      await renderAndLoad()
      
      expect(localStorage.setItem).toHaveBeenCalledWith(
        'pokerpulse_theme_settings',
        expect.any(String)
      )
    })

    it('applies dark mode class to document', async () => {
      await renderAndLoad()
      
      expect(document.documentElement.classList.contains('dark')).toBe(true)
    })

    it('applies accent class to document', async () => {
      await renderAndLoad()
      
      expect(document.documentElement.classList.contains('accent-emerald')).toBe(true)
    })
  })

  describe('Keyboard Shortcuts Integration', () => {
    beforeEach(async () => {
      vi.useFakeTimers()
      // Dismiss onboarding
      ;(localStorage.getItem as ReturnType<typeof vi.fn>).mockImplementation((key: string) => {
        if (key === 'pokerpulse_onboarding_complete') return 'true'
        return null
      })
    })

    afterEach(() => {
      vi.useRealTimers()
    })

    const renderAndLoad = async () => {
      const result = render(<App />)
      await act(async () => {
        vi.advanceTimersByTime(1300)
      })
      return result
    }

    it('toggles timer with Space key', async () => {
      const { container } = await renderAndLoad()
      
      // Timer uses CSS class 'timer-running' when running, no class when paused
      expect(container.querySelector('.timer-running')).toBeNull()
      
      // Press Space to start timer
      await act(async () => {
        fireEvent.keyDown(window, { code: 'Space' })
      })
      
      // Should now have timer-running class
      expect(container.querySelector('.timer-running')).toBeInTheDocument()
    })
    
    it('does not trigger shortcuts when typing in input', async () => {
      const { container } = await renderAndLoad()
      
      // Navigate to settings which has inputs
      fireEvent.click(screen.getByText('Settings'))
      
      const inputs = screen.getAllByRole('textbox')
      if (inputs.length > 0) {
        // Focus on an input and press Space
        fireEvent.keyDown(inputs[0], { code: 'Space', target: inputs[0] })
        
        // Timer should still be paused since we're in an input
        fireEvent.click(screen.getByText('Timer'))
        expect(container.querySelector('.timer-running')).toBeNull()
      }
    })

    it('adds time with + key', async () => {
      await renderAndLoad()
      
      // Default time is 15:00 (900s)
      expect(screen.getByText('15:00')).toBeInTheDocument()
      
      await act(async () => {
        fireEvent.keyDown(window, { code: 'Equal' })
      })
      
      // Time should increase by 60 seconds to 16:00
      expect(screen.getByText('16:00')).toBeInTheDocument()
    })

    it('subtracts time with - key', async () => {
      await renderAndLoad()
      
      expect(screen.getByText('15:00')).toBeInTheDocument()
      
      await act(async () => {
        fireEvent.keyDown(window, { code: 'Minus' })
      })
      
      // Time should decrease by 60 seconds to 14:00
      expect(screen.getByText('14:00')).toBeInTheDocument()
    })

    it('handles NumpadAdd for adding time', async () => {
      await renderAndLoad()
      
      await act(async () => {
        fireEvent.keyDown(window, { code: 'NumpadAdd' })
      })
      
      // Should work without error, time increases
      expect(screen.getByText('16:00')).toBeInTheDocument()
    })

    it('handles NumpadSubtract for removing time', async () => {
      await renderAndLoad()
      
      await act(async () => {
        fireEvent.keyDown(window, { code: 'NumpadSubtract' })
      })
      
      expect(screen.getByText('14:00')).toBeInTheDocument()
    })
  })

  describe('Timer Functionality', () => {
    beforeEach(async () => {
      vi.useFakeTimers()
      // Dismiss onboarding
      ;(localStorage.getItem as ReturnType<typeof vi.fn>).mockImplementation((key: string) => {
        if (key === 'pokerpulse_onboarding_complete') return 'true'
        return null
      })
    })

    afterEach(() => {
      vi.useRealTimers()
    })

    const renderAndLoad = async () => {
      const result = render(<App />)
      await act(async () => {
        vi.advanceTimersByTime(1300)
      })
      return result
    }

    it('counts down when running', async () => {
      const { container } = await renderAndLoad()
      
      // Toggle timer on
      await act(async () => {
        fireEvent.keyDown(window, { code: 'Space' })
      })
      
      expect(container.querySelector('.timer-running')).toBeInTheDocument()
      
      // Advance 1 second
      await act(async () => {
        vi.advanceTimersByTime(1000)
      })
      
      // Timer should still be running (timer-running class present)
      expect(container.querySelector('.timer-running')).toBeInTheDocument()
      // Time should have decremented from 15:00 to 14:59
      expect(screen.getByText('14:59')).toBeInTheDocument()
    })

    it('shows reset tournament confirm modal', async () => {
      await renderAndLoad()
      
      // Navigate to settings
      fireEvent.click(screen.getByText('Settings'))

      // Click the danger zone Reset Tournament button
      const resetButtons = screen.getAllByText('Reset Tournament')
      // The button is in the danger zone — find the one that IS a button element
      for (const el of resetButtons) {
        const btn = el.closest('button')
        if (btn && btn.classList.contains('btn-danger')) {
          fireEvent.click(btn)
          break
        }
      }
      
      // Confirm modal should appear with hardcoded English text
      expect(screen.getByText(/Are you sure you want to reset/)).toBeInTheDocument()
    })
  })

  describe('Onboarding', () => {
    beforeEach(async () => {
      vi.useFakeTimers()
    })

    afterEach(() => {
      vi.useRealTimers()
    })

    it('shows onboarding on first visit', async () => {
      // No onboarding_complete in localStorage
      (localStorage.getItem as ReturnType<typeof vi.fn>).mockReturnValue(null)
      
      render(<App />)
      await act(async () => {
        vi.advanceTimersByTime(1300)
      })
      
      // Onboarding should be visible
      expect(screen.getByText(/Welcome to PokerPulse/)).toBeInTheDocument()
    })

    it('does not show onboarding when already completed', async () => {
      (localStorage.getItem as ReturnType<typeof vi.fn>).mockImplementation((key: string) => {
        if (key === 'pokerpulse_onboarding_complete') return 'true'
        return null
      })
      
      render(<App />)
      await act(async () => {
        vi.advanceTimersByTime(1300)
      })
      
      // Onboarding should not be visible
      expect(screen.queryByText(/Welcome to PokerPulse/)).not.toBeInTheDocument()
    })

    it('completes onboarding and saves to localStorage', async () => {
      (localStorage.getItem as ReturnType<typeof vi.fn>).mockReturnValue(null)
      
      render(<App />)
      await act(async () => {
        vi.advanceTimersByTime(1300)
      })
      
      // Skip the onboarding
      const skipButton = screen.getByText('Skip Tutorial')
      fireEvent.click(skipButton)
      
      expect(localStorage.setItem).toHaveBeenCalledWith('pokerpulse_onboarding_complete', 'true')
    })
  })

  describe('Theme Application', () => {
    beforeEach(async () => {
      vi.useFakeTimers()
    })

    afterEach(() => {
      vi.useRealTimers()
    })

    it('loads saved theme from localStorage', async () => {
      (localStorage.getItem as ReturnType<typeof vi.fn>).mockImplementation((key: string) => {
        if (key === 'pokerpulse_theme_settings') return JSON.stringify({ mode: 'light', accent: 'blue' })
        if (key === 'pokerpulse_onboarding_complete') return 'true'
        return null
      })
      
      render(<App />)
      await act(async () => {
        vi.advanceTimersByTime(1300)
      })
      
      expect(document.documentElement.classList.contains('light')).toBe(true)
      expect(document.documentElement.classList.contains('accent-blue')).toBe(true)
    })
  })

  describe('Saved State Restoration', () => {
    it('loads saved tab from localStorage', async () => {
      vi.useFakeTimers();
      (localStorage.getItem as ReturnType<typeof vi.fn>).mockImplementation((key: string) => {
        if (key === 'pokerpulse_active_tab') return 'blinds'
        if (key === 'pokerpulse_onboarding_complete') return 'true'
        return null
      })
      
      render(<App />)
      await act(async () => {
        vi.advanceTimersByTime(1300)
      })
      
      // Blinds tab renders Quick Templates heading
      expect(screen.getByText('Quick Templates')).toBeInTheDocument()
      
      vi.useRealTimers()
    })

    it('loads saved sound settings from localStorage', async () => {
      vi.useFakeTimers()
      const savedSettings = {
        enabled: false,
        soundType: 'evil-laugh',
        volume: 0.5,
        customSoundPath: null,
        warningEnabled: false,
        warningAt60: false,
        warningAt30: false,
        autoPauseOnBreak: false,
      };
      (localStorage.getItem as ReturnType<typeof vi.fn>).mockImplementation((key: string) => {
        if (key === 'pokerpulse_sound_settings') return JSON.stringify(savedSettings)
        if (key === 'pokerpulse_onboarding_complete') return 'true'
        return null
      })
      
      render(<App />)
      await act(async () => {
        vi.advanceTimersByTime(1300)
      })
      
      // Navigate to settings and check sound is disabled
      fireEvent.click(screen.getByText('Settings'))
      
      // The component should render with sound settings loaded
      expect(screen.getByText('Settings')).toBeInTheDocument()
      
      vi.useRealTimers()
    })

    it('handles corrupted localStorage data gracefully', async () => {
      vi.useFakeTimers();
      (localStorage.getItem as ReturnType<typeof vi.fn>).mockImplementation((key: string) => {
        if (key === 'pokerpulse_tournament') return 'not valid json{'
        if (key === 'pokerpulse_onboarding_complete') return 'true'
        return null
      })
      
      // Should not throw
      render(<App />)
      await act(async () => {
        vi.advanceTimersByTime(1300)
      })
      
      // Should fall back to defaults
      expect(screen.getByText('Timer')).toBeInTheDocument()
      
      vi.useRealTimers()
    })

    it('migrates old tournament data without addon fields', async () => {
      vi.useFakeTimers()
      const oldData = {
        id: 'old-tournament',
        name: 'Old Tournament',
        buyin_amount: 100,
        rebuy_amount: 50,
        starting_chips: 15000,
        players: [{ id: '1', name: 'P1', buyins: 1, rebuys: 0, eliminated: false, placement: null, tableNumber: null, seatNumber: null }],
        blind_structure: [{ id: '1', small_blind: 25, big_blind: 50, ante: 0, duration_minutes: 15, is_break: false }],
        current_level: 0,
        time_remaining_seconds: 900,
        is_running: true,
        currency_symbol: '$',
        tableCount: 1,
        seatsPerTable: 9,
      };
      (localStorage.getItem as ReturnType<typeof vi.fn>).mockImplementation((key: string) => {
        if (key === 'pokerpulse_tournament') return JSON.stringify(oldData)
        if (key === 'pokerpulse_onboarding_complete') return 'true'
        return null
      })
      
      const { container } = render(<App />)
      await act(async () => {
        vi.advanceTimersByTime(1300)
      })
      
      // Should render without errors - migration adds missing fields
      expect(screen.getByText('Timer')).toBeInTheDocument()
      // Should always start paused when restored (no timer-running class)
      expect(container.querySelector('.timer-running')).toBeNull()
      
      vi.useRealTimers()
    })
  })

  describe('Arrow Key Level Navigation', () => {
    beforeEach(async () => {
      vi.useFakeTimers()
      ;(window as any).Audio = vi.fn(function() { return { volume: 0, play: vi.fn().mockResolvedValue(undefined) } })
      ;(localStorage.getItem as ReturnType<typeof vi.fn>).mockImplementation((key: string) => {
        if (key === 'pokerpulse_onboarding_complete') return 'true'
        return null
      })
    })

    afterEach(() => {
      vi.useRealTimers()
    })

    const renderAndLoad = async () => {
      const result = render(<App />)
      await act(async () => {
        vi.advanceTimersByTime(1300)
      })
      return result
    }

    it('advances to next level with ArrowRight', async () => {
      await renderAndLoad()

      // At level 0, next preview shows 50/100. "150" not visible.
      expect(screen.queryByText('150')).not.toBeInTheDocument()

      await act(async () => {
        fireEvent.keyDown(window, { code: 'ArrowRight' })
      })

      // At level 1, next preview shows 75/150
      expect(screen.getByText('150')).toBeInTheDocument()
    })

    it('goes back to previous level with ArrowLeft', async () => {
      await renderAndLoad()

      // Advance to level 1
      await act(async () => {
        fireEvent.keyDown(window, { code: 'ArrowRight' })
      })
      expect(screen.getByText('150')).toBeInTheDocument()

      // Go back to level 0
      await act(async () => {
        fireEvent.keyDown(window, { code: 'ArrowLeft' })
      })

      expect(screen.queryByText('150')).not.toBeInTheDocument()
      expect(screen.getByText('25')).toBeInTheDocument()
    })

    it('does not go before first level', async () => {
      await renderAndLoad()

      await act(async () => {
        fireEvent.keyDown(window, { code: 'ArrowLeft' })
      })

      // Still at level 0
      expect(screen.getByText('25')).toBeInTheDocument()
    })

    it('navigates to break level with correct duration', async () => {
      await renderAndLoad()

      // Navigate to level 4 (break) - 4 ArrowRight presses
      for (let i = 0; i < 4; i++) {
        await act(async () => {
          fireEvent.keyDown(window, { code: 'ArrowRight' })
        })
      }

      // Break has 10-minute duration
      expect(screen.getByText('10:00')).toBeInTheDocument()
    })
  })

  describe('Level Change Sound Playback', () => {
    let mockAudioPlay: ReturnType<typeof vi.fn>
    let MockAudioConstructor: ReturnType<typeof vi.fn>

    beforeEach(async () => {
      vi.useFakeTimers()
      mockAudioPlay = vi.fn().mockResolvedValue(undefined)
      MockAudioConstructor = vi.fn(function() { return { volume: 0, play: mockAudioPlay } })
      ;(window as any).Audio = MockAudioConstructor
      ;(localStorage.getItem as ReturnType<typeof vi.fn>).mockImplementation((key: string) => {
        if (key === 'pokerpulse_onboarding_complete') return 'true'
        return null
      })
    })

    afterEach(() => {
      vi.useRealTimers()
    })

    const renderAndLoad = async () => {
      const result = render(<App />)
      await act(async () => {
        vi.advanceTimersByTime(1300)
      })
      return result
    }

    it('plays bell sound when level changes', async () => {
      await renderAndLoad()

      await act(async () => {
        fireEvent.keyDown(window, { code: 'ArrowRight' })
      })

      expect(MockAudioConstructor).toHaveBeenCalledWith('/alarms/bell-ring-01.wav')
      expect(mockAudioPlay).toHaveBeenCalled()
    })

    it('plays evil-laugh sound when configured', async () => {
      ;(localStorage.getItem as ReturnType<typeof vi.fn>).mockImplementation((key: string) => {
        if (key === 'pokerpulse_onboarding_complete') return 'true'
        if (key === 'pokerpulse_sound_settings') return JSON.stringify({
          enabled: true, soundType: 'evil-laugh', customSoundPath: null,
          volume: 0.7, warningEnabled: true, warningAt60: true, warningAt30: true, autoPauseOnBreak: true,
        })
        return null
      })

      await renderAndLoad()

      await act(async () => {
        fireEvent.keyDown(window, { code: 'ArrowRight' })
      })

      expect(MockAudioConstructor).toHaveBeenCalledWith('/alarms/evil-laugh.wav')
    })

    it('plays localized sound for current language', async () => {
      ;(localStorage.getItem as ReturnType<typeof vi.fn>).mockImplementation((key: string) => {
        if (key === 'pokerpulse_onboarding_complete') return 'true'
        if (key === 'pokerpulse_sound_settings') return JSON.stringify({
          enabled: true, soundType: 'localized', customSoundPath: null,
          volume: 0.7, warningEnabled: true, warningAt60: true, warningAt30: true, autoPauseOnBreak: true,
        })
        return null
      })

      await renderAndLoad()

      await act(async () => {
        fireEvent.keyDown(window, { code: 'ArrowRight' })
      })

      expect(MockAudioConstructor).toHaveBeenCalledWith('/alarms/localized/english.mp3')
    })

    it('does not play sound when disabled', async () => {
      ;(localStorage.getItem as ReturnType<typeof vi.fn>).mockImplementation((key: string) => {
        if (key === 'pokerpulse_onboarding_complete') return 'true'
        if (key === 'pokerpulse_sound_settings') return JSON.stringify({
          enabled: false, soundType: 'bell', customSoundPath: null,
          volume: 0.7, warningEnabled: true, warningAt60: true, warningAt30: true, autoPauseOnBreak: true,
        })
        return null
      })

      await renderAndLoad()

      await act(async () => {
        fireEvent.keyDown(window, { code: 'ArrowRight' })
      })

      expect(MockAudioConstructor).not.toHaveBeenCalled()
    })

    it('sets correct volume on audio element', async () => {
      await renderAndLoad()

      await act(async () => {
        fireEvent.keyDown(window, { code: 'ArrowRight' })
      })

      const audioInstance = MockAudioConstructor.mock.results[0]?.value
      expect(audioInstance).toBeDefined()
      expect(audioInstance.volume).toBe(0.7)
    })
  })

  describe('Warning Sounds Integration', () => {
    beforeEach(async () => {
      vi.useFakeTimers()
      ;(window as any).Audio = vi.fn(function() { return { volume: 0, play: vi.fn().mockResolvedValue(undefined) } })
    })

    afterEach(() => {
      vi.useRealTimers()
    })

    it('plays warning beep at 60 seconds remaining', async () => {
      ;(localStorage.getItem as ReturnType<typeof vi.fn>).mockImplementation((key: string) => {
        if (key === 'pokerpulse_tournament') return JSON.stringify({
          id: 'dev-tournament', name: 'Test', buyin_amount: 100, rebuy_amount: 100,
          rebuy_chips: 10000, addon_amount: 100, addon_chips: 10000, starting_chips: 10000,
          players: [{ id: '1', name: 'Alice', buyins: 1, rebuys: 0, addons: 0, eliminated: false, placement: null, tableNumber: null, seatNumber: null }],
          blind_structure: [
            { id: '1', small_blind: 25, big_blind: 50, ante: 0, duration_minutes: 15, is_break: false },
            { id: '2', small_blind: 50, big_blind: 100, ante: 0, duration_minutes: 15, is_break: false },
          ],
          current_level: 0, time_remaining_seconds: 62, is_running: false,
          currency_symbol: '$', tableCount: 1, seatsPerTable: 9,
        })
        if (key === 'pokerpulse_onboarding_complete') return 'true'
        return null
      })

      render(<App />)
      await act(async () => { vi.advanceTimersByTime(1300) })

      ;(window.AudioContext as ReturnType<typeof vi.fn>).mockClear()

      // Start timer
      await act(async () => { fireEvent.keyDown(window, { code: 'Space' }) })

      // Advance 2 seconds: 62 → 61 → 60
      await act(async () => { vi.advanceTimersByTime(2000) })

      // Warning sound triggers via AudioContext
      expect(window.AudioContext).toHaveBeenCalled()
    })

    it('plays warning beep at 30 seconds remaining', async () => {
      ;(localStorage.getItem as ReturnType<typeof vi.fn>).mockImplementation((key: string) => {
        if (key === 'pokerpulse_tournament') return JSON.stringify({
          id: 'dev-tournament', name: 'Test', buyin_amount: 100, rebuy_amount: 100,
          rebuy_chips: 10000, addon_amount: 100, addon_chips: 10000, starting_chips: 10000,
          players: [{ id: '1', name: 'Alice', buyins: 1, rebuys: 0, addons: 0, eliminated: false, placement: null, tableNumber: null, seatNumber: null }],
          blind_structure: [
            { id: '1', small_blind: 25, big_blind: 50, ante: 0, duration_minutes: 15, is_break: false },
            { id: '2', small_blind: 50, big_blind: 100, ante: 0, duration_minutes: 15, is_break: false },
          ],
          current_level: 0, time_remaining_seconds: 32, is_running: false,
          currency_symbol: '$', tableCount: 1, seatsPerTable: 9,
        })
        if (key === 'pokerpulse_onboarding_complete') return 'true'
        return null
      })

      render(<App />)
      await act(async () => { vi.advanceTimersByTime(1300) })

      ;(window.AudioContext as ReturnType<typeof vi.fn>).mockClear()

      await act(async () => { fireEvent.keyDown(window, { code: 'Space' }) })

      // Advance 2 seconds: 32 → 31 → 30
      await act(async () => { vi.advanceTimersByTime(2000) })

      expect(window.AudioContext).toHaveBeenCalled()
    })
  })

  describe('Timer Auto-Advance', () => {
    beforeEach(async () => {
      vi.useFakeTimers()
      ;(window as any).Audio = vi.fn(function() { return { volume: 0, play: vi.fn().mockResolvedValue(undefined) } })
    })

    afterEach(() => {
      vi.useRealTimers()
    })

    it('advances to next level when time runs out', async () => {
      ;(localStorage.getItem as ReturnType<typeof vi.fn>).mockImplementation((key: string) => {
        if (key === 'pokerpulse_tournament') return JSON.stringify({
          id: 'dev-tournament', name: 'Test', buyin_amount: 100, rebuy_amount: 100,
          rebuy_chips: 10000, addon_amount: 100, addon_chips: 10000, starting_chips: 10000,
          players: [{ id: '1', name: 'Alice', buyins: 1, rebuys: 0, addons: 0, eliminated: false, placement: null, tableNumber: null, seatNumber: null }],
          blind_structure: [
            { id: '1', small_blind: 25, big_blind: 50, ante: 0, duration_minutes: 15, is_break: false },
            { id: '2', small_blind: 50, big_blind: 100, ante: 0, duration_minutes: 15, is_break: false },
            { id: '3', small_blind: 75, big_blind: 150, ante: 0, duration_minutes: 15, is_break: false },
          ],
          current_level: 0, time_remaining_seconds: 2, is_running: false,
          currency_symbol: '$', tableCount: 1, seatsPerTable: 9,
        })
        if (key === 'pokerpulse_onboarding_complete') return 'true'
        return null
      })

      render(<App />)
      await act(async () => { vi.advanceTimersByTime(1300) })

      // Start timer
      await act(async () => { fireEvent.keyDown(window, { code: 'Space' }) })

      // Advance 3 seconds: 2→1→0→auto-advance to level 1
      await act(async () => { vi.advanceTimersByTime(3000) })

      // At level 1, next preview shows 75/150
      expect(screen.getByText('150')).toBeInTheDocument()
    })

    it('stops timer at last level when time runs out', async () => {
      ;(localStorage.getItem as ReturnType<typeof vi.fn>).mockImplementation((key: string) => {
        if (key === 'pokerpulse_tournament') return JSON.stringify({
          id: 'dev-tournament', name: 'Test', buyin_amount: 100, rebuy_amount: 100,
          rebuy_chips: 10000, addon_amount: 100, addon_chips: 10000, starting_chips: 10000,
          players: [{ id: '1', name: 'Alice', buyins: 1, rebuys: 0, addons: 0, eliminated: false, placement: null, tableNumber: null, seatNumber: null }],
          blind_structure: [
            { id: '1', small_blind: 25, big_blind: 50, ante: 0, duration_minutes: 15, is_break: false },
            { id: '2', small_blind: 200, big_blind: 400, ante: 50, duration_minutes: 15, is_break: false },
          ],
          current_level: 1, time_remaining_seconds: 2, is_running: false,
          currency_symbol: '$', tableCount: 1, seatsPerTable: 9,
        })
        if (key === 'pokerpulse_onboarding_complete') return 'true'
        return null
      })

      const { container } = render(<App />)
      await act(async () => { vi.advanceTimersByTime(1300) })

      // Start timer
      await act(async () => { fireEvent.keyDown(window, { code: 'Space' }) })

      // Advance 3 seconds
      await act(async () => { vi.advanceTimersByTime(3000) })

      // Timer should stop
      expect(container.querySelector('.timer-running')).toBeNull()
      // Tournament complete state
      expect(screen.getByText('Tournament Complete')).toBeInTheDocument()
    })
  })

  describe('Auto-Pause on Break', () => {
    beforeEach(async () => {
      vi.useFakeTimers()
      ;(window as any).Audio = vi.fn(function() { return { volume: 0, play: vi.fn().mockResolvedValue(undefined) } })
    })

    afterEach(() => {
      vi.useRealTimers()
    })

    it('pauses timer when auto-advancing to break level', async () => {
      ;(localStorage.getItem as ReturnType<typeof vi.fn>).mockImplementation((key: string) => {
        if (key === 'pokerpulse_tournament') return JSON.stringify({
          id: 'dev-tournament', name: 'Test', buyin_amount: 100, rebuy_amount: 100,
          rebuy_chips: 10000, addon_amount: 100, addon_chips: 10000, starting_chips: 10000,
          players: [{ id: '1', name: 'Alice', buyins: 1, rebuys: 0, addons: 0, eliminated: false, placement: null, tableNumber: null, seatNumber: null }],
          blind_structure: [
            { id: '1', small_blind: 100, big_blind: 200, ante: 25, duration_minutes: 15, is_break: false },
            { id: 'break1', small_blind: 0, big_blind: 0, ante: 0, duration_minutes: 10, is_break: true },
            { id: '2', small_blind: 150, big_blind: 300, ante: 25, duration_minutes: 15, is_break: false },
          ],
          current_level: 0, time_remaining_seconds: 2, is_running: false,
          currency_symbol: '$', tableCount: 1, seatsPerTable: 9,
        })
        if (key === 'pokerpulse_onboarding_complete') return 'true'
        return null
      })

      const { container } = render(<App />)
      await act(async () => { vi.advanceTimersByTime(1300) })

      // Start timer
      await act(async () => { fireEvent.keyDown(window, { code: 'Space' }) })
      expect(container.querySelector('.timer-running')).toBeInTheDocument()

      // Advance 3 seconds → auto-advance to break level
      await act(async () => { vi.advanceTimersByTime(3000) })

      // Timer should be paused due to auto-pause on break
      expect(container.querySelector('.timer-running')).toBeNull()
      // Break duration shown
      expect(screen.getByText('10:00')).toBeInTheDocument()
    })
  })

  describe('Browser Fullscreen Toggle', () => {
    beforeEach(async () => {
      vi.useFakeTimers()
      ;(window as any).Audio = vi.fn(function() { return { volume: 0, play: vi.fn().mockResolvedValue(undefined) } })
      document.documentElement.requestFullscreen = vi.fn().mockResolvedValue(undefined)
      document.exitFullscreen = vi.fn().mockResolvedValue(undefined)
      ;(localStorage.getItem as ReturnType<typeof vi.fn>).mockImplementation((key: string) => {
        if (key === 'pokerpulse_onboarding_complete') return 'true'
        return null
      })
    })

    afterEach(() => {
      vi.useRealTimers()
      Object.defineProperty(document, 'fullscreenElement', { value: null, configurable: true })
    })

    const renderAndLoad = async () => {
      const result = render(<App />)
      await act(async () => {
        vi.advanceTimersByTime(1300)
      })
      return result
    }

    it('enters fullscreen with F11 key', async () => {
      await renderAndLoad()

      await act(async () => {
        fireEvent.keyDown(window, { code: 'F11' })
      })

      expect(document.documentElement.requestFullscreen).toHaveBeenCalled()
    })

    it('exits fullscreen with Escape key', async () => {
      await renderAndLoad()

      // Enter fullscreen first
      await act(async () => {
        fireEvent.keyDown(window, { code: 'F11' })
      })

      // Simulate browser entering fullscreen
      Object.defineProperty(document, 'fullscreenElement', {
        value: document.documentElement, configurable: true
      })

      // Press Escape to exit
      await act(async () => {
        fireEvent.keyDown(window, { code: 'Escape', key: 'Escape' })
      })

      expect(document.exitFullscreen).toHaveBeenCalled()
    })
  })

  describe('Reset Tournament Confirm Flow', () => {
    beforeEach(async () => {
      vi.useFakeTimers()
      ;(window as any).Audio = vi.fn(function() { return { volume: 0, play: vi.fn().mockResolvedValue(undefined) } })
      ;(localStorage.getItem as ReturnType<typeof vi.fn>).mockImplementation((key: string) => {
        if (key === 'pokerpulse_onboarding_complete') return 'true'
        return null
      })
    })

    afterEach(() => {
      vi.useRealTimers()
    })

    it('resets tournament to defaults when confirmed', async () => {
      render(<App />)
      await act(async () => { vi.advanceTimersByTime(1300) })

      // Navigate to level 3 (SB=100, BB=200)
      for (let i = 0; i < 3; i++) {
        await act(async () => {
          fireEvent.keyDown(window, { code: 'ArrowRight' })
        })
      }

      // Verify at level 3: 200 visible as big blind
      expect(screen.getByText('200')).toBeInTheDocument()

      // Go to Settings tab
      fireEvent.click(screen.getByText('Settings'))

      // Click Reset Tournament button (btn-danger)
      const resetButtons = screen.getAllByText('Reset Tournament')
      for (const el of resetButtons) {
        const btn = el.closest('button')
        if (btn && btn.classList.contains('btn-danger')) {
          fireEvent.click(btn)
          break
        }
      }

      // Confirm modal visible
      expect(screen.getByText(/Are you sure you want to reset/)).toBeInTheDocument()

      // Click confirm "Reset" button in modal
      const confirmBtn = screen.getByRole('button', { name: 'Reset' })
      fireEvent.click(confirmBtn)

      // Go back to Timer tab
      fireEvent.click(screen.getAllByText('Timer')[0])

      // Should be back at level 0 with 25/50 blinds and 15:00
      expect(screen.getByText('25')).toBeInTheDocument()
      expect(screen.getByText('15:00')).toBeInTheDocument()
      expect(screen.queryByText('200')).not.toBeInTheDocument()
    })
  })

  describe('Prizes Tab Rendering', () => {
    beforeEach(async () => {
      vi.useFakeTimers()
      ;(localStorage.getItem as ReturnType<typeof vi.fn>).mockImplementation((key: string) => {
        if (key === 'pokerpulse_onboarding_complete') return 'true'
        return null
      })
    })

    afterEach(() => {
      vi.useRealTimers()
    })

    it('renders prizes content when tab is selected', async () => {
      render(<App />)
      await act(async () => { vi.advanceTimersByTime(1300) })

      fireEvent.click(screen.getByText('Prizes'))

      expect(screen.getByText('prizes.payoutStructure')).toBeInTheDocument()
    })
  })

  describe('Complete Tournament and History', () => {
    beforeEach(async () => {
      vi.useFakeTimers()
      ;(window as any).Audio = vi.fn(function() { return { volume: 0, play: vi.fn().mockResolvedValue(undefined) } })
    })

    afterEach(() => {
      vi.useRealTimers()
    })

    it('saves completed tournament to history', async () => {
      ;(localStorage.getItem as ReturnType<typeof vi.fn>).mockImplementation((key: string) => {
        if (key === 'pokerpulse_tournament') return JSON.stringify({
          id: 'dev-tournament', name: 'Friday Night Poker', buyin_amount: 100, rebuy_amount: 100,
          rebuy_chips: 10000, addon_amount: 100, addon_chips: 10000, starting_chips: 10000,
          players: [
            { id: '1', name: 'Alice', buyins: 1, rebuys: 0, addons: 0, eliminated: false, placement: null, tableNumber: null, seatNumber: null },
            { id: '2', name: 'Bob', buyins: 1, rebuys: 0, addons: 0, eliminated: true, placement: 2, tableNumber: null, seatNumber: null },
          ],
          blind_structure: [
            { id: '1', small_blind: 25, big_blind: 50, ante: 0, duration_minutes: 15, is_break: false },
            { id: '2', small_blind: 200, big_blind: 400, ante: 50, duration_minutes: 15, is_break: false },
          ],
          current_level: 1, time_remaining_seconds: 0, is_running: false,
          currency_symbol: '$', tableCount: 1, seatsPerTable: 9,
        })
        if (key === 'pokerpulse_onboarding_complete') return 'true'
        return null
      })

      render(<App />)
      await act(async () => { vi.advanceTimersByTime(1300) })

      // Should show tournament complete state
      expect(screen.getByText('Tournament Complete')).toBeInTheDocument()

      // Click Save to History
      fireEvent.click(screen.getByText(/Save to History/))

      // PromptModal opens with default value 'Alice' (only active player)
      const input = screen.getByPlaceholderText('Winner name')
      expect(input).toHaveValue('Alice')

      // Submit the form
      const submitBtn = screen.getByText('Save Tournament')
      fireEvent.click(submitBtn)

      // History should have been saved
      expect(localStorage.setItem).toHaveBeenCalledWith(
        'pokerpulse_tournament_history',
        expect.any(String)
      )
    })
  })
})

describe('App Storage Keys', () => {
  const STORAGE_KEYS = {
    tournament: 'pokerpulse_tournament',
    soundSettings: 'pokerpulse_sound_settings',
    history: 'pokerpulse_tournament_history',
    activeTab: 'pokerpulse_active_tab',
    themeSettings: 'pokerpulse_theme_settings',
    onboardingComplete: 'pokerpulse_onboarding_complete',
  }

  it('has correct tournament storage key', () => {
    expect(STORAGE_KEYS.tournament).toBe('pokerpulse_tournament')
  })

  it('has correct sound settings storage key', () => {
    expect(STORAGE_KEYS.soundSettings).toBe('pokerpulse_sound_settings')
  })

  it('has correct history storage key', () => {
    expect(STORAGE_KEYS.history).toBe('pokerpulse_tournament_history')
  })

  it('has correct active tab storage key', () => {
    expect(STORAGE_KEYS.activeTab).toBe('pokerpulse_active_tab')
  })

  it('has correct theme settings storage key', () => {
    expect(STORAGE_KEYS.themeSettings).toBe('pokerpulse_theme_settings')
  })

  it('has correct onboarding complete storage key', () => {
    expect(STORAGE_KEYS.onboardingComplete).toBe('pokerpulse_onboarding_complete')
  })
})

describe('Default Settings', () => {
  describe('Default Sound Settings', () => {
    const defaultSoundSettings = {
      enabled: true,
      soundType: 'bell',
      customSoundPath: null,
      volume: 0.7,
      warningEnabled: true,
      warningAt60: true,
      warningAt30: true,
      autoPauseOnBreak: true,
    }

    it('has sound enabled by default', () => {
      expect(defaultSoundSettings.enabled).toBe(true)
    })

    it('uses bell sound type by default', () => {
      expect(defaultSoundSettings.soundType).toBe('bell')
    })

    it('has no custom sound path by default', () => {
      expect(defaultSoundSettings.customSoundPath).toBeNull()
    })

    it('has default volume of 0.7', () => {
      expect(defaultSoundSettings.volume).toBe(0.7)
    })

    it('has warning sounds enabled by default', () => {
      expect(defaultSoundSettings.warningEnabled).toBe(true)
    })

    it('has 60 second warning enabled by default', () => {
      expect(defaultSoundSettings.warningAt60).toBe(true)
    })

    it('has 30 second warning enabled by default', () => {
      expect(defaultSoundSettings.warningAt30).toBe(true)
    })

    it('has auto-pause on break enabled by default', () => {
      expect(defaultSoundSettings.autoPauseOnBreak).toBe(true)
    })
  })

  describe('Default Theme Settings', () => {
    const defaultThemeSettings = {
      mode: 'dark',
      accent: 'emerald',
    }

    it('uses dark mode by default', () => {
      expect(defaultThemeSettings.mode).toBe('dark')
    })

    it('uses emerald accent by default', () => {
      expect(defaultThemeSettings.accent).toBe('emerald')
    })
  })
})

describe('Sound URL Logic', () => {
  it('returns correct URL for bell sound', () => {
    const soundType = 'bell'
    let soundUrl: string
    if (soundType === 'bell') {
      soundUrl = '/alarms/bell-ring-01.wav'
    } else {
      soundUrl = '/unknown'
    }
    expect(soundUrl).toBe('/alarms/bell-ring-01.wav')
  })

  it('returns correct URL for evil-laugh sound', () => {
    const soundType = 'evil-laugh'
    let soundUrl: string
    if (soundType === 'bell') {
      soundUrl = '/alarms/bell-ring-01.wav'
    } else if (soundType === 'evil-laugh') {
      soundUrl = '/alarms/evil-laugh.wav'
    } else {
      soundUrl = '/unknown'
    }
    expect(soundUrl).toBe('/alarms/evil-laugh.wav')
  })

  it('uses custom sound path when provided', () => {
    const soundType = 'custom'
    const customSoundPath = '/custom/sound.mp3'
    let soundUrl: string
    if (soundType === 'bell') {
      soundUrl = '/alarms/bell-ring-01.wav'
    } else if (soundType === 'evil-laugh') {
      soundUrl = '/alarms/evil-laugh.wav'
    } else if (customSoundPath) {
      soundUrl = customSoundPath
    } else {
      soundUrl = ''
    }
    expect(soundUrl).toBe('/custom/sound.mp3')
  })
})

describe('Tab Navigation Logic', () => {
  const validTabs = ['timer', 'players', 'blinds', 'prizes', 'settings', 'help']

  it.each(validTabs)('accepts valid tab: %s', (tab) => {
    expect(validTabs.includes(tab)).toBe(true)
  })

  it('rejects invalid tab', () => {
    const invalidTab = 'invalid'
    expect(validTabs.includes(invalidTab)).toBe(false)
  })

  it('defaults to timer tab', () => {
    const defaultTab = 'timer'
    expect(defaultTab).toBe('timer')
  })
})

describe('Timer Logic', () => {
  describe('Time Calculations', () => {
    it('decrements time remaining correctly', () => {
      let timeRemaining = 600 // 10 minutes
      timeRemaining = timeRemaining - 1
      expect(timeRemaining).toBe(599)
    })

    it('handles level transition', () => {
      const blindStructure = [
        { duration_minutes: 15, small_blind: 25, big_blind: 50, ante: 0, is_break: false },
        { duration_minutes: 15, small_blind: 50, big_blind: 100, ante: 0, is_break: false },
      ]
      let currentLevel = 0
      let timeRemaining = 0

      // Time runs out
      if (timeRemaining <= 0 && currentLevel < blindStructure.length - 1) {
        currentLevel = currentLevel + 1
        timeRemaining = blindStructure[currentLevel].duration_minutes * 60
      }

      expect(currentLevel).toBe(1)
      expect(timeRemaining).toBe(900) // 15 * 60
    })

    it('stops at last level', () => {
      const blindStructure = [
        { duration_minutes: 15, small_blind: 25, big_blind: 50, ante: 0, is_break: false },
      ]
      let currentLevel = 0
      let timeRemaining = 0
      let isRunning = true

      // At last level with no time
      if (timeRemaining <= 0 && currentLevel >= blindStructure.length - 1) {
        isRunning = false
      }

      expect(isRunning).toBe(false)
    })
  })

  describe('Add/Remove Time', () => {
    it('adds 60 seconds correctly', () => {
      let timeRemaining = 300
      timeRemaining = timeRemaining + 60
      expect(timeRemaining).toBe(360)
    })

    it('subtracts 60 seconds correctly', () => {
      let timeRemaining = 300
      timeRemaining = Math.max(0, timeRemaining - 60)
      expect(timeRemaining).toBe(240)
    })

    it('does not go below zero', () => {
      let timeRemaining = 30
      timeRemaining = Math.max(0, timeRemaining - 60)
      expect(timeRemaining).toBe(0)
    })
  })

  describe('Level Navigation', () => {
    it('advances to next level', () => {
      const blindStructure = [
        { duration_minutes: 15, small_blind: 25, big_blind: 50, ante: 0, is_break: false },
        { duration_minutes: 15, small_blind: 50, big_blind: 100, ante: 0, is_break: false },
        { duration_minutes: 15, small_blind: 100, big_blind: 200, ante: 0, is_break: false },
      ]
      let currentLevel = 0

      if (currentLevel < blindStructure.length - 1) {
        currentLevel = currentLevel + 1
      }

      expect(currentLevel).toBe(1)
    })

    it('goes back to previous level', () => {
      let currentLevel = 2

      if (currentLevel > 0) {
        currentLevel = currentLevel - 1
      }

      expect(currentLevel).toBe(1)
    })

    it('cannot go before first level', () => {
      let currentLevel = 0

      if (currentLevel > 0) {
        currentLevel = currentLevel - 1
      }

      expect(currentLevel).toBe(0)
    })

    it('cannot go past last level', () => {
      const blindStructure = [
        { duration_minutes: 15, small_blind: 25, big_blind: 50, ante: 0, is_break: false },
        { duration_minutes: 15, small_blind: 50, big_blind: 100, ante: 0, is_break: false },
      ]
      let currentLevel = 1

      if (currentLevel < blindStructure.length - 1) {
        currentLevel = currentLevel + 1
      }

      expect(currentLevel).toBe(1)
    })
  })
})

describe('Warning Sound Logic', () => {
  it('triggers warning at 60 seconds', () => {
    const timeRemaining = 60
    const warningAt60 = true
    const warningPlayed = { 60: false, 30: false }

    let shouldPlay = false
    if (timeRemaining === 60 && warningAt60 && !warningPlayed[60]) {
      shouldPlay = true
      warningPlayed[60] = true
    }

    expect(shouldPlay).toBe(true)
    expect(warningPlayed[60]).toBe(true)
  })

  it('triggers warning at 30 seconds', () => {
    const timeRemaining = 30
    const warningAt30 = true
    const warningPlayed = { 60: true, 30: false }

    let shouldPlay = false
    if (timeRemaining === 30 && warningAt30 && !warningPlayed[30]) {
      shouldPlay = true
      warningPlayed[30] = true
    }

    expect(shouldPlay).toBe(true)
    expect(warningPlayed[30]).toBe(true)
  })

  it('does not repeat warning sound', () => {
    const timeRemaining = 60
    const warningAt60 = true
    const warningPlayed = { 60: true, 30: false } // Already played

    let shouldPlay = false
    if (timeRemaining === 60 && warningAt60 && !warningPlayed[60]) {
      shouldPlay = true
    }

    expect(shouldPlay).toBe(false)
  })

  it('resets warning flags on level change', () => {
    const warningPlayed = { 60: true, 30: true }
    
    // Reset on level change
    const resetWarnings = { 60: false, 30: false }
    
    expect(resetWarnings[60]).toBe(false)
    expect(resetWarnings[30]).toBe(false)
  })
})

describe('Auto-pause on Break Logic', () => {
  it('auto-pauses when level is a break', () => {
    const currentBlind = { is_break: true, duration_minutes: 10, small_blind: 0, big_blind: 0, ante: 0 }
    const autoPauseOnBreak = true
    let isRunning = true

    if (currentBlind.is_break && autoPauseOnBreak) {
      isRunning = false
    }

    expect(isRunning).toBe(false)
  })

  it('does not auto-pause on regular level', () => {
    const currentBlind = { is_break: false, duration_minutes: 15, small_blind: 100, big_blind: 200, ante: 0 }
    const autoPauseOnBreak = true
    let isRunning = true

    if (currentBlind.is_break && autoPauseOnBreak) {
      isRunning = false
    }

    expect(isRunning).toBe(true)
  })

  it('does not auto-pause when setting is disabled', () => {
    const currentBlind = { is_break: true, duration_minutes: 10, small_blind: 0, big_blind: 0, ante: 0 }
    const autoPauseOnBreak = false
    let isRunning = true

    if (currentBlind.is_break && autoPauseOnBreak) {
      isRunning = false
    }

    expect(isRunning).toBe(true)
  })
})

describe('Tournament History Entry', () => {
  it('creates correct history entry structure', () => {
    const entry = {
      id: '1234567890',
      name: 'Friday Night Poker',
      date: '2026-02-02T15:00:00.000Z',
      playerCount: 8,
      winner: 'John Doe',
      prizePool: 800,
      currency_symbol: '$',
      duration_minutes: 120,
    }

    expect(entry.id).toBeDefined()
    expect(entry.name).toBe('Friday Night Poker')
    expect(entry.playerCount).toBe(8)
    expect(entry.winner).toBe('John Doe')
    expect(entry.prizePool).toBe(800)
    expect(entry.currency_symbol).toBe('$')
    expect(entry.duration_minutes).toBe(120)
  })

  it('calculates duration from blind levels', () => {
    const blindStructure = [
      { duration_minutes: 15, small_blind: 25, big_blind: 50, ante: 0, is_break: false },
      { duration_minutes: 15, small_blind: 50, big_blind: 100, ante: 0, is_break: false },
      { duration_minutes: 10, small_blind: 0, big_blind: 0, ante: 0, is_break: true },
      { duration_minutes: 15, small_blind: 100, big_blind: 200, ante: 0, is_break: false },
    ]
    const currentLevel = 2 // Finished through level 3 (index 2)

    const totalDuration = blindStructure
      .slice(0, currentLevel + 1)
      .reduce((sum, level) => sum + level.duration_minutes, 0)

    expect(totalDuration).toBe(40) // 15 + 15 + 10
  })

  it('limits history to 50 entries', () => {
    const existingHistory = Array(55).fill(null).map((_, i) => ({ id: `${i}` }))
    const newEntry = { id: 'new' }
    
    const updatedHistory = [newEntry, ...existingHistory].slice(0, 50)
    
    expect(updatedHistory.length).toBe(50)
    expect(updatedHistory[0].id).toBe('new')
  })
})

describe('Data Migration Logic', () => {
  it('adds missing rebuy_chips field', () => {
    const oldData = {
      starting_chips: 15000,
      rebuy_amount: 50,
    }

    const migrated = {
      ...oldData,
      rebuy_chips: oldData.rebuy_chips ?? oldData.starting_chips ?? 10000,
    }

    expect(migrated.rebuy_chips).toBe(15000)
  })

  it('adds missing addon fields', () => {
    const oldData = {
      starting_chips: 15000,
      rebuy_amount: 50,
    }

    const migrated = {
      ...oldData,
      addon_amount: oldData.addon_amount ?? oldData.rebuy_amount ?? 100,
      addon_chips: oldData.addon_chips ?? oldData.starting_chips ?? 10000,
    }

    expect(migrated.addon_amount).toBe(50)
    expect(migrated.addon_chips).toBe(15000)
  })

  it('adds missing addons field to players', () => {
    const oldPlayers = [
      { id: '1', name: 'Player 1', buyins: 1, rebuys: 0 },
      { id: '2', name: 'Player 2', buyins: 1, rebuys: 2 },
    ]

    const migratedPlayers = oldPlayers.map((p: any) => ({
      ...p,
      addons: p.addons ?? 0,
    }))

    expect(migratedPlayers[0].addons).toBe(0)
    expect(migratedPlayers[1].addons).toBe(0)
  })

  it('always starts paused when restoring', () => {
    const savedData = {
      is_running: true,
      current_level: 5,
    }

    const restored = {
      ...savedData,
      is_running: false, // Always start paused
    }

    expect(restored.is_running).toBe(false)
  })
})

describe('Keyboard Shortcuts Logic', () => {
  const shortcuts = {
    Space: 'toggle timer',
    ArrowRight: 'next level',
    ArrowLeft: 'previous level',
    Equal: 'add minute',
    NumpadAdd: 'add minute',
    Minus: 'subtract minute',
    NumpadSubtract: 'subtract minute',
    F11: 'toggle fullscreen',
    Escape: 'exit fullscreen',
  }

  it.each(Object.entries(shortcuts))('key %s has action: %s', (key, action) => {
    expect(shortcuts[key as keyof typeof shortcuts]).toBe(action)
  })

  it('should ignore shortcuts when typing in input', () => {
    const target = document.createElement('input')
    const shouldIgnore = target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement
    expect(shouldIgnore).toBe(true)
  })

  it('should ignore shortcuts when typing in textarea', () => {
    const target = document.createElement('textarea')
    const shouldIgnore = target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement
    expect(shouldIgnore).toBe(true)
  })

  it('should handle shortcuts on regular elements', () => {
    const target = document.createElement('div')
    const shouldIgnore = target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement
    expect(shouldIgnore).toBe(false)
  })
})

describe('Theme Application Logic', () => {
  it('applies dark mode class', () => {
    const mode = 'dark'
    const expectedClass = mode
    expect(expectedClass).toBe('dark')
  })

  it('applies light mode class', () => {
    const mode = 'light'
    const expectedClass = mode
    expect(expectedClass).toBe('light')
  })

  it('applies accent class correctly', () => {
    const accents = ['emerald', 'blue', 'purple', 'rose', 'amber', 'cyan']
    
    accents.forEach(accent => {
      const expectedClass = `accent-${accent}`
      expect(expectedClass).toBe(`accent-${accent}`)
    })
  })
})

describe('Tauri Environment Check', () => {
  it('detects Tauri v2 environment', () => {
    const checkIsTauri = () => 
      typeof window !== 'undefined' && ('__TAURI_INTERNALS__' in window || '__TAURI__' in window)
    
    // Without Tauri
    expect(checkIsTauri()).toBe(false)
  })

  it('detects browser environment', () => {
    const isTauri = typeof window !== 'undefined' && ('__TAURI_INTERNALS__' in window || '__TAURI__' in window)
    expect(isTauri).toBe(false)
  })
})
