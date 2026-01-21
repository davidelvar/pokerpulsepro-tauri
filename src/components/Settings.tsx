import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import type { Tournament, SoundSettings, ThemeSettings, ThemeMode, AccentColor, TournamentHistoryEntry } from '../types'
import { open, save } from '@tauri-apps/plugin-dialog'
import { writeTextFile, readTextFile } from '@tauri-apps/plugin-fs'
import { calculatePrizePool, formatCurrency } from '../utils'
import { AlertModal, ConfirmModal, PromptModal } from './Modal'
import { SUPPORTED_LANGUAGES } from '../i18n'

interface SettingsProps {
  tournament: Tournament
  setTournament: (t: Tournament) => void
  soundSettings: SoundSettings
  setSoundSettings: (s: SoundSettings) => void
  themeSettings: ThemeSettings
  setThemeSettings: (t: ThemeSettings) => void
  playTestSound: () => void
  resetTournament: () => void
}

// Modal state type
type ModalState = 
  | { type: 'none' }
  | { type: 'alert'; title: string; message: string; variant: 'success' | 'error' | 'info' | 'warning' }
  | { type: 'confirm'; title: string; message: string; onConfirm: () => void; variant?: 'danger' | 'primary' }
  | { type: 'prompt'; title: string; message?: string; placeholder?: string; onSubmit: (value: string) => void }

// Check if running in Tauri
const isTauri = typeof window !== 'undefined' && '__TAURI__' in window

const STORAGE_KEY_HISTORY = 'pokerpulse_tournament_history'

const CURRENCIES = [
  { symbol: '$', name: 'USD' },
  { symbol: '€', name: 'EUR' },
  { symbol: '£', name: 'GBP' },
  { symbol: '¥', name: 'JPY' },
  { symbol: 'kr', name: 'ISK' },
  { symbol: 'C$', name: 'CAD' },
  { symbol: 'A$', name: 'AUD' },
]

const CHIP_PRESETS = [
  { name: 'Turbo', chips: 1500, description: 'Fast-paced action' },
  { name: 'Short Stack', chips: 2500, description: 'Quick tournament' },
  { name: 'Regular', chips: 5000, description: 'Standard play' },
  { name: 'Deep Stack', chips: 10000, description: 'More strategic' },
  { name: 'Super Deep', chips: 20000, description: 'Maximum depth' },
]

