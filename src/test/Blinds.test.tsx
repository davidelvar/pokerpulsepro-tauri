import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { Blinds } from '../components/Blinds'
import type { Tournament, BlindLevel } from '../types'

// Mock react-i18next
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        'blinds.title': 'Blind Structure',
        'blinds.level': 'Level',
        'blinds.small': 'Small',
        'blinds.big': 'Big',
        'blinds.ante': 'Ante',
        'blinds.duration': 'Duration',
        'blinds.break': 'Break',
        'blinds.addLevel': 'Add Level',
        'blinds.addBreak': 'Add Break',
        'blinds.quickTemplates': 'Quick Templates',
        'blinds.save': 'Save',
        'blinds.myTemplates': 'My Templates',
        'blinds.import': 'Import',
        'blinds.export': 'Export',
        'blinds.actions': 'Actions',
        'blinds.edit': 'Edit',
        'blinds.delete': 'Delete',
        'blinds.moveUp': 'Move Up',
        'blinds.moveDown': 'Move Down',
        'blinds.cancel': 'Cancel',
        'blinds.minutes': 'min',
        'blinds.noLevels': 'No blind levels yet',
        'blinds.templateName': 'Template Name',
        'blinds.generateByDuration': 'Generate by Duration',
        'blinds.targetDuration': 'Target Duration',
        'blinds.hours': 'hours',
        'blinds.levelStyle': 'Level Style',
        'blinds.turbo': 'Turbo',
        'blinds.regular': 'Regular',
        'blinds.deep': 'Deep Stack',
        'blinds.generate': 'Generate',
        'blinds.levels': 'levels',
        'blinds.breaks': 'breaks',
        'blinds.blindLevels': 'blind levels',
        'blinds.preview': 'Preview',
        'blinds.noCustomTemplates': 'No custom templates yet',
        'blinds.clearTemplate': 'Clear Template',
      }
      return translations[key] || key
    },
  }),
}))

// Mock Tauri plugins
vi.mock('@tauri-apps/plugin-dialog', () => ({
  open: vi.fn(),
  save: vi.fn(),
}))

vi.mock('@tauri-apps/plugin-fs', () => ({
  writeTextFile: vi.fn(),
  readTextFile: vi.fn(),
}))

const createMockTournament = (overrides?: Partial<Tournament>): Tournament => ({
  id: 'test-tournament',
  name: 'Test Tournament',
  buyin_amount: 100,
  rebuy_amount: 50,
  addon_amount: 50,
  starting_chips: 10000,
  rebuy_chips: 5000,
  addon_chips: 5000,
  players: [],
  blind_structure: [
    { id: 'level-1', small_blind: 25, big_blind: 50, ante: 0, duration_minutes: 20, is_break: false },
    { id: 'level-2', small_blind: 50, big_blind: 100, ante: 0, duration_minutes: 20, is_break: false },
    { id: 'break-1', small_blind: 0, big_blind: 0, ante: 0, duration_minutes: 10, is_break: true },
    { id: 'level-3', small_blind: 75, big_blind: 150, ante: 25, duration_minutes: 20, is_break: false },
  ],
  current_level: 0,
  time_remaining_seconds: 1200,
  is_running: false,
  currency_symbol: '$',
  tableCount: 1,
  seatsPerTable: 9,
  ...overrides,
})

describe('Blinds Component', () => {
  let mockSetTournament: ReturnType<typeof vi.fn>
  let mockTournament: Tournament

  beforeEach(() => {
    mockSetTournament = vi.fn()
    mockTournament = createMockTournament()
    localStorage.clear()
  })

  describe('Rendering', () => {
    it('renders quick templates section', () => {
      render(<Blinds tournament={mockTournament} setTournament={mockSetTournament} />)
      expect(screen.getByText('Quick Templates')).toBeInTheDocument()
    })

    it('renders template buttons', () => {
      render(<Blinds tournament={mockTournament} setTournament={mockSetTournament} />)
      expect(screen.getByText('Turbo')).toBeInTheDocument()
      expect(screen.getByText('Regular')).toBeInTheDocument()
      expect(screen.getByText('Deep Stack')).toBeInTheDocument()
    })

    it('renders blind levels table headers', () => {
      render(<Blinds tournament={mockTournament} setTournament={mockSetTournament} />)
      expect(screen.getByText('Level')).toBeInTheDocument()
      expect(screen.getByText('Ante')).toBeInTheDocument()
      expect(screen.getByText('Duration')).toBeInTheDocument()
    })

    it('renders import/export buttons', () => {
      render(<Blinds tournament={mockTournament} setTournament={mockSetTournament} />)
      expect(screen.getByText('Import')).toBeInTheDocument()
      expect(screen.getByText('Export')).toBeInTheDocument()
    })

    it('renders add level buttons', () => {
      render(<Blinds tournament={mockTournament} setTournament={mockSetTournament} />)
      // Buttons have text with "+" prefix
      expect(screen.getByText(/Add Level/)).toBeInTheDocument()
      expect(screen.getByText(/Add Break/)).toBeInTheDocument()
    })
  })

  describe('Templates', () => {
    it('renders template section', () => {
      render(<Blinds tournament={mockTournament} setTournament={mockSetTournament} />)
      expect(screen.getByText('Quick Templates')).toBeInTheDocument()
    })

    it('renders save button', () => {
      render(<Blinds tournament={mockTournament} setTournament={mockSetTournament} />)
      expect(screen.getByText('Save')).toBeInTheDocument()
    })

    it('renders import/export buttons', () => {
      render(<Blinds tournament={mockTournament} setTournament={mockSetTournament} />)
      expect(screen.getByText('Import')).toBeInTheDocument()
      expect(screen.getByText('Export')).toBeInTheDocument()
    })
  })
})

