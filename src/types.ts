export interface Player {
  id: string
  name: string
  buyins: number
  rebuys: number
  addons: number
  eliminated: boolean
  placement: number | null
  tableNumber: number | null
  seatNumber: number | null
}

export interface BlindLevel {
  id: string
  small_blind: number
  big_blind: number
  ante: number
  duration_minutes: number
  is_break: boolean
}

export interface Tournament {
  id: string
  name: string
  buyin_amount: number
  rebuy_amount: number
  rebuy_chips: number
  addon_amount: number
  addon_chips: number
  starting_chips: number
  players: Player[]
  blind_structure: BlindLevel[]
  current_level: number
  time_remaining_seconds: number
  is_running: boolean
  currency_symbol: string
  tableCount: number
  seatsPerTable: number
}

export interface SoundSettings {
  enabled: boolean
  soundType: 'bell' | 'evil-laugh' | 'custom'
  customSoundPath: string | null
  volume: number
  voiceEnabled: boolean
  warningEnabled: boolean
  warningAt60: boolean
  warningAt30: boolean
  autoPauseOnBreak: boolean
}

export type ThemeMode = 'dark' | 'light'
export type AccentColor = 'emerald' | 'blue' | 'purple' | 'rose' | 'amber' | 'cyan'

export type TimeFormat = '12h' | '24h'

export interface ThemeSettings {
  mode: ThemeMode
  accent: AccentColor
  timeFormat: TimeFormat
  showAnte: boolean
}

export interface TournamentHistoryEntry {
  id: string
  name: string
  date: string
  playerCount: number
  winner: string | null
  prizePool: number
  currency_symbol: string
  duration_minutes: number
}

export interface PhysicalChip {
  id: string
  value: number
  color: string
  borderColor: string
  textColor: string
  label: string
  quantity: number
}

export type Tab = 'timer' | 'players' | 'blinds' | 'prizes' | 'settings' | 'help'
