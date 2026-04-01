import type { Tournament, Player, BlindLevel, PhysicalChip } from './types'

export function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
}

export function formatCurrency(amount: number, symbol: string = '$'): string {
  return `${symbol}${amount.toLocaleString()}`
}

export function calculatePrizePool(tournament: Tournament): number {
  const totalBuyins = tournament.players.reduce((sum, p) => sum + p.buyins, 0)
  const totalRebuys = tournament.players.reduce((sum, p) => sum + p.rebuys, 0)
  const totalAddons = tournament.players.reduce((sum, p) => sum + p.addons, 0)
  return (totalBuyins * tournament.buyin_amount) + (totalRebuys * tournament.rebuy_amount) + (totalAddons * tournament.addon_amount)
}

export function calculatePayouts(prizePool: number, places: number = 3): { place: number; amount: number; percentage: number }[] {
  const percentages = places === 1 
    ? [100]
    : places === 2 
    ? [65, 35]
    : places === 3 
    ? [50, 30, 20]
    : places === 4
    ? [45, 27, 18, 10]
    : [40, 25, 15, 12, 8]

  return percentages.slice(0, places).map((pct, i) => ({
    place: i + 1,
    amount: Math.floor(prizePool * pct / 100),
    percentage: pct,
  }))
}

export function getActivePlayers(players: Player[]): Player[] {
  return players.filter(p => !p.eliminated)
}

export function getEliminatedPlayers(players: Player[]): Player[] {
  return players.filter(p => p.eliminated).sort((a, b) => (a.placement || 0) - (b.placement || 0))
}

export function getAverageStack(tournament: Tournament): number {
  const activePlayers = getActivePlayers(tournament.players)
  if (activePlayers.length === 0) return 0
  
  const totalBuyins = tournament.players.reduce((sum, p) => sum + p.buyins, 0)
  const totalRebuys = tournament.players.reduce((sum, p) => sum + p.rebuys, 0)
  const totalAddons = tournament.players.reduce((sum, p) => sum + p.addons, 0)
  
  const totalChips = 
    (totalBuyins * tournament.starting_chips) + 
    (totalRebuys * tournament.rebuy_chips) + 
    (totalAddons * tournament.addon_chips)
  
  return Math.floor(totalChips / activePlayers.length)
}

export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2)
}

export function playSound(type: 'levelChange' | 'warning' | 'break'): void {
  // Audio notification - can be enhanced with actual sound files
  const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
  const oscillator = audioContext.createOscillator()
  const gainNode = audioContext.createGain()
  
  oscillator.connect(gainNode)
  gainNode.connect(audioContext.destination)
  
  const frequencies: Record<string, number> = {
    levelChange: 880,
    warning: 440,
    break: 660,
  }
  
  oscillator.frequency.value = frequencies[type] || 440
  oscillator.type = 'sine'
  gainNode.gain.value = 0.1
  
  oscillator.start()
  oscillator.stop(audioContext.currentTime + 0.2)
}

// GitHub update checker
export const CURRENT_VERSION = '1.2.1'
const GITHUB_REPO = 'davidelvar/pokerpulsepro-tauri'
const UPDATE_CHECK_KEY = 'pokerpulse_update_check'
const UPDATE_CHECK_INTERVAL = 60 * 60 * 1000 // 1 hour in milliseconds

// Check if running in Tauri
const isTauri = typeof window !== 'undefined' && '__TAURI__' in window

export interface UpdateInfo {
  updateAvailable: boolean
  latestVersion: string
  downloadUrl: string
  releaseNotes?: string
  tauriUpdate?: any // The Tauri update object for downloading/installing
}

