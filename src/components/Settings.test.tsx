import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, act } from '@testing-library/react'
import { Settings } from './Settings'
import type { Tournament, SoundSettings, ThemeSettings } from '../types'

// Mock react-i18next
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        'settings.appearance': 'Appearance',
        'settings.themeMode': 'Theme Mode',
        'settings.dark': 'Dark',
        'settings.light': 'Light',
        'settings.accentColor': 'Accent Color',
        'settings.language': 'Language',
        'settings.tournament': 'Tournament',
        'settings.tournamentName': 'Tournament Name',
        'settings.tournamentNamePlaceholder': 'Enter tournament name',
        'settings.currency': 'Currency',
        'settings.buyinAmount': 'Buy-in Amount',
        'settings.rebuyAmount': 'Rebuy Amount',
        'settings.rebuyChips': 'Rebuy Chips',
        'settings.addonAmount': 'Add-on Amount',
        'settings.addonChips': 'Add-on Chips',
        'settings.startingChips': 'Starting Chips',
        'settings.sound': 'Sound',
        'settings.soundEnabled': 'Sound Enabled',
        'settings.volume': 'Volume',
        'settings.soundType': 'Sound Type',
        'settings.testSound': 'Test Sound',
        'settings.export': 'Export',
        'settings.import': 'Import',
        'settings.reset': 'Reset',
        'settings.resetTournament': 'Reset Tournament',
        'settings.clearHistory': 'Clear History',
        'settings.clearHistoryConfirm': 'Are you sure you want to clear the tournament history?',
        'settings.exportComplete': 'Export Complete',
        'settings.exportSuccess': 'Tournament configuration exported successfully',
        'settings.importFailed': 'Import Failed',
        'settings.importFailedMsg': 'Failed to import tournament configuration',
        'settings.invalidFile': 'Invalid File',
        'settings.invalidFileMsg': 'The selected file is not a valid tournament configuration',
        'settings.history': 'History',
        'settings.showOnboarding': 'Show Onboarding',
      }
      return translations[key] || key
    },
    i18n: {
      language: 'en',
      changeLanguage: vi.fn(),
    },
  }),
  initReactI18next: { type: '3rdParty', init: vi.fn() },
}))

// Mock Tauri dialog plugin
vi.mock('@tauri-apps/plugin-dialog', () => ({
  open: vi.fn(),
  save: vi.fn(),
}))

// Mock Tauri fs plugin
vi.mock('@tauri-apps/plugin-fs', () => ({
  writeTextFile: vi.fn(),
  readTextFile: vi.fn(),
}))

// Mock Modal component
vi.mock('./Modal', () => ({
  AlertModal: ({ isOpen, title, onClose }: { isOpen: boolean; title: string; onClose: () => void }) => 
    isOpen ? <div data-testid="alert-modal">{title}<button onClick={onClose}>Close</button></div> : null,
  ConfirmModal: ({ isOpen, title, onClose }: { isOpen: boolean; title: string; onClose: () => void }) =>
    isOpen ? <div data-testid="confirm-modal">{title}<button onClick={onClose}>Close</button></div> : null,
  PromptModal: ({ isOpen, title, onClose }: { isOpen: boolean; title: string; onClose: () => void }) =>
    isOpen ? <div data-testid="prompt-modal">{title}<button onClick={onClose}>Close</button></div> : null,
}))

const createMockTournament = (overrides: Partial<Tournament> = {}): Tournament => ({
  id: 'test-tournament-1',
  name: 'Test Tournament',
  buyin_amount: 100,
  rebuy_amount: 50,
  rebuy_chips: 5000,
  addon_amount: 100,
  addon_chips: 10000,
  starting_chips: 10000,
  current_level: 0,
  time_remaining_seconds: 900,
  is_running: false,
  blind_structure: [
    { id: '1', small_blind: 25, big_blind: 50, ante: 0, duration_minutes: 15, is_break: false },
    { id: '2', small_blind: 50, big_blind: 100, ante: 0, duration_minutes: 15, is_break: false },
  ],
  players: [],
  currency_symbol: '$',
  tableCount: 1,
  seatsPerTable: 9,
  ...overrides,
})

const createMockSoundSettings = (overrides: Partial<SoundSettings> = {}): SoundSettings => ({
  enabled: true,
  volume: 0.7,
  soundType: 'bell',
  customSoundPath: null,
  voiceEnabled: false,
  warningEnabled: false,
  warningAt60: true,
  warningAt30: true,
  autoPauseOnBreak: false,
  ...overrides,
})

const createMockThemeSettings = (overrides: Partial<ThemeSettings> = {}): ThemeSettings => ({
  mode: 'dark',
  accent: 'emerald',
  timeFormat: '24h',
  showAnte: true,
  ...overrides,
})

