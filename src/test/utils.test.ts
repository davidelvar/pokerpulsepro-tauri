import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  formatTime,
  formatCurrency,
  calculatePrizePool,
  calculatePayouts,
  getActivePlayers,
  getEliminatedPlayers,
  getAverageStack,
  generateId,
  getTableInfo,
  getUnassignedPlayers,
  assignPlayersToTables,
  clearTableAssignments,
  getTableBalanceSuggestions,
  movePlayerToSeat,
  isSeatOccupied,
  getNextAvailableSeat,
  playSound,
  checkForUpdates,
  CURRENT_VERSION,
  applyPayoutRounding,
  calculateColorUpSchedule,
} from '../utils'
import type { Tournament, Player, PhysicalChip, BlindLevel } from '../types'

describe('formatTime', () => {
  it('formats 0 seconds as 00:00', () => {
    expect(formatTime(0)).toBe('00:00')
  })

  it('formats 60 seconds as 01:00', () => {
    expect(formatTime(60)).toBe('01:00')
  })

  it('formats 90 seconds as 01:30', () => {
    expect(formatTime(90)).toBe('01:30')
  })

  it('formats 3661 seconds as 61:01', () => {
    expect(formatTime(3661)).toBe('61:01')
  })

  it('pads single digit minutes and seconds', () => {
    expect(formatTime(65)).toBe('01:05')
  })
})

describe('formatCurrency', () => {
  it('formats with default dollar sign', () => {
    expect(formatCurrency(1000)).toBe('$1,000')
  })

  it('formats with custom currency symbol', () => {
    expect(formatCurrency(1000, '€')).toBe('€1,000')
  })

  it('formats zero', () => {
    expect(formatCurrency(0)).toBe('$0')
  })

  it('formats large numbers with commas', () => {
    expect(formatCurrency(1000000, '$')).toBe('$1,000,000')
  })
})

describe('calculatePrizePool', () => {
  const createTournament = (players: Partial<Player>[]): Tournament => ({
    id: 'test',
    name: 'Test Tournament',
    buyin_amount: 100,
    rebuy_amount: 50,
    rebuy_chips: 5000,
    addon_amount: 25,
    addon_chips: 5000,
    starting_chips: 10000,
    players: players.map((p, i) => ({
      id: `player-${i}`,
      name: `Player ${i}`,
      buyins: 1,
      rebuys: 0,
      addons: 0,
      eliminated: false,
      placement: null,
      tableNumber: null,
      seatNumber: null,
      ...p,
    })),
    blind_structure: [],
    current_level: 0,
    time_remaining_seconds: 600,
    is_running: false,
    currency_symbol: '$',
    tableCount: 1,
    seatsPerTable: 9,
  })

  it('calculates prize pool with buy-ins only', () => {
    const tournament = createTournament([
      { buyins: 1 },
      { buyins: 1 },
      { buyins: 1 },
    ])
    expect(calculatePrizePool(tournament)).toBe(300) // 3 × $100
  })

  it('calculates prize pool with rebuys', () => {
    const tournament = createTournament([
      { buyins: 1, rebuys: 2 },
      { buyins: 1, rebuys: 1 },
    ])
    expect(calculatePrizePool(tournament)).toBe(350) // 2×$100 + 3×$50
  })

  it('calculates prize pool with add-ons', () => {
    const tournament = createTournament([
      { buyins: 1, addons: 1 },
      { buyins: 1, addons: 1 },
    ])
    expect(calculatePrizePool(tournament)).toBe(250) // 2×$100 + 2×$25
  })

  it('calculates prize pool with all entry types', () => {
    const tournament = createTournament([
      { buyins: 1, rebuys: 1, addons: 1 },
    ])
    expect(calculatePrizePool(tournament)).toBe(175) // $100 + $50 + $25
  })

  it('returns 0 with no players', () => {
    const tournament = createTournament([])
    expect(calculatePrizePool(tournament)).toBe(0)
  })
})