function compareVersions(current: string, latest: string): boolean {
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

export async function checkForUpdates(): Promise<UpdateInfo | null> {
  try {
    // Check cache first (for the UI display)
    const cached = localStorage.getItem(UPDATE_CHECK_KEY)
    if (cached) {
      const { timestamp, data } = JSON.parse(cached)
      if (Date.now() - timestamp < UPDATE_CHECK_INTERVAL) {
        return data
      }
    }

    // Try Tauri updater first if available
    if (isTauri) {
      try {
        const { check } = await import('@tauri-apps/plugin-updater')
        const update = await check()
        
        if (update) {
          const updateInfo: UpdateInfo = {
            updateAvailable: true,
            latestVersion: update.version,
            downloadUrl: 'https://www.pokerpulsepro.com',
            releaseNotes: update.body || undefined,
            tauriUpdate: update
          }
          
          // Cache the result
          localStorage.setItem(UPDATE_CHECK_KEY, JSON.stringify({
            timestamp: Date.now(),
            data: { ...updateInfo, tauriUpdate: undefined } // Don't cache the update object
          }))
          
          return updateInfo
        } else {
          // No update available
          const updateInfo: UpdateInfo = {
            updateAvailable: false,
            latestVersion: CURRENT_VERSION,
            downloadUrl: 'https://www.pokerpulsepro.com'
          }
          localStorage.setItem(UPDATE_CHECK_KEY, JSON.stringify({
            timestamp: Date.now(),
            data: updateInfo
          }))
          return updateInfo
        }
      } catch (tauriError) {
        console.warn('Tauri updater not available, falling back to GitHub API:', tauriError)
      }
    }

    // Fallback to GitHub API (for web/dev mode)
    const response = await fetch(`https://api.github.com/repos/${GITHUB_REPO}/releases/latest`, {
      headers: { 'Accept': 'application/vnd.github.v3+json' }
    })
    
    if (!response.ok) {
      console.warn('Failed to check for updates:', response.status)
      return null
    }

    const release = await response.json()
    const latestVersion = release.tag_name.replace('v', '')
    const updateAvailable = compareVersions(CURRENT_VERSION, latestVersion)

    const updateInfo: UpdateInfo = {
      updateAvailable,
      latestVersion,
      downloadUrl: 'https://www.pokerpulsepro.com',
      releaseNotes: release.body
    }

    // Cache the result
    localStorage.setItem(UPDATE_CHECK_KEY, JSON.stringify({
      timestamp: Date.now(),
      data: updateInfo
    }))

    return updateInfo
  } catch (error) {
    console.warn('Error checking for updates:', error)
    return null
  }
}

// Download and install update using Tauri updater
export async function downloadAndInstallUpdate(updateInfo: UpdateInfo): Promise<boolean> {
  if (!isTauri) {
    // Not in Tauri - open website
    window.open(updateInfo.downloadUrl, '_blank')
    return false
  }

  try {
    // Always get a fresh update object (cached updateInfo won't have tauriUpdate)
    let update = updateInfo.tauriUpdate
    if (!update) {
      const { check } = await import('@tauri-apps/plugin-updater')
      update = await check()
    }

    if (!update) {
      // No update found - open website as fallback
      window.open(updateInfo.downloadUrl, '_blank')
      return false
    }
    
    // Download the update
    await update.downloadAndInstall()
    
    // Relaunch the app
    const { relaunch } = await import('@tauri-apps/plugin-process')
    await relaunch()
    
    return true
  } catch (error) {
    console.error('Failed to install update:', error)
    // Fallback to website
    window.open(updateInfo.downloadUrl, '_blank')
    return false
  }
}

// Multi-table utilities

export interface TableAssignment {
  tableNumber: number
  seatNumber: number
}

export interface TableInfo {
  tableNumber: number
  players: Player[]
  emptySeats: number
}

export interface BalanceSuggestion {
  player: Player
  fromTable: number
  toTable: number
  reason: string
}

// Get table information for all tables
export function getTableInfo(players: Player[], tableCount: number, seatsPerTable: number): TableInfo[] {
  const tables: TableInfo[] = []
  
  for (let t = 1; t <= tableCount; t++) {
    const tablePlayers = players.filter(p => !p.eliminated && p.tableNumber === t)
      .sort((a, b) => (a.seatNumber || 0) - (b.seatNumber || 0))
    tables.push({
      tableNumber: t,
      players: tablePlayers,
      emptySeats: seatsPerTable - tablePlayers.length
    })
  }
  
  return tables
}

// Get unassigned active players
export function getUnassignedPlayers(players: Player[]): Player[] {
  return players.filter(p => !p.eliminated && p.tableNumber === null)
}

// Random seat assignment using snake draft for fairness
export function assignPlayersToTables(
  players: Player[], 
  tableCount: number, 
  seatsPerTable: number
): Player[] {
  const activePlayers = players.filter(p => !p.eliminated)
  const eliminatedPlayers = players.filter(p => p.eliminated)
  
  // Shuffle active players randomly
  const shuffled = [...activePlayers].sort(() => Math.random() - 0.5)
  
  // Create seat assignments using snake draft
  const assignments: Map<string, TableAssignment> = new Map()
  let playerIndex = 0
  
  // Fill tables round by round (snake pattern)
  for (let seat = 1; seat <= seatsPerTable && playerIndex < shuffled.length; seat++) {
    // Alternate direction each row for snake draft
    const tables = seat % 2 === 1 
      ? Array.from({ length: tableCount }, (_, i) => i + 1)
      : Array.from({ length: tableCount }, (_, i) => tableCount - i)
    
    for (const table of tables) {
      if (playerIndex >= shuffled.length) break
      assignments.set(shuffled[playerIndex].id, { tableNumber: table, seatNumber: seat })
      playerIndex++
    }
  }
  
  // Apply assignments to players
  const assignedActive = activePlayers.map(p => ({
    ...p,
    tableNumber: assignments.get(p.id)?.tableNumber ?? null,
    seatNumber: assignments.get(p.id)?.seatNumber ?? null
  }))
  
  // Keep eliminated players without table assignments
  const clearedEliminated = eliminatedPlayers.map(p => ({
    ...p,
    tableNumber: null,
    seatNumber: null
  }))
  
  return [...assignedActive, ...clearedEliminated]
}

// Clear all table assignments
export function clearTableAssignments(players: Player[]): Player[] {
  return players.map(p => ({
    ...p,
    tableNumber: null,
    seatNumber: null
  }))
}

// Get balance suggestions when tables are uneven
export function getTableBalanceSuggestions(
  players: Player[], 
  tableCount: number, 
  seatsPerTable: number
): BalanceSuggestion[] {
  const tables = getTableInfo(players, tableCount, seatsPerTable)
  const suggestions: BalanceSuggestion[] = []
  
  // Find min and max table sizes
  const tableSizes = tables.map(t => t.players.length).filter(s => s > 0)
  if (tableSizes.length < 2) return suggestions
  
  const minSize = Math.min(...tableSizes)
  const maxSize = Math.max(...tableSizes)
  
  // If difference is more than 1, suggest moves
  if (maxSize - minSize > 1) {
    const largestTable = tables.find(t => t.players.length === maxSize)
    const smallestTable = tables.find(t => t.players.length === minSize)
    
    if (largestTable && smallestTable && largestTable.players.length > 0) {
      // Suggest moving a random player from largest to smallest
      const playerToMove = largestTable.players[Math.floor(Math.random() * largestTable.players.length)]
      suggestions.push({
        player: playerToMove,
        fromTable: largestTable.tableNumber,
        toTable: smallestTable.tableNumber,
        reason: `Table ${largestTable.tableNumber} has ${largestTable.players.length} players, Table ${smallestTable.tableNumber} has ${smallestTable.players.length}`
      })
    }
  }
  
  return suggestions
}

// Move a player to a specific table and seat
export function movePlayerToSeat(
  players: Player[], 
  playerId: string, 
  tableNumber: number, 
  seatNumber: number
): Player[] {
  return players.map(p => 
    p.id === playerId 
      ? { ...p, tableNumber, seatNumber }
      : p
  )
}

// Check if a seat is occupied
export function isSeatOccupied(players: Player[], tableNumber: number, seatNumber: number): boolean {
  return players.some(p => !p.eliminated && p.tableNumber === tableNumber && p.seatNumber === seatNumber)
}

// Get next available seat at a table
export function getNextAvailableSeat(players: Player[], tableNumber: number, seatsPerTable: number): number | null {
  for (let seat = 1; seat <= seatsPerTable; seat++) {
    if (!isSeatOccupied(players, tableNumber, seat)) {
      return seat
    }
  }
  return null
}

export interface ColorUpEntry {
  chipValue: number
  color: string
  borderColor: string
  textColor: string
  levelIndex: number
  smallBlind: number
  bigBlind: number
}

export function calculateColorUpSchedule(
  chips: PhysicalChip[],
  blindStructure: BlindLevel[]
): ColorUpEntry[] {
  const sorted = [...chips].sort((a, b) => a.value - b.value)
  const schedule: ColorUpEntry[] = []

  for (let c = 0; c < sorted.length - 1; c++) {
    const chip = sorted[c]
    const nextChip = sorted[c + 1]
    if (!nextChip) continue

    for (let i = 0; i < blindStructure.length; i++) {
      const level = blindStructure[i]
      if (level.is_break) continue

      const smallBlindOk = level.small_blind >= nextChip.value
      const anteOk = level.ante === 0 || level.ante >= nextChip.value

      if (smallBlindOk && anteOk) {
        schedule.push({
          chipValue: chip.value,
          color: chip.color,
          borderColor: chip.borderColor,
          textColor: chip.textColor,
          levelIndex: i,
          smallBlind: level.small_blind,
          bigBlind: level.big_blind,
        })
        break
      }
    }
  }

  return schedule
}