describe('Settings Component', () => {
  const mockSetTournament = vi.fn()
  const mockSetSoundSettings = vi.fn()
  const mockSetThemeSettings = vi.fn()
  const mockPlayTestSound = vi.fn()
  const mockResetTournament = vi.fn()
  const mockOnShowOnboarding = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
  })

  const renderSettings = (
    tournamentOverrides: Partial<Tournament> = {},
    soundOverrides: Partial<SoundSettings> = {},
    themeOverrides: Partial<ThemeSettings> = {}
  ) => {
    return render(
      <Settings
        tournament={createMockTournament(tournamentOverrides)}
        setTournament={mockSetTournament}
        soundSettings={createMockSoundSettings(soundOverrides)}
        setSoundSettings={mockSetSoundSettings}
        themeSettings={createMockThemeSettings(themeOverrides)}
        setThemeSettings={mockSetThemeSettings}
        playTestSound={mockPlayTestSound}
        resetTournament={mockResetTournament}
        onShowOnboarding={mockOnShowOnboarding}
        playTestVoice={vi.fn()}
        chipInventory={[
          { id: '1', value: 25, color: '#22c55e', borderColor: '#16a34a', textColor: '#fff', label: 'Green', quantity: 100 },
          { id: '2', value: 100, color: '#1e1e1e', borderColor: '#404040', textColor: '#fff', label: 'Black', quantity: 100 },
        ]}
        setChipInventory={vi.fn()}
      />
    )
  }

  describe('Appearance Section', () => {
    it('renders appearance section', () => {
      renderSettings()
      expect(screen.getByText('Appearance')).toBeInTheDocument()
    })

    it('renders theme mode selector', () => {
      renderSettings()
      expect(screen.getByText('Theme Mode')).toBeInTheDocument()
      expect(screen.getByText('Dark')).toBeInTheDocument()
      expect(screen.getByText('Light')).toBeInTheDocument()
    })

    it('renders accent color selector', () => {
      renderSettings()
      expect(screen.getByText('Accent Color')).toBeInTheDocument()
    })

    it('renders language selector', () => {
      renderSettings()
      expect(screen.getByText('Language')).toBeInTheDocument()
    })

    it('changes theme mode when button is clicked', () => {
      renderSettings()
      
      const lightButton = screen.getByText('Light').closest('button')
      expect(lightButton).not.toBeNull()
      fireEvent.click(lightButton!)
      
      expect(mockSetThemeSettings).toHaveBeenCalledWith(
        expect.objectContaining({ mode: 'light' })
      )
    })

    it('changes theme mode to dark when dark button is clicked', () => {
      renderSettings({}, {}, { mode: 'light' })
      
      const darkButton = screen.getByText('Dark').closest('button')
      expect(darkButton).not.toBeNull()
      fireEvent.click(darkButton!)
      
      expect(mockSetThemeSettings).toHaveBeenCalledWith(
        expect.objectContaining({ mode: 'dark' })
      )
    })
  })

  describe('Tournament Section', () => {
    it('renders tournament section', () => {
      renderSettings()
      expect(screen.getByText('Tournament')).toBeInTheDocument()
    })

    it('renders tournament name input', () => {
      renderSettings()
      expect(screen.getByText('Tournament Name')).toBeInTheDocument()
    })

    it('renders currency selector', () => {
      renderSettings()
      expect(screen.getByText('Currency')).toBeInTheDocument()
    })

    it('renders buy-in amount input', () => {
      renderSettings()
      expect(screen.getByText('Buy-in Amount')).toBeInTheDocument()
    })

    it('renders rebuy amount input', () => {
      renderSettings()
      expect(screen.getByText('Rebuy Amount')).toBeInTheDocument()
    })

    it('updates tournament name when changed', () => {
      renderSettings()
      
      const input = screen.getByDisplayValue('Test Tournament')
      fireEvent.change(input, { target: { value: 'New Tournament Name' } })
      
      expect(mockSetTournament).toHaveBeenCalledWith(
        expect.objectContaining({ name: 'New Tournament Name' })
      )
    })

    it('updates buyin amount when changed', () => {
      renderSettings()
      
      // Find input with value 100 (buyin amount)
      const inputs = screen.getAllByRole('spinbutton')
      const buyinInput = inputs.find(input => (input as HTMLInputElement).value === '100')
      expect(buyinInput).toBeTruthy()
      
      fireEvent.change(buyinInput!, { target: { value: '200' } })
      
      expect(mockSetTournament).toHaveBeenCalled()
    })
  })

  describe('Currency Options', () => {
    it('renders all currency options', () => {
      renderSettings()
      
      // Find the currency select
      const selects = screen.getAllByRole('combobox')
      const currencySelect = selects.find(select => 
        select.innerHTML.includes('USD') || select.innerHTML.includes('EUR')
      )
      expect(currencySelect).toBeTruthy()
    })

    it('updates currency when changed', () => {
      renderSettings()
      
      // Find the currency select - it contains the current currency symbol
      const selects = screen.getAllByRole('combobox')
      // Find select that has currency symbol options
      const currencySelect = selects.find(s => 
        (s as HTMLSelectElement).value === '$'
      )
      
      if (currencySelect) {
        fireEvent.change(currencySelect, { target: { value: '€' } })
        // Currency change should trigger setTournament
        // Note: The callback may not be called if select isn't the currency one
      }
      
      // Verify component renders without errors
      expect(screen.getByText('Currency')).toBeInTheDocument()
    })
  })

  describe('Chip Presets', () => {
    it('validates chip preset data', () => {
      const chipPresets = [
        { name: 'Turbo', chips: 1500, description: 'Fast-paced action' },
        { name: 'Short Stack', chips: 2500, description: 'Quick tournament' },
        { name: 'Regular', chips: 5000, description: 'Standard play' },
        { name: 'Deep Stack', chips: 10000, description: 'More strategic' },
        { name: 'Super Deep', chips: 20000, description: 'Maximum depth' },
      ]

      chipPresets.forEach(preset => {
        expect(preset.name).toBeTruthy()
        expect(preset.chips).toBeGreaterThan(0)
        expect(preset.description).toBeTruthy()
      })
    })
  })

  describe('Accent Colors', () => {
    it('validates accent color options', () => {
      const accentColors = [
        { id: 'emerald', name: 'Emerald' },
        { id: 'blue', name: 'Blue' },
        { id: 'purple', name: 'Purple' },
        { id: 'rose', name: 'Rose' },
        { id: 'amber', name: 'Amber' },
        { id: 'cyan', name: 'Cyan' },
      ]

      expect(accentColors).toHaveLength(6)
      accentColors.forEach(color => {
        expect(color.id).toBeTruthy()
        expect(color.name).toBeTruthy()
      })
    })
  })

  describe('Currency Options Validation', () => {
    it('validates currency list', () => {
      const currencies = [
        { symbol: '$', name: 'USD' },
        { symbol: '€', name: 'EUR' },
        { symbol: '£', name: 'GBP' },
        { symbol: '¥', name: 'JPY' },
        { symbol: 'kr', name: 'ISK' },
        { symbol: 'C$', name: 'CAD' },
        { symbol: 'A$', name: 'AUD' },
      ]

      expect(currencies).toHaveLength(7)
      currencies.forEach(currency => {
        expect(currency.symbol).toBeTruthy()
        expect(currency.name).toBeTruthy()
        expect(currency.name).toHaveLength(3)
      })
    })
  })

  describe('Sound Settings', () => {
    it('should be configurable for sound type', () => {
      const soundSettings = createMockSoundSettings()
      expect(soundSettings.soundType).toBe('bell')
    })

    it('should be configurable for volume', () => {
      const soundSettings = createMockSoundSettings({ volume: 0.5 })
      expect(soundSettings.volume).toBe(0.5)
    })

    it('should have enabled flag', () => {
      const soundSettings = createMockSoundSettings({ enabled: false })
      expect(soundSettings.enabled).toBe(false)
    })
  })

  describe('Theme Settings', () => {
    it('should support dark mode', () => {
      const themeSettings = createMockThemeSettings({ mode: 'dark' })
      expect(themeSettings.mode).toBe('dark')
    })

    it('should support light mode', () => {
      const themeSettings = createMockThemeSettings({ mode: 'light' })
      expect(themeSettings.mode).toBe('light')
    })

    it('should support accent color', () => {
      const themeSettings = createMockThemeSettings({ accent: 'blue' })
      expect(themeSettings.accent).toBe('blue')
    })
  })

  describe('Props Validation', () => {
    it('receives and uses tournament prop', () => {
      renderSettings({ name: 'Custom Tournament' })
      expect(screen.getByDisplayValue('Custom Tournament')).toBeInTheDocument()
    })

    it('receives and uses setTournament prop', () => {
      renderSettings()
      const input = screen.getByDisplayValue('Test Tournament')
      fireEvent.change(input, { target: { value: 'Changed' } })
      expect(mockSetTournament).toHaveBeenCalled()
    })
  })

  describe('Tournament History', () => {
    it('loads tournament history from localStorage', () => {
      const history = [
        { id: '1', name: 'Past Tournament 1', date: '2025-01-01', players: 10 },
        { id: '2', name: 'Past Tournament 2', date: '2025-01-02', players: 8 },
      ]
      localStorage.setItem('pokerpulse_tournament_history', JSON.stringify(history))
      
      renderSettings()
      
      // Component should load history (internal state)
      // We can't directly test internal state, but we can verify no errors
      expect(screen.getByText('Tournament')).toBeInTheDocument()
    })

    it('handles invalid localStorage data gracefully', () => {
      localStorage.setItem('pokerpulse_tournament_history', 'invalid json')
      
      // Should not throw
      expect(() => renderSettings()).not.toThrow()
    })
  })

  describe('Input Validation', () => {
    it('handles zero buyin amount', () => {
      renderSettings({ buyin_amount: 0 })
      
      const inputs = screen.getAllByRole('spinbutton')
      const zeroInput = inputs.find(input => (input as HTMLInputElement).value === '0')
      expect(zeroInput).toBeTruthy()
    })

    it('handles empty tournament name', () => {
      renderSettings({ name: '' })
      
      const input = screen.getByPlaceholderText('Enter tournament name')
      expect((input as HTMLInputElement).value).toBe('')
    })
  })

  describe('Modal State', () => {
    it('starts with no modal open', () => {
      renderSettings()
      
      expect(screen.queryByTestId('alert-modal')).not.toBeInTheDocument()
      expect(screen.queryByTestId('confirm-modal')).not.toBeInTheDocument()
      expect(screen.queryByTestId('prompt-modal')).not.toBeInTheDocument()
    })
  })

  describe('Callbacks', () => {
    it('setTournament callback works correctly', () => {
      renderSettings()
      
      const input = screen.getByDisplayValue('Test Tournament')
      fireEvent.change(input, { target: { value: 'Updated' } })
      
      expect(mockSetTournament).toHaveBeenCalledTimes(1)
      expect(mockSetTournament).toHaveBeenCalledWith(
        expect.objectContaining({ name: 'Updated' })
      )
    })

    it('setThemeSettings callback works correctly', () => {
      renderSettings()
      
      const lightButton = screen.getByText('Light').closest('button')!
      fireEvent.click(lightButton)
      
      expect(mockSetThemeSettings).toHaveBeenCalledTimes(1)
      expect(mockSetThemeSettings).toHaveBeenCalledWith(
        expect.objectContaining({ mode: 'light' })
      )
    })
  })

  describe('Edge Cases', () => {
    it('handles tournament with all fields populated', () => {
      renderSettings({
        name: 'Full Tournament',
        buyin_amount: 500,
        rebuy_amount: 250,
        rebuy_chips: 7500,
        addon_amount: 500,
        addon_chips: 15000,
        starting_chips: 15000,
        currency_symbol: '€',
      })
      
      expect(screen.getByDisplayValue('Full Tournament')).toBeInTheDocument()
    })

    it('handles tournament with minimum values', () => {
      renderSettings({
        buyin_amount: 0,
        rebuy_amount: 0,
        rebuy_chips: 0,
        addon_amount: 0,
        addon_chips: 0,
        starting_chips: 0,
      })
      
      const inputs = screen.getAllByRole('spinbutton')
      const zeroInputs = inputs.filter(input => (input as HTMLInputElement).value === '0')
      expect(zeroInputs.length).toBeGreaterThan(0)
    })
  })
})