describe('calculatePayouts', () => {
  const prizePool = 1000

  it('calculates single winner payout', () => {
    const payouts = calculatePayouts(prizePool, 1)
    expect(payouts).toHaveLength(1)
    expect(payouts[0]).toEqual({ place: 1, amount: 1000, percentage: 100 })
  })

  it('calculates 2-place payouts', () => {
    const payouts = calculatePayouts(prizePool, 2)
    expect(payouts).toHaveLength(2)
    expect(payouts[0].amount).toBe(650) // 65%
    expect(payouts[1].amount).toBe(350) // 35%
  })

  it('calculates 3-place payouts (default)', () => {
    const payouts = calculatePayouts(prizePool, 3)
    expect(payouts).toHaveLength(3)
    expect(payouts[0].amount).toBe(500) // 50%
    expect(payouts[1].amount).toBe(300) // 30%
    expect(payouts[2].amount).toBe(200) // 20%
  })

  it('calculates 4-place payouts', () => {
    const payouts = calculatePayouts(prizePool, 4)
    expect(payouts).toHaveLength(4)
    expect(payouts.reduce((sum, p) => sum + p.percentage, 0)).toBe(100)
  })

  it('calculates 5-place payouts', () => {
    const payouts = calculatePayouts(prizePool, 5)
    expect(payouts).toHaveLength(5)
    expect(payouts.reduce((sum, p) => sum + p.percentage, 0)).toBe(100)
  })
})

describe('applyPayoutRounding', () => {
  it('floors amounts when rounding is off (increment 0)', () => {
    // $530 pool, 50/30/20 => 265 / 159 / 106
    const payouts = applyPayoutRounding(530, [50, 30, 20], 0)
    expect(payouts.map(p => p.amount)).toEqual([265, 159, 106])
  })

  it('treats negative increments as off', () => {
    const payouts = applyPayoutRounding(530, [50, 30, 20], -5)
    expect(payouts.map(p => p.amount)).toEqual([265, 159, 106])
  })

  it('rounds lower places to nearest $5 and keeps the pool exact', () => {
    // $530: 2nd 159 -> 160, 3rd 106 -> 105, 1st absorbs remainder = 530-265 = 265
    const payouts = applyPayoutRounding(530, [50, 30, 20], 5)
    expect(payouts.map(p => p.amount)).toEqual([265, 160, 105])
    expect(payouts.reduce((sum, p) => sum + p.amount, 0)).toBe(530)
  })

  it('rounds lower places to nearest $1 and keeps the pool exact', () => {
    // $533: raw 266.5 / 159.9 / 106.6 -> round lower: 160 / 107, 1st = 533-267 = 266
    const payouts = applyPayoutRounding(533, [50, 30, 20], 1)
    expect(payouts[1].amount).toBe(160)
    expect(payouts[2].amount).toBe(107)
    expect(payouts.reduce((sum, p) => sum + p.amount, 0)).toBe(533)
  })

  it('makes every lower place a clean multiple of the increment', () => {
    const payouts = applyPayoutRounding(1234, [50, 30, 20], 25)
    for (const p of payouts.slice(1)) {
      expect(p.amount % 25).toBe(0)
    }
    expect(payouts.reduce((sum, p) => sum + p.amount, 0)).toBe(1234)
  })

  it('preserves percentage and place metadata', () => {
    const payouts = applyPayoutRounding(1000, [50, 30, 20], 5)
    expect(payouts.map(p => p.place)).toEqual([1, 2, 3])
    expect(payouts.map(p => p.percentage)).toEqual([50, 30, 20])
  })

  it('falls back to flooring if rounding the lower places overshoots the pool', () => {
    // Degenerate structure where rounding the lower places past the pool would
    // force a negative 1st place; the util must fall back to plain flooring.
    const payouts = applyPayoutRounding(100, [10, 60, 60], 100)
    expect(payouts.map(p => p.amount)).toEqual([10, 60, 60]) // floored, no negatives
    expect(payouts.every(p => p.amount >= 0)).toBe(true)
  })

  it('handles an empty payout structure', () => {
    expect(applyPayoutRounding(1000, [], 5)).toEqual([])
  })

  it('handles a single winner', () => {
    const payouts = applyPayoutRounding(1000, [100], 5)
    expect(payouts).toHaveLength(1)
    expect(payouts[0].amount).toBe(1000)
  })
})

