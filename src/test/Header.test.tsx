import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { Header } from '../components/Header'
import type { Tournament } from '../types'

// Mock i18n
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, options?: any) => {
      const translations: Record<string, string> = {
        'header.tournamentName': 'Tournament Name',
        'header.players': 'Players',
        'header.prizePool': 'Prize Pool',
        'header.openProjector': 'Open Projector',
        'header.closeProjector': 'Close Projector',
        'header.fullscreen': 'Fullscreen',
        'header.exitFullscreen': 'Exit Fullscreen',
        'header.about': 'About',
        'header.about.title': 'About',
        'header.about.version': `Version ${options?.version || ''}`,
        'header.about.description': 'A poker tournament management app',
        'header.about.features.blinds': 'Blind structure management',
        'header.about.features.players': 'Player management',
        'header.about.features.prizes': 'Prize pool calculations',
        'header.about.features.settings': 'Customizable settings',
        'header.about.builtWith': 'Built with Tauri',
        'header.about.website': 'pokerpulsepro.com',
        'header.about.updateAvailable': 'Update Available',
        'header.about.downloadUpdate': 'Download Update',
        'header.about.updating': 'Updating...',
        'header.shortcuts.title': 'Keyboard Shortcuts',
        'header.shortcuts.playPause': 'Play / Pause',
        'header.shortcuts.previousLevel': 'Previous Level',
        'header.shortcuts.nextLevel': 'Next Level',
        'header.shortcuts.addMinute': 'Add 1 Minute',
        'header.shortcuts.removeMinute': 'Remove 1 Minute',
        'header.shortcuts.fullscreen': 'Fullscreen',
        'header.shortcuts.exitFullscreen': 'Exit Fullscreen',
      }
      return translations[key] || key
    },
  }),
}))

// Mock utils
vi.mock('../utils', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../utils')>()
  return {
    ...actual,
    downloadAndInstallUpdate: vi.fn().mockResolvedValue(true),
  }
})

