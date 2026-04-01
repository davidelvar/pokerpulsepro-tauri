import { useState, useEffect, useRef, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import type { Tournament } from '../types'
import { calculatePrizePool, formatCurrency, getEliminatedPlayers, generateId } from '../utils'
import { open, save } from '@tauri-apps/plugin-dialog'
import { writeTextFile, readTextFile } from '@tauri-apps/plugin-fs'

interface PrizesProps {
  tournament: Tournament
}

interface SavedPrizeTemplate {
  id: string
  name: string
  paidPlaces: number
  percentages: number[]
  createdAt: string
}

// Check if running in Tauri
const isTauri = typeof window !== 'undefined' && '__TAURI__' in window
const STORAGE_KEY_PRIZE_TEMPLATES = 'pokerpulse_prize_templates'
const STORAGE_KEY_PAYOUT_CONFIG = 'pokerpulse_payout_config'

const PAYOUT_TEMPLATES: Record<number, number[]> = {
  2: [65, 35],
  3: [50, 30, 20],
  4: [45, 27, 18, 10],
  5: [40, 25, 15, 12, 8],
  6: [35, 22, 15, 12, 9, 7],
  7: [32, 20, 14, 11, 9, 8, 6],
  8: [30, 18, 13, 10, 9, 8, 7, 5],
}

function generateDefaultDistribution(places: number): number[] {
  if (places <= 0) return [100]
  if (PAYOUT_TEMPLATES[places]) return [...PAYOUT_TEMPLATES[places]]
  // Generate a top-heavy distribution for any number of places
  const weights = Array.from({ length: places }, (_, i) => Math.pow(places - i, 1.5))
  const totalWeight = weights.reduce((a, b) => a + b, 0)
  const raw = weights.map(w => (w / totalWeight) * 100)
  // Round to integers, adjust last place to ensure sum = 100
  const rounded = raw.map(v => Math.floor(v))
  // Ensure minimum 1% per place
  for (let i = 0; i < rounded.length; i++) {
    if (rounded[i] < 1) rounded[i] = 1
  }
  const diff = 100 - rounded.reduce((a, b) => a + b, 0)
  rounded[0] += diff
  return rounded
}

export function Prizes({ tournament }: PrizesProps) {
  const { t } = useTranslation()
  const [paidPlaces, setPaidPlaces] = useState(3)
  const [percentages, setPercentages] = useState<number[]>([50, 30, 20])
  const [savedTemplates, setSavedTemplates] = useState<SavedPrizeTemplate[]>([])
  const [showSaveModal, setShowSaveModal] = useState(false)
  const [newTemplateName, setNewTemplateName] = useState('')
  const [showCustomTemplates, setShowCustomTemplates] = useState(false)
  const [activeTemplate, setActiveTemplate] = useState<string | null>(null)

  const prizePool = calculatePrizePool(tournament)
  const eliminatedPlayers = getEliminatedPlayers(tournament.players)

  // Load saved templates and payout config from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_PRIZE_TEMPLATES)
      if (saved) {
        setSavedTemplates(JSON.parse(saved))
      }
    } catch (e) {
      console.error('Failed to load saved prize templates:', e)
    }
    try {
      const config = localStorage.getItem(STORAGE_KEY_PAYOUT_CONFIG)
      if (config) {
        const { paidPlaces: pp, percentages: pcts } = JSON.parse(config)
        if (pp && pcts) {
          setPaidPlaces(pp)
          setPercentages(pcts)
        }
      }
    } catch (e) {
      console.error('Failed to load payout config:', e)
    }
  }, [])

  // Persist payout config whenever it changes
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_PAYOUT_CONFIG, JSON.stringify({ paidPlaces, percentages }))
    } catch (e) {
      console.error('Failed to save payout config:', e)
    }
  }, [paidPlaces, percentages])

  const initialLoadRef = useRef(true)
  useEffect(() => {
    if (initialLoadRef.current) {
      initialLoadRef.current = false
      return
    }
    const template = generateDefaultDistribution(paidPlaces)
    setPercentages(template)
    setActiveTemplate(null) // Clear active template when changing places
  }, [paidPlaces])

  const updatePercentage = (index: number, value: number) => {
    const newPercentages = [...percentages]
    newPercentages[index] = value
    setPercentages(newPercentages)
    setActiveTemplate(null) // Clear active template when manually editing
  }

  const totalPercentage = percentages.reduce((sum, p) => sum + p, 0)
  const isValid = Math.abs(totalPercentage - 100) < 0.01

  const payouts = percentages.map((pct, i) => ({
    place: i + 1,
    percentage: pct,
    amount: Math.floor(prizePool * pct / 100),
  }))

  const basePlaceLabels = ['🥇', '🥈', '🥉']
  const placeLabels = Array.from({ length: paidPlaces }, (_, i) => 
    i < basePlaceLabels.length ? basePlaceLabels[i] : `${i + 1}th`
  )
  const basePlaceColors = [
    'rgb(234, 179, 8)',    // gold
    'rgb(148, 163, 184)',  // silver
    'rgb(194, 120, 62)',   // bronze
    'rgb(96, 165, 250)',   // blue
    'rgb(168, 85, 247)',   // purple
    'rgb(52, 211, 153)',   // emerald
    'rgb(251, 146, 60)',   // orange
    'rgb(244, 114, 182)',  // pink
  ]
  const placeColors = Array.from({ length: paidPlaces }, (_, i) => {
    if (i < basePlaceColors.length) return basePlaceColors[i]
    // Generate distinct hue-shifted colors for places beyond 8
    const hue = (i * 137.508) % 360 // golden angle for good distribution
    return `hsl(${hue}, 65%, 55%)`
  })
  const placeColorsBg = placeColors.map(c => {
    if (c.startsWith('rgb(')) return c.replace('rgb(', 'rgba(').replace(')', ', 0.15)')
    // For hsl colors, add alpha
    return c.replace('hsl(', 'hsla(').replace(')', ', 0.15)')
  })

  const stackedBarRef = useRef<HTMLDivElement>(null)
  const dragIndexRef = useRef<number | null>(null)

  // Update percentage with auto-balancing: adjusts the next place to keep total at 100%
  const updatePercentageBalanced = useCallback((index: number, newValue: number) => {
    const clamped = Math.max(1, Math.min(99, Math.round(newValue)))
    const newPercentages = [...percentages]
    const oldValue = newPercentages[index]
    const diff = clamped - oldValue
    
    if (diff === 0) return
    
    newPercentages[index] = clamped
    
    // Distribute the difference across other places proportionally
    const otherIndices = newPercentages
      .map((_, i) => i)
      .filter(i => i !== index)
    
    const otherTotal = otherIndices.reduce((sum, i) => sum + newPercentages[i], 0)
    
    if (otherTotal > 0) {
      let remaining = -diff
      for (let i = 0; i < otherIndices.length; i++) {
        const oi = otherIndices[i]
        if (i === otherIndices.length - 1) {
          // Last one gets the remainder
          newPercentages[oi] = Math.max(1, newPercentages[oi] + remaining)
        } else {
          const share = Math.round(remaining * (newPercentages[oi] / otherTotal))
          const adjusted = Math.max(1, newPercentages[oi] + share)
          remaining -= (adjusted - newPercentages[oi])
          newPercentages[oi] = adjusted
        }
      }
    }
    
    // Ensure total is exactly 100
    const total = newPercentages.reduce((s, p) => s + p, 0)
    if (total !== 100) {
      // Find the largest other place to absorb the rounding error
      const largestOther = otherIndices.reduce((max, i) => 
        newPercentages[i] > newPercentages[max] ? i : max, otherIndices[0])
      newPercentages[largestOther] += (100 - total)
    }
    
    // Validate all are >= 1
    if (newPercentages.every(p => p >= 1)) {
      setPercentages(newPercentages)
      setActiveTemplate(null)
    }
  }, [percentages])

  // Stacked bar drag handlers
  const handleDividerMouseDown = useCallback((dividerIndex: number) => (e: React.MouseEvent) => {
    e.preventDefault()
    dragIndexRef.current = dividerIndex
    
    const handleMouseMove = (e: MouseEvent) => {
      if (dragIndexRef.current === null || !stackedBarRef.current) return
      const rect = stackedBarRef.current.getBoundingClientRect()
      const x = e.clientX - rect.left
      const totalWidth = rect.width
      const overallPercent = (x / totalWidth) * 100
      
      const idx = dragIndexRef.current
      // Sum of all places before this divider
      const sumBefore = percentages.slice(0, idx).reduce((s, p) => s + p, 0)
      const newValue = Math.round(overallPercent - sumBefore)
      
      if (newValue >= 1 && newValue <= 98) {
        updatePercentageBalanced(idx, newValue)
      }
    }
    
    const handleMouseUp = () => {
      dragIndexRef.current = null
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }
    
    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
  }, [percentages, updatePercentageBalanced])

  // Save current prize structure as a custom template
  const saveAsTemplate = () => {
    if (!newTemplateName.trim()) return
    
    const template: SavedPrizeTemplate = {
      id: generateId(),
      name: newTemplateName.trim(),
      paidPlaces,
      percentages: [...percentages],
      createdAt: new Date().toISOString()
    }
    
    const updated = [...savedTemplates, template]
    setSavedTemplates(updated)
    localStorage.setItem(STORAGE_KEY_PRIZE_TEMPLATES, JSON.stringify(updated))
    setNewTemplateName('')
    setShowSaveModal(false)
    setActiveTemplate(template.name)
  }

  // Load a saved custom template
  const loadCustomTemplate = (template: SavedPrizeTemplate) => {
    setPaidPlaces(template.paidPlaces)
    setPercentages([...template.percentages])
    setActiveTemplate(template.name)
    setShowCustomTemplates(false)
  }

  // Delete a saved template
  const deleteTemplate = (id: string) => {
    const updated = savedTemplates.filter(t => t.id !== id)
    setSavedTemplates(updated)
    localStorage.setItem(STORAGE_KEY_PRIZE_TEMPLATES, JSON.stringify(updated))
  }

  // Export a template to JSON file
  const exportTemplate = async (template?: SavedPrizeTemplate) => {
    const dataToExport = template 
      ? { name: template.name, paidPlaces: template.paidPlaces, percentages: template.percentages }
      : { 
          name: tournament.name + ' Prizes',
          paidPlaces,
          percentages
        }
    
    const jsonString = JSON.stringify(dataToExport, null, 2)
    const fileName = `${dataToExport.name.replace(/[^a-z0-9]/gi, '_')}_prizes.json`
    
    if (isTauri) {
      try {
        const filePath = await save({
          filters: [{ name: 'JSON', extensions: ['json'] }],
          defaultPath: fileName
        })
        if (filePath) {
          await writeTextFile(filePath, jsonString)
        }
      } catch (err) {
        console.error('Failed to export:', err)
      }
    } else {
      const blob = new Blob([jsonString], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = fileName
      a.click()
      URL.revokeObjectURL(url)
    }
  }

  // Import a template from JSON file
  const importTemplate = async () => {
    if (isTauri) {
      try {
        const filePath = await open({
          filters: [{ name: 'JSON', extensions: ['json'] }],
          multiple: false
        })
        if (filePath && typeof filePath === 'string') {
          const content = await readTextFile(filePath)
          const imported = JSON.parse(content)
          applyImportedTemplate(imported)
        }
      } catch (err) {
        console.error('Failed to import:', err)
      }
    } else {
      const input = document.createElement('input')
      input.type = 'file'
      input.accept = '.json'
      input.onchange = async (e) => {
        const file = (e.target as HTMLInputElement).files?.[0]
        if (file) {
          const text = await file.text()
          try {
            const imported = JSON.parse(text)
            applyImportedTemplate(imported)
          } catch (err) {
            console.error('Failed to parse file:', err)
          }
        }
      }
      input.click()
    }
  }

  const applyImportedTemplate = (imported: { name?: string, paidPlaces: number, percentages: number[] }) => {
    if (!imported.percentages || !Array.isArray(imported.percentages)) {
      console.error('Invalid template format')
      return
    }
    
    setPaidPlaces(imported.paidPlaces || imported.percentages.length)
    setPercentages([...imported.percentages])
    setActiveTemplate(imported.name || t('prizes.importedTemplate'))
  }

  // Clear active template and reset to default
  const clearActiveTemplate = () => {
    setActiveTemplate(null)
    const template = generateDefaultDistribution(paidPlaces)
    setPercentages(template)
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Prize Pool Summary */}
      <div className="card p-8 mb-6 text-center">
        <div className="text-themed-muted text-sm mb-2">{t('prizes.totalPrizePool')}</div>
        <div className="text-5xl font-bold text-accent mb-4">
          {formatCurrency(prizePool, tournament.currency_symbol)}
        </div>
        <div className="flex justify-center gap-8 text-sm">
          <div>
            <span className="text-themed-muted">{t('players.buyins')}: </span>
            <span className="text-themed-primary">
              {tournament.players.reduce((s, p) => s + p.buyins, 0)} × {formatCurrency(tournament.buyin_amount, tournament.currency_symbol)}
            </span>
          </div>
          <div>
            <span className="text-themed-muted">{t('players.rebuys')}: </span>
            <span className="text-themed-primary">
              {tournament.players.reduce((s, p) => s + p.rebuys, 0)} × {formatCurrency(tournament.rebuy_amount, tournament.currency_symbol)}
            </span>
          </div>
          <div>
            <span className="text-themed-muted">{t('players.addons')}: </span>
            <span className="text-themed-primary">
              {tournament.players.reduce((s, p) => s + p.addons, 0)} × {formatCurrency(tournament.addon_amount, tournament.currency_symbol)}
            </span>
          </div>
        </div>
      </div>

      {/* Template Actions Bar */}
      <div className="card p-4 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Active Template Indicator */}
            {activeTemplate && (
              <div className="flex items-center gap-2 px-3 py-1.5 bg-accent/10 border border-accent/30 rounded-lg">
                <svg className="w-4 h-4 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-sm text-accent font-medium">{activeTemplate}</span>
                <button 
                  onClick={clearActiveTemplate}
                  className="text-accent/60 hover:text-accent ml-1"
                  title={t('prizes.clearTemplate')}
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            {/* My Templates Button */}
            <button
              onClick={() => setShowCustomTemplates(!showCustomTemplates)}
              className={`btn btn-ghost flex items-center gap-2 ${showCustomTemplates ? 'bg-themed-tertiary' : ''}`}
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
              </svg>
              {t('prizes.myTemplates')}
              {savedTemplates.length > 0 && (
                <span className="ml-1 px-1.5 py-0.5 text-xs bg-accent/20 text-accent rounded">
                  {savedTemplates.length}
                </span>
              )}
            </button>

            {/* Save Template Button */}
            <button
              onClick={() => setShowSaveModal(true)}
              className="btn btn-ghost flex items-center gap-2"
              title={t('prizes.saveTemplate')}
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
              </svg>
              {t('prizes.save')}
            </button>

            {/* Export Button */}
            <button
              onClick={() => exportTemplate()}
              className="btn btn-ghost flex items-center gap-2"
              title={t('prizes.exportTemplate')}
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
              {t('prizes.export')}
            </button>

            {/* Import Button */}
            <button
              onClick={importTemplate}
              className="btn btn-ghost flex items-center gap-2"
              title={t('prizes.importTemplate')}
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              {t('prizes.import')}
            </button>
          </div>
        </div>

        {/* Custom Templates Dropdown */}
        {showCustomTemplates && (
          <div className="mt-4 pt-4 border-t border-themed">
            {savedTemplates.length === 0 ? (
              <div className="text-center py-4 text-themed-muted">
                <p className="text-sm">{t('prizes.noCustomTemplates')}</p>
                <p className="text-xs mt-1">{t('prizes.saveCurrentToCreate')}</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                {savedTemplates.map((template) => (
                  <div
                    key={template.id}
                    className="flex items-center justify-between p-3 bg-themed-tertiary/50 rounded-lg group"
                  >
                    <button
                      onClick={() => loadCustomTemplate(template)}
                      className="flex-1 text-left"
                    >
                      <div className="font-medium text-themed-primary">{template.name}</div>
                      <div className="text-xs text-themed-muted">
                        {template.paidPlaces} {t('prizes.places')} • {template.percentages.slice(0, 3).join('/')}{template.paidPlaces > 3 ? '...' : ''}%
                      </div>
                    </button>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => exportTemplate(template)}
                        className="p-1.5 text-themed-muted hover:text-themed-primary"
                        title={t('prizes.export')}
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                        </svg>
                      </button>
                      <button
                        onClick={() => deleteTemplate(template.id)}
                        className="p-1.5 text-themed-muted hover:text-red-400"
                        title={t('prizes.delete')}
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Save Template Modal */}
      {showSaveModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="card p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold text-themed-primary mb-4">{t('prizes.saveAsTemplate')}</h3>
            <input
              type="text"
              value={newTemplateName}
              onChange={(e) => setNewTemplateName(e.target.value)}
              placeholder={t('prizes.templateName')}
              className="input w-full mb-4"
              autoFocus
              onKeyDown={(e) => e.key === 'Enter' && saveAsTemplate()}
            />
            <div className="text-sm text-themed-muted mb-4">
              {paidPlaces} {t('prizes.places')}: {percentages.join('/')}%
            </div>
            <div className="flex justify-end gap-3">
              <button onClick={() => setShowSaveModal(false)} className="btn btn-ghost">
                {t('common.cancel')}
              </button>
              <button 
                onClick={saveAsTemplate} 
                className="btn btn-primary"
                disabled={!newTemplateName.trim()}
              >
                {t('prizes.save')}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-6">
        {/* Payout Structure */}
        <div className="card p-6">
          <h3 className="text-lg font-semibold text-themed-primary mb-4">{t('prizes.payoutStructure')}</h3>
          
          {/* Places Selector */}
          <div className="mb-6">
            <label className="text-sm text-themed-muted mb-2 block">{t('prizes.paidPlaces')}</label>
            <div className="flex gap-2 items-center">
              {[2, 3, 4, 5, 6, 7, 8].map((n) => (
                <button
                  key={n}
                  onClick={() => setPaidPlaces(n)}
                  className={`w-10 h-10 rounded-lg font-medium transition-colors ${
                    paidPlaces === n
                      ? 'bg-accent text-white'
                      : 'bg-themed-tertiary text-themed-secondary hover:opacity-80'
                  }`}
                >
                  {n}
                </button>
              ))}
              <div className="flex items-center gap-1 ml-2">
                <input
                  type="number"
                  min={2}
                  max={50}
                  value={paidPlaces}
                  onChange={(e) => {
                    const v = parseInt(e.target.value)
                    if (v >= 2 && v <= 50) setPaidPlaces(v)
                  }}
                  aria-label="custom-places"
                  className="w-16 h-10 rounded-lg bg-themed-tertiary text-themed-primary text-center font-medium border border-themed-border focus:border-accent focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                />
              </div>
            </div>
          </div>

          {/* Interactive Stacked Bar */}
          <div className="mb-6">
            <label className="text-sm text-themed-muted mb-2 block">{t('prizes.dragToAdjust')}</label>
            <div 
              ref={stackedBarRef}
              className="relative h-12 rounded-xl overflow-hidden flex select-none"
              style={{ cursor: 'default' }}
            >
              {payouts.map((payout, index) => (
                <div
                  key={index}
                  className="relative h-full flex items-center justify-center group"
                  style={{
                    width: `${percentages[index]}%`,
                    backgroundColor: placeColors[index],
                    transition: dragIndexRef.current !== null ? 'none' : 'width 0.2s ease',
                  }}
                >
                  {/* Label inside segment */}
                  {percentages[index] >= 8 && (
                    <span className="text-xs font-bold text-white drop-shadow-md pointer-events-none">
                      {percentages[index]}%
                    </span>
                  )}
                  
                  {/* Draggable divider between segments */}
                  {index < payouts.length - 1 && (
                    <div
                      onMouseDown={handleDividerMouseDown(index)}
                      className="absolute right-0 top-0 bottom-0 w-3 cursor-col-resize z-10 flex items-center justify-center hover:bg-white/30 active:bg-white/40"
                      style={{ transform: 'translateX(50%)' }}
                    >
                      <div className="w-0.5 h-6 bg-white/60 rounded-full" />
                    </div>
                  )}
                </div>
              ))}
            </div>
            {/* Stacked bar legend */}
            <div className="flex flex-wrap gap-3 mt-2">
              {payouts.map((_, index) => (
                <div key={index} className="flex items-center gap-1.5 text-xs text-themed-muted">
                  <div 
                    className="w-2.5 h-2.5 rounded-sm" 
                    style={{ backgroundColor: placeColors[index] }} 
                  />
                  {placeLabels[index]}
                </div>
              ))}
            </div>
          </div>

          {/* Per-place sliders + inputs */}
          <div className="space-y-4">
            {payouts.map((payout, index) => {
              const sliderMin = 1
              const sliderMax = Math.min(99, percentages[index] + (100 - totalPercentage) + percentages[index])
              const fillPercent = ((percentages[index] - sliderMin) / (sliderMax - sliderMin)) * 100
              return (
              <div key={index}>
                <div className="flex items-center gap-3 mb-1">
                  <span className="w-8 text-lg">{placeLabels[index]}</span>
                  <div className="flex-1">
                    <input
                      type="range"
                      min={sliderMin}
                      max={sliderMax}
                      value={percentages[index]}
                      onChange={(e) => updatePercentageBalanced(index, parseInt(e.target.value))}
                      className="w-full h-2 rounded-full appearance-none cursor-pointer"
                      style={{
                        background: `linear-gradient(to right, ${placeColors[index]} 0%, ${placeColors[index]} ${fillPercent}%, var(--color-themed-tertiary, #374151) ${fillPercent}%, var(--color-themed-tertiary, #374151) 100%)`,
                        accentColor: placeColors[index],
                        color: placeColors[index],
                      }}
                    />
                  </div>
                  <div className="flex items-center bg-themed-secondary rounded-lg border border-themed overflow-hidden">
                    <input
                      type="number"
                      value={percentages[index]}
                      onChange={(e) => updatePercentageBalanced(index, parseInt(e.target.value) || 1)}
                      className="w-12 text-center text-sm py-1.5 bg-transparent text-themed border-none outline-none focus:ring-0 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                      min="1"
                      max="99"
                      step="1"
                    />
                    <span className="text-themed-muted text-sm pr-2 select-none">%</span>
                    <div className="flex flex-col border-l border-themed bg-themed-tertiary">
                      <button
                        type="button"
                        onClick={() => updatePercentageBalanced(index, Math.min(99, percentages[index] + 1))}
                        className="px-2 py-0.5 hover:bg-themed-hover text-themed-muted hover:text-themed transition-colors"
                        tabIndex={-1}
                      >
                        <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 10 6" stroke="currentColor" strokeWidth="2">
                          <path d="M1 5l4-4 4 4" />
                        </svg>
                      </button>
                      <button
                        type="button"
                        onClick={() => updatePercentageBalanced(index, Math.max(1, percentages[index] - 1))}
                        className="px-2 py-0.5 hover:bg-themed-hover text-themed-muted hover:text-themed transition-colors border-t border-themed"
                        tabIndex={-1}
                      >
                        <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 10 6" stroke="currentColor" strokeWidth="2">
                          <path d="M1 1l4 4 4-4" />
                        </svg>
                      </button>
                    </div>
                  </div>
                  <span 
                    className="w-24 text-right font-semibold text-sm"
                    style={{ color: placeColors[index] }}
                  >
                    {formatCurrency(payout.amount, tournament.currency_symbol)}
                  </span>
                </div>
              </div>
            )})}
          </div>

          {/* Validation */}
          <div className={`mt-4 pt-3 border-t border-themed flex items-center justify-between`}>
            <span className={`text-sm font-medium ${isValid ? 'text-accent' : 'text-red-400'}`}>
              {t('prizes.total')}: {totalPercentage.toFixed(0)}%
              {!isValid && ` (${t('prizes.mustEqual100')})`}
            </span>
            {isValid && (
              <span className="text-xs text-accent flex items-center gap-1">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                {t('prizes.valid')}
              </span>
            )}
          </div>
        </div>

        {/* Results / Standings */}
        <div className="card p-6">
          <h3 className="text-lg font-semibold text-themed-primary mb-4">{t('prizes.finalStandings')}</h3>
          
          {eliminatedPlayers.length > 0 ? (
            <div className="space-y-2">
              {eliminatedPlayers.slice(0, 8).map((player) => {
                const payout = payouts.find(p => p.place === player.placement)
                return (
                  <div
                    key={player.id}
                    className={`flex items-center justify-between p-3 rounded-lg ${
                      payout ? 'bg-accent/10' : 'bg-themed-tertiary/50'
                    }`}
                    style={payout ? { border: '1px solid rgba(var(--accent-rgb), 0.25)' } : undefined}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-lg w-8">
                        {player.placement && player.placement <= 3 
                          ? placeLabels[player.placement - 1]
                          : `#${player.placement}`
                        }
                      </span>
                      <span className="font-medium text-themed-primary">{player.name}</span>
                    </div>
                    {payout && (
                      <span className="font-semibold text-accent">
                        {formatCurrency(payout.amount, tournament.currency_symbol)}
                      </span>
                    )}
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="text-center py-8 text-themed-muted">
              <div className="text-4xl mb-3">🏆</div>
              <p>{t('prizes.noEliminations')}</p>
              <p className="text-sm mt-1">{t('prizes.standingsWillAppear')}</p>
            </div>
          )}
        </div>
      </div>

      {/* Payout Summary Cards */}
      <div className="grid grid-cols-3 gap-4 mt-6">
        {payouts.slice(0, 3).map((payout, index) => (
          <div
            key={index}
            className={`card p-6 text-center ${
              index === 0 
                ? 'bg-gradient-to-br from-amber-500/10 to-amber-600/5 border-amber-500/30' 
                : index === 1
                ? 'bg-gradient-to-br from-zinc-400/10 to-zinc-500/5 border-zinc-400/30'
                : 'bg-gradient-to-br from-orange-600/10 to-orange-700/5 border-orange-600/30'
            }`}
          >
            <div className="text-4xl mb-2">{placeLabels[index]}</div>
            <div className="text-2xl font-bold text-themed-primary mb-1">
              {formatCurrency(payout.amount, tournament.currency_symbol)}
            </div>
            <div className="text-sm text-themed-muted">{payout.percentage}% {t('prizes.ofPool')}</div>
          </div>
        ))}
      </div>
    </div>
  )
}