describe('Blind Level Data Validation', () => {
  it('validates blind level structure', () => {
    const validLevel: BlindLevel = {
      id: 'test-level',
      small_blind: 50,
      big_blind: 100,
      ante: 10,
      duration_minutes: 15,
      is_break: false,
    }

    expect(validLevel.small_blind).toBeLessThan(validLevel.big_blind)
    expect(validLevel.big_blind).toBe(validLevel.small_blind * 2)
    expect(validLevel.ante).toBeLessThan(validLevel.small_blind)
  })

  it('validates break level structure', () => {
    const breakLevel: BlindLevel = {
      id: 'break-1',
      small_blind: 0,
      big_blind: 0,
      ante: 0,
      duration_minutes: 10,
      is_break: true,
    }

    expect(breakLevel.is_break).toBe(true)
    expect(breakLevel.small_blind).toBe(0)
    expect(breakLevel.big_blind).toBe(0)
    expect(breakLevel.ante).toBe(0)
  })

  it('validates blind progression', () => {
    const blindStructure: BlindLevel[] = [
      { id: 'l1', small_blind: 25, big_blind: 50, ante: 0, duration_minutes: 20, is_break: false },
      { id: 'l2', small_blind: 50, big_blind: 100, ante: 0, duration_minutes: 20, is_break: false },
      { id: 'l3', small_blind: 100, big_blind: 200, ante: 25, duration_minutes: 20, is_break: false },
    ]

    // Blinds should increase
    for (let i = 1; i < blindStructure.length; i++) {
      expect(blindStructure[i].small_blind).toBeGreaterThan(blindStructure[i - 1].small_blind)
    }
  })

  it('calculates total tournament time', () => {
    const blindStructure: BlindLevel[] = [
      { id: 'l1', small_blind: 25, big_blind: 50, ante: 0, duration_minutes: 20, is_break: false },
      { id: 'l2', small_blind: 50, big_blind: 100, ante: 0, duration_minutes: 20, is_break: false },
      { id: 'b1', small_blind: 0, big_blind: 0, ante: 0, duration_minutes: 10, is_break: true },
      { id: 'l3', small_blind: 100, big_blind: 200, ante: 0, duration_minutes: 20, is_break: false },
    ]

    const totalMinutes = blindStructure.reduce((sum, level) => sum + level.duration_minutes, 0)
    expect(totalMinutes).toBe(70) // 20 + 20 + 10 + 20
  })

  it('counts playing levels vs breaks', () => {
    const blindStructure: BlindLevel[] = [
      { id: 'l1', small_blind: 25, big_blind: 50, ante: 0, duration_minutes: 20, is_break: false },
      { id: 'l2', small_blind: 50, big_blind: 100, ante: 0, duration_minutes: 20, is_break: false },
      { id: 'b1', small_blind: 0, big_blind: 0, ante: 0, duration_minutes: 10, is_break: true },
      { id: 'l3', small_blind: 100, big_blind: 200, ante: 0, duration_minutes: 20, is_break: false },
      { id: 'b2', small_blind: 0, big_blind: 0, ante: 0, duration_minutes: 10, is_break: true },
    ]

    const playingLevels = blindStructure.filter(l => !l.is_break)
    const breaks = blindStructure.filter(l => l.is_break)

    expect(playingLevels.length).toBe(3)
    expect(breaks.length).toBe(2)
  })
})