describe('Header Component', () => {
  const mockSetTournament = vi.fn()
  const mockToggleFullscreen = vi.fn()
  const mockToggleProjector = vi.fn()

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
      { id: '1', name: 'Player 1', buyins: 1, rebuys: 0, addons: 0, eliminated: false, placement: null, tableNumber: null, seatNumber: null },
      { id: '2', name: 'Player 2', buyins: 1, rebuys: 1, addons: 0, eliminated: false, placement: null, tableNumber: null, seatNumber: null },
      { id: '3', name: 'Player 3', buyins: 1, rebuys: 0, addons: 1, eliminated: true, placement: 3, tableNumber: null, seatNumber: null },
    ],
    blind_structure: [{ id: '1', small_blind: 25, big_blind: 50, ante: 0, duration_minutes: 20, is_break: false }],
    current_level: 0,
    time_remaining_seconds: 1200,
    is_running: false,
    currency_symbol: '$',
    tableCount: 1,
    seatsPerTable: 9,
  }

  beforeEach(() => {
    mockSetTournament.mockClear()
    mockToggleFullscreen.mockClear()
    mockToggleProjector.mockClear()
  })

  it('renders tournament name', () => {
    render(
      <Header
        tournament={baseTournament}
        setTournament={mockSetTournament}
        isFullscreen={false}
        toggleFullscreen={mockToggleFullscreen}
      />
    )
    
    const input = screen.getByDisplayValue('Test Tournament')
    expect(input).toBeInTheDocument()
  })

  it('updates tournament name on input change', () => {
    render(
      <Header
        tournament={baseTournament}
        setTournament={mockSetTournament}
        isFullscreen={false}
        toggleFullscreen={mockToggleFullscreen}
      />
    )
    
    const input = screen.getByDisplayValue('Test Tournament')
    fireEvent.change(input, { target: { value: 'New Tournament Name' } })
    
    expect(mockSetTournament).toHaveBeenCalledWith({
      ...baseTournament,
      name: 'New Tournament Name',
    })
  })

  it('displays player count correctly', () => {
    render(
      <Header
        tournament={baseTournament}
        setTournament={mockSetTournament}
        isFullscreen={false}
        toggleFullscreen={mockToggleFullscreen}
      />
    )
    
    // 2 active players out of 3 total (1 eliminated)
    expect(screen.getByText('2/3')).toBeInTheDocument()
  })

  it('displays prize pool with currency', () => {
    render(
      <Header
        tournament={baseTournament}
        setTournament={mockSetTournament}
        isFullscreen={false}
        toggleFullscreen={mockToggleFullscreen}
      />
    )
    
    // Prize pool: 3 buyins * $100 + 1 rebuy * $50 + 1 addon * $50 = $400
    expect(screen.getByText('$400')).toBeInTheDocument()
  })

  it('shows projector button when onToggleProjector is provided', () => {
    render(
      <Header
        tournament={baseTournament}
        setTournament={mockSetTournament}
        isFullscreen={false}
        toggleFullscreen={mockToggleFullscreen}
        onToggleProjector={mockToggleProjector}
      />
    )
    
    const projectorButton = screen.getByTitle('Open Projector')
    expect(projectorButton).toBeInTheDocument()
  })

  it('calls toggleProjector when projector button clicked', () => {
    render(
      <Header
        tournament={baseTournament}
        setTournament={mockSetTournament}
        isFullscreen={false}
        toggleFullscreen={mockToggleFullscreen}
        onToggleProjector={mockToggleProjector}
      />
    )
    
    const projectorButton = screen.getByTitle('Open Projector')
    fireEvent.click(projectorButton)
    
    expect(mockToggleProjector).toHaveBeenCalled()
  })

  it('shows indicator when projector is open', () => {
    render(
      <Header
        tournament={baseTournament}
        setTournament={mockSetTournament}
        isFullscreen={false}
        toggleFullscreen={mockToggleFullscreen}
        isProjectorOpen={true}
        onToggleProjector={mockToggleProjector}
      />
    )
    
    const projectorButton = screen.getByTitle('Close Projector')
    expect(projectorButton).toBeInTheDocument()
    expect(projectorButton).toHaveClass('text-accent')
  })

  it('shows current time', () => {
    // Mock Date to return a specific time
    const mockDate = new Date('2024-01-15T14:30:00')
    vi.setSystemTime(mockDate)
    
    render(
      <Header
        tournament={baseTournament}
        setTournament={mockSetTournament}
        isFullscreen={false}
        toggleFullscreen={mockToggleFullscreen}
      />
    )
    
    // The time format depends on locale, just check something time-like is present
    const timeElement = document.querySelector('.font-mono')
    expect(timeElement).toBeInTheDocument()
    
    vi.useRealTimers()
  })

  it('renders update indicator when update is available', () => {
    const updateInfo = {
      updateAvailable: true,
      latestVersion: '1.3.0',
      downloadUrl: 'https://example.com',
    }

    render(
      <Header
        tournament={baseTournament}
        setTournament={mockSetTournament}
        isFullscreen={false}
        toggleFullscreen={mockToggleFullscreen}
        updateInfo={updateInfo}
      />
    )
    
    // The component shows a pulsing accent dot for update available
    const updateBadge = document.querySelector('.animate-pulse')
    expect(updateBadge).toBeInTheDocument()
  })

  it('handles empty players array', () => {
    const emptyTournament: Tournament = { ...baseTournament, players: [] }
    
    render(
      <Header
        tournament={emptyTournament}
        setTournament={mockSetTournament}
        isFullscreen={false}
        toggleFullscreen={mockToggleFullscreen}
      />
    )
    
    expect(screen.getByText('0/0')).toBeInTheDocument()
  })

  it('calls toggleFullscreen when fullscreen button clicked', () => {
    render(
      <Header
        tournament={baseTournament}
        setTournament={mockSetTournament}
        isFullscreen={false}
        toggleFullscreen={mockToggleFullscreen}
      />
    )
    
    const fullscreenButton = screen.getByTitle('Fullscreen')
    fireEvent.click(fullscreenButton)
    
    expect(mockToggleFullscreen).toHaveBeenCalled()
  })

  it('shows exit fullscreen title when in fullscreen mode', () => {
    render(
      <Header
        tournament={baseTournament}
        setTournament={mockSetTournament}
        isFullscreen={true}
        toggleFullscreen={mockToggleFullscreen}
      />
    )
    
    const exitButton = screen.getByTitle('Exit Fullscreen')
    expect(exitButton).toBeInTheDocument()
  })

  it('opens keyboard shortcuts dropdown when clicked', () => {
    render(
      <Header
        tournament={baseTournament}
        setTournament={mockSetTournament}
        isFullscreen={false}
        toggleFullscreen={mockToggleFullscreen}
      />
    )
    
    const shortcutsButton = screen.getByTitle('Keyboard Shortcuts')
    fireEvent.click(shortcutsButton)
    
    expect(screen.getByText('Play / Pause')).toBeInTheDocument()
    expect(screen.getByText('Space')).toBeInTheDocument()
  })

  it('shows all keyboard shortcuts in dropdown', () => {
    render(
      <Header
        tournament={baseTournament}
        setTournament={mockSetTournament}
        isFullscreen={false}
        toggleFullscreen={mockToggleFullscreen}
      />
    )
    
    const shortcutsButton = screen.getByTitle('Keyboard Shortcuts')
    fireEvent.click(shortcutsButton)
    
    expect(screen.getByText('Play / Pause')).toBeInTheDocument()
    expect(screen.getByText('Previous Level')).toBeInTheDocument()
    expect(screen.getByText('Next Level')).toBeInTheDocument()
    expect(screen.getByText('Add 1 Minute')).toBeInTheDocument()
    expect(screen.getByText('Remove 1 Minute')).toBeInTheDocument()
    expect(screen.getByText('←')).toBeInTheDocument()
    expect(screen.getByText('→')).toBeInTheDocument()
    expect(screen.getByText('+')).toBeInTheDocument()
    expect(screen.getByText('-')).toBeInTheDocument()
    expect(screen.getByText('F11')).toBeInTheDocument()
    expect(screen.getByText('Esc')).toBeInTheDocument()
  })

  it('opens about dropdown when clicked', () => {
    render(
      <Header
        tournament={baseTournament}
        setTournament={mockSetTournament}
        isFullscreen={false}
        toggleFullscreen={mockToggleFullscreen}
      />
    )
    
    const aboutButton = screen.getByTitle('About')
    fireEvent.click(aboutButton)
    
    expect(screen.getByText('PokerPulse Pro')).toBeInTheDocument()
    expect(screen.getByText(/Version/)).toBeInTheDocument()
  })

  it('shows app description in about dropdown', () => {
    render(
      <Header
        tournament={baseTournament}
        setTournament={mockSetTournament}
        isFullscreen={false}
        toggleFullscreen={mockToggleFullscreen}
      />
    )
    
    const aboutButton = screen.getByTitle('About')
    fireEvent.click(aboutButton)
    
    expect(screen.getByText('A poker tournament management app')).toBeInTheDocument()
  })

  it('shows feature list in about dropdown', () => {
    render(
      <Header
        tournament={baseTournament}
        setTournament={mockSetTournament}
        isFullscreen={false}
        toggleFullscreen={mockToggleFullscreen}
      />
    )
    
    const aboutButton = screen.getByTitle('About')
    fireEvent.click(aboutButton)
    
    expect(screen.getByText(/Blind structure/)).toBeInTheDocument()
    expect(screen.getByText(/Player management/)).toBeInTheDocument()
    expect(screen.getByText(/Prize pool/)).toBeInTheDocument()
  })

  it('shows download update button when update is available', () => {
    const updateInfo = {
      updateAvailable: true,
      latestVersion: '1.3.0',
      downloadUrl: 'https://example.com',
    }

    render(
      <Header
        tournament={baseTournament}
        setTournament={mockSetTournament}
        isFullscreen={false}
        toggleFullscreen={mockToggleFullscreen}
        updateInfo={updateInfo}
      />
    )
    
    const aboutButton = screen.getByTitle('About')
    fireEvent.click(aboutButton)
    
    expect(screen.getByText('Update Available')).toBeInTheDocument()
    expect(screen.getByText('Download Update')).toBeInTheDocument()
  })

  it('shows poker spade logo', () => {
    render(
      <Header
        tournament={baseTournament}
        setTournament={mockSetTournament}
        isFullscreen={false}
        toggleFullscreen={mockToggleFullscreen}
      />
    )
    
    expect(screen.getByText('♠')).toBeInTheDocument()
  })

  it('does not show projector button when onToggleProjector is not provided', () => {
    render(
      <Header
        tournament={baseTournament}
        setTournament={mockSetTournament}
        isFullscreen={false}
        toggleFullscreen={mockToggleFullscreen}
      />
    )
    
    expect(screen.queryByTitle('Open Projector')).not.toBeInTheDocument()
  })

  it('closes shortcuts dropdown when clicking outside', () => {
    render(
      <Header
        tournament={baseTournament}
        setTournament={mockSetTournament}
        isFullscreen={false}
        toggleFullscreen={mockToggleFullscreen}
      />
    )
    
    const shortcutsButton = screen.getByTitle('Keyboard Shortcuts')
    fireEvent.click(shortcutsButton)
    expect(screen.getByText('Play / Pause')).toBeInTheDocument()
    
    // Click outside
    fireEvent.mouseDown(document)
    expect(screen.queryByText('Play / Pause')).not.toBeInTheDocument()
  })

  it('closes about dropdown when clicking outside', () => {
    render(
      <Header
        tournament={baseTournament}
        setTournament={mockSetTournament}
        isFullscreen={false}
        toggleFullscreen={mockToggleFullscreen}
      />
    )
    
    const aboutButton = screen.getByTitle('About')
    fireEvent.click(aboutButton)
    expect(screen.getByText('PokerPulse Pro')).toBeInTheDocument()
    
    // Click outside
    fireEvent.mouseDown(document)
    expect(screen.queryByText('PokerPulse Pro')).not.toBeInTheDocument()
  })
})
