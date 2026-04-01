import { useState, useRef, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import type { Tournament } from '../types'
import type { TimeFormat } from '../types'
import { calculatePrizePool, formatCurrency, getActivePlayers, UpdateInfo, CURRENT_VERSION, downloadAndInstallUpdate } from '../utils'

interface HeaderProps {
  tournament: Tournament
  setTournament: (t: Tournament) => void
  isFullscreen: boolean
  toggleFullscreen: () => void
  updateInfo?: UpdateInfo | null
  isProjectorOpen?: boolean
  onToggleProjector?: () => void
  timeFormat?: TimeFormat
}

export function Header({ tournament, setTournament, isFullscreen, toggleFullscreen, updateInfo, isProjectorOpen, onToggleProjector, timeFormat = '24h' }: HeaderProps) {
  const { t } = useTranslation()
  const [isUpdating, setIsUpdating] = useState(false)
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
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: timeFormat === '12h' })
  }

  return (
    <header className="h-16 pl-6 pr-4 flex items-center justify-between border-b border-themed bg-themed-secondary/30 backdrop-blur-sm relative z-50" role="banner">
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
            placeholder={t('header.tournamentName')}
            aria-label={t('header.editName')}
          />
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-2">
            <span className="text-themed-muted">{t('header.players')}</span>
            <span className="font-semibold text-themed-primary">{activePlayers}/{totalPlayers}</span>
          </div>
          <div className="w-px h-4 bg-themed-tertiary" />
          <div className="flex items-center gap-2">
            <span className="text-themed-muted">{t('header.prizePool')}</span>
            <span className="font-semibold text-accent">{formatCurrency(prizePool, tournament.currency_symbol)}</span>
          </div>
          <div className="w-px h-4 bg-themed-tertiary" />
          <div className="font-mono text-themed-secondary">
            {formatClockTime(currentTime)}
          </div>
        </div>

        <div className="flex items-center gap-1">
          {/* Projector Mode Button */}
          {onToggleProjector && (
            <button
              data-onboarding="projector"
              onClick={onToggleProjector}
              className={`btn btn-ghost p-2 relative ${isProjectorOpen ? 'text-accent' : ''}`}
              title={isProjectorOpen ? t('header.closeProjector') : t('header.openProjector')}
              aria-label={isProjectorOpen ? t('header.closeProjector') : t('header.openProjector')}
              aria-pressed={isProjectorOpen}
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 20.25h12m-7.5-3v3m3-3v3m-10.125-3h17.25c.621 0 1.125-.504 1.125-1.125V4.875c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125z" />
              </svg>
              {isProjectorOpen && (
                <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-accent rounded-full" />
              )}
            </button>
          )}

          {/* Keyboard Shortcuts dropdown */}
          <div className="relative z-50" ref={shortcutsRef}>
            <button
              onClick={() => setShowShortcuts(!showShortcuts)}
              className="btn btn-ghost p-2"
              title={t('header.shortcuts.title')}
              aria-label={t('header.shortcuts.title')}
              aria-expanded={showShortcuts}
              aria-haspopup="true"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
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
                    {t('header.shortcuts.title')}
                  </h3>
                </div>
                <div className="p-3 space-y-2 text-sm">
                  <div className="flex items-center justify-between p-1.5 bg-themed-tertiary rounded">
                    <span className="text-themed-secondary">{t('header.shortcuts.playPause')}</span>
                    <kbd className="px-2 py-0.5 bg-themed-secondary rounded text-themed-primary font-mono text-xs">Space</kbd>
                  </div>
                  <div className="flex items-center justify-between p-1.5 bg-themed-tertiary rounded">
                    <span className="text-themed-secondary">{t('header.shortcuts.previousLevel')}</span>
                    <kbd className="px-2 py-0.5 bg-themed-secondary rounded text-themed-primary font-mono text-xs">←</kbd>
                  </div>
                  <div className="flex items-center justify-between p-1.5 bg-themed-tertiary rounded">
                    <span className="text-themed-secondary">{t('header.shortcuts.nextLevel')}</span>
                    <kbd className="px-2 py-0.5 bg-themed-secondary rounded text-themed-primary font-mono text-xs">→</kbd>
                  </div>
                  <div className="flex items-center justify-between p-1.5 bg-themed-tertiary rounded">
                    <span className="text-themed-secondary">{t('header.shortcuts.addMinute')}</span>
                    <kbd className="px-2 py-0.5 bg-themed-secondary rounded text-themed-primary font-mono text-xs">+</kbd>
                  </div>
                  <div className="flex items-center justify-between p-1.5 bg-themed-tertiary rounded">
                    <span className="text-themed-secondary">{t('header.shortcuts.removeMinute')}</span>
                    <kbd className="px-2 py-0.5 bg-themed-secondary rounded text-themed-primary font-mono text-xs">-</kbd>
                  </div>
                  <div className="flex items-center justify-between p-1.5 bg-themed-tertiary rounded">
                    <span className="text-themed-secondary">{t('header.shortcuts.fullscreen')}</span>
                    <kbd className="px-2 py-0.5 bg-themed-secondary rounded text-themed-primary font-mono text-xs">F11</kbd>
                  </div>
                  <div className="flex items-center justify-between p-1.5 bg-themed-tertiary rounded">
                    <span className="text-themed-secondary">{t('header.shortcuts.exitFullscreen')}</span>
                    <kbd className="px-2 py-0.5 bg-themed-secondary rounded text-themed-primary font-mono text-xs">Esc</kbd>
                  </div>
                </div>
              </div>
            )}
          </div>

          <button
            data-onboarding="fullscreen"
            onClick={toggleFullscreen}
            className="btn btn-ghost p-2"
            title={isFullscreen ? t('header.shortcuts.exitFullscreen') : t('header.shortcuts.fullscreen')}
            aria-label={isFullscreen ? t('header.shortcuts.exitFullscreen') : t('header.shortcuts.fullscreen')}
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
              className="btn btn-ghost p-2 relative"
              title={t('header.about.title')}
              aria-label={t('header.about.title')}
              aria-expanded={showAbout}
              aria-haspopup="true"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
              </svg>
              {updateInfo?.updateAvailable && (
                <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-accent rounded-full animate-pulse" />
              )}
            </button>
            
            {showAbout && (
              <div className="absolute right-0 top-full mt-2 w-80 bg-themed-secondary border border-themed rounded-lg shadow-2xl z-[100] overflow-hidden">
                <div className="p-4 border-b border-themed">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-accent flex items-center justify-center">
                      <span className="text-white font-bold text-xl">♠</span>
                    </div>
                    <div>
                      <h3 className="font-bold text-themed-primary">PokerPulse Pro</h3>
                      <p className="text-sm text-themed-muted">{t('header.about.version', { version: CURRENT_VERSION })}</p>
                    </div>
                  </div>
                </div>
                {updateInfo?.updateAvailable && (
                  <div className="px-4 py-3 bg-accent/10 border-b border-themed">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <svg className="w-4 h-4 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                        <span className="text-sm font-medium text-accent">{t('header.about.updateAvailable')}</span>
                      </div>
                      <span className="text-xs text-themed-muted">v{updateInfo.latestVersion}</span>
                    </div>
                    <button 
                      onClick={async () => {
                        setIsUpdating(true)
                        await downloadAndInstallUpdate(updateInfo)
                        setIsUpdating(false)
                      }}
                      disabled={isUpdating}
                      className="mt-2 block w-full text-center px-3 py-1.5 bg-accent text-white text-sm font-medium rounded hover:bg-accent/90 transition-colors disabled:opacity-50 disabled:cursor-wait"
                    >
                      {isUpdating ? t('header.about.updating') : t('header.about.downloadUpdate')}
                    </button>
                  </div>
                )}
                <div className="p-4 space-y-3 text-sm">
                  <p className="text-themed-secondary">
                    {t('header.about.description')}
                  </p>
                  <div className="space-y-1 text-themed-muted">
                    <p>• {t('header.about.features.blinds')}</p>
                    <p>• {t('header.about.features.players')}</p>
                    <p>• {t('header.about.features.prizes')}</p>
                    <p>• {t('header.about.features.settings')}</p>
                  </div>
                </div>
                <div className="px-4 py-2.5 bg-themed-tertiary/50 flex items-center justify-between gap-2">
                  <span className="text-xs text-themed-muted whitespace-nowrap">{t('header.about.builtWith')}</span>
                  <a 
                    href="https://www.pokerpulsepro.com" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-xs text-accent hover:underline flex items-center gap-1 whitespace-nowrap"
                  >
                    {t('header.about.website')}
                    <svg className="w-3 h-3 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </a>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}