describe('calculateColorUpSchedule', () => {
  const chip = (value: number, over: Partial<PhysicalChip> = {}): PhysicalChip => ({
    id: `c${value}`,
    value,
    color: '#000',
    borderColor: '#000',
    textColor: '#fff',
    label: `${value}`,
    quantity: 100,
    ...over,
  })
  const lvl = (small_blind: number, big_blind: number, ante = 0, is_break = false): BlindLevel => ({
    id: `l-${small_blind}-${big_blind}-${ante}${is_break ? '-b' : ''}`,
    small_blind,
    big_blind,
    ante,
    duration_minutes: 15,
    is_break,
  })

  const chips = [chip(25), chip(100), chip(500)]
  // L6 carries a 25 ante: the 25 chip is still needed there even though L4 already
  // has SB >= 100. This is the case the old "first qualifying level" logic got wrong.
  const structure = [
    lvl(25, 50),
    lvl(50, 100),
    lvl(75, 150),
    lvl(100, 200),
    lvl(150, 300),
    lvl(200, 400, 25),
    lvl(300, 600),
    lvl(500, 1000),
  ]

  it('colors up only after the last level that still needs the chip (looks past a later ante)', () => {
    const schedule = calculateColorUpSchedule(chips, structure)
    const e25 = schedule.find((e) => e.chipValue === 25)!
    expect(e25.levelIndex).toBe(6) // level 7, after the L6 ante of 25
    expect(e25.manual).toBe(false)
  })

  it('never colors up the largest denomination', () => {
    const schedule = calculateColorUpSchedule(chips, structure)
    expect(schedule.find((e) => e.chipValue === 500)).toBeUndefined()
  })

  it('honors a manual override and reports its blinds', () => {
    const schedule = calculateColorUpSchedule(
      [chip(25, { colorUpLevel: 4 }), chip(100), chip(500)],
      structure
    )
    const e25 = schedule.find((e) => e.chipValue === 25)!
    expect(e25.levelIndex).toBe(3) // level 4
    expect(e25.manual).toBe(true)
    expect(e25.smallBlind).toBe(100) // blinds taken from level 4
  })

  it('falls back to auto when the override points at a break level', () => {
    const struct = [lvl(25, 50), lvl(50, 100), lvl(0, 0, 0, true), lvl(100, 200), lvl(300, 600)]
    const schedule = calculateColorUpSchedule([chip(25, { colorUpLevel: 3 }), chip(100)], struct)
    expect(schedule.find((e) => e.chipValue === 25)!.manual).toBe(false)
  })

  it('falls back to auto when the override is out of range', () => {
    const schedule = calculateColorUpSchedule(
      [chip(25, { colorUpLevel: 99 }), chip(100), chip(500)],
      structure
    )
    expect(schedule.find((e) => e.chipValue === 25)!.manual).toBe(false)
  })

  it('skips breaks when choosing the auto level', () => {
    // 25 (next 100) is needed at L1/L2; index 2 is a break, so it colors up at L4.
    const struct = [lvl(25, 50), lvl(50, 100), lvl(0, 0, 0, true), lvl(100, 200), lvl(200, 400)]
    const schedule = calculateColorUpSchedule([chip(25), chip(100)], struct)
    expect(schedule.find((e) => e.chipValue === 25)!.levelIndex).toBe(3)
  })

  it('omits a chip that is needed through the final level', () => {
    const struct = [lvl(25, 50), lvl(50, 100), lvl(75, 150)]
    const schedule = calculateColorUpSchedule([chip(25), chip(100)], struct)
    expect(schedule.find((e) => e.chipValue === 25)).toBeUndefined()
  })

  it('keeps a chip in play for non-multiple blinds (75 small blind out of 50s)', () => {
    // Chips [25, 50, 100]: the 25 is needed at the 75 small blind (75 = 50 + 25)
    // even though 75 is not < 50. Divisibility, not a plain "<", must catch this.
    const struct = [lvl(25, 50), lvl(50, 100), lvl(75, 150), lvl(100, 200), lvl(200, 400)]
    const schedule = calculateColorUpSchedule([chip(25), chip(50), chip(100)], struct)
    const e25 = schedule.find((e) => e.chipValue === 25)!
    expect(e25.levelIndex).toBe(3) // colors up at level 4, AFTER the 75 SB at level 3
  })
})

describe('getActivePlayers', () => {
  const players: Player[] = [
    { id: '1', name: 'Alice', buyins: 1, rebuys: 0, addons: 0, eliminated: false, placement: null, tableNumber: null, seatNumber: null },
    { id: '2', name: 'Bob', buyins: 1, rebuys: 0, addons: 0, eliminated: true, placement: 3, tableNumber: null, seatNumber: null },
    { id: '3', name: 'Charlie', buyins: 1, rebuys: 0, addons: 0, eliminated: false, placement: null, tableNumber: null, seatNumber: null },
  ]

  it('returns only non-eliminated players', () => {
    const active = getActivePlayers(players)
    expect(active).toHaveLength(2)
    expect(active.map(p => p.name)).toEqual(['Alice', 'Charlie'])
  })

  it('returns empty array if all eliminated', () => {
    const allEliminated = players.map(p => ({ ...p, eliminated: true }))
    expect(getActivePlayers(allEliminated)).toHaveLength(0)
  })

  it('returns all players if none eliminated', () => {
    const noneEliminated = players.map(p => ({ ...p, eliminated: false }))
    expect(getActivePlayers(noneEliminated)).toHaveLength(3)
  })
})

