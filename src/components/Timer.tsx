import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { Tournament } from '../types'
import { formatTime, formatCurrency, getActivePlayers, getAverageStack, calculatePrizePool } from '../utils'
import { PromptModal, AlertModal } from './Modal'

interface TimerProps {
  tournament: Tournament
  toggleTimer: () => void
  nextLevel: () => void
  prevLevel: () => void
  addTime: (seconds: number) => void
  onCompleteTournament?: (winner: string) => void
  onReset?: () => void
}

export function Timer({ tournament, toggleTimer, nextLevel, prevLevel, addTime, onCompleteTournament, onReset }: TimerProps) {
  const { t } = useTranslation()
  const [showWinnerPrompt, setShowWinnerPrompt] = useState(false)
  const [showSavedAlert, setShowSavedAlert] = useState(false)
  const [hasSaved, setHasSaved] = useState(false)

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

  return (
    <div className="h-full flex flex-col">
      {/* Top Stats Bar */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="card p-4 text-center">
          <div className="text-themed-muted text-sm mb-1">{t('timer.players')}</div>
          <div className="text-2xl font-bold text-themed-primary">
            {activePlayers} <span className="text-themed-muted font-normal text-lg">/ {totalPlayers}</span>
          </div>
        </div>
        <div className="card p-4 text-center">
          <div className="text-themed-muted text-sm mb-1">{t('timer.prizePool')}</div>
          <div className="text-2xl font-bold text-accent">
            {formatCurrency(prizePool, tournament.currency_symbol)}
          </div>
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
              {isBreak ? `☕ ${t('timer.break')}` : isFinalLevel ? `🏆 ${t('timer.finalLevel')}` : t('timer.levelOf', { current: tournament.current_level + 1, total: tournament.blind_structure.length })}
            </div>

            {/* Timer */}
            <div 
              className={`
                timer-display text-[10rem] font-bold leading-none tracking-tighter
                ${tournament.is_running ? 'timer-running' : ''}
                ${isLowTime ? 'text-red-500' : isBreak ? 'text-amber-400' : 'text-themed-primary'}
              `}
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
                <div className="text-6xl text-themed-muted font-light">+</div>
                <div className="text-center">
                  <div className="text-themed-muted text-lg mb-2 uppercase tracking-wide">{t('timer.ante')}</div>
                  <div className={`text-6xl font-bold ${currentBlind?.ante ? 'text-accent' : 'text-themed-muted'}`}>
                    {currentBlind?.ante ? currentBlind.ante.toLocaleString() : '–'}
                  </div>
                </div>
              </div>
            )}

            {/* Next Level Preview */}
            {nextBlind && !isBreak && (
              <div className="mt-6 card px-6 py-4 inline-block">
                <div className="text-themed-muted text-xs mb-2 uppercase tracking-wide text-center">{t('timer.nextLevel')}</div>
                {nextBlind.is_break ? (
                  <div className="text-amber-400 text-xl font-semibold text-center">☕ {t('timer.break')}</div>
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
                    <div className="text-xl text-themed-muted font-light">+</div>
                    <div className="text-center">
                      <div className="text-themed-muted text-xs mb-1 uppercase tracking-wide">{t('timer.ante')}</div>
                      <div className={`text-xl font-bold ${nextBlind.ante ? 'text-accent' : 'text-themed-muted'}`}>
                        {nextBlind.ante ? nextBlind.ante.toLocaleString() : '–'}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Timer Controls */}
            <div className="mt-10 flex items-center gap-4">
              <button
                onClick={prevLevel}
                className="btn btn-secondary w-12 h-12 rounded-full p-0"
                title={t('timer.previousLevel')}
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>

              <button
                onClick={toggleTimer}
                className={`
                  w-20 h-20 rounded-full flex items-center justify-center transition-all duration-200
                  ${tournament.is_running 
                    ? 'bg-themed-tertiary hover:opacity-80 text-themed-primary' 
                    : 'bg-accent hover:opacity-90 text-white'
                  }
                `}
              >
                {tournament.is_running ? (
                  <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
                  </svg>
                ) : (
                  <svg className="w-8 h-8 ml-1" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                )}
              </button>

              <button
                onClick={nextLevel}
                className="btn btn-secondary w-12 h-12 rounded-full p-0"
                title={t('timer.nextLevel')}
                disabled={isFinalLevel}
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>

            {/* Quick Time Adjustments */}
            <div className="mt-6 flex items-center gap-2">
              <button onClick={() => addTime(-60)} className="btn btn-ghost text-sm">-1m</button>
              <button onClick={() => addTime(60)} className="btn btn-ghost text-sm">+1m</button>
              <button onClick={() => addTime(300)} className="btn btn-ghost text-sm">+5m</button>
            </div>
          </>
        )}
      </div>

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
