import { useState, useEffect, useCallback, useRef } from 'react'
import type { Tournament, Tab, SoundSettings, ThemeSettings, TournamentHistoryEntry } from './types'
import { mockApi } from './api'
import { calculatePrizePool } from './utils'
import { Timer } from './components/Timer'
import { Players } from './components/Players'
import { Blinds } from './components/Blinds'
import { Prizes } from './components/Prizes'
import { Settings } from './components/Settings'
import { Help } from './components/Help'
import { Navigation } from './components/Navigation'
import { Header } from './components/Header'
import { ConfirmModal } from './components/Modal'
import { getCurrentWindow } from '@tauri-apps/api/window'

// Check if running in Tauri
const isTauri = typeof window !== 'undefined' && '__TAURI__' in window

const STORAGE_KEYS = {
  tournament: 'pokerpulse_tournament',
  soundSettings: 'pokerpulse_sound_settings',
  history: 'pokerpulse_tournament_history',
  activeTab: 'pokerpulse_active_tab',
  themeSettings: 'pokerpulse_theme_settings',
}

const defaultSoundSettings: SoundSettings = {
  enabled: true,
  soundType: 'bell',
  customSoundPath: null,
  volume: 0.7,
  warningEnabled: true,
  warningAt60: true,
  warningAt30: true,
  autoPauseOnBreak: true,
}

const defaultThemeSettings: ThemeSettings = {
  mode: 'dark',
  accent: 'emerald',
}

// Load saved state from localStorage
function loadSavedTournament(): Tournament {
  try {
    const saved = localStorage.getItem(STORAGE_KEYS.tournament)
    if (saved) {
      const parsed = JSON.parse(saved)
      // Migrate old data - add missing fields with defaults
      const migrated = {
        ...mockApi.tournament, // defaults
        ...parsed,
        // Ensure new fields exist
        rebuy_chips: parsed.rebuy_chips ?? parsed.starting_chips ?? 10000,
        addon_amount: parsed.addon_amount ?? parsed.rebuy_amount ?? 100,
        addon_chips: parsed.addon_chips ?? parsed.starting_chips ?? 10000,
        // Migrate players to include addons field
        players: (parsed.players || []).map((p: any) => ({
          ...p,
          addons: p.addons ?? 0,
        })),
        is_running: false, // Always start paused when restoring
      }
      return migrated
    }
  } catch (e) {
    console.error('Failed to load saved tournament:', e)
  }
  return mockApi.tournament
}

function loadSavedSoundSettings(): SoundSettings {
  try {
    const saved = localStorage.getItem(STORAGE_KEYS.soundSettings)
    if (saved) {
      const parsed = JSON.parse(saved)
      // Migrate old data - add missing fields with defaults
      return {
        ...defaultSoundSettings,
        ...parsed,
        warningEnabled: parsed.warningEnabled ?? true,
        warningAt60: parsed.warningAt60 ?? true,
        warningAt30: parsed.warningAt30 ?? true,
        autoPauseOnBreak: parsed.autoPauseOnBreak ?? true,
      }
    }
  } catch (e) {
    console.error('Failed to load saved sound settings:', e)
  }
  return defaultSoundSettings
}

function loadSavedTab(): Tab {
  try {
    const saved = localStorage.getItem(STORAGE_KEYS.activeTab)
    if (saved && ['timer', 'players', 'blinds', 'prizes', 'settings', 'help'].includes(saved)) {
      return saved as Tab
    }
  } catch (e) {
    console.error('Failed to load saved tab:', e)
  }
  return 'timer'
}

function loadSavedTheme(): ThemeSettings {
  try {
    const saved = localStorage.getItem(STORAGE_KEYS.themeSettings)
    if (saved) {
      return { ...defaultThemeSettings, ...JSON.parse(saved) }
    }
  } catch (e) {
    console.error('Failed to load saved theme:', e)
  }
  return defaultThemeSettings
}