describe('getEliminatedPlayers', () => {
  const players: Player[] = [
    { id: '1', name: 'Alice', buyins: 1, rebuys: 0, addons: 0, eliminated: true, placement: 3, tableNumber: null, seatNumber: null },
    { id: '2', name: 'Bob', buyins: 1, rebuys: 0, addons: 0, eliminated: false, placement: null, tableNumber: null, seatNumber: null },
    { id: '3', name: 'Charlie', buyins: 1, rebuys: 0, addons: 0, eliminated: true, placement: 2, tableNumber: null, seatNumber: null },
  ]

  it('returns only eliminated players', () => {
    const eliminated = getEliminatedPlayers(players)
    expect(eliminated).toHaveLength(2)
  })

  it('sorts by placement ascending', () => {
    const eliminated = getEliminatedPlayers(players)
    expect(eliminated[0].placement).toBe(2)
    expect(eliminated[1].placement).toBe(3)
  })

  it('returns empty array if none eliminated', () => {
    const noneEliminated = players.map(p => ({ ...p, eliminated: false }))
    expect(getEliminatedPlayers(noneEliminated)).toHaveLength(0)
  })
})

describe('getAverageStack', () => {
  const createTournament = (players: Partial<Player>[], config: Partial<Tournament> = {}): Tournament => ({
    id: 'test',
    name: 'Test Tournament',
    buyin_amount: 100,
    rebuy_amount: 50,
    rebuy_chips: 5000,
    addon_amount: 25,
    addon_chips: 2500,
    starting_chips: 10000,
    players: players.map((p, i) => ({
      id: `player-${i}`,
      name: `Player ${i}`,
      buyins: 1,
      rebuys: 0,
      addons: 0,
      eliminated: false,
      placement: null,
      tableNumber: null,
      seatNumber: null,
      ...p,
    })),
    blind_structure: [],
    current_level: 0,
    time_remaining_seconds: 600,
    is_running: false,
    currency_symbol: '$',
    tableCount: 1,
    seatsPerTable: 9,
    ...config,
  })

  it('calculates average with all active players', () => {
    const tournament = createTournament([
      { buyins: 1 },
      { buyins: 1 },
    ])
    // 2 buy-ins × 10000 chips = 20000 / 2 players = 10000
    expect(getAverageStack(tournament)).toBe(10000)
  })

  it('calculates average with some eliminated', () => {
    const tournament = createTournament([
      { buyins: 1, eliminated: false },
      { buyins: 1, eliminated: true },
    ])
    // 2 buy-ins × 10000 chips = 20000 / 1 active player = 20000
    expect(getAverageStack(tournament)).toBe(20000)
  })

  it('includes rebuys in chip count', () => {
    const tournament = createTournament([
      { buyins: 1, rebuys: 2 },
      { buyins: 1, rebuys: 0 },
    ])
    // 2 buy-ins × 10000 + 2 rebuys × 5000 = 30000 / 2 = 15000
    expect(getAverageStack(tournament)).toBe(15000)
  })

  it('includes add-ons in chip count', () => {
    const tournament = createTournament([
      { buyins: 1, addons: 1 },
      { buyins: 1, addons: 1 },
    ])
    // 2 buy-ins × 10000 + 2 add-ons × 2500 = 25000 / 2 = 12500
    expect(getAverageStack(tournament)).toBe(12500)
  })

  it('returns 0 with no active players', () => {
    const tournament = createTournament([
      { eliminated: true },
    ])
    expect(getAverageStack(tournament)).toBe(0)
  })
})

describe('generateId', () => {
  it('generates a non-empty string', () => {
    const id = generateId()
    expect(typeof id).toBe('string')
    expect(id.length).toBeGreaterThan(0)
  })

  it('generates unique IDs', () => {
    const ids = new Set(Array.from({ length: 100 }, () => generateId()))
    expect(ids.size).toBe(100)
  })

  it('generates IDs with alphanumeric characters', () => {
    const id = generateId()
    expect(id).toMatch(/^[a-z0-9]+$/)
  })
})

