import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  getTableInfo,
  getUnassignedPlayers,
  assignPlayersToTables,
  getTableBalanceSuggestions,
  clearTableAssignments,
  movePlayerToSeat,
  isSeatOccupied,
  getNextAvailableSeat,
} from '../utils'
import type { Player } from '../types'

// Helper to create test players
const createPlayer = (id: string, name: string, overrides: Partial<Player> = {}): Player => ({
  id,
  name,
  buyins: 1,
  rebuys: 0,
  addons: 0,
  eliminated: false,
  placement: null,
  tableNumber: null,
  seatNumber: null,
  ...overrides,
})

describe('Multi-Table Utilities', () => {
  describe('getTableInfo', () => {
    it('returns empty tables when no players assigned', () => {
      const players = [
        createPlayer('1', 'Alice'),
        createPlayer('2', 'Bob'),
      ]
      
      const tableInfo = getTableInfo(players, 2, 9)
      
      expect(tableInfo).toHaveLength(2)
      expect(tableInfo[0].players).toHaveLength(0)
      expect(tableInfo[0].emptySeats).toBe(9)
      expect(tableInfo[1].players).toHaveLength(0)
    })

    it('groups players by table correctly', () => {
      const players = [
        createPlayer('1', 'Alice', { tableNumber: 1, seatNumber: 1 }),
        createPlayer('2', 'Bob', { tableNumber: 1, seatNumber: 2 }),
        createPlayer('3', 'Charlie', { tableNumber: 2, seatNumber: 1 }),
      ]
      
      const tableInfo = getTableInfo(players, 2, 9)
      
      expect(tableInfo[0].players).toHaveLength(2)
      expect(tableInfo[0].emptySeats).toBe(7)
      expect(tableInfo[1].players).toHaveLength(1)
      expect(tableInfo[1].emptySeats).toBe(8)
    })

    it('excludes eliminated players', () => {
      const players = [
        createPlayer('1', 'Alice', { tableNumber: 1, seatNumber: 1 }),
        createPlayer('2', 'Bob', { tableNumber: 1, seatNumber: 2, eliminated: true }),
      ]
      
      const tableInfo = getTableInfo(players, 1, 9)
      
      expect(tableInfo[0].players).toHaveLength(1)
      expect(tableInfo[0].players[0].name).toBe('Alice')
    })

    it('sorts players by seat number', () => {
      const players = [
        createPlayer('1', 'Alice', { tableNumber: 1, seatNumber: 5 }),
        createPlayer('2', 'Bob', { tableNumber: 1, seatNumber: 2 }),
        createPlayer('3', 'Charlie', { tableNumber: 1, seatNumber: 8 }),
      ]
      
      const tableInfo = getTableInfo(players, 1, 9)
      
      expect(tableInfo[0].players[0].name).toBe('Bob')      // seat 2
      expect(tableInfo[0].players[1].name).toBe('Alice')    // seat 5
      expect(tableInfo[0].players[2].name).toBe('Charlie')  // seat 8
    })
  })

  describe('getUnassignedPlayers', () => {
    it('returns players without table assignment', () => {
      const players = [
        createPlayer('1', 'Alice', { tableNumber: 1, seatNumber: 1 }),
        createPlayer('2', 'Bob', { tableNumber: null }),
        createPlayer('3', 'Charlie', { tableNumber: null }),
      ]
      
      const unassigned = getUnassignedPlayers(players)
      
      expect(unassigned).toHaveLength(2)
      expect(unassigned.map(p => p.name)).toContain('Bob')
      expect(unassigned.map(p => p.name)).toContain('Charlie')
    })

    it('excludes eliminated players', () => {
      const players = [
        createPlayer('1', 'Alice', { tableNumber: null }),
        createPlayer('2', 'Bob', { tableNumber: null, eliminated: true }),
      ]
      
      const unassigned = getUnassignedPlayers(players)
      
      expect(unassigned).toHaveLength(1)
      expect(unassigned[0].name).toBe('Alice')
    })

    it('returns empty array when all assigned', () => {
      const players = [
        createPlayer('1', 'Alice', { tableNumber: 1, seatNumber: 1 }),
        createPlayer('2', 'Bob', { tableNumber: 2, seatNumber: 1 }),
      ]
      
      const unassigned = getUnassignedPlayers(players)
      
      expect(unassigned).toHaveLength(0)
    })
  })

  describe('assignPlayersToTables', () => {
    it('assigns all active players to tables', () => {
      const players = [
        createPlayer('1', 'Alice'),
        createPlayer('2', 'Bob'),
        createPlayer('3', 'Charlie'),
        createPlayer('4', 'David'),
      ]
      
      const assigned = assignPlayersToTables(players, 2, 9)
      const activePlayers = assigned.filter(p => !p.eliminated)
      
      activePlayers.forEach(p => {
        expect(p.tableNumber).not.toBeNull()
        expect(p.seatNumber).not.toBeNull()
      })
    })

    it('preserves eliminated players without assignment', () => {
      const players = [
        createPlayer('1', 'Alice'),
        createPlayer('2', 'Bob', { eliminated: true, placement: 5 }),
      ]
      
      const assigned = assignPlayersToTables(players, 1, 9)
      const eliminated = assigned.find(p => p.eliminated)
      
      expect(eliminated?.tableNumber).toBeNull()
      expect(eliminated?.placement).toBe(5)
    })

    it('distributes players evenly across tables', () => {
      const players = Array.from({ length: 18 }, (_, i) => 
        createPlayer(`${i}`, `Player ${i}`)
      )
      
      const assigned = assignPlayersToTables(players, 2, 9)
      
      const table1 = assigned.filter(p => p.tableNumber === 1)
      const table2 = assigned.filter(p => p.tableNumber === 2)
      
      expect(table1.length).toBe(9)
      expect(table2.length).toBe(9)
    })

    it('handles odd number of players', () => {
      const players = Array.from({ length: 17 }, (_, i) => 
        createPlayer(`${i}`, `Player ${i}`)
      )
      
      const assigned = assignPlayersToTables(players, 2, 9)
      
      const table1 = assigned.filter(p => p.tableNumber === 1)
      const table2 = assigned.filter(p => p.tableNumber === 2)
      
      // One table gets 9, other gets 8
      expect(Math.abs(table1.length - table2.length)).toBeLessThanOrEqual(1)
    })

    it('respects seat limits per table', () => {
      const players = Array.from({ length: 20 }, (_, i) => 
        createPlayer(`${i}`, `Player ${i}`)
      )
      
      const assigned = assignPlayersToTables(players, 3, 6)
      
      for (let t = 1; t <= 3; t++) {
        const tablePlayers = assigned.filter(p => p.tableNumber === t)
        expect(tablePlayers.length).toBeLessThanOrEqual(6)
      }
    })
  })

  describe('getTableBalanceSuggestions', () => {
    it('suggests moving player from larger to smaller table', () => {
      const players = [
        createPlayer('1', 'A', { tableNumber: 1, seatNumber: 1 }),
        createPlayer('2', 'B', { tableNumber: 1, seatNumber: 2 }),
        createPlayer('3', 'C', { tableNumber: 1, seatNumber: 3 }),
        createPlayer('4', 'D', { tableNumber: 1, seatNumber: 4 }),
        createPlayer('5', 'E', { tableNumber: 2, seatNumber: 1 }),
      ]
      
      const suggestions = getTableBalanceSuggestions(players, 2, 9)
      
      expect(suggestions.length).toBeGreaterThan(0)
      expect(suggestions[0].fromTable).toBe(1) // from larger table
      expect(suggestions[0].toTable).toBe(2)   // to smaller table
    })

    it('returns empty array when tables are balanced', () => {
      const players = [
        createPlayer('1', 'A', { tableNumber: 1, seatNumber: 1 }),
        createPlayer('2', 'B', { tableNumber: 1, seatNumber: 2 }),
        createPlayer('3', 'C', { tableNumber: 2, seatNumber: 1 }),
        createPlayer('4', 'D', { tableNumber: 2, seatNumber: 2 }),
      ]
      
      const suggestions = getTableBalanceSuggestions(players, 2, 9)
      
      expect(suggestions).toHaveLength(0)
    })

    it('returns empty array for single table difference', () => {
      const players = [
        createPlayer('1', 'A', { tableNumber: 1, seatNumber: 1 }),
        createPlayer('2', 'B', { tableNumber: 1, seatNumber: 2 }),
        createPlayer('3', 'C', { tableNumber: 1, seatNumber: 3 }),
        createPlayer('4', 'D', { tableNumber: 2, seatNumber: 1 }),
        createPlayer('5', 'E', { tableNumber: 2, seatNumber: 2 }),
      ]
      
      const suggestions = getTableBalanceSuggestions(players, 2, 9)
      
      expect(suggestions).toHaveLength(0) // 1 player difference is acceptable
    })
  })

  describe('clearTableAssignments', () => {
    it('clears all table and seat assignments', () => {
      const players = [
        createPlayer('1', 'A', { tableNumber: 1, seatNumber: 1 }),
        createPlayer('2', 'B', { tableNumber: 2, seatNumber: 3 }),
      ]
      
      const cleared = clearTableAssignments(players)
      
      cleared.forEach(p => {
        expect(p.tableNumber).toBeNull()
        expect(p.seatNumber).toBeNull()
      })
    })

    it('preserves other player properties', () => {
      const players = [
        createPlayer('1', 'Alice', { tableNumber: 1, seatNumber: 1, rebuys: 2, addons: 1 }),
      ]
      
      const cleared = clearTableAssignments(players)
      
      expect(cleared[0].name).toBe('Alice')
      expect(cleared[0].rebuys).toBe(2)
      expect(cleared[0].addons).toBe(1)
    })
  })

  describe('movePlayerToSeat', () => {
    it('moves player to new table and seat', () => {
      const players = [
        createPlayer('1', 'A', { tableNumber: 1, seatNumber: 1 }),
        createPlayer('2', 'B', { tableNumber: 1, seatNumber: 2 }),
      ]
      
      const updated = movePlayerToSeat(players, '1', 2, 5)
      const movedPlayer = updated.find(p => p.id === '1')
      
      expect(movedPlayer?.tableNumber).toBe(2)
      expect(movedPlayer?.seatNumber).toBe(5)
    })

    it('does not affect other players', () => {
      const players = [
        createPlayer('1', 'A', { tableNumber: 1, seatNumber: 1 }),
        createPlayer('2', 'B', { tableNumber: 1, seatNumber: 2 }),
      ]
      
      const updated = movePlayerToSeat(players, '1', 2, 5)
      const otherPlayer = updated.find(p => p.id === '2')
      
      expect(otherPlayer?.tableNumber).toBe(1)
      expect(otherPlayer?.seatNumber).toBe(2)
    })
  })

  describe('isSeatOccupied', () => {
    it('returns true for occupied seat', () => {
      const players = [
        createPlayer('1', 'A', { tableNumber: 1, seatNumber: 3 }),
      ]
      
      expect(isSeatOccupied(players, 1, 3)).toBe(true)
    })

    it('returns false for empty seat', () => {
      const players = [
        createPlayer('1', 'A', { tableNumber: 1, seatNumber: 3 }),
      ]
      
      expect(isSeatOccupied(players, 1, 5)).toBe(false)
    })

    it('returns false for eliminated player seat', () => {
      const players = [
        createPlayer('1', 'A', { tableNumber: 1, seatNumber: 3, eliminated: true }),
      ]
      
      expect(isSeatOccupied(players, 1, 3)).toBe(false)
    })
  })

  describe('getNextAvailableSeat', () => {
    it('returns first available seat', () => {
      const players = [
        createPlayer('1', 'A', { tableNumber: 1, seatNumber: 1 }),
        createPlayer('2', 'B', { tableNumber: 1, seatNumber: 2 }),
      ]
      
      const nextSeat = getNextAvailableSeat(players, 1, 9)
      
      expect(nextSeat).toBe(3)
    })

    it('finds seat in middle of occupied seats', () => {
      const players = [
        createPlayer('1', 'A', { tableNumber: 1, seatNumber: 1 }),
        createPlayer('2', 'B', { tableNumber: 1, seatNumber: 3 }),
      ]
      
      const nextSeat = getNextAvailableSeat(players, 1, 9)
      
      expect(nextSeat).toBe(2)
    })

    it('returns null when table is full', () => {
      const players = Array.from({ length: 9 }, (_, i) =>
        createPlayer(`${i}`, `P${i}`, { tableNumber: 1, seatNumber: i + 1 })
      )
      
      const nextSeat = getNextAvailableSeat(players, 1, 9)
      
      expect(nextSeat).toBeNull()
    })
  })
})

