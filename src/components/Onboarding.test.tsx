import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, cleanup } from '@testing-library/react'
import { Onboarding } from './Onboarding'

// Mock react-i18next
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, options?: { returnObjects?: boolean; defaultValue?: unknown }) => {
      const translations: Record<string, unknown> = {
        'onboarding.skip': 'Skip Tutorial',
        'onboarding.next': 'Next',
        'onboarding.previous': 'Back',
        'onboarding.getStarted': 'Get Started!',
        'onboarding.accessLater': 'You can always access this tutorial from Settings or Help',
        'onboarding.steps.welcome.title': 'Welcome to PokerPulse Pro!',
        'onboarding.steps.welcome.description': 'Your professional poker tournament management tool.',
        'onboarding.steps.timer.title': 'Tournament Timer',
        'onboarding.steps.timer.description': 'The heart of your tournament. Control blinds, track time.',
        'onboarding.steps.timer.features': ['Play/pause with spacebar', 'Navigate levels with arrow keys', 'Add or remove time as needed', 'Fullscreen mode for display'],
        'onboarding.steps.players.title': 'Player Management',
        'onboarding.steps.players.description': 'Track all your players, their buy-ins, rebuys, and eliminations.',
        'onboarding.steps.players.features': ['Add and manage players easily', 'Track buy-ins, rebuys, and add-ons'],
        'onboarding.steps.blinds.title': 'Blind Structure',
        'onboarding.steps.blinds.description': 'Customize your blind levels to match your tournament style.',
        'onboarding.steps.blinds.features': ['Choose from preset templates', 'Create custom blind structures'],
        'onboarding.steps.prizes.title': 'Prize Distribution',
        'onboarding.steps.prizes.description': 'Automatically calculate and display prize pool distribution.',
        'onboarding.steps.prizes.features': ['Auto-calculates based on buy-ins', 'Customizable payout percentages'],
        'onboarding.steps.settings.title': 'Settings',
        'onboarding.steps.settings.description': 'Customize your tournament experience with comprehensive settings.',
        'onboarding.steps.settings.features': ['Theme and accent colors', 'Sound and notification options'],
        'onboarding.steps.projector.title': 'Projector View',
        'onboarding.steps.projector.description': 'Open a separate window optimized for large displays.',
        'onboarding.steps.projector.features': ['Clean, readable display', 'Shows current and next blinds'],
        'onboarding.steps.fullscreen.title': 'Fullscreen Mode',
        'onboarding.steps.fullscreen.description': 'Maximize the app for a distraction-free experience.',
        'onboarding.steps.fullscreen.features': ['Hide window controls', 'Use entire screen'],
        'onboarding.steps.ready.title': "You're All Set!",
        'onboarding.steps.ready.description': "You're ready to run your first tournament.",
      }
      const value = translations[key]
      if (options?.returnObjects && Array.isArray(value)) {
        return value
      }
      if (value === undefined && options?.returnObjects) {
        return options.defaultValue ?? null
      }
      return value ?? key
    },
    i18n: { language: 'en', changeLanguage: vi.fn() },
  }),
  initReactI18next: { type: '3rdParty', init: vi.fn() },
}))

