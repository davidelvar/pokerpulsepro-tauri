import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ProjectorView } from '../components/ProjectorView'

// Mock Tauri APIs
vi.mock('@tauri-apps/api/event', () => ({
  listen: vi.fn().mockResolvedValue(() => {}),
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
    t: (key: string) => {
      const translations: Record<string, string> = {
        'projector.waitingForData': 'Waiting for tournament data...',
        'projector.level': 'Level',
        'projector.break': 'BREAK',
        'projector.players': 'Players',
        'projector.prizePool': 'Prize Pool',
        'projector.avgStack': 'Avg Stack',
        'projector.nextLevel': 'Next',
        'projector.smallBlind': 'SB',
        'projector.bigBlind': 'BB',
        'projector.ante': 'Ante',
      }
      return translations[key] || key
    },
  }),
}))

describe('ProjectorView Component', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

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

  it('sets up Tauri event listener on mount', async () => {
    const { listen } = await import('@tauri-apps/api/event')
    
    render(<ProjectorView />)
    
    expect(listen).toHaveBeenCalledWith('projector-state-update', expect.any(Function))
  })
})
