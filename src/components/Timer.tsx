import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { Tournament, PhysicalChip } from '../types'
import { formatTime, formatCurrency, getActivePlayers, getAverageStack, calculatePrizePool, calculateColorUpSchedule } from '../utils'
import { PromptModal, AlertModal } from './Modal'

interface TimerProps {
  tournament: Tournament
  setTournament: (t: Tournament) => void
  toggleTimer: () => void
  nextLevel: () => void
  prevLevel: () => void
  addTime: (seconds: number) => void
  onCompleteTournament?: (winner: string) => void
  onReset?: () => void
  chipInventory?: PhysicalChip[]
  showAnte?: boolean
}

export function Timer({ tournament, setTournament, toggleTimer, nextLevel, prevLevel, addTime, onCompleteTournament, onReset, chipInventory, showAnte = true }: TimerProps) {
  const { t } = useTranslation()
  const [showWinnerPrompt, setShowWinnerPrompt] = useState(false)
  const [showSavedAlert, setShowSavedAlert] = useState(false)
  const [hasSaved, setHasSaved] = useState(false)
  const [showPayouts, setShowPayouts] = useState(false)
  const [showPlayersModal, setShowPlayersModal] = useState(false)
  const [newPlayerName, setNewPlayerName] = useState('')

  const currentBlind = tournament.blind_structure[tournament.current_level]
  const nextBlind = tournament.blind_structure[tournament.current_level + 1]
  const isBreak = currentBlind?.is_break
  const isLowTime = tournament.time_remaining_seconds <= 60 && tournament.time_remaining_seconds > 0
  const isFinalLevel = tournament.current_level === tournament.blind_structure.length - 1
  const isTournamentComplete = isFinalLevel && tournament.time_remaining_seconds === 0
  
  const activePlayersList = getActivePlayers(tournament.players)
  const activePlayers = activePlayersList.length
  const totalPlayers = tournament.players.length
  const avgStack = getAverageStack(tournament)
  const prizePool = calculatePrizePool(tournament)
  
  // If only 1 player remaining, they're the winner
  const likelyWinner = activePlayers === 1 ? activePlayersList[0].name : ''
  
  // Tournament over: all eliminated or only 1 left (and we had at least 2 players)
  const isTournamentOver = totalPlayers >= 2 && activePlayers <= 1 && !hasSaved

  // Color-up notifications
  const colorUpSchedule = chipInventory && chipInventory.length > 1
    ? calculateColorUpSchedule(chipInventory, tournament.blind_structure)
    : []
  const currentColorUps = colorUpSchedule.filter(e => e.levelIndex === tournament.current_level)
  const nextColorUps = !isBreak && nextBlind
    ? colorUpSchedule.filter(e => e.levelIndex === tournament.current_level + 1)
    : []

  // Load payout config from localStorage
  const payoutConfig = (() => {
    try {
      const raw = localStorage.getItem('pokerpulse_payout_config')
      if (raw) {
        const { paidPlaces, percentages } = JSON.parse(raw)
        if (paidPlaces && percentages) {
          return percentages.map((pct: number, i: number) => ({
            place: i + 1,
            percentage: pct,
            amount: Math.floor(prizePool * pct / 100),
          }))
        }
      }
    } catch { /* ignore */ }
    // Default 3-way split
    return [50, 30, 20].map((pct, i) => ({
      place: i + 1,
      percentage: pct,
      amount: Math.floor(prizePool * pct / 100),
    }))
  })()

  // Build final standings (winner first, then by placement desc = eliminated last = placed highest)
  const finalStandings = (() => {
    if (!isTournamentOver) return []
    const standings: { name: string; place: number; payout: number }[] = []
    // Winner (last active player)
    if (activePlayers === 1) {
      standings.push({ name: activePlayersList[0].name, place: 1, payout: payoutConfig[0]?.amount || 0 })
    }
    // Eliminated players sorted by placement (highest placement = eliminated last = better finish)
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

  const placeEmojis = ['🥇', '🥈', '🥉']

  // Player management functions
  const eliminatePlayer = (id: string) => {
    const activeCount = tournament.players.filter(p => !p.eliminated).length
    setTournament({
      ...tournament,
      players: tournament.players.map(p =>
        p.id === id ? { ...p, eliminated: true, placement: activeCount } : p
      ),
    })
  }

  const reinstatePlayer = (id: string) => {
    setTournament({
      ...tournament,
      players: tournament.players.map(p =>
        p.id === id ? { ...p, eliminated: false, placement: null } : p
      ),
    })
  }

  const addPlayer = () => {
    if (!newPlayerName.trim()) return
    setTournament({
      ...tournament,
      players: [...tournament.players, {
        id: crypto.randomUUID?.() || Date.now().toString(),
        name: newPlayerName.trim(),
        buyins: 1,
        rebuys: 0,
        addons: 0,
        eliminated: false,
        placement: null,
        tableNumber: null,
        seatNumber: null,
      }],
    })
    setNewPlayerName('')
  }

  const removePlayer = (id: string) => {
    setTournament({
      ...tournament,
      players: tournament.players.filter(p => p.id !== id),
    })
  }

  return (
    <div className="h-full flex flex-col">
      {/* Top Stats Bar */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <button
          onClick={() => setShowPlayersModal(true)}
          className="card p-4 text-center cursor-pointer hover:ring-2 hover:ring-accent/50 transition-all"
        >
          <div className="text-themed-muted text-sm mb-1 flex items-center justify-center gap-1">
            {t('timer.players')}
            <svg className="w-3.5 h-3.5 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
          </div>
          <div className="text-2xl font-bold text-themed-primary text-center">
            {activePlayers} <span className="text-themed-muted font-normal text-lg">/ {totalPlayers}</span>
          </div>
        </button>
        <div className="relative">
          <button
            onClick={() => setShowPayouts(!showPayouts)}
            className="card p-4 text-center w-full cursor-pointer hover:ring-2 hover:ring-accent/50 transition-all"
          >
            <div className="text-themed-muted text-sm mb-1 flex items-center justify-center gap-1">
              {t('timer.prizePool')}
              <svg className={`w-3.5 h-3.5 opacity-50 transition-transform ${showPayouts ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
            </div>
            <div className="text-2xl font-bold text-accent">
              {formatCurrency(prizePool, tournament.currency_symbol)}
            </div>
          </button>
          {showPayouts && (
            <div className="absolute top-full left-0 right-0 mt-1 card p-3 z-20 shadow-xl border border-themed-border">
              <div className="text-themed-muted text-xs uppercase tracking-wide mb-2 text-center">{t('timer.payoutStructure')}</div>
              <div className="space-y-1.5">
                {payoutConfig.map((p: { place: number; percentage: number; amount: number }) => (
                  <div key={p.place} className="flex items-center justify-between text-sm">
                    <span className="text-themed-secondary">
                      {p.place <= 3 ? placeEmojis[p.place - 1] : `${p.place}th`}
                    </span>
                    <span className="text-themed-muted text-xs">{p.percentage}%</span>
                    <span className="font-semibold text-themed-primary">
                      {formatCurrency(p.amount, tournament.currency_symbol)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
        <div className="card p-4 text-center">
          <div className="text-themed-muted text-sm mb-1">{t('timer.averageStack')}</div>
          <div className="text-2xl font-bold text-themed-primary">{avgStack.toLocaleString()}</div>
        </div>
      </div>

      {/* Main Timer Display */}
      <div className="flex-1 flex flex-col items-center justify-center">
        {isTournamentComplete ? (
          /* Tournament Complete State */
          <>
            <div className="mb-6 w-24 h-24 rounded-full bg-accent/20 flex items-center justify-center">
              <svg className="w-12 h-12 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
              </svg>
            </div>
            <div className="text-5xl font-bold text-accent mb-4">{t('timer.tournamentComplete')}</div>
            <div className="text-xl text-themed-secondary mb-8">
              {t('timer.allLevelsFinished', { count: tournament.blind_structure.length })}
            </div>
            
            {/* Final Stats */}
            <div className="grid grid-cols-3 gap-8 mb-8">
              <div className="text-center">
                <div className="text-themed-muted text-sm mb-1">{t('timer.playersRemaining')}</div>
                <div className="text-3xl font-bold text-themed-primary">{activePlayers}</div>
              </div>
              <div className="text-center">
                <div className="text-themed-muted text-sm mb-1">{t('timer.finalPrizePool')}</div>
                <div className="text-3xl font-bold text-accent">{formatCurrency(prizePool, tournament.currency_symbol)}</div>
              </div>
              <div className="text-center">
                <div className="text-themed-muted text-sm mb-1">{t('timer.finalBlinds')}</div>
                <div className="text-3xl font-bold text-themed-primary">
                  {currentBlind?.small_blind.toLocaleString()} / {currentBlind?.big_blind.toLocaleString()}
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-4">
              <button
                onClick={prevLevel}
                className="btn btn-secondary"
              >
                ← {t('timer.goBackLevel')}
              </button>
              <button
                onClick={() => addTime(300)}
                className="btn btn-secondary"
              >
                + {t('timer.addFiveMin')}
              </button>
              {onCompleteTournament && !hasSaved && (
                <button
                  onClick={() => setShowWinnerPrompt(true)}
                  className="btn btn-primary"
                >
                  🏆 {t('timer.saveToHistory')}
                </button>
              )}
              {hasSaved && onReset && (
                <button
                  onClick={onReset}
                  className="btn btn-primary"
                >
                  🔄 {t('timer.resetTournament')}
                </button>
              )}
            </div>
          </>
        ) : isTournamentOver ? (
          /* Tournament Over - All Players Eliminated */
          <>
            {/* Winner Announcement */}
            {likelyWinner ? (
              <>
                <div className="mb-4 text-8xl">🏆</div>
                <div className="text-5xl font-bold text-accent mb-2">{likelyWinner}</div>
                <div className="text-xl text-themed-secondary mb-8">{t('timer.winsTheTournament')}</div>
              </>
            ) : (
              <>
                <div className="mb-4 text-8xl">🏁</div>
                <div className="text-4xl font-bold text-themed-primary mb-2">{t('timer.tournamentOver')}</div>
                <div className="text-lg text-themed-secondary mb-8">{t('timer.allPlayersEliminated')}</div>
              </>
            )}

            {/* Final Standings Table */}
            {finalStandings.length > 0 && (
              <div className="card p-5 mb-8 w-full max-w-lg">
                <div className="text-themed-muted text-xs uppercase tracking-wide mb-3 text-center">{t('prizes.finalStandings')}</div>
                <div className="space-y-2">
                  {finalStandings.map((s) => (
                    <div key={s.place} className={`flex items-center justify-between p-3 rounded-lg ${s.place === 1 ? 'bg-accent/15 border border-accent/30' : s.place <= 3 ? 'bg-themed-secondary/50' : 'bg-themed-tertiary/30'}`}>
                      <div className="flex items-center gap-3">
                        <span className="text-xl w-8 text-center">
                          {s.place === 1 ? '🥇' : s.place === 2 ? '🥈' : s.place === 3 ? '🥉' : `${s.place}.`}
                        </span>
                        <span className={`font-semibold ${s.place === 1 ? 'text-accent text-lg' : 'text-themed-primary'}`}>{s.name}</span>
                      </div>
                      {s.payout > 0 && (
                        <span className="font-bold text-accent">{formatCurrency(s.payout, tournament.currency_symbol)}</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center gap-4">
              {onCompleteTournament && (
                <button
                  onClick={() => setShowWinnerPrompt(true)}
                  className="btn btn-primary text-lg px-6 py-3"
                >
                  💾 {t('timer.saveToHistory')}
                </button>
              )}
              {onReset && (
                <button
                  onClick={onReset}
                  className="btn btn-secondary text-lg px-6 py-3"
                >
                  🔄 {t('timer.newTournament')}
                </button>
              )}
            </div>
            <button
              onClick={() => setShowPlayersModal(true)}
              className="mt-4 btn btn-ghost text-sm"
            >
              ↩ {t('timer.undoElimination')}
            </button>
          </>
        ) : (
          /* Normal Timer State */
          <>
            {/* Current Level Badge */}
            <div className={`
              mb-4 px-6 py-2 rounded-full text-2xl font-semibold
              ${isBreak 
                ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' 
                : isFinalLevel
                  ? 'bg-accent/20 text-accent border border-accent/30'
                  : 'bg-themed-tertiary text-themed-secondary'
              }
            `}>
              {isBreak ? <><svg className="inline w-6 h-6 mb-1 mr-1" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path d="M2 19h18v2H2v-2zm2-4h2v3H4v-3zm4 0h2v3H8v-3zm4 0h2v3h-2v-3zm-9-6h14v6c0 1.1-.9 2-2 2H5c-1.1 0-2-.9-2-2V9h0zm16 0h2c1.1 0 2 .9 2 2v2c0 1.1-.9 2-2 2h-2V9zm0 4h2v-2h-2v2zM2 7h16l-1-4H3L2 7z"/></svg>{t('timer.break')}</> : isFinalLevel ? `🏆 ${t('timer.finalLevel')}` : t('timer.levelOf', { current: tournament.current_level + 1, total: tournament.blind_structure.length })}
            </div>

            {/* Timer */}
            <div 
              className={`
                timer-display text-[10rem] font-bold leading-none tracking-tighter
                ${tournament.is_running ? 'timer-running' : ''}
                ${isLowTime ? 'text-red-500' : isBreak ? 'text-amber-400' : 'text-themed-primary'}
              `}
              role="timer"
              aria-live="assertive"
              aria-atomic="true"
              aria-label={`${formatTime(tournament.time_remaining_seconds)} ${tournament.is_running ? t('timer.running') : t('timer.paused')}`}
            >
              {formatTime(tournament.time_remaining_seconds)}
            </div>

            {/* Blinds Display - BIGGER */}
            {!isBreak && (
              <div className="mt-8 flex items-center gap-12">
                <div className="text-center">
                  <div className="text-themed-muted text-lg mb-2 uppercase tracking-wide">{t('timer.smallBlind')}</div>
                  <div className="text-6xl font-bold text-themed-primary">{currentBlind?.small_blind.toLocaleString()}</div>
                </div>
                <div className="text-6xl text-themed-muted font-light">/</div>
                <div className="text-center">
                  <div className="text-themed-muted text-lg mb-2 uppercase tracking-wide">{t('timer.bigBlind')}</div>
                  <div className="text-6xl font-bold text-themed-primary">{currentBlind?.big_blind.toLocaleString()}</div>
                </div>
                {showAnte && (
                  <>
                    <div className="text-6xl text-themed-muted font-light">+</div>
                    <div className="text-center">
                      <div className="text-themed-muted text-lg mb-2 uppercase tracking-wide">{t('timer.ante')}</div>
                      <div className={`text-6xl font-bold ${currentBlind?.ante ? 'text-accent' : 'text-themed-muted'}`}>
                        {currentBlind?.ante ? currentBlind.ante.toLocaleString() : '–'}
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Next Level Preview */}
            {nextBlind && !isBreak && (
              <div className="mt-6 card px-6 py-4 inline-block">
                <div className="text-themed-muted text-xs mb-2 uppercase tracking-wide text-center">{t('timer.nextLevel')}</div>
                {nextBlind.is_break ? (
                  <div className="text-amber-400 text-xl font-semibold text-center flex items-center justify-center gap-1"><svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path d="M2 19h18v2H2v-2zm2-4h2v3H4v-3zm4 0h2v3H8v-3zm4 0h2v3h-2v-3zm-9-6h14v6c0 1.1-.9 2-2 2H5c-1.1 0-2-.9-2-2V9h0zm16 0h2c1.1 0 2 .9 2 2v2c0 1.1-.9 2-2 2h-2V9zm0 4h2v-2h-2v2zM2 7h16l-1-4H3L2 7z"/></svg> {t('timer.break')}</div>
                ) : (
                  <div className="flex items-center justify-center gap-4">
                    <div className="text-center">
                      <div className="text-themed-muted text-xs mb-1 uppercase tracking-wide">{t('timer.smallBlind')}</div>
                      <div className="text-xl font-bold text-themed-secondary">{nextBlind.small_blind.toLocaleString()}</div>
                    </div>
                    <div className="text-xl text-themed-muted font-light">/</div>
                    <div className="text-center">
                      <div className="text-themed-muted text-xs mb-1 uppercase tracking-wide">{t('timer.bigBlind')}</div>
                      <div className="text-xl font-bold text-themed-secondary">{nextBlind.big_blind.toLocaleString()}</div>
                    </div>
                    {showAnte && (
                      <>
                        <div className="text-xl text-themed-muted font-light">+</div>
                        <div className="text-center">
                          <div className="text-themed-muted text-xs mb-1 uppercase tracking-wide">{t('timer.ante')}</div>
                          <div className={`text-xl font-bold ${nextBlind.ante ? 'text-accent' : 'text-themed-muted'}`}>
                            {nextBlind.ante ? nextBlind.ante.toLocaleString() : '–'}
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Color-Up Notifications */}
            {currentColorUps.length > 0 && (
              <div className="mt-4 px-5 py-3 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center gap-3">
                <span className="text-amber-400 text-xl">🔄</span>
                <div>
                  <div className="text-amber-300 font-semibold text-sm">{t('timer.colorUpNow')}</div>
                  <div className="text-amber-400/80 text-xs flex items-center gap-2 mt-0.5">
                    {currentColorUps.map((entry, i) => (
                      <span key={i} className="inline-flex items-center gap-1">
                        <span
                          className="inline-block w-3 h-3 rounded-full border"
                          style={{ backgroundColor: entry.color, borderColor: entry.borderColor }}
                        />
                        {entry.chipValue.toLocaleString()}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            )}
            {nextColorUps.length > 0 && currentColorUps.length === 0 && (
              <div className="mt-4 px-5 py-3 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center gap-3">
                <span className="text-blue-400 text-lg">🔄</span>
                <div>
                  <div className="text-blue-300 font-medium text-sm">{t('timer.colorUpNext')}</div>
                  <div className="text-blue-400/70 text-xs flex items-center gap-2 mt-0.5">
                    {nextColorUps.map((entry, i) => (
                      <span key={i} className="inline-flex items-center gap-1">
                        <span
                          className="inline-block w-3 h-3 rounded-full border"
                          style={{ backgroundColor: entry.color, borderColor: entry.borderColor }}
                        />
                        {entry.chipValue.toLocaleString()}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Timer Controls */}
            <div className="mt-10 flex items-center gap-4">
              <button
                onClick={prevLevel}
                className="btn btn-secondary w-12 h-12 rounded-full p-0"
                title={t('timer.previousLevel')}
                aria-label={t('timer.previousLevel')}
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>

              <button
                onClick={toggleTimer}
                aria-label={tournament.is_running ? t('timer.pause') : t('timer.play')}
                className={`
                  w-20 h-20 rounded-full flex items-center justify-center transition-all duration-200
                  ${tournament.is_running 
                    ? 'bg-themed-tertiary hover:opacity-80 text-themed-primary' 
                    : 'bg-accent hover:opacity-90 text-white'
                  }
                `}
              >
                {tournament.is_running ? (
                  <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
                  </svg>
                ) : (
                  <svg className="w-8 h-8 ml-1" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                )}
              </button>

              <button
                onClick={nextLevel}
                className="btn btn-secondary w-12 h-12 rounded-full p-0"
                title={t('timer.nextLevel')}
                aria-label={t('timer.nextLevel')}
                disabled={isFinalLevel}
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>

            {/* Quick Time Adjustments */}
            <div className="mt-6 flex items-center gap-2">
              <button onClick={() => addTime(-60)} className="btn btn-ghost text-sm" aria-label={t('timer.subtractMinute')}>-1m</button>
              <button onClick={() => addTime(60)} className="btn btn-ghost text-sm" aria-label={t('timer.addMinute')}>+1m</button>
              <button onClick={() => addTime(300)} className="btn btn-ghost text-sm" aria-label={t('timer.addFiveMin')}>+5m</button>
            </div>
          </>
        )}
      </div>

      {/* Quick Players Modal */}
      {showPlayersModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50" onClick={() => setShowPlayersModal(false)}>
          <div className="card p-6 w-full max-w-md max-h-[80vh] flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-themed-primary">{t('timer.quickPlayers')}</h3>
              <button onClick={() => setShowPlayersModal(false)} className="text-themed-muted hover:text-themed-primary text-xl leading-none">&times;</button>
            </div>
            
            {/* Add Player */}
            <div className="flex gap-2 mb-4">
              <input
                type="text"
                value={newPlayerName}
                onChange={e => setNewPlayerName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && addPlayer()}
                placeholder={t('timer.addPlayerPlaceholder')}
                className="input flex-1 h-10"
              />
              <button onClick={addPlayer} disabled={!newPlayerName.trim()} className="btn btn-primary h-10 px-4">+</button>
            </div>

            {/* Player List */}
            <div className="flex-1 overflow-y-auto space-y-1.5 min-h-0">
              {tournament.players.length === 0 ? (
                <div className="text-themed-muted text-center py-8 text-sm">{t('timer.noPlayers')}</div>
              ) : (
                <>
                  {/* Active players first */}
                  {tournament.players.filter(p => !p.eliminated).map(player => (
                    <div key={player.id} className="flex items-center justify-between p-2.5 rounded-lg bg-themed-secondary/50">
                      <span className="text-themed-primary font-medium text-sm truncate flex-1">{player.name}</span>
                      <div className="flex items-center gap-1.5 ml-2">
                        <button
                          onClick={() => eliminatePlayer(player.id)}
                          className="px-2.5 py-1 rounded text-xs font-medium bg-red-500/15 text-red-400 hover:bg-red-500/25 transition-colors"
                          title={t('timer.eliminate')}
                        >
                          ✕
                        </button>
                        <button
                          onClick={() => removePlayer(player.id)}
                          className="px-2 py-1 rounded text-xs text-themed-muted hover:text-red-400 hover:bg-red-500/10 transition-colors"
                          title={t('timer.removePlayer')}
                        >
                          🗑
                        </button>
                      </div>
                    </div>
                  ))}
                  {/* Eliminated players */}
                  {tournament.players.filter(p => p.eliminated).map(player => (
                    <div key={player.id} className="flex items-center justify-between p-2.5 rounded-lg bg-themed-tertiary/50 opacity-60">
                      <span className="text-themed-muted font-medium text-sm truncate flex-1 line-through">{player.name}</span>
                      <div className="flex items-center gap-1.5 ml-2">
                        <button
                          onClick={() => reinstatePlayer(player.id)}
                          className="px-2.5 py-1 rounded text-xs font-medium bg-green-500/15 text-green-400 hover:bg-green-500/25 transition-colors"
                          title={t('timer.reinstate')}
                        >
                          ↩
                        </button>
                      </div>
                    </div>
                  ))}
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Winner Prompt Modal */}
      <PromptModal
        isOpen={showWinnerPrompt}
        onClose={() => setShowWinnerPrompt(false)}
        onSubmit={(winner) => {
          if (onCompleteTournament) {
            onCompleteTournament(winner)
            setHasSaved(true)
            setShowSavedAlert(true)
          }
        }}
        title={t('timer.tournamentWinner')}
        message={likelyWinner 
          ? t('timer.winnerConfirm', { name: likelyWinner })
          : t('timer.enterWinnerName')
        }
        placeholder={t('timer.winnerPlaceholder')}
        defaultValue={likelyWinner}
        submitText={t('timer.saveTournament')}
      />

      {/* Saved Confirmation */}
      <AlertModal
        isOpen={showSavedAlert}
        onClose={() => setShowSavedAlert(false)}
        title={t('timer.tournamentSaved')}
        message={t('timer.tournamentSavedMessage')}
        type="success"
      />
    </div>
  )
}