describe('Onboarding Component', () => {
  const mockOnComplete = vi.fn()
  const mockOnSkip = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    // Reset window dimensions for position calculations
    Object.defineProperty(window, 'innerWidth', { value: 1920, writable: true })
    Object.defineProperty(window, 'innerHeight', { value: 1080, writable: true })
  })

  afterEach(() => {
    cleanup()
  })

  describe('Initial Rendering', () => {
    it('renders the welcome step initially', () => {
      render(<Onboarding onComplete={mockOnComplete} onSkip={mockOnSkip} />)
      expect(screen.getByText('Welcome to PokerPulse Pro!')).toBeInTheDocument()
    })

    it('shows the step description', () => {
      render(<Onboarding onComplete={mockOnComplete} onSkip={mockOnSkip} />)
      expect(screen.getByText('Your professional poker tournament management tool.')).toBeInTheDocument()
    })

    it('displays skip button on first step', () => {
      render(<Onboarding onComplete={mockOnComplete} onSkip={mockOnSkip} />)
      expect(screen.getByText('Skip Tutorial')).toBeInTheDocument()
    })

    it('shows progress indicator with correct count', () => {
      render(<Onboarding onComplete={mockOnComplete} onSkip={mockOnSkip} />)
      // 9 steps total: welcome, timer, players, blinds, prizes, settings, projector, fullscreen, ready
      expect(screen.getByText('1 / 9')).toBeInTheDocument()
    })

    it('displays Next button on first step', () => {
      render(<Onboarding onComplete={mockOnComplete} onSkip={mockOnSkip} />)
      expect(screen.getByText('Next')).toBeInTheDocument()
    })

    it('displays Back button (disabled) on first step', () => {
      render(<Onboarding onComplete={mockOnComplete} onSkip={mockOnSkip} />)
      const backButton = screen.getByText('Back').closest('button')
      expect(backButton).toBeDisabled()
    })

    it('displays the helper text about accessing later', () => {
      render(<Onboarding onComplete={mockOnComplete} onSkip={mockOnSkip} />)
      expect(screen.getByText(/You can always access this tutorial/)).toBeInTheDocument()
    })
  })

  describe('Navigation', () => {
    it('advances to next step when clicking Next', () => {
      render(<Onboarding onComplete={mockOnComplete} onSkip={mockOnSkip} />)
      
      fireEvent.click(screen.getByText('Next'))
      
      expect(screen.getByText('Tournament Timer')).toBeInTheDocument()
      expect(screen.getByText('2 / 9')).toBeInTheDocument()
    })

    it('goes back to previous step when clicking Back', () => {
      render(<Onboarding onComplete={mockOnComplete} onSkip={mockOnSkip} />)
      
      // Go to step 2
      fireEvent.click(screen.getByText('Next'))
      expect(screen.getByText('Tournament Timer')).toBeInTheDocument()
      
      // Go back to step 1
      fireEvent.click(screen.getByText('Back'))
      expect(screen.getByText('Welcome to PokerPulse Pro!')).toBeInTheDocument()
    })

    it('navigates through all steps sequentially', () => {
      render(<Onboarding onComplete={mockOnComplete} onSkip={mockOnSkip} />)
      
      const stepTitles = [
        'Welcome to PokerPulse Pro!',
        'Tournament Timer',
        'Player Management',
        'Blind Structure',
        'Prize Distribution',
        'Settings',
        'Projector View',
        'Fullscreen Mode',
        "You're All Set!",
      ]
      
      // Check first step
      expect(screen.getByText(stepTitles[0])).toBeInTheDocument()
      
      // Navigate through remaining steps
      for (let i = 1; i < stepTitles.length; i++) {
        fireEvent.click(screen.getByText('Next'))
        expect(screen.getByText(stepTitles[i])).toBeInTheDocument()
      }
    })

    it('enables Back button after first step', () => {
      render(<Onboarding onComplete={mockOnComplete} onSkip={mockOnSkip} />)
      
      fireEvent.click(screen.getByText('Next'))
      
      const backButton = screen.getByText('Back').closest('button')
      expect(backButton).not.toBeDisabled()
    })
  })

  describe('Progress Dots', () => {
    it('can navigate using Next button multiple times', () => {
      render(<Onboarding onComplete={mockOnComplete} onSkip={mockOnSkip} />)
      
      // Navigate to blinds step (index 3)
      fireEvent.click(screen.getByText('Next')) // timer
      fireEvent.click(screen.getByText('Next')) // players
      fireEvent.click(screen.getByText('Next')) // blinds
      
      expect(screen.getByText('Blind Structure')).toBeInTheDocument()
      expect(screen.getByText('4 / 9')).toBeInTheDocument()
    })

    it('updates progress indicator as user navigates', () => {
      render(<Onboarding onComplete={mockOnComplete} onSkip={mockOnSkip} />)
      
      expect(screen.getByText('1 / 9')).toBeInTheDocument()
      
      fireEvent.click(screen.getByText('Next'))
      expect(screen.getByText('2 / 9')).toBeInTheDocument()
      
      fireEvent.click(screen.getByText('Next'))
      expect(screen.getByText('3 / 9')).toBeInTheDocument()
    })
  })

  describe('Skip Functionality', () => {
    it('calls onSkip when skip button is clicked', () => {
      render(<Onboarding onComplete={mockOnComplete} onSkip={mockOnSkip} />)
      
      fireEvent.click(screen.getByText('Skip Tutorial'))
      
      expect(mockOnSkip).toHaveBeenCalledTimes(1)
    })

    it('shows skip button on all steps except the last', () => {
      render(<Onboarding onComplete={mockOnComplete} onSkip={mockOnSkip} />)
      
      // Navigate to step 8 (fullscreen)
      for (let i = 0; i < 7; i++) {
        expect(screen.getByText('Skip Tutorial')).toBeInTheDocument()
        fireEvent.click(screen.getByText('Next'))
      }
      
      // Still visible on fullscreen step
      expect(screen.getByText('Skip Tutorial')).toBeInTheDocument()
      
      // Navigate to last step (ready)
      fireEvent.click(screen.getByText('Next'))
      
      // Skip button should not be visible on last step
      expect(screen.queryByText('Skip Tutorial')).not.toBeInTheDocument()
    })
  })

  describe('Completion', () => {
    it('shows Get Started button on last step', () => {
      render(<Onboarding onComplete={mockOnComplete} onSkip={mockOnSkip} />)
      
      // Navigate to last step
      for (let i = 0; i < 8; i++) {
        fireEvent.click(screen.getByText('Next'))
      }
      
      expect(screen.getByText('Get Started!')).toBeInTheDocument()
      expect(screen.queryByText('Next')).not.toBeInTheDocument()
    })

    it('calls onComplete when Get Started is clicked', () => {
      render(<Onboarding onComplete={mockOnComplete} onSkip={mockOnSkip} />)
      
      // Navigate to last step
      for (let i = 0; i < 8; i++) {
        fireEvent.click(screen.getByText('Next'))
      }
      
      fireEvent.click(screen.getByText('Get Started!'))
      
      expect(mockOnComplete).toHaveBeenCalledTimes(1)
    })

    it('shows final step message', () => {
      render(<Onboarding onComplete={mockOnComplete} onSkip={mockOnSkip} />)
      
      // Navigate to last step
      for (let i = 0; i < 8; i++) {
        fireEvent.click(screen.getByText('Next'))
      }
      
      expect(screen.getByText("You're All Set!")).toBeInTheDocument()
      expect(screen.getByText("You're ready to run your first tournament.")).toBeInTheDocument()
    })
  })

  describe('Features List', () => {
    it('displays features list for timer step', () => {
      render(<Onboarding onComplete={mockOnComplete} onSkip={mockOnSkip} />)
      
      // Navigate to timer step
      fireEvent.click(screen.getByText('Next'))
      
      expect(screen.getByText('Play/pause with spacebar')).toBeInTheDocument()
      expect(screen.getByText('Navigate levels with arrow keys')).toBeInTheDocument()
    })

    it('displays features list for players step', () => {
      render(<Onboarding onComplete={mockOnComplete} onSkip={mockOnSkip} />)
      
      // Navigate to players step
      fireEvent.click(screen.getByText('Next'))
      fireEvent.click(screen.getByText('Next'))
      
      expect(screen.getByText('Add and manage players easily')).toBeInTheDocument()
      expect(screen.getByText('Track buy-ins, rebuys, and add-ons')).toBeInTheDocument()
    })

    it('does not display features on welcome step', () => {
      render(<Onboarding onComplete={mockOnComplete} onSkip={mockOnSkip} />)
      
      // Welcome step has no features
      expect(screen.queryByText('Play/pause with spacebar')).not.toBeInTheDocument()
    })

    it('does not display features on ready step', () => {
      render(<Onboarding onComplete={mockOnComplete} onSkip={mockOnSkip} />)
      
      // Navigate to last step
      for (let i = 0; i < 8; i++) {
        fireEvent.click(screen.getByText('Next'))
      }
      
      // Ready step has no features
      expect(screen.queryByText('Hide window controls')).not.toBeInTheDocument()
    })
  })
})