describe('CURRENT_VERSION', () => {
  it('exports current version string', async () => {
    const { CURRENT_VERSION } = await import('../utils')
    expect(typeof CURRENT_VERSION).toBe('string')
    expect(CURRENT_VERSION).toMatch(/^\d+\.\d+\.\d+$/)
  })

  it('is version 1.2.2', async () => {
    const { CURRENT_VERSION } = await import('../utils')
    expect(CURRENT_VERSION).toBe('1.2.2')
  })
})

describe('Multi-table Utilities', () => {
  const createPlayer = (id: string, name: string, tableNumber: number | null = null, seatNumber: number | null = null, eliminated = false): Player => ({
    id,
    name,
    buyins: 1,
    rebuys: 0,
    addons: 0,
    eliminated,
    placement: eliminated ? 10 : null,
    tableNumber,
    seatNumber,
  })

  describe('getTableInfo', () => {
    it('returns info for all tables', () => {
      const players = [
        createPlayer('p1', 'Alice', 1, 1),
        createPlayer('p2', 'Bob', 1, 2),
        createPlayer('p3', 'Charlie', 2, 1),
      ]
      const info = getTableInfo(players, 2, 9)
      
      expect(info).toHaveLength(2)
      expect(info[0].tableNumber).toBe(1)
      expect(info[0].players).toHaveLength(2)
      expect(info[1].tableNumber).toBe(2)
      expect(info[1].players).toHaveLength(1)
    })

    it('calculates empty seats correctly', () => {
      const players = [
        createPlayer('p1', 'Alice', 1, 1),
      ]
      const info = getTableInfo(players, 1, 9)
      
      expect(info[0].emptySeats).toBe(8)
    })

    it('excludes eliminated players', () => {
      const players = [
        createPlayer('p1', 'Alice', 1, 1),
        createPlayer('p2', 'Bob', 1, 2, true), // eliminated
      ]
      const info = getTableInfo(players, 1, 9)
      
      expect(info[0].players).toHaveLength(1)
    })

    it('sorts players by seat number', () => {
      const players = [
        createPlayer('p1', 'Alice', 1, 5),
        createPlayer('p2', 'Bob', 1, 2),
        createPlayer('p3', 'Charlie', 1, 8),
      ]
      const info = getTableInfo(players, 1, 9)
      
      expect(info[0].players[0].seatNumber).toBe(2)
      expect(info[0].players[1].seatNumber).toBe(5)
      expect(info[0].players[2].seatNumber).toBe(8)
    })
  })

  describe('getUnassignedPlayers', () => {
    it('returns players without table assignment', () => {
      const players = [
        createPlayer('p1', 'Alice', 1, 1),
        createPlayer('p2', 'Bob', null, null),
        createPlayer('p3', 'Charlie', null, null),
      ]
      const unassigned = getUnassignedPlayers(players)
      
      expect(unassigned).toHaveLength(2)
      expect(unassigned.map(p => p.name)).toContain('Bob')
      expect(unassigned.map(p => p.name)).toContain('Charlie')
    })

    it('excludes eliminated players', () => {
      const players = [
        createPlayer('p1', 'Alice', null, null, true), // eliminated
        createPlayer('p2', 'Bob', null, null),
      ]
      const unassigned = getUnassignedPlayers(players)
      
      expect(unassigned).toHaveLength(1)
      expect(unassigned[0].name).toBe('Bob')
    })

    it('returns empty array when all assigned', () => {
      const players = [
        createPlayer('p1', 'Alice', 1, 1),
        createPlayer('p2', 'Bob', 1, 2),
      ]
      const unassigned = getUnassignedPlayers(players)
      
      expect(unassigned).toHaveLength(0)
    })
  })

  describe('assignPlayersToTables', () => {
    it('assigns all active players to tables', () => {
      const players = [
        createPlayer('p1', 'Alice'),
        createPlayer('p2', 'Bob'),
        createPlayer('p3', 'Charlie'),
      ]
      const assigned = assignPlayersToTables(players, 2, 9)
      const activePlayers = assigned.filter(p => !p.eliminated)
      
      activePlayers.forEach(p => {
        expect(p.tableNumber).not.toBeNull()
        expect(p.seatNumber).not.toBeNull()
      })
    })

    it('keeps eliminated players without assignments', () => {
      const players = [
        createPlayer('p1', 'Alice'),
        createPlayer('p2', 'Bob', null, null, true),
      ]
      const assigned = assignPlayersToTables(players, 1, 9)
      const eliminated = assigned.find(p => p.name === 'Bob')
      
      expect(eliminated?.tableNumber).toBeNull()
      expect(eliminated?.seatNumber).toBeNull()
    })

    it('distributes players across tables', () => {
      const players = Array.from({ length: 6 }, (_, i) => 
        createPlayer(`p${i}`, `Player ${i}`)
      )
      const assigned = assignPlayersToTables(players, 2, 9)
      
      const table1Count = assigned.filter(p => p.tableNumber === 1).length
      const table2Count = assigned.filter(p => p.tableNumber === 2).length
      
      // Should be balanced (3 each for 6 players, 2 tables)
      expect(Math.abs(table1Count - table2Count)).toBeLessThanOrEqual(1)
    })
  })

  describe('clearTableAssignments', () => {
    it('removes all table assignments', () => {
      const players = [
        createPlayer('p1', 'Alice', 1, 1),
        createPlayer('p2', 'Bob', 2, 3),
      ]
      const cleared = clearTableAssignments(players)
      
      cleared.forEach(p => {
        expect(p.tableNumber).toBeNull()
        expect(p.seatNumber).toBeNull()
      })
    })

    it('preserves other player data', () => {
      const players = [
        createPlayer('p1', 'Alice', 1, 1),
      ]
      const cleared = clearTableAssignments(players)
      
      expect(cleared[0].name).toBe('Alice')
      expect(cleared[0].id).toBe('p1')
    })
  })

  describe('getTableBalanceSuggestions', () => {
    it('returns empty when tables are balanced', () => {
      const players = [
        createPlayer('p1', 'Alice', 1, 1),
        createPlayer('p2', 'Bob', 1, 2),
        createPlayer('p3', 'Charlie', 2, 1),
        createPlayer('p4', 'Dave', 2, 2),
      ]
      const suggestions = getTableBalanceSuggestions(players, 2, 9)
      
      expect(suggestions).toHaveLength(0)
    })

    it('returns suggestion when tables differ by more than 1', () => {
      const players = [
        createPlayer('p1', 'Alice', 1, 1),
        createPlayer('p2', 'Bob', 1, 2),
        createPlayer('p3', 'Charlie', 1, 3),
        createPlayer('p4', 'Dave', 2, 1),
      ]
      const suggestions = getTableBalanceSuggestions(players, 2, 9)
      
      // Table 1 has 3, Table 2 has 1 - difference of 2, should suggest move
      expect(suggestions.length).toBeGreaterThanOrEqual(1)
      if (suggestions.length > 0) {
        expect(suggestions[0].fromTable).toBe(1)
        expect(suggestions[0].toTable).toBe(2)
      }
    })

    it('returns empty for single table', () => {
      const players = [
        createPlayer('p1', 'Alice', 1, 1),
      ]
      const suggestions = getTableBalanceSuggestions(players, 1, 9)
      
      expect(suggestions).toHaveLength(0)
    })
  })

  describe('movePlayerToSeat', () => {
    it('moves player to specified table and seat', () => {
      const players = [
        createPlayer('p1', 'Alice', 1, 1),
        createPlayer('p2', 'Bob', 1, 2),
      ]
      const moved = movePlayerToSeat(players, 'p1', 2, 5)
      const alice = moved.find(p => p.id === 'p1')
      
      expect(alice?.tableNumber).toBe(2)
      expect(alice?.seatNumber).toBe(5)
    })

    it('does not affect other players', () => {
      const players = [
        createPlayer('p1', 'Alice', 1, 1),
        createPlayer('p2', 'Bob', 1, 2),
      ]
      const moved = movePlayerToSeat(players, 'p1', 2, 5)
      const bob = moved.find(p => p.id === 'p2')
      
      expect(bob?.tableNumber).toBe(1)
      expect(bob?.seatNumber).toBe(2)
    })
  })

  describe('isSeatOccupied', () => {
    it('returns true for occupied seat', () => {
      const players = [
        createPlayer('p1', 'Alice', 1, 3),
      ]
      expect(isSeatOccupied(players, 1, 3)).toBe(true)
    })

    it('returns false for empty seat', () => {
      const players = [
        createPlayer('p1', 'Alice', 1, 3),
      ]
      expect(isSeatOccupied(players, 1, 5)).toBe(false)
    })

    it('returns false for eliminated player seat', () => {
      const players = [
        createPlayer('p1', 'Alice', 1, 3, true), // eliminated
      ]
      expect(isSeatOccupied(players, 1, 3)).toBe(false)
    })

    it('returns false for different table', () => {
      const players = [
        createPlayer('p1', 'Alice', 1, 3),
      ]
      expect(isSeatOccupied(players, 2, 3)).toBe(false)
    })
  })

  describe('getNextAvailableSeat', () => {
    it('returns first empty seat', () => {
      const players = [
        createPlayer('p1', 'Alice', 1, 1),
        createPlayer('p2', 'Bob', 1, 2),
      ]
      const seat = getNextAvailableSeat(players, 1, 9)
      
      expect(seat).toBe(3)
    })

    it('returns 1 for empty table', () => {
      const players: Player[] = []
      const seat = getNextAvailableSeat(players, 1, 9)
      
      expect(seat).toBe(1)
    })

    it('returns null when table is full', () => {
      const players = Array.from({ length: 9 }, (_, i) => 
        createPlayer(`p${i}`, `Player ${i}`, 1, i + 1)
      )
      const seat = getNextAvailableSeat(players, 1, 9)
      
      expect(seat).toBeNull()
    })

    it('finds gaps in seating', () => {
      const players = [
        createPlayer('p1', 'Alice', 1, 1),
        createPlayer('p2', 'Bob', 1, 3), // seat 2 is empty
      ]
      const seat = getNextAvailableSeat(players, 1, 9)
      
      expect(seat).toBe(2)
    })
  })
})