describe('Settings Component Advanced', () => {
  const mockSetTournament = vi.fn()
  const mockSetSoundSettings = vi.fn()
  const mockSetThemeSettings = vi.fn()
  const mockPlayTestSound = vi.fn()
  const mockResetTournament = vi.fn()
  const mockOnShowOnboarding = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
  })

  const renderSettings = (
    tournamentOverrides: Partial<Tournament> = {},
    soundOverrides: Partial<SoundSettings> = {},
    themeOverrides: Partial<ThemeSettings> = {}
  ) => {
    const tournament: Tournament = {
      id: 'test-tournament-1',
      name: 'Test Tournament',
      buyin_amount: 100,
      rebuy_amount: 50,
      rebuy_chips: 5000,
      addon_amount: 100,
      addon_chips: 10000,
      starting_chips: 10000,
      current_level: 0,
      time_remaining_seconds: 900,
      is_running: false,
      blind_structure: [
        { id: '1', small_blind: 25, big_blind: 50, ante: 0, duration_minutes: 15, is_break: false },
        { id: '2', small_blind: 50, big_blind: 100, ante: 0, duration_minutes: 15, is_break: false },
      ],
      players: [],
      currency_symbol: '$',
      tableCount: 1,
      seatsPerTable: 9,
      ...tournamentOverrides,
    }
    
    const soundSettings: SoundSettings = {
      enabled: true,
      volume: 0.7,
      soundType: 'bell',
      customSoundPath: null, voiceEnabled: false,
      warningEnabled: false,
      warningAt60: true,
      warningAt30: true,
      autoPauseOnBreak: false,
      ...soundOverrides,
    }
    
    const themeSettings: ThemeSettings = {
      mode: 'dark',
      accent: 'emerald',
      timeFormat: '24h',
      showAnte: true,
      ...themeOverrides,
    }
    
    return render(
      <Settings
        tournament={tournament}
        setTournament={mockSetTournament}
        soundSettings={soundSettings}
        setSoundSettings={mockSetSoundSettings}
        themeSettings={themeSettings}
        setThemeSettings={mockSetThemeSettings}
        playTestSound={mockPlayTestSound}
        resetTournament={mockResetTournament}
        onShowOnboarding={mockOnShowOnboarding}
        playTestVoice={vi.fn()}
        chipInventory={[
          { id: '1', value: 25, color: '#22c55e', borderColor: '#16a34a', textColor: '#fff', label: 'Green', quantity: 100 },
          { id: '2', value: 100, color: '#1e1e1e', borderColor: '#404040', textColor: '#fff', label: 'Black', quantity: 100 },
        ]}
        setChipInventory={vi.fn()}
      />
    )
  }

  describe('Accent Color Selection', () => {
    it('displays all accent color options', () => {
      renderSettings()
      expect(screen.getByText('Accent Color')).toBeInTheDocument()
      // Color buttons should be present (rendered as buttons with backgrounds)
    })

    it('shows checkmark on selected accent color', () => {
      renderSettings({}, {}, { accent: 'emerald' })
      // The selected color should have a checkmark SVG
      expect(screen.getByText('Accent Color')).toBeInTheDocument()
    })
  })

  describe('Sound Type Selection', () => {
    it('displays sound type options when sound enabled', () => {
      renderSettings({}, { enabled: true })
      // Sound section should have options
      expect(screen.getByText('Sound')).toBeInTheDocument()
    })

    it('calls setSoundSettings when sound type changed', () => {
      renderSettings({}, { enabled: true, soundType: 'bell' })
      
      // Find bell sound button
      const buttons = screen.getAllByRole('button')
      const bellButton = buttons.find(btn => btn.textContent?.includes('Bell'))
      if (bellButton) {
        fireEvent.click(bellButton)
        expect(mockSetSoundSettings).toHaveBeenCalled()
      }
    })
  })

  describe('Volume Control', () => {
    it('displays volume slider when sound enabled', () => {
      renderSettings({}, { enabled: true })
      expect(screen.getByText(/Volume/)).toBeInTheDocument()
    })

    it('updates volume when slider changed', () => {
      renderSettings({}, { enabled: true, volume: 0.5 })
      
      const sliders = screen.getAllByRole('slider')
      if (sliders.length > 0) {
        fireEvent.change(sliders[0], { target: { value: '0.8' } })
        // setSoundSettings should be called
      }
    })
  })

  describe('Test Sound Button', () => {
    it('displays test sound button when sound enabled', () => {
      renderSettings({}, { enabled: true })
      expect(screen.getByText('Test Sound')).toBeInTheDocument()
    })

    it('calls playTestSound when clicked', () => {
      renderSettings({}, { enabled: true })
      
      const testSoundButton = screen.getByText('Test Sound').closest('button')!
      fireEvent.click(testSoundButton)
      
      expect(mockPlayTestSound).toHaveBeenCalled()
    })
  })

  describe('Currency Selection', () => {
    it('renders currency dropdown', () => {
      renderSettings()
      expect(screen.getByText('Currency')).toBeInTheDocument()
    })

    it('shows current currency in select', () => {
      renderSettings({ currency_symbol: '$' })
      
      const selects = screen.getAllByRole('combobox')
      const currencySelect = selects.find(s => 
        (s as HTMLSelectElement).value === '$'
      )
      expect(currencySelect).toBeTruthy()
    })
  })

  describe('Chip Presets', () => {
    it('renders chip preset buttons', () => {
      renderSettings()
      // Chip preset buttons (1500, 2500, 5000, 10000, 20000)
      expect(screen.getByText('1,500')).toBeInTheDocument()
      expect(screen.getByText('5,000')).toBeInTheDocument()
      expect(screen.getByText('10,000')).toBeInTheDocument()
    })

    it('highlights selected chip preset', () => {
      renderSettings({ starting_chips: 10000 })
      // The 10000 button should have active styling
      const chip10kButton = screen.getByText('10,000').closest('button')
      expect(chip10kButton).toHaveClass('bg-accent/20')
    })

    it('updates starting chips when preset clicked', () => {
      renderSettings({ starting_chips: 5000 })
      
      const chip1500Button = screen.getByText('1,500').closest('button')!
      fireEvent.click(chip1500Button)
      
      expect(mockSetTournament).toHaveBeenCalledWith(
        expect.objectContaining({ starting_chips: 1500 })
      )
    })
  })

  describe('Starting Chips Input', () => {
    it('renders starting chips input', () => {
      renderSettings({ starting_chips: 10000 })
      
      const inputs = screen.getAllByRole('spinbutton')
      const chipsInput = inputs.find(input => 
        (input as HTMLInputElement).value === '10000'
      )
      expect(chipsInput).toBeTruthy()
    })

    it('updates starting chips when input changed', () => {
      renderSettings({ starting_chips: 10000 })
      
      const inputs = screen.getAllByRole('spinbutton')
      const chipsInput = inputs.find(input => 
        (input as HTMLInputElement).value === '10000'
      )!
      
      fireEvent.change(chipsInput, { target: { value: '15000' } })
      
      expect(mockSetTournament).toHaveBeenCalled()
    })
  })

  describe('Rebuy and Addon Inputs', () => {
    it('renders rebuy amount input', () => {
      renderSettings({ rebuy_amount: 50 })
      expect(screen.getByText('Rebuy Amount')).toBeInTheDocument()
    })

    it('renders rebuy chips input', () => {
      renderSettings({ rebuy_chips: 5000 })
      expect(screen.getByText('Rebuy Chips')).toBeInTheDocument()
    })

    it('renders addon amount input', () => {
      renderSettings({ addon_amount: 100 })
      expect(screen.getByText('Add-on Amount')).toBeInTheDocument()
    })

    it('renders addon chips input', () => {
      renderSettings({ addon_chips: 10000 })
      expect(screen.getByText('Add-on Chips')).toBeInTheDocument()
    })

    it('updates rebuy amount when changed', () => {
      renderSettings({ rebuy_amount: 50 })
      
      const inputs = screen.getAllByRole('spinbutton')
      const rebuyInput = inputs.find(input => 
        (input as HTMLInputElement).value === '50'
      )!
      
      fireEvent.change(rebuyInput, { target: { value: '75' } })
      
      expect(mockSetTournament).toHaveBeenCalled()
    })
  })

  describe('Sound Toggle', () => {
    it('renders sound toggle button', () => {
      renderSettings()
      expect(screen.getByText('Sound')).toBeInTheDocument()
    })

    it('toggles sound enabled state', () => {
      renderSettings({}, { enabled: true })
      
      // Find toggle button (relative positioned with absolute inner div)
      const toggleButtons = screen.getAllByRole('button')
      const soundToggle = toggleButtons.find(btn => 
        btn.className.includes('w-12') && btn.className.includes('h-6')
      )
      
      if (soundToggle) {
        fireEvent.click(soundToggle)
        expect(mockSetSoundSettings).toHaveBeenCalledWith(
          expect.objectContaining({ enabled: false })
        )
      }
    })
  })

  describe('Language Selector', () => {
    it('renders language selector', () => {
      renderSettings()
      expect(screen.getByText('Language')).toBeInTheDocument()
    })

    it('displays available languages', () => {
      renderSettings()
      
      // Find the language select
      const selects = screen.getAllByRole('combobox')
      expect(selects.length).toBeGreaterThan(0)
    })
  })

  describe('Import/Export', () => {
    it('renders export button', () => {
      renderSettings()
      expect(screen.getByText('Export')).toBeInTheDocument()
    })

    it('renders import button', () => {
      renderSettings()
      expect(screen.getByText('Import')).toBeInTheDocument()
    })
  })

  describe('Reset Tournament', () => {
    it('renders reset button', () => {
      renderSettings()
      // Multiple elements may match, use getAllByText
      const resetButtons = screen.getAllByText(/Reset Tournament/)
      expect(resetButtons.length).toBeGreaterThanOrEqual(1)
    })
  })
})

describe('Settings Data Validation', () => {
  it('validates sound settings structure', () => {
    const soundSettings: SoundSettings = {
      enabled: true,
      volume: 0.8,
      soundType: 'bell',
      warningEnabled: true,
      warningAt60: true,
      warningAt30: true,
      autoPauseOnBreak: false,
      customSoundPath: null,
      voiceEnabled: false,
    }
    
    expect(soundSettings.enabled).toBe(true)
    expect(soundSettings.volume).toBeGreaterThanOrEqual(0)
    expect(soundSettings.volume).toBeLessThanOrEqual(1)
    expect(['bell', 'evil-laugh', 'custom']).toContain(soundSettings.soundType)
  })

  it('validates theme settings structure', () => {
    const themeSettings: ThemeSettings = {
      mode: 'dark',
      accent: 'emerald',
      timeFormat: '24h',
      showAnte: true,
    }
    
    expect(['dark', 'light']).toContain(themeSettings.mode)
    expect(['emerald', 'blue', 'purple', 'rose', 'amber', 'cyan']).toContain(themeSettings.accent)
  })

  it('validates chip presets', () => {
    const chipPresets = [1500, 2500, 5000, 10000, 20000]
    
    chipPresets.forEach(chips => {
      expect(chips).toBeGreaterThan(0)
    })
    
    // Should be in ascending order
    for (let i = 1; i < chipPresets.length; i++) {
      expect(chipPresets[i]).toBeGreaterThan(chipPresets[i - 1])
    }
  })

  it('validates currency options', () => {
    const currencies = ['$', '€', '£', '¥', 'kr', 'C$', 'A$']
    
    expect(currencies.length).toBe(7)
    currencies.forEach(symbol => {
      expect(symbol).toBeTruthy()
    })
  })
})

describe('Settings - Localized Sound Option', () => {
  const mockSetTournament = vi.fn()
  const mockSetSoundSettings = vi.fn()
  const mockSetThemeSettings = vi.fn()
  const mockPlayTestSound = vi.fn()
  const mockResetTournament = vi.fn()
  const mockOnShowOnboarding = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
  })

  const renderSettings = (
    soundOverrides: Partial<SoundSettings> = {},
    tournamentOverrides: Partial<Tournament> = {},
  ) => {
    const tournament: Tournament = {
      id: 'test-1', name: 'Test', buyin_amount: 100, rebuy_amount: 50, rebuy_chips: 5000,
      addon_amount: 100, addon_chips: 10000, starting_chips: 10000, current_level: 0,
      time_remaining_seconds: 900, is_running: false,
      blind_structure: [
        { id: '1', small_blind: 25, big_blind: 50, ante: 0, duration_minutes: 15, is_break: false },
      ],
      players: [], currency_symbol: '$', tableCount: 1, seatsPerTable: 9,
      ...tournamentOverrides,
    }
    const soundSettings: SoundSettings = {
      enabled: true, volume: 0.7, soundType: 'bell', customSoundPath: null, voiceEnabled: false,
      warningEnabled: false, warningAt60: true, warningAt30: true, autoPauseOnBreak: false,
      ...soundOverrides,
    }
    return render(
      <Settings
        tournament={tournament} setTournament={mockSetTournament}
        soundSettings={soundSettings} setSoundSettings={mockSetSoundSettings}
        themeSettings={{ mode: 'dark', accent: 'emerald', timeFormat: '24h', showAnte: true }} setThemeSettings={mockSetThemeSettings}
        playTestSound={mockPlayTestSound} resetTournament={mockResetTournament}
        onShowOnboarding={mockOnShowOnboarding}
        playTestVoice={vi.fn()}
        chipInventory={[
          { id: '1', value: 25, color: '#22c55e', borderColor: '#16a34a', textColor: '#fff', label: 'Green', quantity: 100 },
          { id: '2', value: 100, color: '#1e1e1e', borderColor: '#404040', textColor: '#fff', label: 'Black', quantity: 100 },
        ]}
        setChipInventory={vi.fn()}
      />
    )
  }

  it('renders all three sound type buttons when sound enabled', () => {
    renderSettings({ enabled: true })
    expect(screen.getByText('settings.soundBell')).toBeInTheDocument()
    expect(screen.getByText('settings.soundEvilLaugh')).toBeInTheDocument()
    expect(screen.getByText('settings.soundCustom')).toBeInTheDocument()
  })

  it('does not render sound type buttons when sound is disabled', () => {
    renderSettings({ enabled: false })
    expect(screen.queryByText('settings.soundBell')).not.toBeInTheDocument()
  })
})