describe('Table Capacity Calculations', () => {
  it('calculates recommended table count', () => {
    const getRecommendedTables = (players: number, seatsPerTable: number) => {
      if (players <= seatsPerTable) return 1
      return Math.ceil(players / seatsPerTable)
    }

    expect(getRecommendedTables(6, 9)).toBe(1)
    expect(getRecommendedTables(9, 9)).toBe(1)
    expect(getRecommendedTables(10, 9)).toBe(2)
    expect(getRecommendedTables(18, 9)).toBe(2)
    expect(getRecommendedTables(19, 9)).toBe(3)
    expect(getRecommendedTables(27, 9)).toBe(3)
  })

  it('determines if consolidation is possible', () => {
    const canConsolidate = (
      activePlayers: number, 
      tableCount: number, 
      seatsPerTable: number
    ) => {
      const minTables = Math.ceil(activePlayers / seatsPerTable)
      return minTables < tableCount
    }

    // 12 players on 3 tables with 9 seats can consolidate to 2
    expect(canConsolidate(12, 3, 9)).toBe(true)
    
    // 18 players on 2 tables with 9 seats cannot consolidate
    expect(canConsolidate(18, 2, 9)).toBe(false)
    
    // 10 players on 2 tables cannot consolidate
    expect(canConsolidate(10, 2, 9)).toBe(false)
    
    // 8 players on 2 tables can consolidate to 1
    expect(canConsolidate(8, 2, 9)).toBe(true)
  })
})