describe('Version Comparison Logic', () => {
  // Testing the version comparison algorithm used in the app
  const compareVersions = (current: string, latest: string): boolean => {
    const currentParts = current.replace('v', '').split('.').map(Number)
    const latestParts = latest.replace('v', '').split('.').map(Number)
    
    for (let i = 0; i < Math.max(currentParts.length, latestParts.length); i++) {
      const c = currentParts[i] || 0
      const l = latestParts[i] || 0
      if (l > c) return true
      if (l < c) return false
    }
    return false
  }

  it('returns true when major version is higher', () => {
    expect(compareVersions('1.0.0', '2.0.0')).toBe(true)
  })

  it('returns true when minor version is higher', () => {
    expect(compareVersions('1.0.0', '1.1.0')).toBe(true)
  })

  it('returns true when patch version is higher', () => {
    expect(compareVersions('1.0.0', '1.0.1')).toBe(true)
  })

  it('returns false when versions are equal', () => {
    expect(compareVersions('1.2.0', '1.2.0')).toBe(false)
  })

  it('returns false when current is higher', () => {
    expect(compareVersions('2.0.0', '1.5.0')).toBe(false)
  })

  it('handles v prefix in version strings', () => {
    expect(compareVersions('v1.0.0', 'v1.1.0')).toBe(true)
    expect(compareVersions('1.0.0', 'v1.1.0')).toBe(true)
  })

  it('handles different version lengths', () => {
    expect(compareVersions('1.0', '1.0.1')).toBe(true)
    expect(compareVersions('1.0.0', '1.1')).toBe(true)
  })
})