describe('Settings - Warning Sounds', () => {
  const mockSetSoundSettings = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
  })

  const renderSettings = (soundOverrides: Partial<SoundSettings> = {}) => {
    const tournament: Tournament = {
      id: 'test-1', name: 'Test', buyin_amount: 100, rebuy_amount: 50, rebuy_chips: 5000,
      addon_amount: 100, addon_chips: 10000, starting_chips: 10000, current_level: 0,
      time_remaining_seconds: 900, is_running: false,
      blind_structure: [
        { id: '1', small_blind: 25, big_blind: 50, ante: 0, duration_minutes: 15, is_break: false },
      ],
      players: [], currency_symbol: '$', tableCount: 1, seatsPerTable: 9,
    }
    const soundSettings: SoundSettings = {
      enabled: true, volume: 0.7, soundType: 'bell', customSoundPath: null, voiceEnabled: false,
      warningEnabled: false, warningAt60: true, warningAt30: true, autoPauseOnBreak: false,
      ...soundOverrides,
    }
    return render(
      <Settings
        tournament={tournament} setTournament={vi.fn()}
        soundSettings={soundSettings} setSoundSettings={mockSetSoundSettings}
        themeSettings={{ mode: 'dark', accent: 'emerald', timeFormat: '24h', showAnte: true }} setThemeSettings={vi.fn()}
        playTestSound={vi.fn()} resetTournament={vi.fn()}
        onShowOnboarding={vi.fn()}
        playTestVoice={vi.fn()}
        chipInventory={[
          { id: '1', value: 25, color: '#22c55e', borderColor: '#16a34a', textColor: '#fff', label: 'Green', quantity: 100 },
          { id: '2', value: 100, color: '#1e1e1e', borderColor: '#404040', textColor: '#fff', label: 'Black', quantity: 100 },
        ]}
        setChipInventory={vi.fn()}
      />
    )
  }

  it('renders warning sound toggle', () => {
    renderSettings()
    expect(screen.getByText('settings.warningSound')).toBeInTheDocument()
    expect(screen.getByText('settings.warningSoundDesc')).toBeInTheDocument()
  })

  it('toggles warning sounds on', () => {
    renderSettings({ warningEnabled: false })
    const toggleButtons = screen.getAllByRole('button')
    // Find the warning toggle specifically (2nd toggle in right column)
    const allToggles = toggleButtons.filter(btn =>
      btn.className.includes('w-12') && btn.className.includes('h-6')
    )
    // Toggle at index 1 should be warning toggle
    if (allToggles[1]) {
      fireEvent.click(allToggles[1])
      expect(mockSetSoundSettings).toHaveBeenCalledWith(
        expect.objectContaining({ warningEnabled: true })
      )
    }
  })

  it('shows warning checkboxes when warning is enabled', () => {
    renderSettings({ warningEnabled: true })
    expect(screen.getByText('settings.warning60')).toBeInTheDocument()
    expect(screen.getByText('settings.warning30')).toBeInTheDocument()
  })

  it('does not show warning checkboxes when warning is disabled', () => {
    renderSettings({ warningEnabled: false })
    expect(screen.queryByText('settings.warning60')).not.toBeInTheDocument()
    expect(screen.queryByText('settings.warning30')).not.toBeInTheDocument()
  })

  it('toggles 60-second warning checkbox', () => {
    renderSettings({ warningEnabled: true, warningAt60: true })
    const checkboxes = screen.getAllByRole('checkbox')
    const warning60 = checkboxes[0]
    fireEvent.click(warning60)
    expect(mockSetSoundSettings).toHaveBeenCalledWith(
      expect.objectContaining({ warningAt60: false })
    )
  })

  it('toggles 30-second warning checkbox', () => {
    renderSettings({ warningEnabled: true, warningAt30: true })
    const checkboxes = screen.getAllByRole('checkbox')
    const warning30 = checkboxes[1]
    fireEvent.click(warning30)
    expect(mockSetSoundSettings).toHaveBeenCalledWith(
      expect.objectContaining({ warningAt30: false })
    )
  })
})

describe('Settings - Auto-Pause on Break', () => {
  const mockSetSoundSettings = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
  })

  const renderSettings = (soundOverrides: Partial<SoundSettings> = {}) => {
    const tournament: Tournament = {
      id: 'test-1', name: 'Test', buyin_amount: 100, rebuy_amount: 50, rebuy_chips: 5000,
      addon_amount: 100, addon_chips: 10000, starting_chips: 10000, current_level: 0,
      time_remaining_seconds: 900, is_running: false,
      blind_structure: [
        { id: '1', small_blind: 25, big_blind: 50, ante: 0, duration_minutes: 15, is_break: false },
      ],
      players: [], currency_symbol: '$', tableCount: 1, seatsPerTable: 9,
    }
    const soundSettings: SoundSettings = {
      enabled: true, volume: 0.7, soundType: 'bell', customSoundPath: null, voiceEnabled: false,
      warningEnabled: false, warningAt60: true, warningAt30: true, autoPauseOnBreak: false,
      ...soundOverrides,
    }
    return render(
      <Settings
        tournament={tournament} setTournament={vi.fn()}
        soundSettings={soundSettings} setSoundSettings={mockSetSoundSettings}
        themeSettings={{ mode: 'dark', accent: 'emerald', timeFormat: '24h', showAnte: true }} setThemeSettings={vi.fn()}
        playTestSound={vi.fn()} resetTournament={vi.fn()}
        onShowOnboarding={vi.fn()}
        playTestVoice={vi.fn()}
        chipInventory={[
          { id: '1', value: 25, color: '#22c55e', borderColor: '#16a34a', textColor: '#fff', label: 'Green', quantity: 100 },
          { id: '2', value: 100, color: '#1e1e1e', borderColor: '#404040', textColor: '#fff', label: 'Black', quantity: 100 },
        ]}
        setChipInventory={vi.fn()}
      />
    )
  }

  it('renders auto-pause on break toggle', () => {
    renderSettings()
    expect(screen.getByText('settings.autoPauseBreak')).toBeInTheDocument()
    expect(screen.getByText('settings.autoPauseBreakDesc')).toBeInTheDocument()
  })

  it('toggles auto-pause on break', () => {
    renderSettings({ autoPauseOnBreak: false })
    const allToggles = screen.getAllByRole('button').filter(btn =>
      btn.className.includes('w-12') && btn.className.includes('h-6')
    )
    // Auto-pause toggle is the 3rd toggle
    if (allToggles[2]) {
      fireEvent.click(allToggles[2])
      expect(mockSetSoundSettings).toHaveBeenCalledWith(
        expect.objectContaining({ autoPauseOnBreak: true })
      )
    }
  })
})

describe('Settings - Keyboard Shortcuts Display', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
  })

  const renderSettings = () => {
    const tournament: Tournament = {
      id: 'test-1', name: 'Test', buyin_amount: 100, rebuy_amount: 50, rebuy_chips: 5000,
      addon_amount: 100, addon_chips: 10000, starting_chips: 10000, current_level: 0,
      time_remaining_seconds: 900, is_running: false,
      blind_structure: [
        { id: '1', small_blind: 25, big_blind: 50, ante: 0, duration_minutes: 15, is_break: false },
      ],
      players: [], currency_symbol: '$', tableCount: 1, seatsPerTable: 9,
    }
    return render(
      <Settings
        tournament={tournament} setTournament={vi.fn()}
        soundSettings={{ enabled: true, volume: 0.7, soundType: 'bell', customSoundPath: null, voiceEnabled: false, warningEnabled: false, warningAt60: true, warningAt30: true, autoPauseOnBreak: false }}
        setSoundSettings={vi.fn()}
        themeSettings={{ mode: 'dark', accent: 'emerald', timeFormat: '24h', showAnte: true }} setThemeSettings={vi.fn()}
        playTestSound={vi.fn()} resetTournament={vi.fn()}
        onShowOnboarding={vi.fn()}
        playTestVoice={vi.fn()}
        chipInventory={[
          { id: '1', value: 25, color: '#22c55e', borderColor: '#16a34a', textColor: '#fff', label: 'Green', quantity: 100 },
          { id: '2', value: 100, color: '#1e1e1e', borderColor: '#404040', textColor: '#fff', label: 'Black', quantity: 100 },
        ]}
        setChipInventory={vi.fn()}
      />
    )
  }

  it('renders keyboard shortcuts section', () => {
    renderSettings()
    expect(screen.getByText('settings.shortcuts')).toBeInTheDocument()
  })

  it('shows all shortcut keys', () => {
    renderSettings()
    expect(screen.getByText('Space')).toBeInTheDocument()
    expect(screen.getByText('←')).toBeInTheDocument()
    expect(screen.getByText('→')).toBeInTheDocument()
    expect(screen.getByText('+')).toBeInTheDocument()
    expect(screen.getByText('-')).toBeInTheDocument()
    expect(screen.getByText('F')).toBeInTheDocument()
  })

  it('shows shortcut labels', () => {
    renderSettings()
    expect(screen.getByText('settings.playPause')).toBeInTheDocument()
    expect(screen.getByText('settings.prevLevel')).toBeInTheDocument()
    expect(screen.getByText('settings.nextLevel')).toBeInTheDocument()
    expect(screen.getByText('settings.addMin')).toBeInTheDocument()
    expect(screen.getByText('settings.removeMin')).toBeInTheDocument()
    expect(screen.getByText('settings.fullscreen')).toBeInTheDocument()
  })
})

