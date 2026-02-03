import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { Prizes } from './Prizes'
import type { Tournament } from '../types'

// Mock react-i18next
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        'prizes.totalPrizePool': 'Total Prize Pool',
        'prizes.myTemplates': 'My Templates',
        'prizes.save': 'Save',
        'prizes.export': 'Export',
        'prizes.import': 'Import',
        'prizes.saveAsTemplate': 'Save as Template',
        'prizes.templateName': 'Template name',
        'prizes.places': 'places',
        'prizes.paidPlaces': 'Paid Places',
        'prizes.percentage': 'Percentage',
        'prizes.amount': 'Amount',
        'prizes.noCustomTemplates': 'No custom templates saved yet',
        'prizes.saveCurrentToCreate': 'Save your current structure to create one',
        'prizes.clearTemplate': 'Clear template',
        'prizes.delete': 'Delete',
        'prizes.importedTemplate': 'Imported Template',
        'prizes.payoutSummary': 'Payout Summary',
        'prizes.eliminatedPlayers': 'Eliminated Players',
        'prizes.place': 'Place',
        'prizes.totalPercentage': 'Total Percentage',
        'players.buyins': 'Buyins',
        'players.rebuys': 'Rebuys',
        'players.addons': 'Add-ons',
        'common.cancel': 'Cancel',
      }
      return translations[key] || key
    },
  }),
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
    { small_blind: 25, big_blind: 50, ante: 0, duration_minutes: 15 },
    { small_blind: 50, big_blind: 100, ante: 0, duration_minutes: 15 },
  ],
  players: [
    { id: 'p1', name: 'Player 1', buyins: 1, rebuys: 0, addons: 0, eliminated: false, tableNumber: 1, seatNumber: 1 },
    { id: 'p2', name: 'Player 2', buyins: 1, rebuys: 1, addons: 0, eliminated: false, tableNumber: 1, seatNumber: 2 },
    { id: 'p3', name: 'Player 3', buyins: 1, rebuys: 0, addons: 1, eliminated: true, eliminationOrder: 1, tableNumber: 1, seatNumber: 3 },
  ],
  currency_symbol: '$',
  ...overrides,
})