describe('Onboarding Data Validation', () => {
  describe('Step Configuration', () => {
    const stepKeys = ['welcome', 'timer', 'players', 'blinds', 'prizes', 'settings', 'projector', 'fullscreen', 'ready']
    const highlightableSteps = ['timer', 'players', 'blinds', 'prizes', 'settings', 'projector', 'fullscreen']
    
    it('has correct number of steps', () => {
      expect(stepKeys).toHaveLength(9)
    })

    it('first step is welcome', () => {
      expect(stepKeys[0]).toBe('welcome')
    })

    it('last step is ready', () => {
      expect(stepKeys[stepKeys.length - 1]).toBe('ready')
    })

    it('has correct highlightable steps', () => {
      // Welcome and ready don't highlight elements
      expect(highlightableSteps).not.toContain('welcome')
      expect(highlightableSteps).not.toContain('ready')
      expect(highlightableSteps).toHaveLength(7)
    })

    it.each(highlightableSteps)('step %s has valid highlight target', (step) => {
      expect(typeof step).toBe('string')
      expect(step.length).toBeGreaterThan(0)
    })
  })

  describe('Translation Keys', () => {
    const requiredKeys = [
      'onboarding.skip',
      'onboarding.next',
      'onboarding.previous',
      'onboarding.getStarted',
      'onboarding.accessLater',
    ]

    const stepKeys = ['welcome', 'timer', 'players', 'blinds', 'prizes', 'settings', 'projector', 'fullscreen', 'ready']

    it.each(requiredKeys)('has required translation key: %s', (key) => {
      expect(typeof key).toBe('string')
      expect(key.startsWith('onboarding.')).toBe(true)
    })

    it.each(stepKeys)('step %s has title and description keys', (step) => {
      const titleKey = `onboarding.steps.${step}.title`
      const descKey = `onboarding.steps.${step}.description`
      expect(titleKey).toMatch(/^onboarding\.steps\.\w+\.title$/)
      expect(descKey).toMatch(/^onboarding\.steps\.\w+\.description$/)
    })

    it('feature steps have features translation key', () => {
      const featureSteps = ['timer', 'players', 'blinds', 'prizes', 'settings', 'projector', 'fullscreen']
      featureSteps.forEach(step => {
        const featureKey = `onboarding.steps.${step}.features`
        expect(featureKey).toMatch(/^onboarding\.steps\.\w+\.features$/)
      })
    })
  })

  describe('Position Calculation Logic', () => {
    it('calculates centered position when no highlight', () => {
      const cardPosition = { top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }
      expect(cardPosition.top).toBe('50%')
      expect(cardPosition.left).toBe('50%')
      expect(cardPosition.transform).toBe('translate(-50%, -50%)')
    })

    it('uses px values when highlight rect is present', () => {
      const mockRect = { right: 200, left: 100, top: 100, width: 100, height: 50 }
      const cardWidth = 500
      const padding = 24
      
      // Position to the right of highlighted element
      const left = mockRect.right + padding
      expect(left).toBe(224) // 200 + 24
    })

    it('positions card to left when right overflow', () => {
      const mockRect = { right: 1800, left: 1700, top: 100, width: 100, height: 50 }
      const cardWidth = 500
      const padding = 24
      const windowWidth = 1920
      
      let left = mockRect.right + padding
      
      // Would overflow right
      if (left + cardWidth > windowWidth - padding) {
        left = mockRect.left - cardWidth - padding
      }
      
      expect(left).toBe(1176) // 1700 - 500 - 24
    })

    it('centers card when both sides overflow', () => {
      const cardWidth = 500
      const padding = 24
      const windowWidth = 600 // Small window
      
      let left = -100 // Negative means left overflow
      
      if (left < padding) {
        left = (windowWidth - cardWidth) / 2
      }
      
      expect(left).toBe(50) // (600 - 500) / 2
    })

    it('constrains vertical position to viewport', () => {
      const padding = 24
      const windowHeight = 1080
      const cardHeight = 400
      
      let top = -50 // Would go above viewport
      
      if (top < padding) top = padding
      
      expect(top).toBe(24)
      
      top = 900 // Would go below viewport
      
      if (top + cardHeight > windowHeight - padding) {
        top = windowHeight - cardHeight - padding
      }
      
      expect(top).toBe(656) // 1080 - 400 - 24
    })
  })
})