describe('playSound', () => {
  // AudioContext is mocked globally in setup.ts
  // We just need to verify the function uses it correctly

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('creates an AudioContext', () => {
    playSound('levelChange')
    expect(window.AudioContext).toHaveBeenCalled()
  })

  it('creates an oscillator and gain node', () => {
    const ctx = (window.AudioContext as any)()
    vi.clearAllMocks()
    playSound('levelChange')
    const newCtx = (window.AudioContext as any).mock.results[0]?.value
    expect(newCtx.createOscillator).toHaveBeenCalled()
    expect(newCtx.createGain).toHaveBeenCalled()
  })

  it('starts the oscillator', () => {
    playSound('levelChange')
    const ctx = (window.AudioContext as any).mock.results[0]?.value
    const oscillator = ctx.createOscillator.mock.results[0]?.value
    expect(oscillator.start).toHaveBeenCalled()
  })

  it('stops the oscillator after a short delay', () => {
    playSound('levelChange')
    const ctx = (window.AudioContext as any).mock.results[0]?.value
    const oscillator = ctx.createOscillator.mock.results[0]?.value
    expect(oscillator.stop).toHaveBeenCalled()
  })

  it('sets frequency for levelChange to 880', () => {
    playSound('levelChange')
    const ctx = (window.AudioContext as any).mock.results[0]?.value
    const oscillator = ctx.createOscillator.mock.results[0]?.value
    expect(oscillator.frequency.value).toBe(880)
  })

  it('sets frequency for warning to 440', () => {
    playSound('warning')
    const ctx = (window.AudioContext as any).mock.results[0]?.value
    const oscillator = ctx.createOscillator.mock.results[0]?.value
    expect(oscillator.frequency.value).toBe(440)
  })

  it('sets frequency for break to 660', () => {
    playSound('break')
    const ctx = (window.AudioContext as any).mock.results[0]?.value
    const oscillator = ctx.createOscillator.mock.results[0]?.value
    expect(oscillator.frequency.value).toBe(660)
  })

  it('connects oscillator through gain node', () => {
    playSound('levelChange')
    const ctx = (window.AudioContext as any).mock.results[0]?.value
    const oscillator = ctx.createOscillator.mock.results[0]?.value
    const gainNode = ctx.createGain.mock.results[0]?.value
    expect(oscillator.connect).toHaveBeenCalledWith(gainNode)
    expect(gainNode.connect).toHaveBeenCalledWith(ctx.destination)
  })

  it('sets low gain volume', () => {
    playSound('levelChange')
    const ctx = (window.AudioContext as any).mock.results[0]?.value
    const gainNode = ctx.createGain.mock.results[0]?.value
    expect(gainNode.gain.value).toBe(0.1)
  })
})

