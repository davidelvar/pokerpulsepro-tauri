import type { Tournament, Player } from './types'

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
export const CURRENT_VERSION = '1.1.0'
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
  if (!isTauri || !updateInfo.tauriUpdate) {
    // Not in Tauri or no update object - open website
    window.open(updateInfo.downloadUrl, '_blank')
    return false
  }

  try {
    const update = updateInfo.tauriUpdate
    
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
