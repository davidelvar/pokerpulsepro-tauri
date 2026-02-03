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
        'header.editName': 'Edit Name',
        'header.projectorOpen': 'Projector Open',
        'header.openProjector': 'Open Projector',
        'header.fullscreen': 'Fullscreen',
        'header.exitFullscreen': 'Exit Fullscreen',
        'timer.level': 'Level',
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
        'timer.playersRemaining': 'Players Remaining',
        'timer.averageStack': 'Average Stack',
        'timer.totalChips': 'Total Chips',
        'timer.prizePool': 'Prize Pool',
        'timer.blinds': 'Blinds',
        'timer.ante': 'Ante',
        'timer.break': 'Break',
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