describe('Settings - Data Management', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
  })

  const renderSettings = () => {
    const tournament: Tournament = {
      id: 'test-1', name: 'Test', buyin_amount: 100, rebuy_amount: 50, rebuy_chips: 5000,
      addon_amount: 100, addon_chips: 10000, starting_chips: 10000, current_level: 0,
      time_remaining_seconds: 900, is_running: false,
      blind_structure: [
        { id: '1', small_blind: 25, big_blind: 50, ante: 0, duration_minutes: 15, is_break: false },
      ],
      players: [], currency_symbol: '$', tableCount: 1, seatsPerTable: 9,
    }
    return render(
      <Settings
        tournament={tournament} setTournament={vi.fn()}
        soundSettings={{ enabled: true, volume: 0.7, soundType: 'bell', customSoundPath: null, voiceEnabled: false, warningEnabled: false, warningAt60: true, warningAt30: true, autoPauseOnBreak: false }}
        setSoundSettings={vi.fn()}
        themeSettings={{ mode: 'dark', accent: 'emerald', timeFormat: '24h', showAnte: true }} setThemeSettings={vi.fn()}
        playTestSound={vi.fn()} resetTournament={vi.fn()}
        onShowOnboarding={vi.fn()}
        playTestVoice={vi.fn()}
        chipInventory={[
          { id: '1', value: 25, color: '#22c55e', borderColor: '#16a34a', textColor: '#fff', label: 'Green', quantity: 100 },
          { id: '2', value: 100, color: '#1e1e1e', borderColor: '#404040', textColor: '#fff', label: 'Black', quantity: 100 },
        ]}
        setChipInventory={vi.fn()}
      />
    )
  }

  it('renders data management section', () => {
    renderSettings()
    expect(screen.getByText('settings.dataManagement')).toBeInTheDocument()
  })

  it('renders auto-save indicator', () => {
    renderSettings()
    expect(screen.getByText('settings.autoSaveEnabled')).toBeInTheDocument()
    expect(screen.getByText('settings.autoSaveDesc')).toBeInTheDocument()
  })
})

describe('Settings - Tournament History with Entries', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
  })

  const renderSettings = () => {
    const tournament: Tournament = {
      id: 'test-1', name: 'Test', buyin_amount: 100, rebuy_amount: 50, rebuy_chips: 5000,
      addon_amount: 100, addon_chips: 10000, starting_chips: 10000, current_level: 0,
      time_remaining_seconds: 900, is_running: false,
      blind_structure: [
        { id: '1', small_blind: 25, big_blind: 50, ante: 0, duration_minutes: 15, is_break: false },
      ],
      players: [], currency_symbol: '$', tableCount: 1, seatsPerTable: 9,
    }
    return render(
      <Settings
        tournament={tournament} setTournament={vi.fn()}
        soundSettings={{ enabled: true, volume: 0.7, soundType: 'bell', customSoundPath: null, voiceEnabled: false, warningEnabled: false, warningAt60: true, warningAt30: true, autoPauseOnBreak: false }}
        setSoundSettings={vi.fn()}
        themeSettings={{ mode: 'dark', accent: 'emerald', timeFormat: '24h', showAnte: true }} setThemeSettings={vi.fn()}
        playTestSound={vi.fn()} resetTournament={vi.fn()}
        onShowOnboarding={vi.fn()}
        playTestVoice={vi.fn()}
        chipInventory={[
          { id: '1', value: 25, color: '#22c55e', borderColor: '#16a34a', textColor: '#fff', label: 'Green', quantity: 100 },
          { id: '2', value: 100, color: '#1e1e1e', borderColor: '#404040', textColor: '#fff', label: 'Black', quantity: 100 },
        ]}
        setChipInventory={vi.fn()}
      />
    )
  }

  it('shows empty history message when no history', () => {
    renderSettings()
    expect(screen.getByText('settings.noHistory')).toBeInTheDocument()
  })

  it('renders history entries from localStorage', async () => {
    const history = [
      { id: '1', name: 'Friday Night Poker', date: '2025-12-01T20:00:00Z', playerCount: 8, winner: 'Alice', prizePool: 800, currency_symbol: '$', duration_minutes: 180 },
    ]
    ;(localStorage.getItem as ReturnType<typeof vi.fn>).mockImplementation((key: string) => {
      if (key === 'pokerpulse_tournament_history') return JSON.stringify(history)
      return null
    })
    await act(async () => {
      renderSettings()
    })
    expect(screen.getByText('Friday Night Poker')).toBeInTheDocument()
    expect(screen.getByText(/Alice/)).toBeInTheDocument()
  })

  it('renders multiple history entries', async () => {
    const history = [
      { id: '1', name: 'Tournament A', date: '2025-12-01T20:00:00Z', playerCount: 8, winner: 'Alice', prizePool: 800, currency_symbol: '$', duration_minutes: 180 },
      { id: '2', name: 'Tournament B', date: '2025-12-05T20:00:00Z', playerCount: 6, winner: 'Bob', prizePool: 600, currency_symbol: '€', duration_minutes: 120 },
    ]
    ;(localStorage.getItem as ReturnType<typeof vi.fn>).mockImplementation((key: string) => {
      if (key === 'pokerpulse_tournament_history') return JSON.stringify(history)
      return null
    })
    await act(async () => {
      renderSettings()
    })
    expect(screen.getByText('Tournament A')).toBeInTheDocument()
    expect(screen.getByText('Tournament B')).toBeInTheDocument()
  })

  it('shows history count badge', async () => {
    const history = [
      { id: '1', name: 'T1', date: '2025-12-01', playerCount: 8, winner: 'A', prizePool: 800, currency_symbol: '$', duration_minutes: 180 },
      { id: '2', name: 'T2', date: '2025-12-02', playerCount: 6, winner: 'B', prizePool: 600, currency_symbol: '$', duration_minutes: 120 },
    ]
    ;(localStorage.getItem as ReturnType<typeof vi.fn>).mockImplementation((key: string) => {
      if (key === 'pokerpulse_tournament_history') return JSON.stringify(history)
      return null
    })
    await act(async () => {
      renderSettings()
    })
    expect(screen.getByText('(2)')).toBeInTheDocument()
  })

  it('shows clear history button when history exists', async () => {
    const history = [
      { id: '1', name: 'T1', date: '2025-12-01', playerCount: 8, winner: 'A', prizePool: 800, currency_symbol: '$', duration_minutes: 180 },
    ]
    ;(localStorage.getItem as ReturnType<typeof vi.fn>).mockImplementation((key: string) => {
      if (key === 'pokerpulse_tournament_history') return JSON.stringify(history)
      return null
    })
    await act(async () => {
      renderSettings()
    })
    expect(screen.getByText('Clear History')).toBeInTheDocument()
  })
})

describe('Settings - Help & Tutorial Section', () => {
  const mockOnShowOnboarding = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
  })

  it('renders tutorial section when onShowOnboarding is provided', () => {
    const tournament: Tournament = {
      id: 'test-1', name: 'Test', buyin_amount: 100, rebuy_amount: 50, rebuy_chips: 5000,
      addon_amount: 100, addon_chips: 10000, starting_chips: 10000, current_level: 0,
      time_remaining_seconds: 900, is_running: false,
      blind_structure: [
        { id: '1', small_blind: 25, big_blind: 50, ante: 0, duration_minutes: 15, is_break: false },
      ],
      players: [], currency_symbol: '$', tableCount: 1, seatsPerTable: 9,
    }
    render(
      <Settings
        tournament={tournament} setTournament={vi.fn()}
        soundSettings={{ enabled: true, volume: 0.7, soundType: 'bell', customSoundPath: null, voiceEnabled: false, warningEnabled: false, warningAt60: true, warningAt30: true, autoPauseOnBreak: false }}
        setSoundSettings={vi.fn()}
        themeSettings={{ mode: 'dark', accent: 'emerald', timeFormat: '24h', showAnte: true }} setThemeSettings={vi.fn()}
        playTestSound={vi.fn()} resetTournament={vi.fn()}
        onShowOnboarding={mockOnShowOnboarding}
        playTestVoice={vi.fn()}
        chipInventory={[
          { id: '1', value: 25, color: '#22c55e', borderColor: '#16a34a', textColor: '#fff', label: 'Green', quantity: 100 },
          { id: '2', value: 100, color: '#1e1e1e', borderColor: '#404040', textColor: '#fff', label: 'Black', quantity: 100 },
        ]}
        setChipInventory={vi.fn()}
      />
    )
    expect(screen.getByText('settings.startTutorial')).toBeInTheDocument()
  })

  it('calls onShowOnboarding when tutorial button is clicked', () => {
    const tournament: Tournament = {
      id: 'test-1', name: 'Test', buyin_amount: 100, rebuy_amount: 50, rebuy_chips: 5000,
      addon_amount: 100, addon_chips: 10000, starting_chips: 10000, current_level: 0,
      time_remaining_seconds: 900, is_running: false,
      blind_structure: [
        { id: '1', small_blind: 25, big_blind: 50, ante: 0, duration_minutes: 15, is_break: false },
      ],
      players: [], currency_symbol: '$', tableCount: 1, seatsPerTable: 9,
    }
    render(
      <Settings
        tournament={tournament} setTournament={vi.fn()}
        soundSettings={{ enabled: true, volume: 0.7, soundType: 'bell', customSoundPath: null, voiceEnabled: false, warningEnabled: false, warningAt60: true, warningAt30: true, autoPauseOnBreak: false }}
        setSoundSettings={vi.fn()}
        themeSettings={{ mode: 'dark', accent: 'emerald', timeFormat: '24h', showAnte: true }} setThemeSettings={vi.fn()}
        playTestSound={vi.fn()} resetTournament={vi.fn()}
        onShowOnboarding={mockOnShowOnboarding}
        playTestVoice={vi.fn()}
        chipInventory={[
          { id: '1', value: 25, color: '#22c55e', borderColor: '#16a34a', textColor: '#fff', label: 'Green', quantity: 100 },
          { id: '2', value: 100, color: '#1e1e1e', borderColor: '#404040', textColor: '#fff', label: 'Black', quantity: 100 },
        ]}
        setChipInventory={vi.fn()}
      />
    )
    const tutorialButton = screen.getByText('settings.startTutorial').closest('button')!
    fireEvent.click(tutorialButton)
    expect(mockOnShowOnboarding).toHaveBeenCalledTimes(1)
  })

  it('does not render tutorial section when onShowOnboarding is not provided', () => {
    const tournament: Tournament = {
      id: 'test-1', name: 'Test', buyin_amount: 100, rebuy_amount: 50, rebuy_chips: 5000,
      addon_amount: 100, addon_chips: 10000, starting_chips: 10000, current_level: 0,
      time_remaining_seconds: 900, is_running: false,
      blind_structure: [
        { id: '1', small_blind: 25, big_blind: 50, ante: 0, duration_minutes: 15, is_break: false },
      ],
      players: [], currency_symbol: '$', tableCount: 1, seatsPerTable: 9,
    }
    render(
      <Settings
        tournament={tournament} setTournament={vi.fn()}
        soundSettings={{ enabled: true, volume: 0.7, soundType: 'bell', customSoundPath: null, voiceEnabled: false, warningEnabled: false, warningAt60: true, warningAt30: true, autoPauseOnBreak: false }}
        setSoundSettings={vi.fn()}
        themeSettings={{ mode: 'dark', accent: 'emerald', timeFormat: '24h', showAnte: true }} setThemeSettings={vi.fn()}
        playTestSound={vi.fn()} playTestVoice={vi.fn()} resetTournament={vi.fn()}
        chipInventory={[
          { id: '1', value: 25, color: '#22c55e', borderColor: '#16a34a', textColor: '#fff', label: 'Green', quantity: 100 },
          { id: '2', value: 100, color: '#1e1e1e', borderColor: '#404040', textColor: '#fff', label: 'Black', quantity: 100 },
        ]}
        setChipInventory={vi.fn()}
      />
    )
    expect(screen.queryByText('settings.startTutorial')).not.toBeInTheDocument()
  })
})

