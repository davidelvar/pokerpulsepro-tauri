import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { listen } from '@tauri-apps/api/event'
import { getCurrentWindow } from '@tauri-apps/api/window'
import type { Tournament } from '../types'
import { formatTime, formatCurrency, getActivePlayers, getAverageStack, calculatePrizePool } from '../utils'

// State payload broadcast from main window
interface PayoutEntry {
  place: number
  percentage: number
  amount: number
}

interface ProjectorState {
  tournament: Tournament
  themeMode: 'dark' | 'light'
  accentColor: string
  showAnte?: boolean
  payoutConfig?: PayoutEntry[]
}

export function ProjectorView() {
  const { t } = useTranslation()
  const [state, setState] = useState<ProjectorState | null>(null)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [showControls, setShowControls] = useState(false)

  // Check fullscreen status
  useEffect(() => {
    const checkFullscreen = async () => {
      try {
        const fullscreen = await getCurrentWindow().isFullscreen()
        setIsFullscreen(fullscreen)
      } catch (e) {
        console.error('Failed to check fullscreen:', e)
      }
    }
    checkFullscreen()
  }, [])

  // Toggle fullscreen
  const toggleFullscreen = async () => {
    try {
      const window = getCurrentWindow()
      const fullscreen = await window.isFullscreen()
      await window.setFullscreen(!fullscreen)
      setIsFullscreen(!fullscreen)
    } catch (e) {
      console.error('Failed to toggle fullscreen:', e)
    }
  }

  // Listen for state updates from main window
  useEffect(() => {
    const unlisten = listen<ProjectorState>('projector-state-update', (event) => {
      setState(event.payload)
      // Sync language
      if (event.payload.tournament) {
        // Apply theme
        const root = document.documentElement
        root.classList.remove('light', 'dark')
        root.classList.add(event.payload.themeMode || 'dark')
        root.classList.remove('accent-emerald', 'accent-blue', 'accent-purple', 'accent-rose', 'accent-amber', 'accent-cyan')
        root.classList.add(`accent-${event.payload.accentColor || 'emerald'}`)
      }
    })

    // Request initial state
    import('@tauri-apps/api/event').then(({ emit }) => {
      emit('projector-ready')
    })

    return () => {
      unlisten.then(fn => fn())
    }
  }, [])

  if (!state?.tournament) {
    return (
      <div className="h-screen w-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="w-24 h-24 rounded-2xl bg-accent flex items-center justify-center mx-auto mb-6">
            <span className="text-white font-bold text-5xl">♠</span>
          </div>
          <h1 className="text-4xl font-bold text-white mb-4">PokerPulse Pro</h1>
          <p className="text-xl text-gray-400">{t('projector.waitingForData')}</p>
          <div className="mt-8 flex justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent"></div>
          </div>
        </div>
      </div>
    )
  }

  const { tournament } = state
  const currentBlind = tournament.blind_structure[tournament.current_level]
  const nextBlind = tournament.blind_structure[tournament.current_level + 1]
  const isBreak = currentBlind?.is_break
  const isLowTime = tournament.time_remaining_seconds <= 60 && tournament.time_remaining_seconds > 0
  const isFinalLevel = tournament.current_level === tournament.blind_structure.length - 1
  
  const activePlayersList = getActivePlayers(tournament.players)
  const activePlayers = activePlayersList.length
  const totalPlayers = tournament.players.length
  const prizePool = calculatePrizePool(tournament)
  const avgStack = getAverageStack(tournament)

  // Tournament over detection
  const isTournamentOver = totalPlayers >= 2 && activePlayers <= 1
  const likelyWinner = activePlayers === 1 ? activePlayersList[0].name : ''

  // Build final standings
  const payoutConfig = state.payoutConfig || [50, 30, 20].map((pct, i) => ({
    place: i + 1,
    percentage: pct,
    amount: Math.floor(prizePool * pct / 100),
  }))

  const finalStandings = (() => {
    if (!isTournamentOver) return []
    const standings: { name: string; place: number; payout: number }[] = []
    if (activePlayers === 1) {
      standings.push({ name: activePlayersList[0].name, place: 1, payout: payoutConfig[0]?.amount || 0 })
    }
    const eliminated = tournament.players
      .filter(p => p.eliminated && p.placement !== null)
      .sort((a, b) => (a.placement || 999) - (b.placement || 999))
    eliminated.forEach((p, i) => {
      const place = activePlayers === 1 ? i + 2 : i + 1
      standings.push({
        name: p.name,
        place,
        payout: payoutConfig[place - 1]?.amount || 0,
      })
    })
    return standings
  })()

  // Calculate progress percentage for the visual bar
  const totalTime = currentBlind?.duration_minutes * 60 || 1
  const progressPercent = ((totalTime - tournament.time_remaining_seconds) / totalTime) * 100

  return (
    <div 
      className="h-screen w-screen bg-black text-white overflow-hidden flex flex-col select-none"
      onMouseMove={() => setShowControls(true)}
      onMouseLeave={() => setShowControls(false)}
    >
      {/* Fullscreen Button - appears on hover */}
      <button
        onClick={toggleFullscreen}
        className={`
          absolute top-4 right-4 z-50 p-3 rounded-lg
          bg-gray-800/80 hover:bg-gray-700 text-white
          transition-all duration-300 cursor-pointer
          ${showControls ? 'opacity-100' : 'opacity-0'}
        `}
        title={isFullscreen ? t('header.exitFullscreen') : t('header.fullscreen')}
      >
        {isFullscreen ? (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        ) : (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
          </svg>
        )}
      </button>

      {/* Top Stats Bar */}
      <div className="h-[12vh] flex items-center justify-between px-[3vw] bg-gradient-to-b from-gray-900/80 to-transparent">
        <div className="flex items-center gap-[2vw]">
          <div className="flex items-center gap-[1vw]">
            <div className="w-[4vw] h-[4vw] rounded-xl bg-accent flex items-center justify-center">
              <span className="text-white font-bold text-[2vw]">♠</span>
            </div>
            <div>
              <h1 className="text-[2vw] font-bold text-white leading-tight">{tournament.name}</h1>
              <p className="text-[1vw] text-gray-400">{t('projector.title')}</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-[4vw]">
          <div className="text-center">
            <div className="text-[1.2vw] text-gray-400 uppercase tracking-wider">{t('timer.players')}</div>
            <div className="text-[3vw] font-bold text-white leading-none">
              {activePlayers}<span className="text-gray-500 text-[2vw]">/{totalPlayers}</span>
            </div>
          </div>
          <div className="text-center">
            <div className="text-[1.2vw] text-gray-400 uppercase tracking-wider">{t('timer.prizePool')}</div>
            <div className="text-[3vw] font-bold text-accent leading-none">
              {formatCurrency(prizePool, tournament.currency_symbol)}
            </div>
          </div>
          <div className="text-center">
            <div className="text-[1.2vw] text-gray-400 uppercase tracking-wider">{t('timer.averageStack')}</div>
            <div className="text-[3vw] font-bold text-white leading-none">
              {avgStack.toLocaleString()}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col items-center justify-center">
        {isTournamentOver ? (
          /* Tournament Over Screen */
          <>
            {likelyWinner ? (
              <>
                <div className="mb-[2vh] text-[12vw]">🏆</div>
                <div className="text-[6vw] font-bold text-accent mb-[1vh]">{likelyWinner}</div>
                <div className="text-[2.5vw] text-gray-400 mb-[4vh]">{t('timer.winsTheTournament')}</div>
              </>
            ) : (
              <>
                <div className="mb-[2vh] text-[12vw]">🏁</div>
                <div className="text-[5vw] font-bold text-white mb-[1vh]">{t('timer.tournamentOver')}</div>
                <div className="text-[2vw] text-gray-400 mb-[4vh]">{t('timer.allPlayersEliminated')}</div>
              </>
            )}

            {/* Final Standings */}
            {finalStandings.length > 0 && (
              <div className="w-[60vw] max-w-[800px]">
                <div className="text-[1.5vw] text-gray-400 uppercase tracking-wider mb-[2vh] text-center">{t('prizes.finalStandings')}</div>
                <div className="space-y-[1vh]">
                  {finalStandings.map((s) => (
                    <div key={s.place} className={`flex items-center justify-between px-[2vw] py-[1.5vh] rounded-xl ${
                      s.place === 1 ? 'bg-accent/20 border-2 border-accent/40' : s.place <= 3 ? 'bg-gray-800/60 border border-gray-700' : 'bg-gray-800/30'
                    }`}>
                      <div className="flex items-center gap-[1.5vw]">
                        <span className="text-[3vw] w-[4vw] text-center">
                          {s.place === 1 ? '🥇' : s.place === 2 ? '🥈' : s.place === 3 ? '🥉' : `${s.place}.`}
                        </span>
                        <span className={`font-bold ${s.place === 1 ? 'text-accent text-[2.5vw]' : 'text-white text-[2vw]'}`}>{s.name}</span>
                      </div>
                      {s.payout > 0 && (
                        <span className="font-bold text-accent text-[2.5vw]">{formatCurrency(s.payout, tournament.currency_symbol)}</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        ) : (
          /* Normal Timer State */
          <>
        {/* Level Badge */}
        <div className={`
          mb-[2vh] px-[3vw] py-[1vh] rounded-full text-[2.5vw] font-semibold
          ${isBreak 
            ? 'bg-amber-500/30 text-amber-400 border-2 border-amber-500/50' 
            : isFinalLevel
              ? 'bg-accent/30 text-accent border-2 border-accent/50'
              : 'bg-gray-800/80 text-gray-300 border-2 border-gray-700'
          }
        `}>
          {isBreak 
            ? <><svg className="inline w-[3vw] h-[3vw] mb-[0.5vw] mr-[0.5vw]" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path d="M2 19h18v2H2v-2zm2-4h2v3H4v-3zm4 0h2v3H8v-3zm4 0h2v3h-2v-3zm-9-6h14v6c0 1.1-.9 2-2 2H5c-1.1 0-2-.9-2-2V9h0zm16 0h2c1.1 0 2 .9 2 2v2c0 1.1-.9 2-2 2h-2V9zm0 4h2v-2h-2v2zM2 7h16l-1-4H3L2 7z"/></svg>{t('timer.break')}</> 
            : isFinalLevel 
              ? `🏆 ${t('timer.finalLevel')}` 
              : t('timer.levelOf', { current: tournament.current_level + 1, total: tournament.blind_structure.length })
          }
        </div>

        {/* Giant Timer Display */}
        <div className={`
          text-[22vw] font-bold leading-none tracking-tighter font-mono
          ${isLowTime ? 'text-red-500 animate-pulse' : isBreak ? 'text-amber-400' : 'text-white'}
          ${tournament.is_running ? '' : 'opacity-80'}
        `}>
          {formatTime(tournament.time_remaining_seconds)}
        </div>

        {/* Running/Paused Indicator */}
        <div className={`
          mt-[1vh] px-[2vw] py-[0.5vh] rounded-full text-[1.5vw] font-medium
          ${tournament.is_running 
            ? 'bg-green-500/30 text-green-400' 
            : 'bg-red-500/30 text-red-400'
          }
        `}>
          {tournament.is_running ? '● RUNNING' : '❚❚ PAUSED'}
        </div>

        {/* Blinds Display */}
        {!isBreak && (
          <div className="mt-[4vh] flex items-center gap-[4vw]">
            <div className="text-center">
              <div className="text-[1.5vw] text-gray-400 uppercase tracking-wider mb-[0.5vh]">{t('timer.smallBlind')}</div>
              <div className="text-[8vw] font-bold text-white leading-none">{currentBlind?.small_blind.toLocaleString()}</div>
            </div>
            <div className="text-[6vw] text-gray-600 font-light">/</div>
            <div className="text-center">
              <div className="text-[1.5vw] text-gray-400 uppercase tracking-wider mb-[0.5vh]">{t('timer.bigBlind')}</div>
              <div className="text-[8vw] font-bold text-white leading-none">{currentBlind?.big_blind.toLocaleString()}</div>
            </div>
            {(state?.showAnte !== false) && currentBlind?.ante > 0 && (
              <>
                <div className="text-[6vw] text-gray-600 font-light">+</div>
                <div className="text-center">
                  <div className="text-[1.5vw] text-gray-400 uppercase tracking-wider mb-[0.5vh]">{t('timer.ante')}</div>
                  <div className="text-[8vw] font-bold text-accent leading-none">{currentBlind?.ante.toLocaleString()}</div>
                </div>
              </>
            )}
          </div>
        )}

        {/* Break Message */}
        {isBreak && (
          <div className="mt-[4vh] text-center">
            <div className="text-[4vw] text-amber-400 font-semibold flex items-center justify-center gap-[0.5vw]"><svg className="w-[4vw] h-[4vw]" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path d="M2 19h18v2H2v-2zm2-4h2v3H4v-3zm4 0h2v3H8v-3zm4 0h2v3h-2v-3zm-9-6h14v6c0 1.1-.9 2-2 2H5c-1.1 0-2-.9-2-2V9h0zm16 0h2c1.1 0 2 .9 2 2v2c0 1.1-.9 2-2 2h-2V9zm0 4h2v-2h-2v2zM2 7h16l-1-4H3L2 7z"/></svg> {t('projector.breakTime')}</div>
            <div className="text-[2vw] text-gray-400 mt-[1vh]">{t('projector.breakMessage')}</div>
          </div>
        )}
          </>
        )}
      </div>

      {/* Bottom Bar - Next Level & Progress (hidden when tournament over) */}
      {!isTournamentOver && (
      <div className="h-[18vh] bg-gradient-to-t from-gray-900/90 to-transparent">
        {/* Progress Bar */}
        <div className="h-[1vh] w-full bg-gray-800">
          <div 
            className={`h-full transition-all duration-1000 ${isLowTime ? 'bg-red-500' : 'bg-accent'}`}
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        {/* Next Level Preview */}
        <div className="flex items-center justify-center h-[calc(100%-1vh)] px-[3vw]">
          {nextBlind && (
            <div className="text-center">
              <div className="text-[1.5vw] text-gray-400 uppercase tracking-wider mb-[1vh]">{t('timer.nextLevel')}</div>
              {nextBlind.is_break ? (
                <div className="text-[3vw] text-amber-400 font-semibold flex items-center justify-center gap-[0.5vw]"><svg className="w-[3vw] h-[3vw]" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path d="M2 19h18v2H2v-2zm2-4h2v3H4v-3zm4 0h2v3H8v-3zm4 0h2v3h-2v-3zm-9-6h14v6c0 1.1-.9 2-2 2H5c-1.1 0-2-.9-2-2V9h0zm16 0h2c1.1 0 2 .9 2 2v2c0 1.1-.9 2-2 2h-2V9zm0 4h2v-2h-2v2zM2 7h16l-1-4H3L2 7z"/></svg> {t('timer.break')}</div>
              ) : (
                <div className="flex items-center gap-[3vw] text-[3vw]">
                  <span className="text-gray-300 font-bold">{nextBlind.small_blind.toLocaleString()}</span>
                  <span className="text-gray-600">/</span>
                  <span className="text-gray-300 font-bold">{nextBlind.big_blind.toLocaleString()}</span>
                  {(state?.showAnte !== false) && nextBlind.ante > 0 && (
                    <>
                      <span className="text-gray-600">+</span>
                      <span className="text-accent font-bold">{nextBlind.ante.toLocaleString()}</span>
                    </>
                  )}
                </div>
              )}
            </div>
          )}
          {!nextBlind && (
            <div className="text-[2vw] text-gray-500">{t('projector.finalLevelReached')}</div>
          )}
        </div>
      </div>
      )}
    </div>
  )
}

export default ProjectorView
