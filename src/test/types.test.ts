import { describe, it, expect } from 'vitest'
import type { Player, BlindLevel, Tournament, SoundSettings } from '../types'

describe('Player type', () => {
  it('should have required properties', () => {
    const player: Player = {
      id: 'test-1',
      name: 'Test Player',
      buyins: 1,
      rebuys: 0,
      addons: 0,
      eliminated: false,
      placement: null,
      tableNumber: 1,
      seatNumber: 3,
    }

    expect(player.id).toBe('test-1')
    expect(player.name).toBe('Test Player')
    expect(player.buyins).toBe(1)
    expect(player.eliminated).toBe(false)
    expect(player.placement).toBeNull()
    expect(player.tableNumber).toBe(1)
    expect(player.seatNumber).toBe(3)
  })

  it('should handle eliminated player with placement', () => {
    const player: Player = {
      id: 'test-2',
      name: 'Eliminated Player',
      buyins: 1,
      rebuys: 2,
      addons: 1,
      eliminated: true,
      placement: 5,
      tableNumber: null,
      seatNumber: null,
    }

    expect(player.eliminated).toBe(true)
    expect(player.placement).toBe(5)
    expect(player.rebuys).toBe(2)
    expect(player.addons).toBe(1)
  })
})

describe('BlindLevel type', () => {
  it('should represent a regular level', () => {
    const level: BlindLevel = {
      id: 'level-1',
      small_blind: 25,
      big_blind: 50,
      ante: 0,
      duration_minutes: 15,
      is_break: false,
    }

    expect(level.small_blind).toBe(25)
    expect(level.big_blind).toBe(50)
    expect(level.ante).toBe(0)
    expect(level.duration_minutes).toBe(15)
    expect(level.is_break).toBe(false)
  })

  it('should represent a break', () => {
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
  })

  it('should represent a level with ante', () => {
    const level: BlindLevel = {
      id: 'level-5',
      small_blind: 200,
      big_blind: 400,
      ante: 50,
      duration_minutes: 20,
      is_break: false,
    }

    expect(level.ante).toBe(50)
    expect(level.big_blind / level.small_blind).toBe(2)
  })
})

describe('Tournament type', () => {
  it('should have complete tournament structure', () => {
    const tournament: Tournament = {
      id: 'tourney-1',
      name: 'Friday Night Poker',
      buyin_amount: 50,
      rebuy_amount: 25,
      rebuy_chips: 5000,
      addon_amount: 25,
      addon_chips: 5000,
      starting_chips: 10000,
      players: [],
      blind_structure: [],
      current_level: 0,
      time_remaining_seconds: 900,
      is_running: false,
      currency_symbol: '$',
      tableCount: 2,
      seatsPerTable: 9,
    }

    expect(tournament.name).toBe('Friday Night Poker')
    expect(tournament.buyin_amount).toBe(50)
    expect(tournament.starting_chips).toBe(10000)
    expect(tournament.is_running).toBe(false)
    expect(tournament.tableCount).toBe(2)
    expect(tournament.seatsPerTable).toBe(9)
  })

  it('should handle tournament with players and levels', () => {
    const players: Player[] = [
      { id: 'p1', name: 'Alice', buyins: 1, rebuys: 0, addons: 0, eliminated: false, placement: null, tableNumber: 1, seatNumber: 1 },
      { id: 'p2', name: 'Bob', buyins: 1, rebuys: 1, addons: 0, eliminated: false, placement: null, tableNumber: 1, seatNumber: 2 },
    ]

    const blinds: BlindLevel[] = [
      { id: 'l1', small_blind: 25, big_blind: 50, ante: 0, duration_minutes: 15, is_break: false },
      { id: 'l2', small_blind: 50, big_blind: 100, ante: 0, duration_minutes: 15, is_break: false },
      { id: 'b1', small_blind: 0, big_blind: 0, ante: 0, duration_minutes: 10, is_break: true },
    ]

    const tournament: Tournament = {
      id: 'tourney-2',
      name: 'Test Tournament',
      buyin_amount: 100,
      rebuy_amount: 50,
      rebuy_chips: 5000,
      addon_amount: 50,
      addon_chips: 5000,
      starting_chips: 10000,
      players,
      blind_structure: blinds,
      current_level: 1,
      time_remaining_seconds: 450,
      is_running: true,
      currency_symbol: '€',
      tableCount: 1,
      seatsPerTable: 9,
    }

    expect(tournament.players).toHaveLength(2)
    expect(tournament.blind_structure).toHaveLength(3)
    expect(tournament.current_level).toBe(1)
    expect(tournament.is_running).toBe(true)
    expect(tournament.currency_symbol).toBe('€')
  })
})

describe('SoundSettings type', () => {
  it('should have all sound configuration options', () => {
    const settings: SoundSettings = {
      enabled: true,
      soundType: 'bell',
      customSoundPath: null,
      volume: 0.8,
      voiceEnabled: false,
      warningEnabled: true,
      warningAt60: true,
      warningAt30: true,
      autoPauseOnBreak: false,
    }

    expect(settings.enabled).toBe(true)
    expect(settings.soundType).toBe('bell')
    expect(settings.volume).toBe(0.8)
    expect(settings.warningEnabled).toBe(true)
    expect(settings.autoPauseOnBreak).toBe(false)
  })

  it('should support custom sound path', () => {
    const settings: SoundSettings = {
      enabled: true,
      soundType: 'custom',
      customSoundPath: '/path/to/custom-sound.mp3',
      volume: 1.0,
      voiceEnabled: false,
      warningEnabled: false,
      warningAt60: false,
      warningAt30: false,
      autoPauseOnBreak: true,
    }

    expect(settings.soundType).toBe('custom')
    expect(settings.customSoundPath).toBe('/path/to/custom-sound.mp3')
    expect(settings.autoPauseOnBreak).toBe(true)
  })

  it('should allow different sound types', () => {
    const bellSettings: SoundSettings = {
      enabled: true,
      soundType: 'bell',
      customSoundPath: null,
      volume: 0.5,
      voiceEnabled: false,
      warningEnabled: true,
      warningAt60: true,
      warningAt30: false,
      autoPauseOnBreak: false,
    }

    const evilLaughSettings: SoundSettings = {
      enabled: true,
      soundType: 'evil-laugh',
      customSoundPath: null,
      volume: 0.7,
      voiceEnabled: false,
      warningEnabled: true,
      warningAt60: false,
      warningAt30: true,
      autoPauseOnBreak: false,
    }

    expect(bellSettings.soundType).toBe('bell')
    expect(evilLaughSettings.soundType).toBe('evil-laugh')
  })
})