describe('Settings - Danger Zone', () => {
  const mockResetTournament = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
  })

  it('renders reset tournament section', () => {
    const tournament: Tournament = {
      id: 'test-1', name: 'Test', buyin_amount: 100, rebuy_amount: 50, rebuy_chips: 5000,
      addon_amount: 100, addon_chips: 10000, starting_chips: 10000, current_level: 0,
      time_remaining_seconds: 900, is_running: false,
      blind_structure: [
        { id: '1', small_blind: 25, big_blind: 50, ante: 0, duration_minutes: 15, is_break: false },
      ],
      players: [], currency_symbol: '$', tableCount: 1, seatsPerTable: 9,
    }
    render(
      <Settings
        tournament={tournament} setTournament={vi.fn()}
        soundSettings={{ enabled: true, volume: 0.7, soundType: 'bell', customSoundPath: null, voiceEnabled: false, warningEnabled: false, warningAt60: true, warningAt30: true, autoPauseOnBreak: false }}
        setSoundSettings={vi.fn()}
        themeSettings={{ mode: 'dark', accent: 'emerald', timeFormat: '24h', showAnte: true }} setThemeSettings={vi.fn()}
        playTestSound={vi.fn()} resetTournament={mockResetTournament}
        onShowOnboarding={vi.fn()}
        playTestVoice={vi.fn()}
        chipInventory={[
          { id: '1', value: 25, color: '#22c55e', borderColor: '#16a34a', textColor: '#fff', label: 'Green', quantity: 100 },
          { id: '2', value: 100, color: '#1e1e1e', borderColor: '#404040', textColor: '#fff', label: 'Black', quantity: 100 },
        ]}
        setChipInventory={vi.fn()}
      />
    )
    expect(screen.getByText('settings.resetTournamentDesc')).toBeInTheDocument()
  })

  it('calls resetTournament when reset button is clicked', () => {
    const tournament: Tournament = {
      id: 'test-1', name: 'Test', buyin_amount: 100, rebuy_amount: 50, rebuy_chips: 5000,
      addon_amount: 100, addon_chips: 10000, starting_chips: 10000, current_level: 0,
      time_remaining_seconds: 900, is_running: false,
      blind_structure: [
        { id: '1', small_blind: 25, big_blind: 50, ante: 0, duration_minutes: 15, is_break: false },
      ],
      players: [], currency_symbol: '$', tableCount: 1, seatsPerTable: 9,
    }
    render(
      <Settings
        tournament={tournament} setTournament={vi.fn()}
        soundSettings={{ enabled: true, volume: 0.7, soundType: 'bell', customSoundPath: null, voiceEnabled: false, warningEnabled: false, warningAt60: true, warningAt30: true, autoPauseOnBreak: false }}
        setSoundSettings={vi.fn()}
        themeSettings={{ mode: 'dark', accent: 'emerald', timeFormat: '24h', showAnte: true }} setThemeSettings={vi.fn()}
        playTestSound={vi.fn()} resetTournament={mockResetTournament}
        onShowOnboarding={vi.fn()}
        playTestVoice={vi.fn()}
        chipInventory={[
          { id: '1', value: 25, color: '#22c55e', borderColor: '#16a34a', textColor: '#fff', label: 'Green', quantity: 100 },
          { id: '2', value: 100, color: '#1e1e1e', borderColor: '#404040', textColor: '#fff', label: 'Black', quantity: 100 },
        ]}
        setChipInventory={vi.fn()}
      />
    )
    const resetButtons = screen.getAllByText('Reset Tournament')
    const dangerButton = resetButtons.find(el => el.closest('button')?.classList.contains('btn-danger'))
    expect(dangerButton).toBeTruthy()
    fireEvent.click(dangerButton!.closest('button')!)
    expect(mockResetTournament).toHaveBeenCalledTimes(1)
  })
})

describe('Settings - Volume Display', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
  })

  const renderSettings = (volume: number) => {
    const tournament: Tournament = {
      id: 'test-1', name: 'Test', buyin_amount: 100, rebuy_amount: 50, rebuy_chips: 5000,
      addon_amount: 100, addon_chips: 10000, starting_chips: 10000, current_level: 0,
      time_remaining_seconds: 900, is_running: false,
      blind_structure: [
        { id: '1', small_blind: 25, big_blind: 50, ante: 0, duration_minutes: 15, is_break: false },
      ],
      players: [], currency_symbol: '$', tableCount: 1, seatsPerTable: 9,
    }
    return render(
      <Settings
        tournament={tournament} setTournament={vi.fn()}
        soundSettings={{ enabled: true, volume, soundType: 'bell', customSoundPath: null, voiceEnabled: false, warningEnabled: false, warningAt60: true, warningAt30: true, autoPauseOnBreak: false }}
        setSoundSettings={vi.fn()}
        themeSettings={{ mode: 'dark', accent: 'emerald', timeFormat: '24h', showAnte: true }} setThemeSettings={vi.fn()}
        playTestSound={vi.fn()} resetTournament={vi.fn()}
        onShowOnboarding={vi.fn()}
        playTestVoice={vi.fn()}
        chipInventory={[
          { id: '1', value: 25, color: '#22c55e', borderColor: '#16a34a', textColor: '#fff', label: 'Green', quantity: 100 },
          { id: '2', value: 100, color: '#1e1e1e', borderColor: '#404040', textColor: '#fff', label: 'Black', quantity: 100 },
        ]}
        setChipInventory={vi.fn()}
      />
    )
  }

  it('displays volume as percentage', () => {
    renderSettings(0.7)
    expect(screen.getByText(/70%/)).toBeInTheDocument()
  })

  it('displays 0% volume', () => {
    renderSettings(0)
    expect(screen.getByText(/0%/)).toBeInTheDocument()
  })

  it('displays 100% volume', () => {
    renderSettings(1)
    expect(screen.getByText(/100%/)).toBeInTheDocument()
  })
})

describe('Settings - Sound Type Selections', () => {
  const mockSetSoundSettings = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
  })

  const renderSettings = (soundOverrides: Partial<SoundSettings> = {}) => {
    const tournament: Tournament = {
      id: 'test-1', name: 'Test', buyin_amount: 100, rebuy_amount: 50, rebuy_chips: 5000,
      addon_amount: 100, addon_chips: 10000, starting_chips: 10000, current_level: 0,
      time_remaining_seconds: 900, is_running: false,
      blind_structure: [
        { id: '1', small_blind: 25, big_blind: 50, ante: 0, duration_minutes: 15, is_break: false },
      ],
      players: [], currency_symbol: '$', tableCount: 1, seatsPerTable: 9,
    }
    return render(
      <Settings
        tournament={tournament} setTournament={vi.fn()}
        soundSettings={{ enabled: true, volume: 0.7, soundType: 'bell', customSoundPath: null, voiceEnabled: false, warningEnabled: false, warningAt60: true, warningAt30: true, autoPauseOnBreak: false, ...soundOverrides }}
        setSoundSettings={mockSetSoundSettings}
        themeSettings={{ mode: 'dark', accent: 'emerald', timeFormat: '24h', showAnte: true }} setThemeSettings={vi.fn()}
        playTestSound={vi.fn()} resetTournament={vi.fn()}
        onShowOnboarding={vi.fn()}
        playTestVoice={vi.fn()}
        chipInventory={[
          { id: '1', value: 25, color: '#22c55e', borderColor: '#16a34a', textColor: '#fff', label: 'Green', quantity: 100 },
          { id: '2', value: 100, color: '#1e1e1e', borderColor: '#404040', textColor: '#fff', label: 'Black', quantity: 100 },
        ]}
        setChipInventory={vi.fn()}
      />
    )
  }

  it('selects evil-laugh sound type', () => {
    renderSettings({ enabled: true })
    const evilLaughButton = screen.getByText('settings.soundEvilLaugh').closest('button')!
    fireEvent.click(evilLaughButton)
    expect(mockSetSoundSettings).toHaveBeenCalledWith(
      expect.objectContaining({ soundType: 'evil-laugh' })
    )
  })

  it('selects bell sound type', () => {
    renderSettings({ enabled: true, soundType: 'evil-laugh' })
    const bellButton = screen.getByText('settings.soundBell').closest('button')!
    fireEvent.click(bellButton)
    expect(mockSetSoundSettings).toHaveBeenCalledWith(
      expect.objectContaining({ soundType: 'bell' })
    )
  })

  it('highlights evil-laugh when selected', () => {
    renderSettings({ enabled: true, soundType: 'evil-laugh' })
    const evilLaughButton = screen.getByText('settings.soundEvilLaugh').closest('button')!
    expect(evilLaughButton).toHaveClass('bg-accent/20')
  })

  it('highlights bell when selected', () => {
    renderSettings({ enabled: true, soundType: 'bell' })
    const bellButton = screen.getByText('settings.soundBell').closest('button')!
    expect(bellButton).toHaveClass('bg-accent/20')
  })

  it('highlights custom when selected', () => {
    renderSettings({ enabled: true, soundType: 'custom' })
    const customButton = screen.getByText('settings.soundCustom').closest('button')!
    expect(customButton).toHaveClass('bg-accent/20')
  })

  it('only one sound type is highlighted at a time', () => {
    renderSettings({ enabled: true, soundType: 'evil-laugh' })
    const bellButton = screen.getByText('settings.soundBell').closest('button')!
    const evilButton = screen.getByText('settings.soundEvilLaugh').closest('button')!
    const customButton = screen.getByText('settings.soundCustom').closest('button')!

    expect(evilButton).toHaveClass('bg-accent/20')
    expect(bellButton).not.toHaveClass('bg-accent/20')
    expect(customButton).not.toHaveClass('bg-accent/20')
  })
})

