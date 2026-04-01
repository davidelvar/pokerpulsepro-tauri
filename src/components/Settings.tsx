import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import type { Tournament, SoundSettings, ThemeSettings, ThemeMode, AccentColor, TournamentHistoryEntry, PhysicalChip } from '../types'
import { open, save } from '@tauri-apps/plugin-dialog'
import { writeTextFile, readTextFile } from '@tauri-apps/plugin-fs'
import { formatCurrency, calculateColorUpSchedule } from '../utils'
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
  playTestVoice: () => void
  resetTournament: () => void
  onShowOnboarding?: () => void
  chipInventory: PhysicalChip[]
  setChipInventory: (chips: PhysicalChip[]) => void
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
const STORAGE_KEY_CUSTOM_CHIP_SETS = 'pokerpulse_custom_chip_sets'

interface CustomChipSet {
  id: string
  name: string
  chips: Omit<PhysicalChip, 'id'>[]
}

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

export function Settings({ tournament, setTournament, soundSettings, setSoundSettings, themeSettings, setThemeSettings, playTestSound, playTestVoice, resetTournament, onShowOnboarding, chipInventory, setChipInventory }: SettingsProps) {
  const { t, i18n } = useTranslation()
  const [tournamentHistory, setTournamentHistory] = useState<TournamentHistoryEntry[]>([])
  const [showHistory, setShowHistory] = useState(true)
  const [modal, setModal] = useState<ModalState>({ type: 'none' })
  const [customChipSets, setCustomChipSets] = useState<CustomChipSet[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_CUSTOM_CHIP_SETS)
      return saved ? JSON.parse(saved) : []
    } catch { return [] }
  })

  const saveCustomChipSets = (sets: CustomChipSet[]) => {
    setCustomChipSets(sets)
    localStorage.setItem(STORAGE_KEY_CUSTOM_CHIP_SETS, JSON.stringify(sets))
  }

  const saveCurrentChipSet = () => {
    setModal({
      type: 'prompt',
      title: t('settings.saveChipSet'),
      message: t('settings.saveChipSetMessage'),
      placeholder: t('settings.chipSetNamePlaceholder'),
      onSubmit: (name: string) => {
        const newSet: CustomChipSet = {
          id: Date.now().toString(),
          name,
          chips: chipInventory.map(({ id, ...rest }) => rest),
        }
        saveCustomChipSets([...customChipSets, newSet])
      },
    })
  }

  const deleteCustomChipSet = (id: string) => {
    saveCustomChipSets(customChipSets.filter(s => s.id !== id))
  }

  const showAlert = (title: string, message: string, variant: 'success' | 'error' | 'info' | 'warning' = 'info') => {
    setModal({ type: 'alert', title, message, variant })
  }

  const showConfirm = (title: string, message: string, onConfirm: () => void, variant?: 'danger' | 'primary') => {
    setModal({ type: 'confirm', title, message, onConfirm, variant })
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
        <div className="grid grid-cols-4 gap-6">
          {/* Language Selector */}
          <div>
            <div className="text-sm text-themed-muted mb-3">{t('settings.language')}</div>
            <select
              value={SUPPORTED_LANGUAGES.find(l => i18n.language === l.code || i18n.language.startsWith(l.code + '-'))?.code || 'en'}
              onChange={(e) => changeLanguage(e.target.value)}
              className="input w-full h-[58px]"
            >
              {SUPPORTED_LANGUAGES.map((lang) => (
                <option key={lang.code} value={lang.code}>
                  {lang.flag} {lang.name}
                </option>
              ))}
            </select>
          </div>

          {/* Time Format */}
          <div>
            <div className="text-sm text-themed-muted mb-3">{t('settings.timeFormat')}</div>
            <div className="flex gap-3">
              {(['24h', '12h'] as const).map((fmt) => (
                <button
                  key={fmt}
                  onClick={() => setThemeSettings({ ...themeSettings, timeFormat: fmt })}
                  className={`flex-1 h-[58px] rounded-xl border-2 transition-all ${
                    themeSettings.timeFormat === fmt
                      ? 'border-accent bg-accent/10'
                      : 'border-themed hover:border-themed-muted'
                  }`}
                >
                  <div className="flex items-center justify-center gap-2">
                    <span className="text-lg">🕐</span>
                    <span className={`font-medium ${themeSettings.timeFormat === fmt ? 'text-accent' : 'text-themed-secondary'}`}>
                      {fmt === '24h' ? '24h' : 'AM/PM'}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Light/Dark Mode */}
          <div>
            <div className="text-sm text-themed-muted mb-3">{t('settings.themeMode')}</div>
            <div className="flex gap-3">
              {(['dark', 'light'] as ThemeMode[]).map((mode) => (
                <button
                  key={mode}
                  onClick={() => setThemeSettings({ ...themeSettings, mode })}
                  className={`flex-1 h-[58px] rounded-xl border-2 transition-all ${
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
                  className={`h-[58px] rounded-xl ${color.class} transition-all flex items-center justify-center ${
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

          {/* Show Ante Toggle */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setThemeSettings({ ...themeSettings, showAnte: !themeSettings.showAnte })}
              className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors ${
                themeSettings.showAnte !== false ? 'bg-accent' : 'bg-themed-tertiary'
              }`}
            >
              <span
                className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${
                  themeSettings.showAnte !== false ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
            <div>
              <label className="text-sm text-themed-muted block">{t('settings.showAnte')}</label>
              <span className="text-xs text-themed-muted">{t('settings.showAnteDesc')}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Chip Manager */}
      <div className="card p-6">
        <h3 className="text-lg font-semibold text-themed-primary mb-4 flex items-center gap-2">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {t('settings.chipManager')}
        </h3>

        {/* Chip Presets */}
        <div className="mb-4">
          <div className="text-sm text-themed-muted mb-2">{t('settings.chipPresetSets')}</div>
          <div className="flex flex-wrap gap-2">
              {CHIP_SET_PRESETS.map((preset) => (
                <button
                  key={preset.name}
                  onClick={() => setChipInventory(preset.chips.map((c, i) => ({ ...c, id: `${i + 1}` })))}
                  className="px-3 py-2 rounded-lg text-center transition-colors bg-themed-tertiary hover:bg-themed-secondary text-themed-secondary"
                  title={t(`settings.chipSetPresets.${preset.key}Desc`)}
                >
                  <div className="font-semibold text-sm">{t(`settings.chipSetPresets.${preset.key}`)}</div>
                </button>
              ))}
              {customChipSets.map((set) => (
                <div key={set.id} className="relative group">
                  <button
                    onClick={() => setChipInventory(set.chips.map((c, i) => ({ ...c, id: `${i + 1}` })))}
                    className="px-3 py-2 rounded-lg text-center transition-colors bg-accent/20 hover:bg-accent/30 text-accent border border-accent/30"
                    title={set.chips.map(c => c.label).join(', ')}
                  >
                    <div className="font-semibold text-sm">{set.name}</div>
                  </button>
                  <button
                    onClick={() => deleteCustomChipSet(set.id)}
                    className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                    title={t('settings.deleteChipSet')}
                  >
                    ×
                  </button>
                </div>
              ))}
              <button
                onClick={saveCurrentChipSet}
                className="px-3 py-2 rounded-lg text-center transition-colors border-2 border-dashed border-themed hover:border-accent hover:text-accent text-themed-muted"
                title={t('settings.saveChipSet')}
              >
                <div className="font-semibold text-sm">+ {t('settings.saveSet')}</div>
              </button>
            </div>
        </div>

        <div className="grid grid-cols-2 gap-6">
          {/* Left Column: Chip Inventory Table */}
          <div>
            <div className="text-sm text-themed-muted mb-2">{t('settings.yourChips')}</div>
            <div className="overflow-hidden rounded-lg border border-themed">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-themed-tertiary">
                    <th className="text-left px-3 py-2 text-themed-muted font-medium">{t('settings.chipColor')}</th>
                    <th className="text-left px-3 py-2 text-themed-muted font-medium">{t('settings.chipLabel')}</th>
                    <th className="text-right px-3 py-2 text-themed-muted font-medium">{t('settings.chipValue')}</th>
                    <th className="text-right px-3 py-2 text-themed-muted font-medium">{t('settings.chipQuantity')}</th>
                    <th className="px-3 py-2 w-10"></th>
                  </tr>
                </thead>
                <tbody>
                  {chipInventory.sort((a, b) => a.value - b.value).map((chip) => (
                    <tr key={chip.id} className="border-t border-themed">
                      <td className="px-3 py-2">
                        <div className="flex items-center gap-2">
                          <input
                            type="color"
                            value={chip.color}
                            onChange={(e) => {
                              setChipInventory(chipInventory.map(c =>
                                c.id === chip.id ? { ...c, color: e.target.value, borderColor: e.target.value } : c
                              ))
                            }}
                            className="w-8 h-8 rounded cursor-pointer border-0 p-0"
                          />
                          <div
                            className="chip"
                            style={{ backgroundColor: chip.color, borderColor: chip.borderColor, color: chip.textColor }}
                          >
                            {chip.value >= 1000 ? `${chip.value / 1000}K` : chip.value}
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-2">
                        <input
                          type="text"
                          value={chip.label}
                          onChange={(e) => setChipInventory(chipInventory.map(c =>
                            c.id === chip.id ? { ...c, label: e.target.value } : c
                          ))}
                          className="input w-24 text-sm"
                        />
                      </td>
                      <td className="px-3 py-2 text-right">
                        <input
                          type="number"
                          value={chip.value}
                          onChange={(e) => setChipInventory(chipInventory.map(c =>
                            c.id === chip.id ? { ...c, value: parseInt(e.target.value) || 1 } : c
                          ))}
                          className="input w-20 text-sm text-right"
                          min="1"
                        />
                      </td>
                      <td className="px-3 py-2 text-right">
                        <input
                          type="number"
                          value={chip.quantity}
                          onChange={(e) => setChipInventory(chipInventory.map(c =>
                            c.id === chip.id ? { ...c, quantity: parseInt(e.target.value) || 0 } : c
                          ))}
                          className="input w-20 text-sm text-right"
                          min="0"
                        />
                      </td>
                      <td className="px-3 py-2 text-center">
                        <button
                          onClick={() => setChipInventory(chipInventory.filter(c => c.id !== chip.id))}
                          className="p-1 text-themed-muted hover:text-red-400 transition-colors"
                          title={t('settings.removeChip')}
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <button
              onClick={() => {
                const newId = `${Date.now()}`
                setChipInventory([...chipInventory, {
                  id: newId,
                  value: 50,
                  color: '#3b82f6',
                  borderColor: '#2563eb',
                  textColor: '#fff',
                  label: 'Blue',
                  quantity: 50,
                }])
              }}
              className="mt-2 btn btn-secondary text-sm"
            >
              <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              {t('settings.addChipDenomination')}
            </button>
          </div>

          {/* Right Column: Distribution & Color-Up */}
          <div className="space-y-4">
            {/* Per-Player Distribution */}
            {chipInventory.length > 0 && (
            <div>
              <div className="text-sm text-themed-muted mb-2 text-center">
                {t('settings.perPlayerDistribution', {
                  chips: tournament.starting_chips.toLocaleString(),
                  players: tournament.players.length || '?',
                })}
              </div>
              {(() => {
                const playerCount = Math.max(tournament.players.length, 1)
                const distribution = calculatePlayerDistribution(chipInventory, tournament.starting_chips)
                const totalNeeded = distribution.map(d => ({ ...d, totalNeeded: d.count * playerCount }))
                const hasShortage = totalNeeded.some(d => {
                  const available = chipInventory.find(c => c.value === d.value)
                  return available ? d.totalNeeded > available.quantity : true
                })

                return (
                  <div className="space-y-3">
                    <div className="flex flex-wrap gap-4 justify-center">
                      {distribution.map((d) => {
                        const available = chipInventory.find(c => c.value === d.value)
                        const needed = d.count * playerCount
                        const isShort = available ? needed > available.quantity : true
                        return (
                          <div key={d.value} className="flex items-center gap-2">
                            <div
                              className="chip"
                              style={{ backgroundColor: d.color, borderColor: d.borderColor, color: d.textColor }}
                            >
                              {d.value >= 1000 ? `${d.value / 1000}K` : d.value}
                            </div>
                            <div className="text-sm">
                              <span className="text-themed-secondary">× {d.count}</span>
                              {tournament.players.length > 0 && (
                                <span className={`block text-xs ${isShort ? 'text-red-400' : 'text-themed-muted'}`}>
                                  {needed}/{available?.quantity ?? 0} {t('settings.chipTotal')}
                                </span>
                              )}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                    {hasShortage && tournament.players.length > 0 && (
                      <div className="p-3 bg-red-500/10 rounded-lg border border-red-500/20">
                        <div className="flex items-center gap-2 text-red-400 text-sm font-medium">
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                          </svg>
                          {t('settings.chipShortageWarning')}
                        </div>
                      </div>
                    )}
                  </div>
                )
              })()}
            </div>
          )}

          {/* Color-Up Schedule */}
          {chipInventory.length > 0 && tournament.blind_structure.length > 0 && (
            <div>
              <div className="text-sm text-themed-muted mb-2 text-center">{t('settings.colorUpSchedule')}</div>
              <div className="text-xs text-themed-muted mb-3 text-center">{t('settings.colorUpScheduleDesc')}</div>
              <div className="space-y-2">
                {(() => {
                  const schedule = calculateColorUpSchedule(chipInventory, tournament.blind_structure)
                  if (schedule.length === 0) {
                    return (
                      <p className="text-themed-muted text-sm text-center py-2">{t('settings.noColorUps')}</p>
                    )
                  }
                  return schedule.map((entry) => (
                    <div key={entry.chipValue} className={`flex items-center gap-3 p-3 rounded-lg ${
                      entry.levelIndex <= tournament.current_level
                        ? 'bg-accent/10 border border-accent/20'
                        : 'bg-themed-tertiary'
                    }`}>
                      <div
                        className="chip"
                        style={{ backgroundColor: entry.color, borderColor: entry.borderColor, color: entry.textColor }}
                      >
                        {entry.chipValue >= 1000 ? `${entry.chipValue / 1000}K` : entry.chipValue}
                      </div>
                      <div className="flex-1">
                        <span className="text-themed-primary text-sm font-medium">
                          {t('settings.colorUpAt', { level: entry.levelIndex + 1 })}
                        </span>
                        <span className="text-themed-muted text-xs ml-2">
                          ({t('nav.blinds')}: {entry.smallBlind}/{entry.bigBlind})
                        </span>
                      </div>
                      {entry.levelIndex <= tournament.current_level && (
                        <span className="text-accent text-xs font-medium">{t('settings.colorUpDone')}</span>
                      )}
                    </div>
                  ))
                })()}
              </div>
            </div>
          )}
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

            <div className="flex items-center justify-between pt-4 border-t border-themed">
              <div>
                <div className="text-themed-primary font-medium">{t('settings.voiceAnnouncement')}</div>
                <div className="text-sm text-themed-muted">{t('settings.voiceAnnouncementDesc')}</div>
              </div>
              <button
                onClick={() => setSoundSettings({ ...soundSettings, voiceEnabled: !soundSettings.voiceEnabled })}
                className={`relative w-12 h-6 rounded-full transition-colors ${
                  soundSettings.voiceEnabled ? 'bg-accent' : 'bg-themed-secondary'
                }`}
              >
                <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${
                  soundSettings.voiceEnabled ? 'translate-x-7' : 'translate-x-1'
                }`} />
              </button>
            </div>

            {soundSettings.voiceEnabled && (
              <div className="pl-4 border-l-2 border-themed">
                <button onClick={playTestVoice} className="btn btn-secondary text-sm">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                  </svg>
                  {t('settings.testVoice')}
                </button>
              </div>
            )}
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

      {/* Help & Danger Zone */}
      <div className="grid grid-cols-2 gap-6">
        {/* Help & Support */}
        {onShowOnboarding && (
          <div className="card p-6">
            <h3 className="text-lg font-semibold mb-4 text-themed-primary flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {t('settings.helpSupport')}
            </h3>
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium text-themed-primary">{t('settings.showTutorial')}</div>
                <div className="text-sm text-themed-muted">{t('settings.showTutorialDesc')}</div>
              </div>
              <button onClick={onShowOnboarding} className="btn btn-secondary">
                <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {t('settings.startTutorial')}
              </button>
            </div>
          </div>
        )}

        {/* Danger Zone */}
        <div className={`card p-6 border-red-500/20 ${!onShowOnboarding ? 'col-span-2' : ''}`}>
          <h3 className="text-lg font-semibold text-red-400 mb-4 flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            {t('settings.resetTournament')}
          </h3>
          <div className="flex items-center justify-between">
            <div className="text-sm text-themed-muted">{t('settings.resetTournamentDesc')}</div>
            <button onClick={resetTournament} className="btn btn-danger">
              {t('settings.resetTournament')}
            </button>
          </div>
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

const CHIP_SET_PRESETS = [
  {
    name: 'Standard',
    key: 'standard',
    chips: [
      { value: 25, color: '#22c55e', borderColor: '#16a34a', textColor: '#fff', label: 'Green', quantity: 100 },
      { value: 100, color: '#1e1e1e', borderColor: '#404040', textColor: '#fff', label: 'Black', quantity: 100 },
      { value: 500, color: '#7c3aed', borderColor: '#6d28d9', textColor: '#fff', label: 'Purple', quantity: 50 },
      { value: 1000, color: '#fbbf24', borderColor: '#f59e0b', textColor: '#000', label: 'Yellow', quantity: 50 },
      { value: 5000, color: '#ef4444', borderColor: '#dc2626', textColor: '#fff', label: 'Red', quantity: 20 },
    ],
  },
  {
    name: 'Small Set',
    key: 'smallSet',
    chips: [
      { value: 25, color: '#ffffff', borderColor: '#d1d5db', textColor: '#000', label: 'White', quantity: 50 },
      { value: 100, color: '#ef4444', borderColor: '#dc2626', textColor: '#fff', label: 'Red', quantity: 50 },
      { value: 500, color: '#3b82f6', borderColor: '#2563eb', textColor: '#fff', label: 'Blue', quantity: 25 },
      { value: 1000, color: '#22c55e', borderColor: '#16a34a', textColor: '#fff', label: 'Green', quantity: 25 },
    ],
  },
  {
    name: 'Large Set',
    key: 'largeSet',
    chips: [
      { value: 25, color: '#22c55e', borderColor: '#16a34a', textColor: '#fff', label: 'Green', quantity: 200 },
      { value: 100, color: '#1e1e1e', borderColor: '#404040', textColor: '#fff', label: 'Black', quantity: 200 },
      { value: 500, color: '#7c3aed', borderColor: '#6d28d9', textColor: '#fff', label: 'Purple', quantity: 100 },
      { value: 1000, color: '#fbbf24', borderColor: '#f59e0b', textColor: '#000', label: 'Yellow', quantity: 100 },
      { value: 5000, color: '#ef4444', borderColor: '#dc2626', textColor: '#fff', label: 'Red', quantity: 50 },
      { value: 10000, color: '#ec4899', borderColor: '#db2777', textColor: '#fff', label: 'Pink', quantity: 25 },
    ],
  },
]

function calculatePlayerDistribution(
  chips: PhysicalChip[],
  startingChips: number
): { value: number; count: number; color: string; borderColor: string; textColor: string }[] {
  const available = chips.filter(c => c.quantity > 0 && c.value <= startingChips)
  if (available.length === 0) return []

  const sorted = [...available].sort((a, b) => a.value - b.value) // ascending
  const n = sorted.length

  if (n === 1) {
    return [{
      value: sorted[0].value,
      count: Math.ceil(startingChips / sorted[0].value),
      color: sorted[0].color,
      borderColor: sorted[0].borderColor,
      textColor: sorted[0].textColor,
    }]
  }

  // Tournament-style distribution: start with generous small-chip allocations
  // (8 of the two smallest denominations, 2 of each larger), then adjust to hit
  // the target stack. This ensures enough small chips for blinds and change-making.
  const counts = sorted.map((_, i) => (i < 2 ? 8 : 2))
  let total = sorted.reduce((sum, chip, i) => sum + chip.value * counts[i], 0)

  // If over target, reduce from largest chips first (keep smallest 2 at min 4)
  for (let i = n - 1; i >= 0 && total > startingChips; i--) {
    const minCount = i < 2 ? 4 : 0
    while (counts[i] > minCount && total > startingChips) {
      counts[i]--
      total -= sorted[i].value
    }
  }

  // If still over (small chips alone exceed stack), reduce more aggressively
  for (let i = n - 1; i >= 0 && total > startingChips; i--) {
    while (counts[i] > 0 && total > startingChips) {
      counts[i]--
      total -= sorted[i].value
    }
  }

  // Fill remaining value from largest denomination that fits
  for (let i = n - 1; i >= 0 && total < startingChips; i--) {
    while (total + sorted[i].value <= startingChips) {
      counts[i]++
      total += sorted[i].value
    }
  }

  // If there's still a gap, round up with smallest chip
  if (total < startingChips) {
    counts[0]++
  }

  return sorted
    .map((chip, i) => ({
      value: chip.value,
      count: counts[i],
      color: chip.color,
      borderColor: chip.borderColor,
      textColor: chip.textColor,
    }))
    .filter(d => d.count > 0)
}