describe('checkForUpdates', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    ;(localStorage.getItem as ReturnType<typeof vi.fn>).mockReturnValue(null)
  })

  it('returns cached result within interval', async () => {
    const cachedData = {
      timestamp: Date.now(),
      data: { updateAvailable: false, latestVersion: '1.2.0', downloadUrl: 'https://example.com' },
    }
    ;(localStorage.getItem as ReturnType<typeof vi.fn>).mockReturnValue(JSON.stringify(cachedData))

    const result = await checkForUpdates()
    expect(result).toEqual(cachedData.data)
  })

  it('ignores expired cache', async () => {
    const expiredData = {
      timestamp: Date.now() - 2 * 60 * 60 * 1000, // 2 hours ago
      data: { updateAvailable: false, latestVersion: '1.0.0', downloadUrl: '' },
    }
    ;(localStorage.getItem as ReturnType<typeof vi.fn>).mockReturnValue(JSON.stringify(expiredData))

    // Mock fetch for GitHub API fallback
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ tag_name: 'v1.2.0', body: 'Release notes' }),
    }) as any

    const result = await checkForUpdates()
    expect(global.fetch).toHaveBeenCalled()

    vi.restoreAllMocks()
  })

  it('returns null on fetch failure', async () => {
    ;(localStorage.getItem as ReturnType<typeof vi.fn>).mockReturnValue(null)

    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 404,
    }) as any

    const result = await checkForUpdates()
    expect(result).toBeNull()

    vi.restoreAllMocks()
  })

  it('returns null on network error', async () => {
    ;(localStorage.getItem as ReturnType<typeof vi.fn>).mockReturnValue(null)

    global.fetch = vi.fn().mockRejectedValue(new Error('Network error')) as any

    const result = await checkForUpdates()
    expect(result).toBeNull()

    vi.restoreAllMocks()
  })

  it('detects new version available', async () => {
    ;(localStorage.getItem as ReturnType<typeof vi.fn>).mockReturnValue(null)

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ tag_name: 'v99.0.0', body: 'Big update' }),
    }) as any

    const result = await checkForUpdates()
    expect(result?.updateAvailable).toBe(true)
    expect(result?.latestVersion).toBe('99.0.0')

    vi.restoreAllMocks()
  })

  it('detects no update when versions match', async () => {
    ;(localStorage.getItem as ReturnType<typeof vi.fn>).mockReturnValue(null)

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ tag_name: `v${CURRENT_VERSION}`, body: '' }),
    }) as any

    const result = await checkForUpdates()
    expect(result?.updateAvailable).toBe(false)

    vi.restoreAllMocks()
  })

  it('caches the result in localStorage', async () => {
    ;(localStorage.getItem as ReturnType<typeof vi.fn>).mockReturnValue(null)

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ tag_name: 'v1.2.0', body: '' }),
    }) as any

    await checkForUpdates()
    expect(localStorage.setItem).toHaveBeenCalled()

    vi.restoreAllMocks()
  })

  it('includes release notes in result', async () => {
    ;(localStorage.getItem as ReturnType<typeof vi.fn>).mockReturnValue(null)

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ tag_name: 'v2.0.0', body: 'Major release notes' }),
    }) as any

    const result = await checkForUpdates()
    expect(result?.releaseNotes).toBe('Major release notes')

    vi.restoreAllMocks()
  })
})

describe('CURRENT_VERSION', () => {
  it('is a valid semver string', () => {
    expect(CURRENT_VERSION).toMatch(/^\d+\.\d+\.\d+$/)
  })

  it('is the expected version', () => {
    expect(CURRENT_VERSION).toBe('1.2.2')
  })
})