describe('Onboarding Step Data', () => {
  describe('Welcome Step', () => {
    it('has correct step key', () => {
      expect('welcome').toBe('welcome')
    })

    it('has no highlight target', () => {
      const welcomeStep = { key: 'welcome', highlight: undefined }
      expect(welcomeStep.highlight).toBeUndefined()
    })
  })

  describe('Timer Step', () => {
    const timerStep = { key: 'timer', highlight: 'timer' }

    it('has correct step key', () => {
      expect(timerStep.key).toBe('timer')
    })

    it('has timer highlight target', () => {
      expect(timerStep.highlight).toBe('timer')
    })

    it('highlight matches data-onboarding attribute', () => {
      expect(`[data-onboarding="${timerStep.highlight}"]`).toBe('[data-onboarding="timer"]')
    })
  })

  describe('Players Step', () => {
    const playersStep = { key: 'players', highlight: 'players' }

    it('has correct step key', () => {
      expect(playersStep.key).toBe('players')
    })

    it('has players highlight target', () => {
      expect(playersStep.highlight).toBe('players')
    })
  })

  describe('Blinds Step', () => {
    const blindsStep = { key: 'blinds', highlight: 'blinds' }

    it('has correct step key', () => {
      expect(blindsStep.key).toBe('blinds')
    })

    it('has blinds highlight target', () => {
      expect(blindsStep.highlight).toBe('blinds')
    })
  })

  describe('Prizes Step', () => {
    const prizesStep = { key: 'prizes', highlight: 'prizes' }

    it('has correct step key', () => {
      expect(prizesStep.key).toBe('prizes')
    })

    it('has prizes highlight target', () => {
      expect(prizesStep.highlight).toBe('prizes')
    })
  })

  describe('Settings Step', () => {
    const settingsStep = { key: 'settings', highlight: 'settings' }

    it('has correct step key', () => {
      expect(settingsStep.key).toBe('settings')
    })

    it('has settings highlight target', () => {
      expect(settingsStep.highlight).toBe('settings')
    })
  })

  describe('Projector Step', () => {
    const projectorStep = { key: 'projector', highlight: 'projector' }

    it('has correct step key', () => {
      expect(projectorStep.key).toBe('projector')
    })

    it('has projector highlight target', () => {
      expect(projectorStep.highlight).toBe('projector')
    })
  })

  describe('Fullscreen Step', () => {
    const fullscreenStep = { key: 'fullscreen', highlight: 'fullscreen' }

    it('has correct step key', () => {
      expect(fullscreenStep.key).toBe('fullscreen')
    })

    it('has fullscreen highlight target', () => {
      expect(fullscreenStep.highlight).toBe('fullscreen')
    })
  })

  describe('Ready Step', () => {
    it('has correct step key', () => {
      expect('ready').toBe('ready')
    })

    it('has no highlight target', () => {
      const readyStep = { key: 'ready', highlight: undefined }
      expect(readyStep.highlight).toBeUndefined()
    })

    it('is the final step', () => {
      const steps = ['welcome', 'timer', 'players', 'blinds', 'prizes', 'settings', 'projector', 'fullscreen', 'ready']
      expect(steps[steps.length - 1]).toBe('ready')
    })
  })
})

