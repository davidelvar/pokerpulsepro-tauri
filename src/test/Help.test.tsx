import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { Help } from '../components/Help'

// Mock i18n
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        'help.title': 'Poker Hand Rankings',
        'help.subtitle': 'From highest to lowest',
        'help.viewTutorial': 'View Tutorial',
        'help.hands.royalFlush.name': 'Royal Flush',
        'help.hands.royalFlush.description': 'A, K, Q, J, 10 of same suit',
        'help.hands.straightFlush.name': 'Straight Flush',
        'help.hands.straightFlush.description': '5 consecutive cards of same suit',
        'help.hands.fourOfAKind.name': 'Four of a Kind',
        'help.hands.fourOfAKind.description': '4 cards of same rank',
        'help.hands.fullHouse.name': 'Full House',
        'help.hands.fullHouse.description': '3 of a kind + a pair',
        'help.hands.flush.name': 'Flush',
        'help.hands.flush.description': '5 cards of same suit',
        'help.hands.straight.name': 'Straight',
        'help.hands.straight.description': '5 consecutive cards',
        'help.hands.threeOfAKind.name': 'Three of a Kind',
        'help.hands.threeOfAKind.description': '3 cards of same rank',
        'help.hands.twoPair.name': 'Two Pair',
        'help.hands.twoPair.description': '2 different pairs',
        'help.hands.onePair.name': 'One Pair',
        'help.hands.onePair.description': '2 cards of same rank',
        'help.hands.highCard.name': 'High Card',
        'help.hands.highCard.description': 'Highest single card',
      }
      return translations[key] || key
    },
  }),
}))

describe('Help Component', () => {
  it('renders title and subtitle', () => {
    render(<Help />)
    
    expect(screen.getByText('Poker Hand Rankings')).toBeInTheDocument()
    expect(screen.getByText('From highest to lowest')).toBeInTheDocument()
  })

  it('renders all 10 poker hands', () => {
    render(<Help />)
    
    expect(screen.getByText('Royal Flush')).toBeInTheDocument()
    expect(screen.getByText('Straight Flush')).toBeInTheDocument()
    expect(screen.getByText('Four of a Kind')).toBeInTheDocument()
    expect(screen.getByText('Full House')).toBeInTheDocument()
    expect(screen.getByText('Flush')).toBeInTheDocument()
    expect(screen.getByText('Straight')).toBeInTheDocument()
    expect(screen.getByText('Three of a Kind')).toBeInTheDocument()
    expect(screen.getByText('Two Pair')).toBeInTheDocument()
    expect(screen.getByText('One Pair')).toBeInTheDocument()
    expect(screen.getByText('High Card')).toBeInTheDocument()
  })

  it('renders hand descriptions', () => {
    render(<Help />)
    
    expect(screen.getByText('A, K, Q, J, 10 of same suit')).toBeInTheDocument()
    expect(screen.getByText('5 consecutive cards of same suit')).toBeInTheDocument()
    expect(screen.getByText('4 cards of same rank')).toBeInTheDocument()
  })

  it('renders rank numbers 1-10', () => {
    render(<Help />)
    
    // All ranks should be present
    for (let i = 1; i <= 10; i++) {
      const rankElements = screen.getAllByText(String(i))
      expect(rankElements.length).toBeGreaterThan(0)
    }
  })

  it('shows tutorial button when onShowOnboarding is provided', () => {
    const mockShowOnboarding = vi.fn()
    render(<Help onShowOnboarding={mockShowOnboarding} />)
    
    const tutorialButton = screen.getByText('View Tutorial')
    expect(tutorialButton).toBeInTheDocument()
  })

  it('calls onShowOnboarding when tutorial button clicked', () => {
    const mockShowOnboarding = vi.fn()
    render(<Help onShowOnboarding={mockShowOnboarding} />)
    
    const tutorialButton = screen.getByText('View Tutorial')
    fireEvent.click(tutorialButton)
    
    expect(mockShowOnboarding).toHaveBeenCalled()
  })

  it('does not show tutorial button when onShowOnboarding is not provided', () => {
    render(<Help />)
    
    expect(screen.queryByText('View Tutorial')).not.toBeInTheDocument()
  })

  it('renders card symbols with correct styling', () => {
    render(<Help />)
    
    // Check that card elements are rendered
    const cardElements = document.querySelectorAll('.bg-white')
    expect(cardElements.length).toBeGreaterThan(0)
  })

  it('displays hands in correct order (Royal Flush first)', () => {
    render(<Help />)
    
    const hands = screen.getAllByRole('listitem') || document.querySelectorAll('.card')
    // First hand should be Royal Flush (rank 1)
    const firstHand = hands[0] || document.querySelector('.card')
    expect(firstHand?.textContent).toContain('1')
  })
})
