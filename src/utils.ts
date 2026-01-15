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