export function Settings({ tournament, setTournament, soundSettings, setSoundSettings, themeSettings, setThemeSettings, playTestSound, resetTournament }: SettingsProps) {
  const { t, i18n } = useTranslation()
  const [tournamentHistory, setTournamentHistory] = useState<TournamentHistoryEntry[]>([])
  const [showHistory, setShowHistory] = useState(true)
  const [modal, setModal] = useState<ModalState>({ type: 'none' })

  const showAlert = (title: string, message: string, variant: 'success' | 'error' | 'info' | 'warning' = 'info') => {
    setModal({ type: 'alert', title, message, variant })
  }

  const showConfirm = (title: string, message: string, onConfirm: () => void, variant?: 'danger' | 'primary') => {
    setModal({ type: 'confirm', title, message, onConfirm, variant })
  }

  const showPrompt = (title: string, onSubmit: (value: string) => void, message?: string, placeholder?: string) => {
    setModal({ type: 'prompt', title, message, placeholder, onSubmit })
  }

  const closeModal = () => setModal({ type: 'none' })

  // Load tournament history from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_HISTORY)
      if (saved) {
        setTournamentHistory(JSON.parse(saved))
      }
    } catch (e) {
      console.error('Failed to load tournament history:', e)
    }
  }, [])

  // Save tournament history to localStorage
  const saveHistory = (history: TournamentHistoryEntry[]) => {
    setTournamentHistory(history)
    localStorage.setItem(STORAGE_KEY_HISTORY, JSON.stringify(history))
  }

  const accentColors: { id: AccentColor; name: string; class: string }[] = [
    { id: 'emerald', name: 'Emerald', class: 'bg-emerald-500' },
    { id: 'blue', name: 'Blue', class: 'bg-blue-500' },
    { id: 'purple', name: 'Purple', class: 'bg-purple-500' },
    { id: 'rose', name: 'Rose', class: 'bg-rose-500' },
    { id: 'amber', name: 'Amber', class: 'bg-amber-500' },
    { id: 'cyan', name: 'Cyan', class: 'bg-cyan-500' },
  ]

  // Export tournament config to JSON
  const exportTournament = async () => {
    const exportData = {
      name: tournament.name,
      buyin_amount: tournament.buyin_amount,
      rebuy_amount: tournament.rebuy_amount,
      rebuy_chips: tournament.rebuy_chips,
      addon_amount: tournament.addon_amount,
      addon_chips: tournament.addon_chips,
      starting_chips: tournament.starting_chips,
      blind_structure: tournament.blind_structure,
      currency_symbol: tournament.currency_symbol,
    }

    const jsonString = JSON.stringify(exportData, null, 2)

    if (isTauri) {
      try {
        const filePath = await save({
          filters: [{ name: 'JSON', extensions: ['json'] }],
          defaultPath: `${tournament.name.replace(/[^a-z0-9]/gi, '_')}_config.json`
        })
        if (filePath) {
          await writeTextFile(filePath, jsonString)
          showAlert(t('settings.exportComplete'), t('settings.exportSuccess'), 'success')
        }
      } catch (err) {
        console.error('Failed to export:', err)
      }
    } else {
      // Browser fallback
      const blob = new Blob([jsonString], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${tournament.name.replace(/[^a-z0-9]/gi, '_')}_config.json`
      a.click()
      URL.revokeObjectURL(url)
    }
  }

  // Import tournament config from JSON
  const importTournament = async () => {
    if (isTauri) {
      try {
        const filePath = await open({
          filters: [{ name: 'JSON', extensions: ['json'] }],
          multiple: false
        })
        if (filePath && typeof filePath === 'string') {
          const content = await readTextFile(filePath)
          const imported = JSON.parse(content)
          applyImportedConfig(imported)
        }
      } catch (err) {
        console.error('Failed to import:', err)
        showAlert(t('settings.importFailed'), t('settings.importFailedMsg'), 'error')
      }
    } else {
      // Browser fallback
      const input = document.createElement('input')
      input.type = 'file'
      input.accept = '.json'
      input.onchange = async (e) => {
        const file = (e.target as HTMLInputElement).files?.[0]
        if (file) {
          const text = await file.text()
          try {
            const imported = JSON.parse(text)
            applyImportedConfig(imported)
          } catch (err) {
            showAlert(t('settings.invalidFile'), t('settings.invalidFileMsg'), 'error')
          }
        }
      }
      input.click()
    }
  }

  const applyImportedConfig = (imported: any) => {
    setTournament({
      ...tournament,
      name: imported.name || tournament.name,
      buyin_amount: imported.buyin_amount ?? tournament.buyin_amount,
      rebuy_amount: imported.rebuy_amount ?? tournament.rebuy_amount,
      rebuy_chips: imported.rebuy_chips ?? tournament.rebuy_chips,
      addon_amount: imported.addon_amount ?? tournament.addon_amount,
      addon_chips: imported.addon_chips ?? tournament.addon_chips,
      starting_chips: imported.starting_chips ?? tournament.starting_chips,
      blind_structure: imported.blind_structure || tournament.blind_structure,
      currency_symbol: imported.currency_symbol || tournament.currency_symbol,
      current_level: 0,
      time_remaining_seconds: (imported.blind_structure?.[0]?.duration_minutes || 15) * 60,
      is_running: false,
      players: [], // Reset players on import
    })
    showAlert(t('settings.exportComplete'), t('settings.exportSuccess'), 'success')
  }

  // Complete tournament and add to history
  const completeTournament = (winnerName?: string) => {
    const winner = winnerName || tournament.players.find(p => p.placement === 1)?.name || null
    const totalLevelMinutes = tournament.blind_structure
      .slice(0, tournament.current_level + 1)
      .reduce((sum, level) => sum + level.duration_minutes, 0)

    const entry: TournamentHistoryEntry = {
      id: `${Date.now()}`,
      name: tournament.name,
      date: new Date().toISOString(),
      playerCount: tournament.players.length,
      winner: winner,
      prizePool: calculatePrizePool(tournament),
      currency_symbol: tournament.currency_symbol,
      duration_minutes: totalLevelMinutes,
    }

    saveHistory([entry, ...tournamentHistory].slice(0, 50)) // Keep last 50
    showAlert(t('settings.tournamentComplete'), t('settings.tournamentSaved'), 'success')
  }

  const deleteHistoryEntry = (id: string) => {
    saveHistory(tournamentHistory.filter(e => e.id !== id))
  }

  const clearHistory = () => {
    showConfirm(
      t('settings.clearHistory'),
      t('settings.clearHistoryConfirm'),
      () => saveHistory([]),
      'danger'
    )
  }

  const selectCustomSound = async () => {
    if (isTauri) {
      try {
        const selected = await open({
          multiple: false,
          filters: [{
            name: 'Audio',
            extensions: ['wav', 'mp3', 'ogg', 'm4a']
          }]
        })
        if (selected && typeof selected === 'string') {
          // Convert to file URL for audio playback
          setSoundSettings({
            ...soundSettings,
            soundType: 'custom',
            customSoundPath: `file://${selected}`
          })
        }
      } catch (err) {
        console.error('Failed to open file dialog:', err)
      }
    } else {
      // Browser fallback - use input file
      const input = document.createElement('input')
      input.type = 'file'
      input.accept = 'audio/*'
      input.onchange = (e) => {
        const file = (e.target as HTMLInputElement).files?.[0]
        if (file) {
          const url = URL.createObjectURL(file)
          setSoundSettings({
            ...soundSettings,
            soundType: 'custom',
            customSoundPath: url
          })
        }
      }
      input.click()
    }
  }

  const changeLanguage = (langCode: string) => {
    i18n.changeLanguage(langCode)
  }

  return (
    <div className="space-y-6">
      {/* Appearance */}
      <div className="card p-6">
        <h3 className="text-lg font-semibold text-themed-primary mb-4">{t('settings.appearance')}</h3>
        <div className="grid grid-cols-3 gap-6">
          {/* Light/Dark Mode */}
          <div>
            <div className="text-sm text-themed-muted mb-3">{t('settings.themeMode')}</div>
            <div className="flex gap-3">
              {(['dark', 'light'] as ThemeMode[]).map((mode) => (
                <button
                  key={mode}
                  onClick={() => setThemeSettings({ ...themeSettings, mode })}
                  className={`flex-1 p-4 rounded-xl border-2 transition-all ${
                    themeSettings.mode === mode
                      ? 'border-accent bg-accent/10'
                      : 'border-themed hover:border-themed-muted'
                  }`}
                >
                  <div className="flex items-center justify-center gap-3">
                    <span className="text-2xl">{mode === 'dark' ? '🌙' : '☀️'}</span>
                    <span className={`font-medium ${themeSettings.mode === mode ? 'text-accent' : 'text-themed-secondary'}`}>
                      {t(`settings.${mode}`)}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>
          
          {/* Accent Color */}
          <div>
            <div className="text-sm text-themed-muted mb-3">{t('settings.accentColor')}</div>
            <div className="grid grid-cols-6 gap-3">
              {accentColors.map((color) => (
                <button
                  key={color.id}
                  onClick={() => setThemeSettings({ ...themeSettings, accent: color.id })}
                  className={`aspect-square rounded-xl ${color.class} transition-all flex items-center justify-center ${
                    themeSettings.accent === color.id
                      ? 'ring-2 ring-offset-2 ring-offset-themed-primary ring-white scale-110'
                      : 'hover:scale-105'
                  }`}
                  title={color.name}
                >
                  {themeSettings.accent === color.id && (
                    <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Language Selector */}
          <div>
            <div className="text-sm text-themed-muted mb-3">{t('settings.language')}</div>
            <select
              value={SUPPORTED_LANGUAGES.find(l => i18n.language === l.code || i18n.language.startsWith(l.code + '-'))?.code || 'en'}
              onChange={(e) => changeLanguage(e.target.value)}
              className="input w-full"
            >
              {SUPPORTED_LANGUAGES.map((lang) => (
                <option key={lang.code} value={lang.code}>
                  {lang.flag} {lang.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>


      {/* Tournament Settings - Combined */}
      <div className="card p-6">
        <h3 className="text-lg font-semibold text-themed-primary mb-4">{t('settings.tournament')}</h3>
        <div className="space-y-6">
          {/* Tournament Name & Currency Row */}
          <div className="grid grid-cols-4 gap-4">
            <div className="col-span-2">
              <label className="text-sm text-themed-muted mb-2 block">{t('settings.tournamentName')}</label>
              <input
                type="text"
                value={tournament.name}
                onChange={(e) => setTournament({ ...tournament, name: e.target.value })}
                className="input"
                placeholder={t('settings.tournamentNamePlaceholder')}
              />
            </div>
            <div>
              <label className="text-sm text-themed-muted mb-2 block">{t('settings.currency')}</label>
              <select
                value={tournament.currency_symbol}
                onChange={(e) => setTournament({ ...tournament, currency_symbol: e.target.value })}
                className="input"
              >
                {CURRENCIES.map((c) => (
                  <option key={c.symbol} value={c.symbol}>
                    {c.symbol} ({c.name})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm text-themed-muted mb-2 block">{t('settings.buyinAmount')}</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-themed-muted">
                  {tournament.currency_symbol}
                </span>
                <input
                  type="number"
                  value={tournament.buyin_amount}
                  onChange={(e) => setTournament({ ...tournament, buyin_amount: parseInt(e.target.value) || 0 })}
                  className="input pl-8"
                  min="0"
                />
              </div>
            </div>
          </div>

          {/* Rebuys & Add-ons Row */}
          <div className="grid grid-cols-4 gap-4">
            <div>
              <label className="text-sm text-themed-muted mb-2 block">{t('settings.rebuyAmount')}</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-themed-muted">
                  {tournament.currency_symbol}
                </span>
                <input
                  type="number"
                  value={tournament.rebuy_amount}
                  onChange={(e) => setTournament({ ...tournament, rebuy_amount: parseInt(e.target.value) || 0 })}
                  className="input pl-8"
                  min="0"
                />
              </div>
            </div>
            <div>
              <label className="text-sm text-themed-muted mb-2 block">{t('settings.rebuyChips')}</label>
              <input
                type="number"
                value={tournament.rebuy_chips}
                onChange={(e) => setTournament({ ...tournament, rebuy_chips: parseInt(e.target.value) || 0 })}
                className="input"
                min="0"
              />
            </div>
            <div>
              <label className="text-sm text-themed-muted mb-2 block">{t('settings.addonAmount')}</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-themed-muted">
                  {tournament.currency_symbol}
                </span>
                <input
                  type="number"
                  value={tournament.addon_amount}
                  onChange={(e) => setTournament({ ...tournament, addon_amount: parseInt(e.target.value) || 0 })}
                  className="input pl-8"
                  min="0"
                />
              </div>
            </div>
            <div>
              <label className="text-sm text-themed-muted mb-2 block">{t('settings.addonChips')}</label>
              <input
                type="number"
                value={tournament.addon_chips}
                onChange={(e) => setTournament({ ...tournament, addon_chips: parseInt(e.target.value) || 0 })}
                className="input"
                min="0"
              />
            </div>
          </div>

          {/* Starting Chips */}
          <div>
            <label className="text-sm text-themed-muted mb-2 block">{t('settings.startingChips')}</label>
            <div className="flex items-center gap-4">
              <div className="flex gap-2">
                {CHIP_PRESETS.map((preset) => (
                  <button
                    key={preset.name}
                    onClick={() => setTournament({ ...tournament, starting_chips: preset.chips })}
                    className={`px-3 py-2 rounded-lg text-center transition-colors ${
                      tournament.starting_chips === preset.chips
                        ? 'bg-accent/20 border border-emerald-600/50 text-accent'
                        : 'bg-themed-tertiary hover:bg-themed-secondary text-themed-secondary'
                    }`}
                    title={t(`settings.chipPresets.${preset.name.toLowerCase().replace(' ', '')}Desc`)}
                  >
                    <div className="font-semibold text-sm">{preset.chips.toLocaleString()}</div>
                  </button>
                ))}
              </div>
              <span className="text-themed-muted">{t('settings.or')}</span>
              <input
                type="number"
                value={tournament.starting_chips}
                onChange={(e) => setTournament({ ...tournament, starting_chips: parseInt(e.target.value) || 1000 })}
                className="input w-32"
                min="100"
                step="100"
              />
            </div>
          </div>

          {/* Chip Breakdown */}
          <div>
            <div className="text-sm text-themed-muted mb-2">{t('settings.suggestedChips', { chips: tournament.starting_chips.toLocaleString() })}</div>
            <div className="flex flex-wrap gap-4">
              {getChipBreakdown(tournament.starting_chips).map((chip) => (
                <div key={chip.value} className="flex items-center gap-2">
                  <div
                    className="chip"
                    style={{
                      backgroundColor: chip.color,
                      borderColor: chip.borderColor,
                      color: chip.textColor,
                    }}
                  >
                    {chip.value >= 1000 ? `${chip.value / 1000}K` : chip.value}
                  </div>
                  <span className="text-themed-secondary text-sm">× {chip.count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Sound Settings - Combined */}
      <div className="card p-6">
        <h3 className="text-lg font-semibold text-themed-primary mb-4">{t('settings.sound')}</h3>
        <div className="grid grid-cols-2 gap-6">
          {/* Level Change Sound */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-themed-primary font-medium">{t('settings.levelChangeSound')}</div>
                <div className="text-sm text-themed-muted">{t('settings.levelChangeSoundDesc')}</div>
              </div>
              <button
                onClick={() => setSoundSettings({ ...soundSettings, enabled: !soundSettings.enabled })}
                className={`relative w-12 h-6 rounded-full transition-colors ${
                  soundSettings.enabled ? 'bg-accent' : 'bg-themed-secondary'
                }`}
              >
                <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${
                  soundSettings.enabled ? 'translate-x-7' : 'translate-x-1'
                }`} />
              </button>
            </div>

            {soundSettings.enabled && (
              <>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={() => setSoundSettings({ ...soundSettings, soundType: 'bell' })}
                    className={`p-2 rounded-lg text-center transition-colors ${
                      soundSettings.soundType === 'bell'
                        ? 'bg-accent/20 border border-emerald-600/50 text-accent'
                        : 'bg-themed-tertiary hover:bg-themed-secondary text-themed-secondary'
                    }`}
                  >
                    <div className="text-xl mb-1">🔔</div>
                    <div className="text-xs font-medium">{t('settings.soundBell')}</div>
                  </button>
                  <button
                    onClick={() => setSoundSettings({ ...soundSettings, soundType: 'evil-laugh' })}
                    className={`p-2 rounded-lg text-center transition-colors ${
                      soundSettings.soundType === 'evil-laugh'
                        ? 'bg-accent/20 border border-emerald-600/50 text-accent'
                        : 'bg-themed-tertiary hover:bg-themed-secondary text-themed-secondary'
                    }`}
                  >
                    <div className="text-xl mb-1">😈</div>
                    <div className="text-xs font-medium">{t('settings.soundEvilLaugh')}</div>
                  </button>
                  <button
                    onClick={selectCustomSound}
                    className={`p-2 rounded-lg text-center transition-colors ${
                      soundSettings.soundType === 'custom'
                        ? 'bg-accent/20 border border-emerald-600/50 text-accent'
                        : 'bg-themed-tertiary hover:bg-themed-secondary text-themed-secondary'
                    }`}
                  >
                    <div className="text-xl mb-1">📁</div>
                    <div className="text-xs font-medium">{t('settings.soundCustom')}</div>
                  </button>
                </div>

                <div>
                  <label className="text-sm text-themed-muted mb-2 block">
                    {t('settings.volume')}: {Math.round(soundSettings.volume * 100)}%
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.1"
                    value={soundSettings.volume}
                    onChange={(e) => setSoundSettings({ ...soundSettings, volume: parseFloat(e.target.value) })}
                    className="w-full h-2 bg-themed-secondary rounded-lg appearance-none cursor-pointer accent-emerald-500"
                  />
                </div>

                <button onClick={playTestSound} className="btn btn-secondary text-sm">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                  </svg>
                  {t('settings.testSound')}
                </button>
              </>
            )}
          </div>

          {/* Warning Sounds & Break Settings */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-themed-primary font-medium">{t('settings.warningSound')}</div>
                <div className="text-sm text-themed-muted">{t('settings.warningSoundDesc')}</div>
              </div>
              <button
                onClick={() => setSoundSettings({ ...soundSettings, warningEnabled: !soundSettings.warningEnabled })}
                className={`relative w-12 h-6 rounded-full transition-colors ${
                  soundSettings.warningEnabled ? 'bg-accent' : 'bg-themed-secondary'
                }`}
              >
                <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${
                  soundSettings.warningEnabled ? 'translate-x-7' : 'translate-x-1'
                }`} />
              </button>
            </div>

            {soundSettings.warningEnabled && (
              <div className="space-y-2 pl-4 border-l-2 border-themed">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={soundSettings.warningAt60}
                    onChange={(e) => setSoundSettings({ ...soundSettings, warningAt60: e.target.checked })}
                    className="w-4 h-4 rounded bg-themed-secondary border-zinc-600 text-emerald-500 focus:ring-emerald-500"
                  />
                  <span className="text-themed-secondary text-sm">{t('settings.warning60')}</span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={soundSettings.warningAt30}
                    onChange={(e) => setSoundSettings({ ...soundSettings, warningAt30: e.target.checked })}
                    className="w-4 h-4 rounded bg-themed-secondary border-zinc-600 text-emerald-500 focus:ring-emerald-500"
                  />
                  <span className="text-themed-secondary text-sm">{t('settings.warning30')}</span>
                </label>
              </div>
            )}

            <div className="flex items-center justify-between pt-4 border-t border-themed">
              <div>
                <div className="text-themed-primary font-medium">{t('settings.autoPauseBreak')}</div>
                <div className="text-sm text-themed-muted">{t('settings.autoPauseBreakDesc')}</div>
              </div>
              <button
                onClick={() => setSoundSettings({ ...soundSettings, autoPauseOnBreak: !soundSettings.autoPauseOnBreak })}
                className={`relative w-12 h-6 rounded-full transition-colors ${
                  soundSettings.autoPauseOnBreak ? 'bg-accent' : 'bg-themed-secondary'
                }`}
              >
                <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${
                  soundSettings.autoPauseOnBreak ? 'translate-x-7' : 'translate-x-1'
                }`} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Keyboard Shortcuts & Data */}
      <div className="grid grid-cols-2 gap-6">
        {/* Keyboard Shortcuts */}
        <div className="card p-6">
          <h3 className="text-lg font-semibold text-themed-primary mb-4 flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
            </svg>
            {t('settings.shortcuts')}
          </h3>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="flex items-center justify-between p-2 bg-themed-tertiary rounded">
              <span className="text-themed-secondary">{t('settings.playPause')}</span>
              <kbd className="px-2 py-1 bg-themed-secondary rounded text-zinc-200 font-mono text-xs">Space</kbd>
            </div>
            <div className="flex items-center justify-between p-2 bg-themed-tertiary rounded">
              <span className="text-themed-secondary">{t('settings.prevLevel')}</span>
              <kbd className="px-2 py-1 bg-themed-secondary rounded text-zinc-200 font-mono text-xs">←</kbd>
            </div>
            <div className="flex items-center justify-between p-2 bg-themed-tertiary rounded">
              <span className="text-themed-secondary">{t('settings.nextLevel')}</span>
              <kbd className="px-2 py-1 bg-themed-secondary rounded text-zinc-200 font-mono text-xs">→</kbd>
            </div>
            <div className="flex items-center justify-between p-2 bg-themed-tertiary rounded">
              <span className="text-themed-secondary">{t('settings.addMin')}</span>
              <kbd className="px-2 py-1 bg-themed-secondary rounded text-zinc-200 font-mono text-xs">+</kbd>
            </div>
            <div className="flex items-center justify-between p-2 bg-themed-tertiary rounded">
              <span className="text-themed-secondary">{t('settings.removeMin')}</span>
              <kbd className="px-2 py-1 bg-themed-secondary rounded text-zinc-200 font-mono text-xs">-</kbd>
            </div>
            <div className="flex items-center justify-between p-2 bg-themed-tertiary rounded">
              <span className="text-themed-secondary">{t('settings.fullscreen')}</span>
              <kbd className="px-2 py-1 bg-themed-secondary rounded text-zinc-200 font-mono text-xs">F</kbd>
            </div>
          </div>
        </div>

        {/* Export / Import & Auto-Save */}
        <div className="card p-6">
          <h3 className="text-lg font-semibold text-themed-primary mb-4 flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
            </svg>
            {t('settings.dataManagement')}
          </h3>
          <div className="space-y-4">
            <div className="flex gap-3">
              <button onClick={exportTournament} className="btn btn-primary flex-1 flex items-center justify-center gap-2">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                </svg>
                {t('settings.export')}
              </button>
              <button onClick={importTournament} className="btn btn-secondary flex-1 flex items-center justify-center gap-2">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                {t('settings.import')}
              </button>
            </div>
            <div className="p-3 bg-accent/10 rounded-lg border border-accent/20">
              <div className="flex items-center gap-2 text-accent text-sm font-medium">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {t('settings.autoSaveEnabled')}
              </div>
              <p className="text-xs text-themed-muted mt-1">
                {t('settings.autoSaveDesc')}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Tournament History */}
      <div className="card p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-themed-primary flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {t('settings.history')}
            {tournamentHistory.length > 0 && (
              <span className="text-sm font-normal text-themed-muted">({tournamentHistory.length})</span>
            )}
          </h3>
          <button
            onClick={() => setShowHistory(!showHistory)}
            className="text-sm text-accent hover:underline"
          >
            {showHistory ? t('settings.hideHistory') : t('settings.showHistory')}
          </button>
        </div>

        {showHistory && (
          <div className="space-y-3">
            {tournamentHistory.length === 0 ? (
              <p className="text-themed-muted text-sm text-center py-4">
                {t('settings.noHistory')}
              </p>
            ) : (
              <>
                {tournamentHistory.map((entry) => (
                  <div key={entry.id} className="p-3 bg-themed-tertiary rounded-lg flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-themed-primary font-medium">{entry.name}</span>
                        <span className="text-xs text-themed-muted">
                          {new Date(entry.date).toLocaleDateString(i18n.language)}
                        </span>
                      </div>
                      <div className="text-sm text-themed-secondary flex items-center gap-3 mt-1">
                        <span>🏆 {entry.winner}</span>
                        <span>👥 {entry.playerCount}</span>
                        <span>💰 {formatCurrency(entry.prizePool, entry.currency_symbol)}</span>
                        {entry.duration_minutes && (
                          <span>⏱️ {Math.floor(entry.duration_minutes / 60)}h {entry.duration_minutes % 60}m</span>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => deleteHistoryEntry(entry.id)}
                      className="p-1 text-themed-muted hover:text-red-400 transition-colors"
                      title={t('modal.delete')}
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                ))}
                <div className="flex justify-end">
                  <button onClick={clearHistory} className="text-sm text-red-400 hover:underline">
                    {t('settings.clearHistory')}
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* Danger Zone */}
      <div className="card p-6 border-red-500/20">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-red-400">{t('settings.resetTournament')}</h3>
            <div className="text-sm text-themed-muted">{t('settings.resetTournamentDesc')}</div>
          </div>
          <button onClick={resetTournament} className="btn btn-danger">
            {t('settings.resetTournament')}
          </button>
        </div>
      </div>

      {/* Modals */}
      {modal.type === 'alert' && (
        <AlertModal
          isOpen={true}
          onClose={closeModal}
          title={modal.title}
          message={modal.message}
          type={modal.variant}
        />
      )}
      {modal.type === 'confirm' && (
        <ConfirmModal
          isOpen={true}
          onClose={closeModal}
          onConfirm={modal.onConfirm}
          title={modal.title}
          message={modal.message}
          variant={modal.variant}
        />
      )}
      {modal.type === 'prompt' && (
        <PromptModal
          isOpen={true}
          onClose={closeModal}
          onSubmit={modal.onSubmit}
          title={modal.title}
          message={modal.message}
          placeholder={modal.placeholder}
        />
      )}
    </div>
  )
}

function getChipBreakdown(totalChips: number): { value: number; count: number; color: string; borderColor: string; textColor: string }[] {
  // Standard chip colors
  const chipDefs = [
    { value: 25, color: '#22c55e', borderColor: '#16a34a', textColor: '#fff' },
    { value: 100, color: '#1e1e1e', borderColor: '#404040', textColor: '#fff' },
    { value: 500, color: '#7c3aed', borderColor: '#6d28d9', textColor: '#fff' },
    { value: 1000, color: '#fbbf24', borderColor: '#f59e0b', textColor: '#000' },
    { value: 5000, color: '#ef4444', borderColor: '#dc2626', textColor: '#fff' },
  ]

  const breakdown: { value: number; count: number; color: string; borderColor: string; textColor: string }[] = []
  let remaining = totalChips

  // Work backwards from largest chip
  for (let i = chipDefs.length - 1; i >= 0; i--) {
    const chip = chipDefs[i]
    if (remaining >= chip.value) {
      const count = Math.floor(remaining / chip.value)
      if (count > 0) {
        // Limit count per denomination for practicality
        const actualCount = Math.min(count, i === 0 ? 20 : 10)
        breakdown.push({ ...chip, count: actualCount })
        remaining -= actualCount * chip.value
      }
    }
  }

  // Add remaining as smallest chips if needed
  if (remaining > 0 && chipDefs[0]) {
    const existing = breakdown.find(b => b.value === chipDefs[0].value)
    if (existing) {
      existing.count += Math.ceil(remaining / chipDefs[0].value)
    } else {
      breakdown.push({ ...chipDefs[0], count: Math.ceil(remaining / chipDefs[0].value) })
    }
  }

  return breakdown.sort((a, b) => a.value - b.value)
}