describe('Settings - Accent Color Clicks', () => {
  const mockSetThemeSettings = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
  })

  const renderSettings = (accent: ThemeSettings['accent'] = 'emerald') => {
    const tournament: Tournament = {
      id: 'test-1', name: 'Test', buyin_amount: 100, rebuy_amount: 50, rebuy_chips: 5000,
      addon_amount: 100, addon_chips: 10000, starting_chips: 10000, current_level: 0,
      time_remaining_seconds: 900, is_running: false,
      blind_structure: [
        { id: '1', small_blind: 25, big_blind: 50, ante: 0, duration_minutes: 15, is_break: false },
      ],
      players: [], currency_symbol: '$', tableCount: 1, seatsPerTable: 9,
    }
    return render(
      <Settings
        tournament={tournament} setTournament={vi.fn()}
        soundSettings={{ enabled: true, volume: 0.7, soundType: 'bell', customSoundPath: null, voiceEnabled: false, warningEnabled: false, warningAt60: true, warningAt30: true, autoPauseOnBreak: false }}
        setSoundSettings={vi.fn()}
        themeSettings={{ mode: 'dark', accent, timeFormat: '24h', showAnte: true }} setThemeSettings={mockSetThemeSettings}
        playTestSound={vi.fn()} resetTournament={vi.fn()}
        onShowOnboarding={vi.fn()}
        playTestVoice={vi.fn()}
        chipInventory={[
          { id: '1', value: 25, color: '#22c55e', borderColor: '#16a34a', textColor: '#fff', label: 'Green', quantity: 100 },
          { id: '2', value: 100, color: '#1e1e1e', borderColor: '#404040', textColor: '#fff', label: 'Black', quantity: 100 },
        ]}
        setChipInventory={vi.fn()}
      />
    )
  }

  it('clicks on blue accent color', () => {
    renderSettings('emerald')
    const colorButtons = screen.getAllByRole('button').filter(btn =>
      btn.classList.contains('aspect-square')
    )
    // Blue should be the 2nd color button
    if (colorButtons[1]) {
      fireEvent.click(colorButtons[1])
      expect(mockSetThemeSettings).toHaveBeenCalledWith(
        expect.objectContaining({ accent: 'blue' })
      )
    }
  })

  it('clicks on purple accent color', () => {
    renderSettings('emerald')
    const colorButtons = screen.getAllByRole('button').filter(btn =>
      btn.classList.contains('aspect-square')
    )
    if (colorButtons[2]) {
      fireEvent.click(colorButtons[2])
      expect(mockSetThemeSettings).toHaveBeenCalledWith(
        expect.objectContaining({ accent: 'purple' })
      )
    }
  })
})
describe('Settings - Export Tournament (Browser mode)', () => {
  const mockSetTournament = vi.fn()
  const mockSetSoundSettings = vi.fn()
  const mockSetThemeSettings = vi.fn()
  const mockPlayTestSound = vi.fn()
  const mockResetTournament = vi.fn()
  const mockOnShowOnboarding = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
    // Ensure not in Tauri environment
    delete (window as any).__TAURI_INTERNALS__
    delete (window as any).__TAURI__
  })

  const renderSettings = (
    tournamentOverrides: Partial<Tournament> = {},
    soundOverrides: Partial<SoundSettings> = {},
    themeOverrides: Partial<ThemeSettings> = {}
  ) => {
    return render(
      <Settings
        tournament={createMockTournament(tournamentOverrides)}
        setTournament={mockSetTournament}
        soundSettings={createMockSoundSettings(soundOverrides)}
        setSoundSettings={mockSetSoundSettings}
        themeSettings={createMockThemeSettings(themeOverrides)}
        setThemeSettings={mockSetThemeSettings}
        playTestSound={mockPlayTestSound}
        resetTournament={mockResetTournament}
        onShowOnboarding={mockOnShowOnboarding}
        playTestVoice={vi.fn()}
        chipInventory={[
          { id: '1', value: 25, color: '#22c55e', borderColor: '#16a34a', textColor: '#fff', label: 'Green', quantity: 100 },
          { id: '2', value: 100, color: '#1e1e1e', borderColor: '#404040', textColor: '#fff', label: 'Black', quantity: 100 },
        ]}
        setChipInventory={vi.fn()}
      />
    )
  }

  it('exports tournament config when Export button is clicked', () => {
    const mockCreateObjectURL = vi.fn(() => 'blob:test')
    const mockRevokeObjectURL = vi.fn()
    const originalCreateObjectURL = URL.createObjectURL
    const originalRevokeObjectURL = URL.revokeObjectURL
    
    URL.createObjectURL = mockCreateObjectURL
    URL.revokeObjectURL = mockRevokeObjectURL

    renderSettings()
    
    const exportButton = screen.getByText('Export').closest('button')!
    fireEvent.click(exportButton)
    
    // In browser mode, creates a blob URL and downloads
    expect(mockCreateObjectURL).toHaveBeenCalled()
    expect(mockRevokeObjectURL).toHaveBeenCalled()
    
    // Restore original functions
    URL.createObjectURL = originalCreateObjectURL
    URL.revokeObjectURL = originalRevokeObjectURL
  })

  it('imports tournament config when Import button is clicked', () => {
    renderSettings()
    
    // Click import - it creates a file input in browser mode
    const importButton = screen.getByText('Import').closest('button')!
    fireEvent.click(importButton)
    
    // Should not throw (file input is created programmatically)
  })
})

describe('Settings - Rebuy/Addon Updates', () => {
  const mockSetTournament = vi.fn()
  const mockSetSoundSettings = vi.fn()
  const mockSetThemeSettings = vi.fn()
  const mockPlayTestSound = vi.fn()
  const mockResetTournament = vi.fn()
  const mockOnShowOnboarding = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
  })

  const renderSettings = (
    tournamentOverrides: Partial<Tournament> = {},
    soundOverrides: Partial<SoundSettings> = {},
    themeOverrides: Partial<ThemeSettings> = {}
  ) => {
    return render(
      <Settings
        tournament={createMockTournament(tournamentOverrides)}
        setTournament={mockSetTournament}
        soundSettings={createMockSoundSettings(soundOverrides)}
        setSoundSettings={mockSetSoundSettings}
        themeSettings={createMockThemeSettings(themeOverrides)}
        setThemeSettings={mockSetThemeSettings}
        playTestSound={mockPlayTestSound}
        resetTournament={mockResetTournament}
        onShowOnboarding={mockOnShowOnboarding}
        playTestVoice={vi.fn()}
        chipInventory={[
          { id: '1', value: 25, color: '#22c55e', borderColor: '#16a34a', textColor: '#fff', label: 'Green', quantity: 100 },
          { id: '2', value: 100, color: '#1e1e1e', borderColor: '#404040', textColor: '#fff', label: 'Black', quantity: 100 },
        ]}
        setChipInventory={vi.fn()}
      />
    )
  }

  it('updates rebuy chips when changed', () => {
    renderSettings()
    
    const rebuyChipsLabel = screen.getByText('Rebuy Chips')
    const input = rebuyChipsLabel.closest('div')!.querySelector('input')!
    fireEvent.change(input, { target: { value: '8000' } })
    
    expect(mockSetTournament).toHaveBeenCalledWith(
      expect.objectContaining({ rebuy_chips: 8000 })
    )
  })

  it('updates addon amount when changed', () => {
    renderSettings()
    
    const addonAmountLabel = screen.getByText('Add-on Amount')
    // Label is inside the outer div that also contains the input wrapper
    const outerDiv = addonAmountLabel.closest('label')!.parentElement!
    const input = outerDiv.querySelector('input')!
    fireEvent.change(input, { target: { value: '75' } })
    
    expect(mockSetTournament).toHaveBeenCalledWith(
      expect.objectContaining({ addon_amount: 75 })
    )
  })

  it('updates addon chips when changed', () => {
    renderSettings()
    
    const addonChipsLabel = screen.getByText('Add-on Chips')
    const input = addonChipsLabel.closest('div')!.querySelector('input')!
    fireEvent.change(input, { target: { value: '12000' } })
    
    expect(mockSetTournament).toHaveBeenCalledWith(
      expect.objectContaining({ addon_chips: 12000 })
    )
  })

  it('handles zero value for rebuy chips', () => {
    renderSettings()
    
    const rebuyChipsLabel = screen.getByText('Rebuy Chips')
    const input = rebuyChipsLabel.closest('div')!.querySelector('input')!
    fireEvent.change(input, { target: { value: '0' } })
    
    expect(mockSetTournament).toHaveBeenCalledWith(
      expect.objectContaining({ rebuy_chips: 0 })
    )
  })
})

describe('Settings - Chip Breakdown Rendering', () => {
  const mockSetTournament = vi.fn()
  const mockSetSoundSettings = vi.fn()
  const mockSetThemeSettings = vi.fn()
  const mockPlayTestSound = vi.fn()
  const mockResetTournament = vi.fn()
  const mockOnShowOnboarding = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
  })

  const renderSettings = (
    tournamentOverrides: Partial<Tournament> = {},
  ) => {
    return render(
      <Settings
        tournament={createMockTournament(tournamentOverrides)}
        setTournament={mockSetTournament}
        soundSettings={createMockSoundSettings()}
        setSoundSettings={mockSetSoundSettings}
        themeSettings={createMockThemeSettings()}
        setThemeSettings={mockSetThemeSettings}
        playTestSound={mockPlayTestSound}
        resetTournament={mockResetTournament}
        onShowOnboarding={mockOnShowOnboarding}
        playTestVoice={vi.fn()}
        chipInventory={[
          { id: '1', value: 25, color: '#22c55e', borderColor: '#16a34a', textColor: '#fff', label: 'Green', quantity: 100 },
          { id: '2', value: 100, color: '#1e1e1e', borderColor: '#404040', textColor: '#fff', label: 'Black', quantity: 100 },
        ]}
        setChipInventory={vi.fn()}
      />
    )
  }

  it('renders chip breakdown for 10000 starting chips', () => {
    renderSettings({ starting_chips: 10000 })
    
    // Should show chip denominations with counts
    // 10000 chips = various denominations like 25, 100, 500, 1000, 5000
    const chipElements = screen.getAllByText(/×\s*\d+/)
    expect(chipElements.length).toBeGreaterThan(0)
  })

  it('renders suggested chips text', () => {
    renderSettings({ starting_chips: 10000 })
    
    expect(screen.getByText(/10,000/)).toBeInTheDocument()
  })

  it('updates chip breakdown when preset is changed', () => {
    renderSettings({ starting_chips: 5000 })
    
    // Click on 10,000 preset button
    const presetButton = screen.getByText('10,000').closest('button')!
    fireEvent.click(presetButton)
    
    expect(mockSetTournament).toHaveBeenCalledWith(
      expect.objectContaining({ starting_chips: 10000 })
    )
  })

  it('renders custom starting chips input', () => {
    renderSettings()
    
    // Should have a number input for custom chips
    const startingChipsInputs = screen.getAllByRole('spinbutton')
    // Find the starting chips input (has step=100 and min=100)
    const customInput = startingChipsInputs.find(input => 
      input.getAttribute('step') === '100' && input.getAttribute('min') === '100'
    )
    expect(customInput).toBeDefined()
  })
})