export default function App() {
  const [isLoading, setIsLoading] = useState(true)
  const [tournament, setTournament] = useState<Tournament>(loadSavedTournament)
  const [activeTab, setActiveTab] = useState<Tab>(loadSavedTab)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [soundSettings, setSoundSettings] = useState<SoundSettings>(loadSavedSoundSettings)
  const [themeSettings, setThemeSettings] = useState<ThemeSettings>(loadSavedTheme)
  const [showResetConfirm, setShowResetConfirm] = useState(false)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const prevLevelRef = useRef(tournament.current_level)
  const warningSoundPlayedRef = useRef<{ 60: boolean; 30: boolean }>({ 60: false, 30: false })

  // Simulate loading / initialization
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false)
    }, 1200) // Show splash for 1.2 seconds
    return () => clearTimeout(timer)
  }, [])

  // Apply theme to document
  useEffect(() => {
    const root = document.documentElement
    // Apply mode
    root.classList.remove('light', 'dark')
    root.classList.add(themeSettings.mode)
    // Apply accent
    root.classList.remove('accent-emerald', 'accent-blue', 'accent-purple', 'accent-rose', 'accent-amber', 'accent-cyan')
    root.classList.add(`accent-${themeSettings.accent}`)
    // Save to localStorage
    localStorage.setItem(STORAGE_KEYS.themeSettings, JSON.stringify(themeSettings))
  }, [themeSettings])

  // Save tournament state whenever it changes
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.tournament, JSON.stringify(tournament))
  }, [tournament])

  // Save sound settings whenever they change
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.soundSettings, JSON.stringify(soundSettings))
  }, [soundSettings])

  // Save active tab whenever it changes
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.activeTab, activeTab)
  }, [activeTab])

  // Sync fullscreen state on load
  useEffect(() => {
    if (isTauri) {
      getCurrentWindow().isFullscreen().then(setIsFullscreen)
    }
  }, [])

  // Play sound when level changes
  const playLevelSound = useCallback(() => {
    if (!soundSettings.enabled) return
    
    let soundUrl: string
    if (soundSettings.soundType === 'bell') {
      soundUrl = '/alarms/bell-ring-01.wav'
    } else if (soundSettings.soundType === 'evil-laugh') {
      soundUrl = '/alarms/evil-laugh.wav'
    } else if (soundSettings.customSoundPath) {
      soundUrl = soundSettings.customSoundPath
    } else {
      return
    }

    const audio = new Audio(soundUrl)
    audio.volume = soundSettings.volume
    audio.play().catch(err => console.log('Audio play failed:', err))
    audioRef.current = audio
  }, [soundSettings])

  // Play warning beep sound
  const playWarningSound = useCallback(() => {
    if (!soundSettings.warningEnabled) return
    
    // Create a simple beep using Web Audio API
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
    const oscillator = audioContext.createOscillator()
    const gainNode = audioContext.createGain()
    
    oscillator.connect(gainNode)
    gainNode.connect(audioContext.destination)
    
    oscillator.frequency.value = 880 // High pitch beep
    oscillator.type = 'sine'
    gainNode.gain.value = soundSettings.volume * 0.3
    
    oscillator.start()
    oscillator.stop(audioContext.currentTime + 0.15)
  }, [soundSettings.warningEnabled, soundSettings.volume])

  // Detect level changes and play sound
  useEffect(() => {
    if (tournament.current_level !== prevLevelRef.current) {
      playLevelSound()
      prevLevelRef.current = tournament.current_level
      // Reset warning flags for new level
      warningSoundPlayedRef.current = { 60: false, 30: false }
      
      // Auto-pause on break
      const currentBlind = tournament.blind_structure[tournament.current_level]
      if (currentBlind?.is_break && soundSettings.autoPauseOnBreak) {
        setTournament(prev => ({ ...prev, is_running: false }))
      }
    }
  }, [tournament.current_level, tournament.blind_structure, soundSettings.autoPauseOnBreak, playLevelSound])

  // Warning sounds effect
  useEffect(() => {
    if (!tournament.is_running || !soundSettings.warningEnabled) return
    
    const timeRemaining = tournament.time_remaining_seconds
    
    // 60 second warning
    if (timeRemaining === 60 && soundSettings.warningAt60 && !warningSoundPlayedRef.current[60]) {
      playWarningSound()
      warningSoundPlayedRef.current[60] = true
    }
    
    // 30 second warning  
    if (timeRemaining === 30 && soundSettings.warningAt30 && !warningSoundPlayedRef.current[30]) {
      playWarningSound()
      warningSoundPlayedRef.current[30] = true
    }
  }, [tournament.time_remaining_seconds, tournament.is_running, soundSettings.warningEnabled, soundSettings.warningAt60, soundSettings.warningAt30, playWarningSound])

  // Timer tick effect
  useEffect(() => {
    if (!tournament.is_running) return

    const interval = setInterval(() => {
      setTournament(prev => {
        if (prev.time_remaining_seconds > 0) {
          return { ...prev, time_remaining_seconds: prev.time_remaining_seconds - 1 }
        } else if (prev.current_level < prev.blind_structure.length - 1) {
          const nextLevel = prev.current_level + 1
          return {
            ...prev,
            current_level: nextLevel,
            time_remaining_seconds: prev.blind_structure[nextLevel].duration_minutes * 60,
          }
        } else {
          return { ...prev, is_running: false }
        }
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [tournament.is_running])

  const toggleTimer = useCallback(() => {
    setTournament(prev => ({ ...prev, is_running: !prev.is_running }))
  }, [])

  const nextLevel = useCallback(() => {
    setTournament(prev => {
      if (prev.current_level < prev.blind_structure.length - 1) {
        const nextLevel = prev.current_level + 1
        return {
          ...prev,
          current_level: nextLevel,
          time_remaining_seconds: prev.blind_structure[nextLevel].duration_minutes * 60,
        }
      }
      return prev
    })
  }, [])

  const prevLevel = useCallback(() => {
    setTournament(prev => {
      if (prev.current_level > 0) {
        const prevLevelIdx = prev.current_level - 1
        return {
          ...prev,
          current_level: prevLevelIdx,
          time_remaining_seconds: prev.blind_structure[prevLevelIdx].duration_minutes * 60,
        }
      }
      return prev
    })
  }, [])

  const addTime = useCallback((seconds: number) => {
    setTournament(prev => ({
      ...prev,
      time_remaining_seconds: prev.time_remaining_seconds + seconds,
    }))
  }, [])

  const toggleFullscreen = useCallback(async () => {
    if (isTauri) {
      const window = getCurrentWindow()
      const isCurrentlyFullscreen = await window.isFullscreen()
      await window.setFullscreen(!isCurrentlyFullscreen)
      setIsFullscreen(!isCurrentlyFullscreen)
    } else {
      if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen()
        setIsFullscreen(true)
      } else {
        document.exitFullscreen()
        setIsFullscreen(false)
      }
    }
  }, [])

  // Keyboard shortcuts - must be after toggleFullscreen is defined
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger shortcuts when typing in inputs
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return
      }
      
      switch (e.code) {
        case 'Space':
          e.preventDefault()
          setTournament(prev => ({ ...prev, is_running: !prev.is_running }))
          break
        case 'ArrowRight':
          e.preventDefault()
          setTournament(prev => {
            if (prev.current_level < prev.blind_structure.length - 1) {
              const next = prev.current_level + 1
              warningSoundPlayedRef.current = { 60: false, 30: false }
              return {
                ...prev,
                current_level: next,
                time_remaining_seconds: prev.blind_structure[next].duration_minutes * 60,
              }
            }
            return prev
          })
          break
        case 'ArrowLeft':
          e.preventDefault()
          setTournament(prev => {
            if (prev.current_level > 0) {
              const prevIdx = prev.current_level - 1
              warningSoundPlayedRef.current = { 60: false, 30: false }
              return {
                ...prev,
                current_level: prevIdx,
                time_remaining_seconds: prev.blind_structure[prevIdx].duration_minutes * 60,
              }
            }
            return prev
          })
          break
        case 'Equal':
        case 'NumpadAdd':
          e.preventDefault()
          setTournament(prev => ({
            ...prev,
            time_remaining_seconds: prev.time_remaining_seconds + 60,
          }))
          break
        case 'Minus':
        case 'NumpadSubtract':
          e.preventDefault()
          setTournament(prev => ({
            ...prev,
            time_remaining_seconds: Math.max(0, prev.time_remaining_seconds - 60),
          }))
          break
        case 'KeyF':
          if (!e.ctrlKey && !e.metaKey) {
            e.preventDefault()
            toggleFullscreen()
          }
          break
        case 'Escape':
          if (isFullscreen) {
            e.preventDefault()
            toggleFullscreen()
          }
          break
      }
    }
    
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [toggleFullscreen, isFullscreen])

  const resetTournament = useCallback(() => {
    setShowResetConfirm(true)
  }, [])

  const confirmResetTournament = useCallback(() => {
    const fresh = { ...mockApi.tournament, name: tournament.name }
    setTournament(fresh)
    prevLevelRef.current = 0
  }, [tournament.name])

  // Complete tournament and save to history
  const completeTournament = useCallback((winnerName: string) => {
    const totalLevelMinutes = tournament.blind_structure
      .slice(0, tournament.current_level + 1)
      .reduce((sum, level) => sum + level.duration_minutes, 0)

    const entry: TournamentHistoryEntry = {
      id: `${Date.now()}`,
      name: tournament.name,
      date: new Date().toISOString(),
      playerCount: tournament.players.length,
      winner: winnerName,
      prizePool: calculatePrizePool(tournament),
      currency_symbol: tournament.currency_symbol,
      duration_minutes: totalLevelMinutes,
    }

    // Load existing history and add new entry
    try {
      const existingHistory = JSON.parse(localStorage.getItem(STORAGE_KEYS.history) || '[]')
      const updatedHistory = [entry, ...existingHistory].slice(0, 50) // Keep last 50
      localStorage.setItem(STORAGE_KEYS.history, JSON.stringify(updatedHistory))
    } catch (e) {
      console.error('Failed to save tournament history:', e)
    }
  }, [tournament])

  // Loading Screen
  if (isLoading) {
    return (
      <div className="min-h-screen bg-themed-primary flex flex-col items-center justify-center">
        {/* Logo / Icon */}
        <div className="mb-8 relative">
          <div className="w-24 h-24 rounded-2xl bg-accent/20 flex items-center justify-center animate-pulse">
            <svg className="w-14 h-14 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          {/* Spinning ring */}
          <div className="absolute inset-0 w-24 h-24 border-4 border-transparent border-t-accent rounded-full animate-spin" />
        </div>
        
        {/* App Name */}
        <h1 className="text-3xl font-bold text-themed-primary mb-2">PokerPulsePro</h1>
        <p className="text-themed-muted text-sm mb-8">Tournament Timer & Manager</p>
        
        {/* Loading dots */}
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 rounded-full bg-accent animate-bounce" style={{ animationDelay: '0ms' }} />
          <div className="w-2 h-2 rounded-full bg-accent animate-bounce" style={{ animationDelay: '150ms' }} />
          <div className="w-2 h-2 rounded-full bg-accent animate-bounce" style={{ animationDelay: '300ms' }} />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-themed-primary flex flex-col border border-themed-subtle">
      <Header 
        tournament={tournament} 
        setTournament={setTournament}
        isFullscreen={isFullscreen}
        toggleFullscreen={toggleFullscreen}
      />
      
      <div className="flex-1 flex overflow-hidden">
        <Navigation activeTab={activeTab} setActiveTab={setActiveTab} />
        
        <main className="flex-1 p-6 overflow-auto">
          {activeTab === 'timer' && (
            <Timer
              tournament={tournament}
              toggleTimer={toggleTimer}
              nextLevel={nextLevel}
              prevLevel={prevLevel}
              addTime={addTime}
              onCompleteTournament={completeTournament}
              onReset={resetTournament}
            />
          )}
          {activeTab === 'players' && (
            <Players tournament={tournament} setTournament={setTournament} />
          )}
          {activeTab === 'blinds' && (
            <Blinds tournament={tournament} setTournament={setTournament} />
          )}
          {activeTab === 'prizes' && (
            <Prizes tournament={tournament} />
          )}
          {activeTab === 'settings' && (
            <Settings 
              tournament={tournament} 
              setTournament={setTournament}
              soundSettings={soundSettings}
              setSoundSettings={setSoundSettings}
              themeSettings={themeSettings}
              setThemeSettings={setThemeSettings}
              playTestSound={playLevelSound}
              resetTournament={resetTournament}
            />
          )}
          {activeTab === 'help' && (
            <Help />
          )}
        </main>
      </div>

      {/* Reset Tournament Confirm Modal */}
      <ConfirmModal
        isOpen={showResetConfirm}
        onClose={() => setShowResetConfirm(false)}
        onConfirm={confirmResetTournament}
        title="Reset Tournament"
        message="Are you sure you want to reset the tournament? All players, timer progress, and settings will be lost. This action cannot be undone."
        confirmText="Reset"
        variant="danger"
      />
    </div>
  )
}