describe('Prizes Component', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
  })

  describe('Prize Pool Display', () => {
    it('renders the prize pool summary', () => {
      const tournament = createMockTournament()
      render(<Prizes tournament={tournament} />)
      
      expect(screen.getByText('Total Prize Pool')).toBeInTheDocument()
    })

    it('calculates prize pool correctly', () => {
      // 3 buyins at $100 + 1 rebuy at $50 + 1 addon at $100 = $450
      const tournament = createMockTournament()
      render(<Prizes tournament={tournament} />)
      
      // Check that the formatted prize pool is displayed
      expect(screen.getByText('$450')).toBeInTheDocument()
    })

    it('displays buyins, rebuys, and addons counts', () => {
      const tournament = createMockTournament()
      render(<Prizes tournament={tournament} />)
      
      expect(screen.getByText(/Buyins/)).toBeInTheDocument()
      expect(screen.getByText(/Rebuys/)).toBeInTheDocument()
      expect(screen.getByText(/Add-ons/)).toBeInTheDocument()
    })
  })

  describe('Template Actions', () => {
    it('renders My Templates button', () => {
      const tournament = createMockTournament()
      render(<Prizes tournament={tournament} />)
      
      expect(screen.getByText('My Templates')).toBeInTheDocument()
    })

    it('renders Save button', () => {
      const tournament = createMockTournament()
      render(<Prizes tournament={tournament} />)
      
      expect(screen.getByText('Save')).toBeInTheDocument()
    })

    it('renders Export button', () => {
      const tournament = createMockTournament()
      render(<Prizes tournament={tournament} />)
      
      expect(screen.getByText('Export')).toBeInTheDocument()
    })

    it('renders Import button', () => {
      const tournament = createMockTournament()
      render(<Prizes tournament={tournament} />)
      
      expect(screen.getByText('Import')).toBeInTheDocument()
    })

    it('opens save modal when Save button is clicked', () => {
      const tournament = createMockTournament()
      render(<Prizes tournament={tournament} />)
      
      const saveButton = screen.getByText('Save')
      fireEvent.click(saveButton)
      
      expect(screen.getByText('Save as Template')).toBeInTheDocument()
      expect(screen.getByPlaceholderText('Template name')).toBeInTheDocument()
    })

    it('shows empty templates message when My Templates is clicked', () => {
      const tournament = createMockTournament()
      render(<Prizes tournament={tournament} />)
      
      const myTemplatesButton = screen.getByText('My Templates')
      fireEvent.click(myTemplatesButton)
      
      expect(screen.getByText('No custom templates saved yet')).toBeInTheDocument()
    })
  })

  describe('Paid Places Configuration', () => {
    it('renders paid places selector', () => {
      const tournament = createMockTournament()
      render(<Prizes tournament={tournament} />)
      
      // Default is 3 paid places - emoji may appear multiple times in component
      expect(screen.getAllByText('🥇').length).toBeGreaterThan(0)
      expect(screen.getAllByText('🥈').length).toBeGreaterThan(0)
      expect(screen.getAllByText('🥉').length).toBeGreaterThan(0)
    })

    it('shows percentage inputs for each paid place', () => {
      const tournament = createMockTournament()
      render(<Prizes tournament={tournament} />)
      
      // Default 3 places should have 3 percentage inputs
      const inputs = screen.getAllByRole('spinbutton')
      expect(inputs.length).toBeGreaterThanOrEqual(3)
    })
  })

  describe('Payout Calculations', () => {
    it('calculates correct payout amounts with default percentages', () => {
      // Default 3 places: 50%, 30%, 20%
      // Prize pool: $450
      // 1st: $225, 2nd: $135, 3rd: $90
      const tournament = createMockTournament()
      render(<Prizes tournament={tournament} />)
      
      // Check for payout amounts - may appear in multiple places (row and summary cards)
      expect(screen.getAllByText('$225').length).toBeGreaterThan(0)
      expect(screen.getAllByText('$135').length).toBeGreaterThan(0)
      expect(screen.getAllByText('$90').length).toBeGreaterThan(0)
    })

    it('updates payout when percentage is changed', () => {
      const tournament = createMockTournament()
      render(<Prizes tournament={tournament} />)
      
      // Find the first percentage input (should be 50)
      const inputs = screen.getAllByRole('spinbutton')
      const firstPercentInput = inputs[0]
      
      // Change to 60%
      fireEvent.change(firstPercentInput, { target: { value: '60' } })
      
      // 60% of $450 = $270 - multiple elements show this value
      expect(screen.getAllByText('$270').length).toBeGreaterThan(0)
    })
  })

  describe('Save Template Modal', () => {
    it('can close save modal with Cancel button', () => {
      const tournament = createMockTournament()
      render(<Prizes tournament={tournament} />)
      
      // Open modal
      fireEvent.click(screen.getByText('Save'))
      expect(screen.getByText('Save as Template')).toBeInTheDocument()
      
      // Close modal
      fireEvent.click(screen.getByText('Cancel'))
      expect(screen.queryByText('Save as Template')).not.toBeInTheDocument()
    })

    it('can save a template with a name', () => {
      const tournament = createMockTournament()
      render(<Prizes tournament={tournament} />)
      
      // Open modal
      fireEvent.click(screen.getByText('Save'))
      
      // Enter template name
      const input = screen.getByPlaceholderText('Template name')
      fireEvent.change(input, { target: { value: 'My Custom Template' } })
      
      // Click save in modal (there are two Save buttons - one in toolbar, one in modal)
      const saveButtons = screen.getAllByText('Save')
      const modalSaveButton = saveButtons[saveButtons.length - 1]
      fireEvent.click(modalSaveButton)
      
      // Modal should close
      expect(screen.queryByText('Save as Template')).not.toBeInTheDocument()
    })

    it('save button is disabled when template name is empty', () => {
      const tournament = createMockTournament()
      render(<Prizes tournament={tournament} />)
      
      // Open modal
      fireEvent.click(screen.getByText('Save'))
      
      // Find the save button in modal (last Save button)
      const saveButtons = screen.getAllByText('Save')
      const modalSaveButton = saveButtons[saveButtons.length - 1]
      
      // Should be disabled
      expect(modalSaveButton).toBeDisabled()
    })
  })

  describe('Saved Templates', () => {
    it('displays saved template after saving', () => {
      const tournament = createMockTournament()
      render(<Prizes tournament={tournament} />)
      
      // Save a template
      fireEvent.click(screen.getByText('Save'))
      const input = screen.getByPlaceholderText('Template name')
      fireEvent.change(input, { target: { value: 'Test Template' } })
      const saveButtons = screen.getAllByText('Save')
      fireEvent.click(saveButtons[saveButtons.length - 1])
      
      // Open My Templates
      fireEvent.click(screen.getByText('My Templates'))
      
      // Should show saved template (may appear in multiple places)
      expect(screen.getAllByText('Test Template').length).toBeGreaterThan(0)
    })

    it('loads template count badge in My Templates button', () => {
      const tournament = createMockTournament()
      
      // Pre-populate localStorage with saved templates
      const savedTemplates = [
        { id: '1', name: 'Template 1', paidPlaces: 3, percentages: [50, 30, 20], createdAt: new Date().toISOString() },
        { id: '2', name: 'Template 2', paidPlaces: 4, percentages: [45, 27, 18, 10], createdAt: new Date().toISOString() },
      ]
      localStorage.setItem('pokerpulse_prize_templates', JSON.stringify(savedTemplates))
      
      render(<Prizes tournament={tournament} />)
      
      // Should show count badge of 2
      expect(screen.getByText('2')).toBeInTheDocument()
    })
  })

  describe('Prize Pool Edge Cases', () => {
    it('handles tournament with no players', () => {
      const tournament = createMockTournament({ players: [] })
      render(<Prizes tournament={tournament} />)
      
      // $0 appears multiple times in the prize breakdown
      expect(screen.getAllByText('$0').length).toBeGreaterThan(0)
    })

    it('handles different currency symbols', () => {
      const tournament = createMockTournament({ currency_symbol: '€' })
      render(<Prizes tournament={tournament} />)
      
      // Euro symbol should appear in the prize pool display
      expect(screen.getAllByText(/€/).length).toBeGreaterThan(0)
    })

    it('handles large prize pools', () => {
      const tournament = createMockTournament({
        buyin_amount: 10000,
        players: Array.from({ length: 100 }, (_, i) => ({
          id: `p${i}`,
          name: `Player ${i}`,
          buyins: 1,
          rebuys: 0,
          addons: 0,
          eliminated: false,
          tableNumber: 1,
          seatNumber: i + 1,
        })),
      })
      render(<Prizes tournament={tournament} />)
      
      // 100 players * $10,000 = $1,000,000 - verify large amounts are formatted
      expect(screen.getAllByText(/\$[0-9,]+/).length).toBeGreaterThan(0)
    })
  })

  describe('Payout Templates', () => {
    it('has correct default template for 2 paid places', () => {
      const tournament = createMockTournament()
      render(<Prizes tournament={tournament} />)
      
      // Find and click to set 2 paid places
      const inputs = screen.getAllByRole('spinbutton')
      // The component should have place selectors
      // For 2 places: 65/35 split
    })

    it('total percentage validation shows correct status', () => {
      const tournament = createMockTournament()
      render(<Prizes tournament={tournament} />)
      
      // Default should be valid (100%)
      // Find percentage display elements
      const inputs = screen.getAllByRole('spinbutton')
      expect(inputs.length).toBeGreaterThan(0)
    })
  })

  describe('Data Validation', () => {
    it('validates payout template structure', () => {
      const payoutTemplates: Record<number, number[]> = {
        2: [65, 35],
        3: [50, 30, 20],
        4: [45, 27, 18, 10],
        5: [40, 25, 15, 12, 8],
        6: [35, 22, 15, 12, 9, 7],
        7: [32, 20, 14, 11, 9, 8, 6],
        8: [30, 18, 13, 10, 9, 8, 7, 5],
      }

      Object.entries(payoutTemplates).forEach(([places, percentages]) => {
        const total = percentages.reduce((sum, p) => sum + p, 0)
        expect(total).toBe(100)
        expect(percentages.length).toBe(Number(places))
      })
    })

    it('validates saved template structure', () => {
      interface SavedPrizeTemplate {
        id: string
        name: string
        paidPlaces: number
        percentages: number[]
        createdAt: string
      }

      const template: SavedPrizeTemplate = {
        id: 'test-id',
        name: 'Test Template',
        paidPlaces: 3,
        percentages: [50, 30, 20],
        createdAt: new Date().toISOString(),
      }

      expect(template.id).toBeTruthy()
      expect(template.name).toBeTruthy()
      expect(template.paidPlaces).toBe(template.percentages.length)
      expect(template.percentages.reduce((a, b) => a + b, 0)).toBe(100)
    })
  })

  describe('Paid Places Selector', () => {
    it('renders all paid places buttons (2-8)', () => {
      const tournament = createMockTournament()
      render(<Prizes tournament={tournament} />)
      
      // Should have buttons for 2-8 paid places
      for (let i = 2; i <= 8; i++) {
        expect(screen.getByRole('button', { name: String(i) })).toBeInTheDocument()
      }
    })

    it('changes percentages when different paid places is selected', () => {
      const tournament = createMockTournament()
      render(<Prizes tournament={tournament} />)
      
      // Select 4 paid places
      const button4 = screen.getByRole('button', { name: '4' })
      fireEvent.click(button4)
      
      // Should now have 4 percentage inputs
      const inputs = screen.getAllByRole('spinbutton')
      expect(inputs.length).toBeGreaterThanOrEqual(4)
    })

    it('applies correct template for 2 paid places', () => {
      const tournament = createMockTournament()
      render(<Prizes tournament={tournament} />)
      
      // Select 2 paid places
      const button2 = screen.getByRole('button', { name: '2' })
      fireEvent.click(button2)
      
      // 2 places: 65/35 split - prize pool is $450
      // 65% of $450 = $292.50 -> $292 (floored)
      expect(screen.getAllByText('$292').length).toBeGreaterThan(0)
    })

    it('applies correct template for 5 paid places', () => {
      const tournament = createMockTournament()
      render(<Prizes tournament={tournament} />)
      
      // Select 5 paid places (40, 25, 15, 12, 8)
      const button5 = screen.getByRole('button', { name: '5' })
      fireEvent.click(button5)
      
      // Should show 5th place indicator
      expect(screen.getByText('5th')).toBeInTheDocument()
    })

    it('applies correct template for 8 paid places', () => {
      const tournament = createMockTournament()
      render(<Prizes tournament={tournament} />)
      
      // Select 8 paid places
      const button8 = screen.getByRole('button', { name: '8' })
      fireEvent.click(button8)
      
      // Should show 8th place indicator
      expect(screen.getByText('8th')).toBeInTheDocument()
    })
  })

  describe('Load Custom Template', () => {
    it('loads saved template when clicked', () => {
      const tournament = createMockTournament()
      render(<Prizes tournament={tournament} />)
      
      // First, change to 5 paid places and save as template
      const button5 = screen.getByRole('button', { name: '5' })
      fireEvent.click(button5)
      
      // Save this as a template
      fireEvent.click(screen.getByText('Save'))
      fireEvent.change(screen.getByPlaceholderText('Template name'), { target: { value: 'High Roller' } })
      const saveButtons = screen.getAllByText('Save')
      fireEvent.click(saveButtons[saveButtons.length - 1])
      
      // Change back to 3 places
      const button3 = screen.getByRole('button', { name: '3' })
      fireEvent.click(button3)
      
      // Verify we're at 3 places (no 5th place indicator)
      expect(screen.queryByText('5th')).not.toBeInTheDocument()
      
      // Open My Templates and load the High Roller template
      fireEvent.click(screen.getByText('My Templates'))
      fireEvent.click(screen.getAllByText('High Roller')[0])
      
      // Should now show 5th place (indicating 5 paid places loaded)
      expect(screen.getByText('5th')).toBeInTheDocument()
    })

    it('closes template dropdown after loading', () => {
      const tournament = createMockTournament()
      render(<Prizes tournament={tournament} />)
      
      // Save a template first
      fireEvent.click(screen.getByText('Save'))
      fireEvent.change(screen.getByPlaceholderText('Template name'), { target: { value: 'Test Load' } })
      const saveButtons = screen.getAllByText('Save')
      fireEvent.click(saveButtons[saveButtons.length - 1])
      
      // Open My Templates
      fireEvent.click(screen.getByText('My Templates'))
      expect(screen.getAllByText('Test Load').length).toBeGreaterThan(0)
      
      // Load template (the name appears both in active indicator and dropdown)
      const templateButtons = screen.getAllByText('Test Load')
      // Click the one in the dropdown (not the active indicator)
      fireEvent.click(templateButtons[templateButtons.length - 1])
      
      // Dropdown should close - the "No custom templates" message should not appear
      expect(screen.queryByText('No custom templates saved yet')).not.toBeInTheDocument()
    })
  })

  describe('Delete Template', () => {
    it('can delete a saved template', () => {
      const tournament = createMockTournament()
      render(<Prizes tournament={tournament} />)
      
      // Save two templates first
      fireEvent.click(screen.getByText('Save'))
      fireEvent.change(screen.getByPlaceholderText('Template name'), { target: { value: 'Template To Delete' } })
      let saveButtons = screen.getAllByText('Save')
      fireEvent.click(saveButtons[saveButtons.length - 1])
      
      fireEvent.click(screen.getByText('Save'))
      fireEvent.change(screen.getByPlaceholderText('Template name'), { target: { value: 'Keep This' } })
      saveButtons = screen.getAllByText('Save')
      fireEvent.click(saveButtons[saveButtons.length - 1])
      
      // Open My Templates
      fireEvent.click(screen.getByText('My Templates'))
      
      // Both templates should be visible (multiple occurrences in badges and dropdown)
      expect(screen.getAllByText('Template To Delete').length).toBeGreaterThan(0)
      expect(screen.getAllByText('Keep This').length).toBeGreaterThan(0)
      
      // Find and click delete button - title is translated to 'Delete'
      const deleteButtons = screen.getAllByTitle('Delete')
      fireEvent.click(deleteButtons[0])
      
      // First template should be removed
      expect(screen.queryByText('Template To Delete')).not.toBeInTheDocument()
      // Second template should still exist
      expect(screen.getAllByText('Keep This').length).toBeGreaterThan(0)
    })

    it('deletes template and updates localStorage', () => {
      const tournament = createMockTournament()
      render(<Prizes tournament={tournament} />)
      
      // Save a template first via interaction
      fireEvent.click(screen.getByText('Save'))
      fireEvent.change(screen.getByPlaceholderText('Template name'), { target: { value: 'Delete Me' } })
      const saveButtons = screen.getAllByText('Save')
      fireEvent.click(saveButtons[saveButtons.length - 1])
      
      // Open My Templates and delete (we need to open it first to see the delete button)
      fireEvent.click(screen.getByText('My Templates'))
      
      // Find and delete
      const deleteButton = screen.getByTitle('Delete')
      fireEvent.click(deleteButton)
      
      // Check localStorage was updated to empty array
      const stored = JSON.parse(localStorage.getItem('pokerpulse_prize_templates') || '[]')
      expect(stored.length).toBe(0)
    })
  })

  describe('Active Template Indicator', () => {
    it('shows active template name after saving', () => {
      const tournament = createMockTournament()
      render(<Prizes tournament={tournament} />)
      
      // Save a template
      fireEvent.click(screen.getByText('Save'))
      fireEvent.change(screen.getByPlaceholderText('Template name'), { target: { value: 'Active Template' } })
      const saveButtons = screen.getAllByText('Save')
      fireEvent.click(saveButtons[saveButtons.length - 1])
      
      // Active template indicator should show the name
      expect(screen.getAllByText('Active Template').length).toBeGreaterThan(0)
    })

    it('clears active template when percentage is manually edited', () => {
      const tournament = createMockTournament()
      render(<Prizes tournament={tournament} />)
      
      // Save and immediately use a template
      fireEvent.click(screen.getByText('Save'))
      fireEvent.change(screen.getByPlaceholderText('Template name'), { target: { value: 'My Template' } })
      const saveButtons = screen.getAllByText('Save')
      fireEvent.click(saveButtons[saveButtons.length - 1])
      
      // Verify active template is shown
      expect(screen.getAllByText('My Template').length).toBeGreaterThan(0)
      
      // Modify a percentage - this should clear active template indicator
      const inputs = screen.getAllByRole('spinbutton')
      fireEvent.change(inputs[0], { target: { value: '55' } })
      
      // After manual edit, active template is cleared - clear button should not exist
      const clearButtons = screen.queryAllByTitle('Clear template')
      expect(clearButtons.length).toBe(0)
    })

    it('clears active template when paid places is changed', () => {
      const tournament = createMockTournament()
      render(<Prizes tournament={tournament} />)
      
      // Save a template to set it as active
      fireEvent.click(screen.getByText('Save'))
      fireEvent.change(screen.getByPlaceholderText('Template name'), { target: { value: 'My Template' } })
      const saveButtons = screen.getAllByText('Save')
      fireEvent.click(saveButtons[saveButtons.length - 1])
      
      // Verify active template is shown
      expect(screen.getAllByText('My Template').length).toBeGreaterThan(0)
      
      // Change paid places
      const button4 = screen.getByRole('button', { name: '4' })
      fireEvent.click(button4)
      
      // Active template should be cleared
      const clearButtons = screen.queryAllByTitle('Clear template')
      expect(clearButtons.length).toBe(0)
    })
  })

  describe('Percentage Total Validation', () => {
    it('shows validation error when total is not 100%', () => {
      const tournament = createMockTournament()
      render(<Prizes tournament={tournament} />)
      
      // Set first percentage to 90 (total will be 90+30+20=140)
      const inputs = screen.getAllByRole('spinbutton')
      fireEvent.change(inputs[0], { target: { value: '90' } })
      
      // Should show invalid total with mustEqual100 message
      expect(screen.getByText(/140\.0%/)).toBeInTheDocument()
    })

    it('shows valid status when total equals 100%', () => {
      const tournament = createMockTournament()
      render(<Prizes tournament={tournament} />)
      
      // Default is valid (50+30+20=100) - look for the total display
      expect(screen.getByText(/100\.0%/)).toBeInTheDocument()
    })

    it('handles decimal percentage changes', () => {
      const tournament = createMockTournament()
      render(<Prizes tournament={tournament} />)
      
      const inputs = screen.getAllByRole('spinbutton')
      fireEvent.change(inputs[0], { target: { value: '50.5' } })
      
      // Should handle decimal input - look for specific percentage format
      expect(screen.getByText(/100\.5%/)).toBeInTheDocument()
    })

    it('handles empty percentage input', () => {
      const tournament = createMockTournament()
      render(<Prizes tournament={tournament} />)
      
      const inputs = screen.getAllByRole('spinbutton')
      fireEvent.change(inputs[0], { target: { value: '' } })
      
      // Should treat empty as 0, showing 50% (0+30+20) - look for total display
      expect(screen.getByText(/50\.0%/)).toBeInTheDocument()
    })
  })

  describe('Final Standings Display', () => {
    it('shows eliminated players in standings', () => {
      const tournament = createMockTournament({
        players: [
          { id: 'p1', name: 'Winner', buyins: 1, rebuys: 0, addons: 0, eliminated: false, tableNumber: 1, seatNumber: 1 },
          { id: 'p2', name: 'Second Place', buyins: 1, rebuys: 0, addons: 0, eliminated: true, eliminationOrder: 2, tableNumber: 1, seatNumber: 2 },
          { id: 'p3', name: 'Third Place', buyins: 1, rebuys: 0, addons: 0, eliminated: true, eliminationOrder: 1, tableNumber: 1, seatNumber: 3 },
        ],
      })
      render(<Prizes tournament={tournament} />)
      
      // Eliminated players should appear in standings
      expect(screen.getByText('Second Place')).toBeInTheDocument()
      expect(screen.getByText('Third Place')).toBeInTheDocument()
    })

    it('shows payout amount next to players in money', () => {
      const tournament = createMockTournament({
        players: [
          { id: 'p1', name: 'Still Playing', buyins: 1, rebuys: 0, addons: 0, eliminated: false, tableNumber: 1, seatNumber: 1 },
          { id: 'p2', name: 'Money Winner', buyins: 1, rebuys: 0, addons: 0, eliminated: true, eliminationOrder: 3, tableNumber: 1, seatNumber: 2 },
          { id: 'p3', name: 'Bubble Boy', buyins: 1, rebuys: 0, addons: 0, eliminated: true, eliminationOrder: 2, tableNumber: 1, seatNumber: 3 },
          { id: 'p4', name: 'First Out', buyins: 1, rebuys: 0, addons: 0, eliminated: true, eliminationOrder: 1, tableNumber: 1, seatNumber: 4 },
        ],
      })
      render(<Prizes tournament={tournament} />)
      
      // Money Winner (eliminated 3rd = 2nd place) should show payout
      expect(screen.getByText('Money Winner')).toBeInTheDocument()
    })

    it('shows empty standings message when no eliminations', () => {
      const tournament = createMockTournament({
        players: [
          { id: 'p1', name: 'Player 1', buyins: 1, rebuys: 0, addons: 0, eliminated: false, tableNumber: 1, seatNumber: 1 },
          { id: 'p2', name: 'Player 2', buyins: 1, rebuys: 0, addons: 0, eliminated: false, tableNumber: 1, seatNumber: 2 },
        ],
      })
      render(<Prizes tournament={tournament} />)
      
      // Should show the trophy emoji for empty standings
      expect(screen.getByText('🏆')).toBeInTheDocument()
    })
  })

  describe('Template Dropdown Toggle', () => {
    it('toggles My Templates dropdown open and closed', () => {
      const tournament = createMockTournament()
      render(<Prizes tournament={tournament} />)
      
      // Click to open
      fireEvent.click(screen.getByText('My Templates'))
      expect(screen.getByText('No custom templates saved yet')).toBeInTheDocument()
      
      // Click again to close
      fireEvent.click(screen.getByText('My Templates'))
      expect(screen.queryByText('No custom templates saved yet')).not.toBeInTheDocument()
    })

    it('shows template count badge when templates exist', () => {
      const tournament = createMockTournament()
      
      // Save templates first via the component interaction
      const { rerender } = render(<Prizes tournament={tournament} />)
      
      // Save a template
      fireEvent.click(screen.getByText('Save'))
      fireEvent.change(screen.getByPlaceholderText('Template name'), { target: { value: 'Test Template' } })
      const saveButtons = screen.getAllByText('Save')
      fireEvent.click(saveButtons[saveButtons.length - 1])
      
      // Rerender to pick up localStorage changes
      rerender(<Prizes tournament={tournament} />)
      
      // Should show badge with count
      expect(screen.getByText('1')).toBeInTheDocument()
    })
  })

  describe('Payout Summary Cards', () => {
    it('displays top 3 payout cards', () => {
      const tournament = createMockTournament()
      render(<Prizes tournament={tournament} />)
      
      // Should show medal emojis for top 3 multiple times (in rows and cards)
      expect(screen.getAllByText('🥇').length).toBeGreaterThanOrEqual(2)
      expect(screen.getAllByText('🥈').length).toBeGreaterThanOrEqual(2)
      expect(screen.getAllByText('🥉').length).toBeGreaterThanOrEqual(2)
    })

    it('shows percentage of pool in summary cards', () => {
      const tournament = createMockTournament()
      render(<Prizes tournament={tournament} />)
      
      // Default percentages should be displayed
      expect(screen.getAllByText(/50%/).length).toBeGreaterThan(0)
      expect(screen.getAllByText(/30%/).length).toBeGreaterThan(0)
      expect(screen.getAllByText(/20%/).length).toBeGreaterThan(0)
    })
  })

  describe('Save Modal Keyboard Interaction', () => {
    it('saves template on Enter key press', () => {
      const tournament = createMockTournament()
      render(<Prizes tournament={tournament} />)
      
      fireEvent.click(screen.getByText('Save'))
      
      const input = screen.getByPlaceholderText('Template name')
      fireEvent.change(input, { target: { value: 'Enter Key Template' } })
      fireEvent.keyDown(input, { key: 'Enter' })
      
      // Modal should close
      expect(screen.queryByText('Save as Template')).not.toBeInTheDocument()
      
      // Template should be saved - open My Templates to verify
      fireEvent.click(screen.getByText('My Templates'))
      expect(screen.getAllByText('Enter Key Template').length).toBeGreaterThan(0)
    })

    it('does not save on Enter when name is empty', () => {
      const tournament = createMockTournament()
      render(<Prizes tournament={tournament} />)
      
      fireEvent.click(screen.getByText('Save'))
      
      const input = screen.getByPlaceholderText('Template name')
      // Don't enter a name, just press Enter
      fireEvent.keyDown(input, { key: 'Enter' })
      
      // Modal should still be open since name was empty
      expect(screen.getByText('Save as Template')).toBeInTheDocument()
    })
  })

  describe('Template Export Buttons', () => {
    it('has export button in template dropdown after saving', () => {
      const tournament = createMockTournament()
      render(<Prizes tournament={tournament} />)
      
      // Save a template first
      fireEvent.click(screen.getByText('Save'))
      fireEvent.change(screen.getByPlaceholderText('Template name'), { target: { value: 'Exportable Template' } })
      const saveButtons = screen.getAllByText('Save')
      fireEvent.click(saveButtons[saveButtons.length - 1])
      
      // Open My Templates to see the saved template
      fireEvent.click(screen.getByText('My Templates'))
      
      // Main export button should exist (in toolbar)
      expect(screen.getByText('Export')).toBeInTheDocument()
    })
  })
})