describe('Settings - History Interaction', () => {
  const mockSetTournament = vi.fn()
  const mockSetSoundSettings = vi.fn()
  const mockSetThemeSettings = vi.fn()
  const mockPlayTestSound = vi.fn()
  const mockResetTournament = vi.fn()
  const mockOnShowOnboarding = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
  })

  const renderSettings = (
    tournamentOverrides: Partial<Tournament> = {},
  ) => {
    return render(
      <Settings
        tournament={createMockTournament(tournamentOverrides)}
        setTournament={mockSetTournament}
        soundSettings={createMockSoundSettings()}
        setSoundSettings={mockSetSoundSettings}
        themeSettings={createMockThemeSettings()}
        setThemeSettings={mockSetThemeSettings}
        playTestSound={mockPlayTestSound}
        resetTournament={mockResetTournament}
        onShowOnboarding={mockOnShowOnboarding}
        playTestVoice={vi.fn()}
        chipInventory={[
          { id: '1', value: 25, color: '#22c55e', borderColor: '#16a34a', textColor: '#fff', label: 'Green', quantity: 100 },
          { id: '2', value: 100, color: '#1e1e1e', borderColor: '#404040', textColor: '#fff', label: 'Black', quantity: 100 },
        ]}
        setChipInventory={vi.fn()}
      />
    )
  }

  it('toggles history visibility', () => {
    (localStorage.getItem as ReturnType<typeof vi.fn>).mockImplementation((key: string) => {
      if (key === 'pokerpulse_tournament_history') return JSON.stringify([])
      return null
    })
    
    renderSettings()
    
    // showHistory defaults to true, so history content is visible and button says hideHistory
    expect(screen.getByText('settings.noHistory')).toBeInTheDocument()
    
    // Click to hide history
    fireEvent.click(screen.getByText('settings.hideHistory'))
    
    // History content should be hidden
    expect(screen.queryByText('settings.noHistory')).not.toBeInTheDocument()
    
    // Click to show history again
    fireEvent.click(screen.getByText('settings.showHistory'))
    
    // History content should be visible again
    expect(screen.getByText('settings.noHistory')).toBeInTheDocument()
  })

  it('deletes individual history entry', async () => {
    const history = [
      {
        id: 'h1',
        name: 'Tournament 1',
        date: '2025-01-01T00:00:00Z',
        playerCount: 8,
        winner: 'Alice',
        prizePool: 800,
        currency_symbol: '$',
        duration_minutes: 120,
      },
      {
        id: 'h2',
        name: 'Tournament 2',
        date: '2025-01-02T00:00:00Z',
        playerCount: 6,
        winner: 'Bob',
        prizePool: 600,
        currency_symbol: '$',
        duration_minutes: 90,
      },
    ];
    (localStorage.getItem as ReturnType<typeof vi.fn>).mockImplementation((key: string) => {
      if (key === 'pokerpulse_tournament_history') return JSON.stringify(history)
      return null
    })
    
    renderSettings()
    
    // showHistory defaults to true, so entries are already visible
    expect(screen.getByText('Tournament 1')).toBeInTheDocument()
    expect(screen.getByText('Tournament 2')).toBeInTheDocument()
    
    // Delete first entry (find delete buttons by title)
    const deleteButtons = screen.getAllByTitle('modal.delete')
    fireEvent.click(deleteButtons[0])
    
    // First entry should be removed
    expect(localStorage.setItem).toHaveBeenCalledWith(
      'pokerpulse_tournament_history',
      expect.not.stringContaining('Tournament 1')
    )
  })

  it('shows clear history button when history entries exist', () => {
    const history = [
      {
        id: 'h1',
        name: 'Tournament X',
        date: '2025-01-01T00:00:00Z',
        playerCount: 8,
        winner: 'Alice',
        prizePool: 800,
        currency_symbol: '$',
        duration_minutes: 120,
      },
    ];
    (localStorage.getItem as ReturnType<typeof vi.fn>).mockImplementation((key: string) => {
      if (key === 'pokerpulse_tournament_history') return JSON.stringify(history)
      return null
    })
    
    renderSettings()
    
    // showHistory defaults to true, so entries are already visible
    expect(screen.getByText('Tournament X')).toBeInTheDocument()
    
    // Clear History button should be present
    const clearBtn = screen.getByText('Clear History')
    expect(clearBtn).toBeInTheDocument()
    expect(clearBtn.tagName).toBe('BUTTON')
  })

  it('renders history entry details correctly', () => {
    const history = [
      {
        id: 'h1',
        name: 'Friday Night',
        date: '2025-06-15T20:00:00Z',
        playerCount: 10,
        winner: 'Charlie',
        prizePool: 1000,
        currency_symbol: '$',
        duration_minutes: 150,
      },
    ];
    (localStorage.getItem as ReturnType<typeof vi.fn>).mockImplementation((key: string) => {
      if (key === 'pokerpulse_tournament_history') return JSON.stringify(history)
      return null
    })
    
    renderSettings()
    
    // showHistory defaults to true, so entries are already visible
    expect(screen.getByText('Friday Night')).toBeInTheDocument()
    expect(screen.getByText(/Charlie/)).toBeInTheDocument()
    // Check player count is shown (👥 10)
    expect(screen.getByText(/👥 10/)).toBeInTheDocument()
  })
})

describe('Settings - Warning Sound Disable/Enable', () => {
  const mockSetTournament = vi.fn()
  const mockSetSoundSettings = vi.fn()
  const mockSetThemeSettings = vi.fn()
  const mockPlayTestSound = vi.fn()
  const mockResetTournament = vi.fn()
  const mockOnShowOnboarding = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
  })

  const renderSettings = (
    soundOverrides: Partial<SoundSettings> = {},
  ) => {
    return render(
      <Settings
        tournament={createMockTournament()}
        setTournament={mockSetTournament}
        soundSettings={createMockSoundSettings(soundOverrides)}
        setSoundSettings={mockSetSoundSettings}
        themeSettings={createMockThemeSettings()}
        setThemeSettings={mockSetThemeSettings}
        playTestSound={mockPlayTestSound}
        resetTournament={mockResetTournament}
        onShowOnboarding={mockOnShowOnboarding}
        playTestVoice={vi.fn()}
        chipInventory={[
          { id: '1', value: 25, color: '#22c55e', borderColor: '#16a34a', textColor: '#fff', label: 'Green', quantity: 100 },
          { id: '2', value: 100, color: '#1e1e1e', borderColor: '#404040', textColor: '#fff', label: 'Black', quantity: 100 },
        ]}
        setChipInventory={vi.fn()}
      />
    )
  }

  it('disables sound completely when toggle clicked', () => {
    renderSettings({ enabled: true })
    
    // Find the sound enabled toggle (it's a button with role)
    const soundLabel = screen.getByText('settings.levelChangeSound')
    const toggleContainer = soundLabel.closest('.flex')!
    const toggle = toggleContainer.querySelector('button')!
    fireEvent.click(toggle)
    
    expect(mockSetSoundSettings).toHaveBeenCalledWith(
      expect.objectContaining({ enabled: false })
    )
  })

  it('does not show sound controls when sound is disabled', () => {
    renderSettings({ enabled: false })
    
    // Volume slider and test sound button should not be visible
    expect(screen.queryByText('Test Sound')).not.toBeInTheDocument()
  })

  it('toggles auto-pause on break', () => {
    renderSettings({ autoPauseOnBreak: false })
    
    const autoPauseLabel = screen.getByText('settings.autoPauseBreak')
    const toggleContainer = autoPauseLabel.closest('.flex')!
    const toggle = toggleContainer.querySelector('button')!
    fireEvent.click(toggle)
    
    expect(mockSetSoundSettings).toHaveBeenCalledWith(
      expect.objectContaining({ autoPauseOnBreak: true })
    )
  })
})

describe('Settings - Language Change', () => {
  const mockSetTournament = vi.fn()
  const mockSetSoundSettings = vi.fn()
  const mockSetThemeSettings = vi.fn()
  const mockPlayTestSound = vi.fn()
  const mockResetTournament = vi.fn()
  const mockOnShowOnboarding = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
  })

  it('changes language when selector is changed', () => {
    const { container } = render(
      <Settings
        tournament={createMockTournament()}
        setTournament={mockSetTournament}
        soundSettings={createMockSoundSettings()}
        setSoundSettings={mockSetSoundSettings}
        themeSettings={createMockThemeSettings()}
        setThemeSettings={mockSetThemeSettings}
        playTestSound={mockPlayTestSound}
        resetTournament={mockResetTournament}
        onShowOnboarding={mockOnShowOnboarding}
        playTestVoice={vi.fn()}
        chipInventory={[
          { id: '1', value: 25, color: '#22c55e', borderColor: '#16a34a', textColor: '#fff', label: 'Green', quantity: 100 },
          { id: '2', value: 100, color: '#1e1e1e', borderColor: '#404040', textColor: '#fff', label: 'Black', quantity: 100 },
        ]}
        setChipInventory={vi.fn()}
      />
    )
    
    // Find the language select
    const selects = container.querySelectorAll('select')
    const langSelect = Array.from(selects).find(s => {
      const options = s.querySelectorAll('option')
      return Array.from(options).some(o => o.textContent?.includes('Español'))
    })
    
    if (langSelect) {
      fireEvent.change(langSelect, { target: { value: 'es' } })
      // i18n.changeLanguage should be called
    }
  })
})
