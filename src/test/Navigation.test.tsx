import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { I18nextProvider } from 'react-i18next'
import i18n from '../i18n'
import { Navigation } from '../components/Navigation'

// Mock i18n for tests
vi.mock('react-i18next', async () => {
  const actual = await vi.importActual('react-i18next')
  return {
    ...actual,
    useTranslation: () => ({
      t: (key: string) => {
        const translations: Record<string, string> = {
          'nav.timer': 'Timer',
          'nav.players': 'Players',
          'nav.blinds': 'Blinds',
          'nav.prizes': 'Prizes',
          'nav.settings': 'Settings',
          'nav.help': 'Help',
        }
        return translations[key] || key
      },
      i18n: { language: 'en' },
    }),
  }
})

describe('Navigation Component', () => {
  const mockSetActiveTab = vi.fn()
  const defaultProps = {
    activeTab: 'timer' as const,
    setActiveTab: mockSetActiveTab,
  }

  beforeEach(() => {
    mockSetActiveTab.mockClear()
  })

  it('renders all navigation tabs', () => {
    render(<Navigation {...defaultProps} />)
    
    expect(screen.getByText('Timer')).toBeInTheDocument()
    expect(screen.getByText('Players')).toBeInTheDocument()
    expect(screen.getByText('Blinds')).toBeInTheDocument()
    expect(screen.getByText('Prizes')).toBeInTheDocument()
    expect(screen.getByText('Settings')).toBeInTheDocument()
    expect(screen.getByText('Help')).toBeInTheDocument()
  })

  it('highlights the active tab', () => {
    render(<Navigation {...defaultProps} activeTab="players" />)
    
    const playersButton = screen.getByText('Players').closest('button')
    expect(playersButton).toHaveClass('bg-accent/20')
    expect(playersButton).toHaveClass('text-accent')
  })

  it('calls setActiveTab when clicking a tab', () => {
    render(<Navigation {...defaultProps} />)
    
    fireEvent.click(screen.getByText('Blinds'))
    expect(mockSetActiveTab).toHaveBeenCalledWith('blinds')
  })

  it('calls setActiveTab for each tab', () => {
    render(<Navigation {...defaultProps} />)
    
    const tabs = ['timer', 'players', 'blinds', 'prizes', 'settings', 'help']
    tabs.forEach((tab) => {
      const tabText = tab.charAt(0).toUpperCase() + tab.slice(1)
      fireEvent.click(screen.getByText(tabText))
    })
    
    expect(mockSetActiveTab).toHaveBeenCalledTimes(6)
  })

  it('has data-onboarding attributes for tutorial', () => {
    render(<Navigation {...defaultProps} />)
    
    const timerButton = screen.getByText('Timer').closest('button')
    expect(timerButton).toHaveAttribute('data-onboarding', 'timer')
    
    const playersButton = screen.getByText('Players').closest('button')
    expect(playersButton).toHaveAttribute('data-onboarding', 'players')
  })
})