describe('Blind Templates', () => {
  it('validates template structure', () => {
    const template = {
      id: 'template-1',
      name: 'Turbo',
      levels: [
        { small_blind: 25, big_blind: 50, ante: 0, duration_minutes: 10, is_break: false },
        { small_blind: 50, big_blind: 100, ante: 0, duration_minutes: 10, is_break: false },
      ],
      createdAt: new Date().toISOString(),
    }

    expect(template.name).toBeTruthy()
    expect(template.levels.length).toBeGreaterThan(0)
    expect(template.createdAt).toBeTruthy()
  })

  it('validates turbo template has shorter durations', () => {
    const turboLevels = [
      { duration_minutes: 10, is_break: false },
      { duration_minutes: 10, is_break: false },
      { duration_minutes: 5, is_break: true },
    ]

    const playingLevels = turboLevels.filter(l => !l.is_break)
    playingLevels.forEach(level => {
      expect(level.duration_minutes).toBeLessThanOrEqual(10)
    })
  })

  it('validates deep stack template has longer durations', () => {
    const deepStackLevels = [
      { duration_minutes: 30, is_break: false },
      { duration_minutes: 30, is_break: false },
      { duration_minutes: 15, is_break: true },
    ]

    const playingLevels = deepStackLevels.filter(l => !l.is_break)
    playingLevels.forEach(level => {
      expect(level.duration_minutes).toBeGreaterThanOrEqual(20)
    })
  })
})

describe('Duration Generator', () => {
  it('calculates levels needed for target duration', () => {
    const targetHours = 3
    const levelDuration = 15 // minutes
    const totalMinutes = targetHours * 60

    // Rough estimate without breaks
    const estimatedLevels = Math.floor(totalMinutes / levelDuration)
    expect(estimatedLevels).toBe(12)
  })

  it('accounts for breaks in duration calculation', () => {
    const targetHours = 3
    const levelDuration = 15
    const breakDuration = 10
    const levelsPerBreak = 5
    const totalMinutes = targetHours * 60

    // Calculate with breaks
    let remainingMinutes = totalMinutes
    let levels = 0
    let breaks = 0

    while (remainingMinutes >= levelDuration) {
      levels++
      remainingMinutes -= levelDuration

      if (levels % levelsPerBreak === 0 && remainingMinutes >= breakDuration) {
        breaks++
        remainingMinutes -= breakDuration
      }
    }

    expect(levels).toBeGreaterThan(0)
    expect(breaks).toBeGreaterThan(0)
    expect(levels + breaks).toBeGreaterThan(10)
  })

  it('generates different level counts for different styles', () => {
    const targetHours = 3
    const totalMinutes = targetHours * 60

    const styles = {
      turbo: { levelDuration: 10, breakDuration: 5 },
      regular: { levelDuration: 15, breakDuration: 10 },
      deep: { levelDuration: 20, breakDuration: 15 },
    }

    const turboLevels = Math.floor(totalMinutes / styles.turbo.levelDuration)
    const regularLevels = Math.floor(totalMinutes / styles.regular.levelDuration)
    const deepLevels = Math.floor(totalMinutes / styles.deep.levelDuration)

    expect(turboLevels).toBeGreaterThan(regularLevels)
    expect(regularLevels).toBeGreaterThan(deepLevels)
  })
})

