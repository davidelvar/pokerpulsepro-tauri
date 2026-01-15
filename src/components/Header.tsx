import { useState, useRef, useEffect } from 'react'
import type { Tournament } from '../types'
import { calculatePrizePool, formatCurrency, getActivePlayers } from '../utils'

interface HeaderProps {
  tournament: Tournament
  setTournament: (t: Tournament) => void
  isFullscreen: boolean
  toggleFullscreen: () => void
}

export function Header({ tournament, setTournament, isFullscreen, toggleFullscreen }: HeaderProps) {
  const prizePool = calculatePrizePool(tournament)
  const activePlayers = getActivePlayers(tournament.players).length
  const totalPlayers = tournament.players.length
  const [showAbout, setShowAbout] = useState(false)
  const [showShortcuts, setShowShortcuts] = useState(false)
  const [currentTime, setCurrentTime] = useState(new Date())
  const aboutRef = useRef<HTMLDivElement>(null)
  const shortcutsRef = useRef<HTMLDivElement>(null)

  // Update clock every second
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (aboutRef.current && !aboutRef.current.contains(event.target as Node)) {
        setShowAbout(false)
      }
      if (shortcutsRef.current && !shortcutsRef.current.contains(event.target as Node)) {
        setShowShortcuts(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const formatClockTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  return (
    <header className="h-16 pl-6 pr-4 flex items-center justify-between border-b border-themed bg-themed-secondary/30 backdrop-blur-sm relative z-50">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center">
            <span className="text-white font-bold text-sm">♠</span>
          </div>
          <input
            type="text"
            value={tournament.name}
            onChange={(e) => setTournament({ ...tournament, name: e.target.value })}
            className="bg-transparent text-lg font-semibold text-themed-primary border-none focus:outline-none focus:ring-0 w-64"
            placeholder="Tournament Name"
          />
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-2">
            <span className="text-themed-muted">Players</span>
            <span className="font-semibold text-themed-primary">{activePlayers}/{totalPlayers}</span>
          </div>
          <div className="w-px h-4 bg-themed-tertiary" />
          <div className="flex items-center gap-2">
            <span className="text-themed-muted">Prize Pool</span>
            <span className="font-semibold text-accent">{formatCurrency(prizePool, tournament.currency_symbol)}</span>
          </div>
          <div className="w-px h-4 bg-themed-tertiary" />
          <div className="font-mono text-themed-secondary">
            {formatClockTime(currentTime)}
          </div>
        </div>

        <div className="flex items-center gap-1">
          {/* Keyboard Shortcuts dropdown */}
          <div className="relative z-50" ref={shortcutsRef}>
            <button
              onClick={() => setShowShortcuts(!showShortcuts)}
              className="btn btn-ghost p-2"
              title="Keyboard Shortcuts"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
              </svg>
            </button>
            
            {showShortcuts && (
              <div className="absolute right-0 top-full mt-2 w-64 bg-themed-secondary border border-themed rounded-lg shadow-2xl z-[100] overflow-hidden">
                <div className="px-4 py-3 border-b border-themed">
                  <h3 className="font-semibold text-themed-primary flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
                    </svg>
                    Keyboard Shortcuts
                  </h3>
                </div>
                <div className="p-3 space-y-2 text-sm">
                  <div className="flex items-center justify-between p-1.5 bg-themed-tertiary rounded">
                    <span className="text-themed-secondary">Play / Pause</span>
                    <kbd className="px-2 py-0.5 bg-themed-secondary rounded text-themed-primary font-mono text-xs">Space</kbd>
                  </div>
                  <div className="flex items-center justify-between p-1.5 bg-themed-tertiary rounded">
                    <span className="text-themed-secondary">Previous Level</span>
                    <kbd className="px-2 py-0.5 bg-themed-secondary rounded text-themed-primary font-mono text-xs">←</kbd>
                  </div>
                  <div className="flex items-center justify-between p-1.5 bg-themed-tertiary rounded">
                    <span className="text-themed-secondary">Next Level</span>
                    <kbd className="px-2 py-0.5 bg-themed-secondary rounded text-themed-primary font-mono text-xs">→</kbd>
                  </div>
                  <div className="flex items-center justify-between p-1.5 bg-themed-tertiary rounded">
                    <span className="text-themed-secondary">Add 1 Minute</span>
                    <kbd className="px-2 py-0.5 bg-themed-secondary rounded text-themed-primary font-mono text-xs">+</kbd>
                  </div>
                  <div className="flex items-center justify-between p-1.5 bg-themed-tertiary rounded">
                    <span className="text-themed-secondary">Remove 1 Minute</span>
                    <kbd className="px-2 py-0.5 bg-themed-secondary rounded text-themed-primary font-mono text-xs">-</kbd>
                  </div>
                  <div className="flex items-center justify-between p-1.5 bg-themed-tertiary rounded">
                    <span className="text-themed-secondary">Fullscreen</span>
                    <kbd className="px-2 py-0.5 bg-themed-secondary rounded text-themed-primary font-mono text-xs">F</kbd>
                  </div>
                  <div className="flex items-center justify-between p-1.5 bg-themed-tertiary rounded">
                    <span className="text-themed-secondary">Exit Fullscreen</span>
                    <kbd className="px-2 py-0.5 bg-themed-secondary rounded text-themed-primary font-mono text-xs">Esc</kbd>
                  </div>
                </div>
              </div>
            )}
          </div>

          <button
            onClick={toggleFullscreen}
            className="btn btn-ghost p-2"
            title={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
          >
            {isFullscreen ? (
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 9V4.5M9 9H4.5M9 9L3.75 3.75M9 15v4.5M9 15H4.5M9 15l-5.25 5.25M15 9h4.5M15 9V4.5M15 9l5.25-5.25M15 15h4.5M15 15v4.5m0-4.5l5.25 5.25" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15M20.25 3.75h-4.5m4.5 0v4.5m0-4.5L15 9m5.25 11.25h-4.5m4.5 0v-4.5m0 4.5L15 15" />
              </svg>
            )}
          </button>

          {/* About dropdown */}
          <div className="relative z-50" ref={aboutRef}>
            <button
              onClick={() => setShowAbout(!showAbout)}
              className="btn btn-ghost p-2"
              title="About"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
              </svg>
            </button>
            
            {showAbout && (
              <div className="absolute right-0 top-full mt-2 w-72 bg-themed-secondary border border-themed rounded-lg shadow-2xl z-[100] overflow-hidden">
                <div className="p-4 border-b border-themed">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-accent flex items-center justify-center">
                      <span className="text-white font-bold text-xl">♠</span>
                    </div>
                    <div>
                      <h3 className="font-bold text-themed-primary">PokerPulse Pro</h3>
                      <p className="text-sm text-themed-muted">Version 1.0.0</p>
                    </div>
                  </div>
                </div>
                <div className="p-4 space-y-3 text-sm">
                  <p className="text-themed-secondary">
                    A professional poker tournament management application.
                  </p>
                  <div className="space-y-1 text-themed-muted">
                    <p>• Blind structure management</p>
                    <p>• Player tracking & eliminations</p>
                    <p>• Prize pool calculations</p>
                    <p>• Customizable tournament settings</p>
                  </div>
                </div>
                <div className="px-4 py-3 bg-themed-tertiary/50 text-xs text-themed-muted">
                  Built with Tauri + React
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}