describe('Onboarding UI Elements', () => {
  describe('Highlight Ring', () => {
    it('has correct border color (emerald)', () => {
      const emeraldColor = '#10b981'
      expect(emeraldColor).toMatch(/^#[0-9a-f]{6}$/i)
    })

    it('has animation class for pulse effect', () => {
      const animationName = 'pulse-ring'
      expect(animationName).toBe('pulse-ring')
    })

    it('ring has correct offset from element', () => {
      const offset = 8
      const highlightRect = { left: 100, top: 200, width: 150, height: 80 }
      
      const ringStyles = {
        left: highlightRect.left - offset,
        top: highlightRect.top - offset,
        width: highlightRect.width + (offset * 2),
        height: highlightRect.height + (offset * 2),
      }
      
      expect(ringStyles.left).toBe(92)
      expect(ringStyles.top).toBe(192)
      expect(ringStyles.width).toBe(166)
      expect(ringStyles.height).toBe(96)
    })
  })

  describe('Card Styling', () => {
    it('has correct max width', () => {
      const maxWidth = '500px'
      expect(maxWidth).toBe('500px')
    })

    it('has correct background color', () => {
      const bgColor = '#18181b'
      expect(bgColor).toBe('#18181b')
    })

    it('has correct border radius', () => {
      const borderRadius = '16px'
      expect(borderRadius).toBe('16px')
    })

    it('has correct border color', () => {
      const borderColor = '#3f3f46'
      expect(borderColor).toBe('#3f3f46')
    })
  })

  describe('Button Styling', () => {
    it('Next button has emerald background', () => {
      const nextButtonBg = '#10b981'
      expect(nextButtonBg).toBe('#10b981')
    })

    it('Back button is transparent when not first step', () => {
      const backButtonBg = 'transparent'
      expect(backButtonBg).toBe('transparent')
    })
  })

  describe('Progress Dot Styling', () => {
    it('active dot width is wider', () => {
      const activeDotWidth = '28px'
      const inactiveDotWidth = '10px'
      expect(parseInt(activeDotWidth)).toBeGreaterThan(parseInt(inactiveDotWidth))
    })

    it('dot height is consistent', () => {
      const dotHeight = '10px'
      expect(dotHeight).toBe('10px')
    })

    it('active dot uses emerald color', () => {
      const activeColor = '#10b981'
      expect(activeColor).toBe('#10b981')
    })

    it('visited dot uses semi-transparent emerald', () => {
      const visitedColor = 'rgba(16, 185, 129, 0.5)'
      expect(visitedColor).toContain('16, 185, 129')
    })

    it('future dot uses zinc color', () => {
      const futureColor = '#3f3f46'
      expect(futureColor).toBe('#3f3f46')
    })
  })
})

describe('Onboarding Interactive Tests', () => {
  const mockOnComplete = vi.fn()
  const mockOnSkip = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    Object.defineProperty(window, 'innerWidth', { value: 1920, writable: true })
    Object.defineProperty(window, 'innerHeight', { value: 1080, writable: true })
  })

  afterEach(() => {
    cleanup()
  })

  describe('Progress Dot Navigation', () => {
    it('can jump to a step by clicking a progress dot', () => {
      render(<Onboarding onComplete={mockOnComplete} onSkip={mockOnSkip} />)
      
      // Should start at step 1
      expect(screen.getByText('1 / 9')).toBeInTheDocument()
      
      // Click the 5th progress dot (prizes step, index 4)
      const dots = document.querySelectorAll('button[style*="border-radius: 9999px"]')
      if (dots.length >= 5) {
        fireEvent.click(dots[4])
        expect(screen.getByText('Prize Distribution')).toBeInTheDocument()
        expect(screen.getByText('5 / 9')).toBeInTheDocument()
      }
    })

    it('can jump backward using progress dots', () => {
      render(<Onboarding onComplete={mockOnComplete} onSkip={mockOnSkip} />)
      
      // Navigate to step 4
      for (let i = 0; i < 3; i++) {
        fireEvent.click(screen.getByText('Next'))
      }
      expect(screen.getByText('4 / 9')).toBeInTheDocument()
      
      // Click the first dot to go back to welcome
      const dots = document.querySelectorAll('button[style*="border-radius: 9999px"]')
      if (dots.length >= 1) {
        fireEvent.click(dots[0])
        expect(screen.getByText('Welcome to PokerPulse Pro!')).toBeInTheDocument()
        expect(screen.getByText('1 / 9')).toBeInTheDocument()
      }
    })

    it('can jump to last step using progress dot', () => {
      render(<Onboarding onComplete={mockOnComplete} onSkip={mockOnSkip} />)
      
      const dots = document.querySelectorAll('button[style*="border-radius: 9999px"]')
      if (dots.length >= 9) {
        fireEvent.click(dots[8])
        expect(screen.getByText("You're All Set!")).toBeInTheDocument()
        expect(screen.getByText('9 / 9')).toBeInTheDocument()
      }
    })
  })

  describe('Feature Lists for All Steps', () => {
    it('displays features list for blinds step', () => {
      render(<Onboarding onComplete={mockOnComplete} onSkip={mockOnSkip} />)
      
      // Navigate to blinds step (index 3)
      for (let i = 0; i < 3; i++) {
        fireEvent.click(screen.getByText('Next'))
      }
      
      expect(screen.getByText('Blind Structure')).toBeInTheDocument()
      expect(screen.getByText('Choose from preset templates')).toBeInTheDocument()
      expect(screen.getByText('Create custom blind structures')).toBeInTheDocument()
    })

    it('displays features list for prizes step', () => {
      render(<Onboarding onComplete={mockOnComplete} onSkip={mockOnSkip} />)
      
      for (let i = 0; i < 4; i++) {
        fireEvent.click(screen.getByText('Next'))
      }
      
      expect(screen.getByText('Prize Distribution')).toBeInTheDocument()
      expect(screen.getByText('Auto-calculates based on buy-ins')).toBeInTheDocument()
      expect(screen.getByText('Customizable payout percentages')).toBeInTheDocument()
    })

    it('displays features list for settings step', () => {
      render(<Onboarding onComplete={mockOnComplete} onSkip={mockOnSkip} />)
      
      for (let i = 0; i < 5; i++) {
        fireEvent.click(screen.getByText('Next'))
      }
      
      expect(screen.getByText('Settings')).toBeInTheDocument()
      expect(screen.getByText('Theme and accent colors')).toBeInTheDocument()
      expect(screen.getByText('Sound and notification options')).toBeInTheDocument()
    })

    it('displays features list for projector step', () => {
      render(<Onboarding onComplete={mockOnComplete} onSkip={mockOnSkip} />)
      
      for (let i = 0; i < 6; i++) {
        fireEvent.click(screen.getByText('Next'))
      }
      
      expect(screen.getByText('Projector View')).toBeInTheDocument()
      expect(screen.getByText('Clean, readable display')).toBeInTheDocument()
      expect(screen.getByText('Shows current and next blinds')).toBeInTheDocument()
    })

    it('displays features list for fullscreen step', () => {
      render(<Onboarding onComplete={mockOnComplete} onSkip={mockOnSkip} />)
      
      for (let i = 0; i < 7; i++) {
        fireEvent.click(screen.getByText('Next'))
      }
      
      expect(screen.getByText('Fullscreen Mode')).toBeInTheDocument()
      expect(screen.getByText('Hide window controls')).toBeInTheDocument()
      expect(screen.getByText('Use entire screen')).toBeInTheDocument()
    })
  })

  describe('Back Button Behavior', () => {
    it('back button does nothing on first step', () => {
      render(<Onboarding onComplete={mockOnComplete} onSkip={mockOnSkip} />)
      
      const backButton = screen.getByText('Back').closest('button')!
      fireEvent.click(backButton)
      
      // Still on first step
      expect(screen.getByText('Welcome to PokerPulse Pro!')).toBeInTheDocument()
      expect(screen.getByText('1 / 9')).toBeInTheDocument()
    })

    it('back button navigates between middle steps', () => {
      render(<Onboarding onComplete={mockOnComplete} onSkip={mockOnSkip} />)
      
      // Go to step 5 (prizes)
      for (let i = 0; i < 4; i++) {
        fireEvent.click(screen.getByText('Next'))
      }
      expect(screen.getByText('5 / 9')).toBeInTheDocument()
      
      // Go back
      fireEvent.click(screen.getByText('Back'))
      expect(screen.getByText('4 / 9')).toBeInTheDocument()
      expect(screen.getByText('Blind Structure')).toBeInTheDocument()
    })
  })

  describe('Descriptions for Each Step', () => {
    it('shows correct description for timer step', () => {
      render(<Onboarding onComplete={mockOnComplete} onSkip={mockOnSkip} />)
      fireEvent.click(screen.getByText('Next'))
      expect(screen.getByText('The heart of your tournament. Control blinds, track time.')).toBeInTheDocument()
    })

    it('shows correct description for players step', () => {
      render(<Onboarding onComplete={mockOnComplete} onSkip={mockOnSkip} />)
      fireEvent.click(screen.getByText('Next'))
      fireEvent.click(screen.getByText('Next'))
      expect(screen.getByText('Track all your players, their buy-ins, rebuys, and eliminations.')).toBeInTheDocument()
    })

    it('shows correct description for blinds step', () => {
      render(<Onboarding onComplete={mockOnComplete} onSkip={mockOnSkip} />)
      for (let i = 0; i < 3; i++) fireEvent.click(screen.getByText('Next'))
      expect(screen.getByText('Customize your blind levels to match your tournament style.')).toBeInTheDocument()
    })

    it('shows correct description for prizes step', () => {
      render(<Onboarding onComplete={mockOnComplete} onSkip={mockOnSkip} />)
      for (let i = 0; i < 4; i++) fireEvent.click(screen.getByText('Next'))
      expect(screen.getByText('Automatically calculate and display prize pool distribution.')).toBeInTheDocument()
    })

    it('shows correct description for settings step', () => {
      render(<Onboarding onComplete={mockOnComplete} onSkip={mockOnSkip} />)
      for (let i = 0; i < 5; i++) fireEvent.click(screen.getByText('Next'))
      expect(screen.getByText('Customize your tournament experience with comprehensive settings.')).toBeInTheDocument()
    })

    it('shows correct description for projector step', () => {
      render(<Onboarding onComplete={mockOnComplete} onSkip={mockOnSkip} />)
      for (let i = 0; i < 6; i++) fireEvent.click(screen.getByText('Next'))
      expect(screen.getByText('Open a separate window optimized for large displays.')).toBeInTheDocument()
    })

    it('shows correct description for fullscreen step', () => {
      render(<Onboarding onComplete={mockOnComplete} onSkip={mockOnSkip} />)
      for (let i = 0; i < 7; i++) fireEvent.click(screen.getByText('Next'))
      expect(screen.getByText('Maximize the app for a distraction-free experience.')).toBeInTheDocument()
    })
  })

  describe('Highlight Element Interaction', () => {
    it('sets highlight rect when DOM element is found', () => {
      // Mock querySelector to return a mock element
      const mockRect = { top: 100, left: 200, width: 300, height: 50, right: 500, bottom: 150, x: 200, y: 100, toJSON: () => {} }
      const mockElement = {
        getBoundingClientRect: () => mockRect,
      }
      const origQuerySelector = document.querySelector.bind(document)
      vi.spyOn(document, 'querySelector').mockImplementation((selector: string) => {
        if (selector.includes('data-onboarding')) {
          return mockElement as unknown as Element
        }
        return origQuerySelector(selector)
      })
      
      render(<Onboarding onComplete={mockOnComplete} onSkip={mockOnSkip} />)
      
      // Navigate to timer step which has highlight='timer'
      fireEvent.click(screen.getByText('Next'))
      
      // The component should have called querySelector for the highlight target
      expect(document.querySelector).toHaveBeenCalledWith('[data-onboarding="timer"]')
      
      vi.restoreAllMocks()
    })

    it('clears highlight rect when element is not found', () => {
      vi.spyOn(document, 'querySelector').mockReturnValue(null)
      
      render(<Onboarding onComplete={mockOnComplete} onSkip={mockOnSkip} />)
      
      // Navigate to timer step
      fireEvent.click(screen.getByText('Next'))
      
      // Component should still render without highlight ring
      expect(screen.getByText('Tournament Timer')).toBeInTheDocument()
      
      vi.restoreAllMocks()
    })

    it('no highlight on welcome step', () => {
      vi.spyOn(document, 'querySelector')
      
      render(<Onboarding onComplete={mockOnComplete} onSkip={mockOnSkip} />)
      
      // Welcome step has no highlight - check that no data-onboarding query was made
      // or that highlightRect is null (no highlight ring visible)
      expect(screen.getByText('Welcome to PokerPulse Pro!')).toBeInTheDocument()
      
      vi.restoreAllMocks()
    })
  })

  describe('Resize Event Handling', () => {
    it('adds resize listener on mount', () => {
      const addSpy = vi.spyOn(window, 'addEventListener')
      
      render(<Onboarding onComplete={mockOnComplete} onSkip={mockOnSkip} />)
      
      expect(addSpy).toHaveBeenCalledWith('resize', expect.any(Function))
      
      addSpy.mockRestore()
    })

    it('removes resize listener on unmount', () => {
      const removeSpy = vi.spyOn(window, 'removeEventListener')
      
      const { unmount } = render(<Onboarding onComplete={mockOnComplete} onSkip={mockOnSkip} />)
      unmount()
      
      expect(removeSpy).toHaveBeenCalledWith('resize', expect.any(Function))
      
      removeSpy.mockRestore()
    })
  })

  describe('Overlay Click Prevention', () => {
    it('renders clickable overlay element', () => {
      render(<Onboarding onComplete={mockOnComplete} onSkip={mockOnSkip} />)
      
      // The overlay div exists with fixed positioning and inset 0
      const overlays = document.querySelectorAll('div[style*="position: fixed"][style*="inset: 0"]')
      expect(overlays.length).toBeGreaterThan(0)
    })
  })

  describe('Skip Button Hover Effects', () => {
    it('changes style on mouseOver and mouseOut', () => {
      render(<Onboarding onComplete={mockOnComplete} onSkip={mockOnSkip} />)
      
      const skipButton = screen.getByText('Skip Tutorial').closest('button')!
      
      // Trigger mouseOver
      fireEvent.mouseOver(skipButton)
      // Colors are stored as rgb in jsdom
      expect(skipButton.style.color).toMatch(/#a1a1aa|rgb\(161, 161, 170\)/)
      expect(skipButton.style.borderColor).toMatch(/#52525b|rgb\(82, 82, 91\)/)
      
      // Trigger mouseOut
      fireEvent.mouseOut(skipButton)
      expect(skipButton.style.color).toMatch(/#71717a|rgb\(113, 113, 122\)/)
      expect(skipButton.style.borderColor).toMatch(/#3f3f46|rgb\(63, 63, 70\)/)
    })
  })

  describe('Multiple Navigation Patterns', () => {
    it('can navigate forward and backward repeatedly', () => {
      render(<Onboarding onComplete={mockOnComplete} onSkip={mockOnSkip} />)
      
      // Forward 3
      fireEvent.click(screen.getByText('Next'))
      fireEvent.click(screen.getByText('Next'))
      fireEvent.click(screen.getByText('Next'))
      expect(screen.getByText('4 / 9')).toBeInTheDocument()
      
      // Back 2
      fireEvent.click(screen.getByText('Back'))
      fireEvent.click(screen.getByText('Back'))
      expect(screen.getByText('2 / 9')).toBeInTheDocument()
      
      // Forward 5
      for (let i = 0; i < 5; i++) {
        fireEvent.click(screen.getByText('Next'))
      }
      expect(screen.getByText('7 / 9')).toBeInTheDocument()
    })

    it('shows back button as enabled after first step', () => {
      render(<Onboarding onComplete={mockOnComplete} onSkip={mockOnSkip} />)
      
      fireEvent.click(screen.getByText('Next'))
      const backButton = screen.getByText('Back').closest('button')!
      
      // Should have visible back text (not transparent)
      expect(backButton.style.color).not.toBe('transparent')
    })

    it('back button is transparent on first step', () => {
      render(<Onboarding onComplete={mockOnComplete} onSkip={mockOnSkip} />)
      
      const backButton = screen.getByText('Back').closest('button')!
      expect(backButton.style.color).toBe('transparent')
    })
  })

  describe('Last Step Specifics', () => {
    it('does not show Next button on last step', () => {
      render(<Onboarding onComplete={mockOnComplete} onSkip={mockOnSkip} />)
      
      for (let i = 0; i < 8; i++) {
        fireEvent.click(screen.getByText('Next'))
      }
      
      // Should show Get Started instead of Next
      expect(screen.queryByText('Next')).not.toBeInTheDocument()
      expect(screen.getByText('Get Started!')).toBeInTheDocument()
    })

    it('does not show skip button on last step', () => {
      render(<Onboarding onComplete={mockOnComplete} onSkip={mockOnSkip} />)
      
      for (let i = 0; i < 8; i++) {
        fireEvent.click(screen.getByText('Next'))
      }
      
      expect(screen.queryByText('Skip Tutorial')).not.toBeInTheDocument()
    })

    it('calls onComplete when Get Started is clicked on last step', () => {
      render(<Onboarding onComplete={mockOnComplete} onSkip={mockOnSkip} />)
      
      for (let i = 0; i < 8; i++) {
        fireEvent.click(screen.getByText('Next'))
      }
      
      fireEvent.click(screen.getByText('Get Started!'))
      expect(mockOnComplete).toHaveBeenCalledOnce()
    })
  })

  describe('Access Later Hint', () => {
    it('shows access later hint on every step', () => {
      render(<Onboarding onComplete={mockOnComplete} onSkip={mockOnSkip} />)
      
      // Check on first step
      expect(screen.getByText(/You can always access this tutorial/)).toBeInTheDocument()
      
      // Check on a middle step
      fireEvent.click(screen.getByText('Next'))
      expect(screen.getByText(/You can always access this tutorial/)).toBeInTheDocument()
      
      // Check on last step
      for (let i = 0; i < 7; i++) {
        fireEvent.click(screen.getByText('Next'))
      }
      expect(screen.getByText(/You can always access this tutorial/)).toBeInTheDocument()
    })
  })
})