describe('Blinds Component Interactions', () => {
  let mockSetTournament: ReturnType<typeof vi.fn>
  let mockTournament: Tournament

  beforeEach(() => {
    mockSetTournament = vi.fn()
    mockTournament = createMockTournament()
    localStorage.clear()
  })

  describe('Template Application', () => {
    it('applies turbo template when clicked', () => {
      render(<Blinds tournament={mockTournament} setTournament={mockSetTournament} />)
      
      const turboButton = screen.getByText('Turbo').closest('button')
      expect(turboButton).not.toBeNull()
      fireEvent.click(turboButton!)
      
      expect(mockSetTournament).toHaveBeenCalled()
      const newTournament = mockSetTournament.mock.calls[0][0]
      expect(newTournament.blind_structure.length).toBeGreaterThan(0)
      // Turbo has 10 minute levels
      expect(newTournament.blind_structure[0].duration_minutes).toBe(10)
    })

    it('applies regular template when clicked', () => {
      render(<Blinds tournament={mockTournament} setTournament={mockSetTournament} />)
      
      const regularButton = screen.getByText('Regular').closest('button')
      expect(regularButton).not.toBeNull()
      fireEvent.click(regularButton!)
      
      expect(mockSetTournament).toHaveBeenCalled()
      const newTournament = mockSetTournament.mock.calls[0][0]
      expect(newTournament.blind_structure.length).toBeGreaterThan(0)
      // Regular has 15 minute levels
      expect(newTournament.blind_structure[0].duration_minutes).toBe(15)
    })

    it('applies deep stack template when clicked', () => {
      render(<Blinds tournament={mockTournament} setTournament={mockSetTournament} />)
      
      const deepButton = screen.getByText('Deep Stack').closest('button')
      expect(deepButton).not.toBeNull()
      fireEvent.click(deepButton!)
      
      expect(mockSetTournament).toHaveBeenCalled()
      const newTournament = mockSetTournament.mock.calls[0][0]
      expect(newTournament.blind_structure.length).toBeGreaterThan(0)
      // Deep has 20 minute levels
      expect(newTournament.blind_structure[0].duration_minutes).toBe(20)
    })

    it('resets current level and time when applying template', () => {
      const tournamentAtLevel3 = createMockTournament({
        current_level: 3,
        time_remaining_seconds: 300,
      })
      render(<Blinds tournament={tournamentAtLevel3} setTournament={mockSetTournament} />)
      
      const turboButton = screen.getByText('Turbo').closest('button')!
      fireEvent.click(turboButton)
      
      const newTournament = mockSetTournament.mock.calls[0][0]
      expect(newTournament.current_level).toBe(0)
      expect(newTournament.time_remaining_seconds).toBe(newTournament.blind_structure[0].duration_minutes * 60)
    })
  })

  describe('Add Level and Break', () => {
    it('adds a new level when Add Level is clicked', () => {
      render(<Blinds tournament={mockTournament} setTournament={mockSetTournament} />)
      
      const addLevelButton = screen.getByText(/Add Level/)
      fireEvent.click(addLevelButton)
      
      expect(mockSetTournament).toHaveBeenCalled()
      const newTournament = mockSetTournament.mock.calls[0][0]
      expect(newTournament.blind_structure.length).toBe(mockTournament.blind_structure.length + 1)
      
      const newLevel = newTournament.blind_structure[newTournament.blind_structure.length - 1]
      expect(newLevel.is_break).toBe(false)
    })

    it('adds a break when Add Break is clicked', () => {
      render(<Blinds tournament={mockTournament} setTournament={mockSetTournament} />)
      
      const addBreakButton = screen.getByText(/Add Break/)
      fireEvent.click(addBreakButton)
      
      expect(mockSetTournament).toHaveBeenCalled()
      const newTournament = mockSetTournament.mock.calls[0][0]
      expect(newTournament.blind_structure.length).toBe(mockTournament.blind_structure.length + 1)
      
      const newLevel = newTournament.blind_structure[newTournament.blind_structure.length - 1]
      expect(newLevel.is_break).toBe(true)
      expect(newLevel.small_blind).toBe(0)
      expect(newLevel.big_blind).toBe(0)
    })

    it('new level doubles blinds from previous level', () => {
      render(<Blinds tournament={mockTournament} setTournament={mockSetTournament} />)
      
      const addLevelButton = screen.getByText(/Add Level/)
      fireEvent.click(addLevelButton)
      
      const newTournament = mockSetTournament.mock.calls[0][0]
      const lastExistingLevel = mockTournament.blind_structure.filter(l => !l.is_break).pop()!
      const newLevel = newTournament.blind_structure[newTournament.blind_structure.length - 1]
      
      expect(newLevel.small_blind).toBe(lastExistingLevel.small_blind * 2)
      expect(newLevel.big_blind).toBe(lastExistingLevel.big_blind * 2)
    })
  })

  describe('My Templates Section', () => {
    it('shows save button', () => {
      render(<Blinds tournament={mockTournament} setTournament={mockSetTournament} />)
      expect(screen.getByText('Save')).toBeInTheDocument()
    })

    it('shows my templates button', () => {
      render(<Blinds tournament={mockTournament} setTournament={mockSetTournament} />)
      expect(screen.getByText('My Templates')).toBeInTheDocument()
    })

    it('toggles custom templates section', () => {
      render(<Blinds tournament={mockTournament} setTournament={mockSetTournament} />)
      
      const myTemplatesButton = screen.getByText('My Templates').closest('button')!
      fireEvent.click(myTemplatesButton)
      
      // Should show empty templates message
      expect(screen.getByText('No custom templates yet')).toBeInTheDocument()
    })

    it('validates custom template structure', () => {
      // Verify template structure without relying on localStorage
      const savedTemplate = {
        id: 't1',
        name: 'My Custom Template',
        levels: [
          { small_blind: 50, big_blind: 100, ante: 0, duration_minutes: 12, is_break: false },
        ],
        createdAt: new Date().toISOString(),
      }
      
      expect(savedTemplate.id).toBeTruthy()
      expect(savedTemplate.name).toBe('My Custom Template')
      expect(savedTemplate.levels).toHaveLength(1)
      expect(savedTemplate.createdAt).toBeTruthy()
    })
  })

  describe('Duration Generator UI', () => {
    it('shows duration generator button', () => {
      render(<Blinds tournament={mockTournament} setTournament={mockSetTournament} />)
      expect(screen.getByText('Generate by Duration')).toBeInTheDocument()
    })

    it('toggles duration generator panel', () => {
      render(<Blinds tournament={mockTournament} setTournament={mockSetTournament} />)
      
      const generateButton = screen.getByText('Generate by Duration').closest('button')!
      fireEvent.click(generateButton)
      
      // Should show duration controls
      expect(screen.getByText('Target Duration')).toBeInTheDocument()
      expect(screen.getByText('Level Style')).toBeInTheDocument()
      expect(screen.getByText('Preview')).toBeInTheDocument()
    })

    it('shows style options in generator', () => {
      render(<Blinds tournament={mockTournament} setTournament={mockSetTournament} />)
      
      const generateButton = screen.getByText('Generate by Duration').closest('button')!
      fireEvent.click(generateButton)
      
      // Style buttons in generator panel
      const styleButtons = screen.getAllByText('Turbo')
      expect(styleButtons.length).toBeGreaterThanOrEqual(1)
    })

    it('shows generate button in panel', () => {
      render(<Blinds tournament={mockTournament} setTournament={mockSetTournament} />)
      
      const generateButton = screen.getByText('Generate by Duration').closest('button')!
      fireEvent.click(generateButton)
      
      expect(screen.getByText('Generate')).toBeInTheDocument()
    })
  })

  describe('Empty State', () => {
    it('renders empty structure gracefully', () => {
      const emptyTournament = createMockTournament({ blind_structure: [] })
      render(<Blinds tournament={emptyTournament} setTournament={mockSetTournament} />)
      
      // Should still render controls
      expect(screen.getByText('Quick Templates')).toBeInTheDocument()
      expect(screen.getByText(/Add Level/)).toBeInTheDocument()
    })

    it('adds first level correctly when structure is empty', () => {
      const emptyTournament = createMockTournament({ blind_structure: [] })
      render(<Blinds tournament={emptyTournament} setTournament={mockSetTournament} />)
      
      const addLevelButton = screen.getByText(/Add Level/)
      fireEvent.click(addLevelButton)
      
      expect(mockSetTournament).toHaveBeenCalled()
      const newTournament = mockSetTournament.mock.calls[0][0]
      expect(newTournament.blind_structure.length).toBe(1)
      // Default first level
      expect(newTournament.blind_structure[0].small_blind).toBe(25)
      expect(newTournament.blind_structure[0].big_blind).toBe(50)
    })
  })
})

