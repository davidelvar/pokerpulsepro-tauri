import { describe, it, expect, vi } from 'vitest'

// Mock Tauri invoke
vi.mock('@tauri-apps/api/core', () => ({
  invoke: vi.fn(),
}))

import { api, mockApi } from '../api'
import { invoke } from '@tauri-apps/api/core'

describe('API Module', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('api object', () => {
    it('has getTournament method', () => {
      expect(typeof api.getTournament).toBe('function')
    })

    it('has updateTournament method', () => {
      expect(typeof api.updateTournament).toBe('function')
    })

    it('has addPlayer method', () => {
      expect(typeof api.addPlayer).toBe('function')
    })

    it('has removePlayer method', () => {
      expect(typeof api.removePlayer).toBe('function')
    })

    it('has updatePlayer method', () => {
      expect(typeof api.updatePlayer).toBe('function')
    })

    it('has eliminatePlayer method', () => {
      expect(typeof api.eliminatePlayer).toBe('function')
    })

    it('has timer control methods', () => {
      expect(typeof api.startTimer).toBe('function')
      expect(typeof api.pauseTimer).toBe('function')
      expect(typeof api.tickTimer).toBe('function')
      expect(typeof api.nextLevel).toBe('function')
      expect(typeof api.prevLevel).toBe('function')
      expect(typeof api.addTime).toBe('function')
    })

    it('has tournament management methods', () => {
      expect(typeof api.resetTournament).toBe('function')
      expect(typeof api.saveTournament).toBe('function')
      expect(typeof api.loadTournament).toBe('function')
      expect(typeof api.listTournaments).toBe('function')
    })
  })

  describe('api method calls', () => {
    it('getTournament calls invoke with correct command', async () => {
      await api.getTournament()
      expect(invoke).toHaveBeenCalledWith('get_tournament')
    })

    it('updateTournament calls invoke with tournament', async () => {
      const tournament = mockApi.tournament
      await api.updateTournament(tournament)
      expect(invoke).toHaveBeenCalledWith('update_tournament', { tournament })
    })

    it('addPlayer calls invoke with name', async () => {
      await api.addPlayer('TestPlayer')
      expect(invoke).toHaveBeenCalledWith('add_player', { name: 'TestPlayer' })
    })

    it('removePlayer calls invoke with playerId', async () => {
      await api.removePlayer('player-123')
      expect(invoke).toHaveBeenCalledWith('remove_player', { playerId: 'player-123' })
    })

    it('eliminatePlayer calls invoke with playerId', async () => {
      await api.eliminatePlayer('player-456')
      expect(invoke).toHaveBeenCalledWith('eliminate_player', { playerId: 'player-456' })
    })

    it('startTimer calls invoke correctly', async () => {
      await api.startTimer()
      expect(invoke).toHaveBeenCalledWith('start_timer')
    })

    it('pauseTimer calls invoke correctly', async () => {
      await api.pauseTimer()
      expect(invoke).toHaveBeenCalledWith('pause_timer')
    })

    it('nextLevel calls invoke correctly', async () => {
      await api.nextLevel()
      expect(invoke).toHaveBeenCalledWith('next_level')
    })

    it('prevLevel calls invoke correctly', async () => {
      await api.prevLevel()
      expect(invoke).toHaveBeenCalledWith('prev_level')
    })

    it('addTime calls invoke with seconds', async () => {
      await api.addTime(60)
      expect(invoke).toHaveBeenCalledWith('add_time', { seconds: 60 })
    })

    it('addTime handles negative seconds', async () => {
      await api.addTime(-30)
      expect(invoke).toHaveBeenCalledWith('add_time', { seconds: -30 })
    })

    it('resetTournament calls invoke correctly', async () => {
      await api.resetTournament()
      expect(invoke).toHaveBeenCalledWith('reset_tournament')
    })

    it('saveTournament calls invoke correctly', async () => {
      await api.saveTournament()
      expect(invoke).toHaveBeenCalledWith('save_tournament')
    })

    it('loadTournament calls invoke with id', async () => {
      await api.loadTournament('tournament-789')
      expect(invoke).toHaveBeenCalledWith('load_tournament', { id: 'tournament-789' })
    })

    it('listTournaments calls invoke correctly', async () => {
      await api.listTournaments()
      expect(invoke).toHaveBeenCalledWith('list_tournaments')
    })
  })

  describe('mockApi', () => {
    it('has a tournament object', () => {
      expect(mockApi.tournament).toBeDefined()
    })

    it('tournament has required properties', () => {
      const { tournament } = mockApi
      expect(tournament.id).toBe('dev-tournament')
      expect(tournament.name).toBe('')
      expect(tournament.buyin_amount).toBe(100)
      expect(tournament.starting_chips).toBe(10000)
      expect(tournament.currency_symbol).toBe('$')
    })

    it('tournament has empty players array', () => {
      expect(Array.isArray(mockApi.tournament.players)).toBe(true)
      expect(mockApi.tournament.players.length).toBe(0)
    })

    it('tournament has blind structure', () => {
      expect(Array.isArray(mockApi.tournament.blind_structure)).toBe(true)
      expect(mockApi.tournament.blind_structure.length).toBeGreaterThan(0)
    })

    it('tournament has initial state values', () => {
      expect(mockApi.tournament.current_level).toBe(0)
      expect(mockApi.tournament.time_remaining_seconds).toBe(900)
      expect(mockApi.tournament.is_running).toBe(false)
    })

    it('blind structure includes a break', () => {
      const breakLevel = mockApi.tournament.blind_structure.find(b => b.is_break)
      expect(breakLevel).toBeDefined()
      expect(breakLevel?.small_blind).toBe(0)
      expect(breakLevel?.big_blind).toBe(0)
    })
  })
})
