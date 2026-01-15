import { invoke } from '@tauri-apps/api/core'
import type { Tournament, Player } from './types'

export const api = {
  getTournament: () => invoke<Tournament>('get_tournament'),
  updateTournament: (tournament: Tournament) => invoke('update_tournament', { tournament }),
  
  addPlayer: (name: string) => invoke<Player>('add_player', { name }),
  removePlayer: (playerId: string) => invoke('remove_player', { playerId }),
  updatePlayer: (player: Player) => invoke('update_player', { player }),
  eliminatePlayer: (playerId: string) => invoke('eliminate_player', { playerId }),
  
  startTimer: () => invoke('start_timer'),
  pauseTimer: () => invoke('pause_timer'),
  tickTimer: () => invoke<Tournament>('tick_timer'),
  nextLevel: () => invoke('next_level'),
  prevLevel: () => invoke('prev_level'),
  addTime: (seconds: number) => invoke('add_time', { seconds }),
  
  resetTournament: () => invoke('reset_tournament'),
  saveTournament: () => invoke<string>('save_tournament'),
  loadTournament: (id: string) => invoke<Tournament>('load_tournament', { id }),
  listTournaments: () => invoke<string[]>('list_tournaments'),
}

// For development without Tauri
export const mockApi = {
  tournament: {
    id: 'dev-tournament',
    name: 'Friday Night Poker',
    buyin_amount: 100,
    rebuy_amount: 100,
    rebuy_chips: 10000,
    addon_amount: 100,
    addon_chips: 10000,
    starting_chips: 10000,
    players: [
      { id: '1', name: 'Alice', buyins: 1, rebuys: 0, addons: 0, eliminated: false, placement: null },
      { id: '2', name: 'Bob', buyins: 1, rebuys: 1, addons: 0, eliminated: false, placement: null },
      { id: '3', name: 'Charlie', buyins: 1, rebuys: 0, addons: 0, eliminated: true, placement: 3 },
    ],
    blind_structure: [
      { id: '1', small_blind: 25, big_blind: 50, ante: 0, duration_minutes: 15, is_break: false },
      { id: '2', small_blind: 50, big_blind: 100, ante: 0, duration_minutes: 15, is_break: false },
      { id: '3', small_blind: 75, big_blind: 150, ante: 0, duration_minutes: 15, is_break: false },
      { id: '4', small_blind: 100, big_blind: 200, ante: 25, duration_minutes: 15, is_break: false },
      { id: 'break1', small_blind: 0, big_blind: 0, ante: 0, duration_minutes: 10, is_break: true },
      { id: '5', small_blind: 150, big_blind: 300, ante: 25, duration_minutes: 15, is_break: false },
      { id: '6', small_blind: 200, big_blind: 400, ante: 50, duration_minutes: 15, is_break: false },
    ],
    current_level: 0,
    time_remaining_seconds: 900,
    is_running: false,
    currency_symbol: '$',
  } as Tournament,
}