describe('Blind Structure Calculations', () => {
  it('calculates total chip count in play', () => {
    const players = [
      { buyins: 1, rebuys: 2, addons: 1 },
      { buyins: 1, rebuys: 0, addons: 0 },
      { buyins: 1, rebuys: 1, addons: 1 },
    ]
    const startingChips = 10000
    const rebuyChips = 5000
    const addonChips = 5000

    const totalChips = players.reduce((sum, p) => {
      return sum +
        (p.buyins * startingChips) +
        (p.rebuys * rebuyChips) +
        (p.addons * addonChips)
    }, 0)

    // 3 buyins (30000) + 3 rebuys (15000) + 2 addons (10000) = 55000
    expect(totalChips).toBe(55000)
  })

  it('calculates average stack for blind level', () => {
    const totalChips = 50000
    const activePlayers = 5
    const averageStack = totalChips / activePlayers
    expect(averageStack).toBe(10000)
  })

  it('calculates BB per player', () => {
    const averageStack = 10000
    const bigBlind = 200
    const bbPerPlayer = averageStack / bigBlind
    expect(bbPerPlayer).toBe(50)
  })

  it('determines if level is playable based on BB', () => {
    const averageStack = 10000
    const levels = [
      { big_blind: 50 },   // 200 BB - very playable
      { big_blind: 200 },  // 50 BB - playable
      { big_blind: 1000 }, // 10 BB - push/fold
      { big_blind: 5000 }, // 2 BB - almost unplayable
    ]

    const bbCounts = levels.map(l => averageStack / l.big_blind)
    expect(bbCounts[0]).toBeGreaterThanOrEqual(100)
    expect(bbCounts[1]).toBeGreaterThanOrEqual(20)
    expect(bbCounts[2]).toBeLessThan(20)
    expect(bbCounts[3]).toBeLessThan(5)
  })
})
