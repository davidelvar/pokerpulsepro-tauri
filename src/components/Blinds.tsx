import { useState, useRef, useEffect, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import type { Tournament, BlindLevel } from '../types'
import { generateId } from '../utils'
import { open, save } from '@tauri-apps/plugin-dialog'
import { writeTextFile, readTextFile } from '@tauri-apps/plugin-fs'

interface BlindsProps {
  tournament: Tournament
  setTournament: (t: Tournament) => void
}

interface SavedTemplate {
  id: string
  name: string
  levels: Omit<BlindLevel, 'id'>[]
  createdAt: string
}

// Check if running in Tauri
const isTauri = typeof window !== 'undefined' && '__TAURI__' in window
const STORAGE_KEY_TEMPLATES = 'pokerpulse_blind_templates'

export function Blinds({ tournament, setTournament }: BlindsProps) {
  const { t } = useTranslation()
  const [editingId, setEditingId] = useState<string | null>(null)
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null)
  const [dropTargetIndex, setDropTargetIndex] = useState<number | null>(null)
  const [justMovedId, setJustMovedId] = useState<string | null>(null)
  const [savedTemplates, setSavedTemplates] = useState<SavedTemplate[]>([])
  const [showSaveModal, setShowSaveModal] = useState(false)
  const [newTemplateName, setNewTemplateName] = useState('')
  const [showCustomTemplates, setShowCustomTemplates] = useState(false)
  const [activeTemplate, setActiveTemplate] = useState<string | null>(null)
  const [showDurationGenerator, setShowDurationGenerator] = useState(false)
  const [targetHours, setTargetHours] = useState<number>(3)
  const [levelStyle, setLevelStyle] = useState<'turbo' | 'regular' | 'deep'>('regular')
  const tableRef = useRef<HTMLTableSectionElement>(null)
  const isDragging = useRef(false)

  // Load saved templates from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_TEMPLATES)
      if (saved) {
        setSavedTemplates(JSON.parse(saved))
      }
    } catch (e) {
      console.error('Failed to load saved templates:', e)
    }
  }, [])

  // Mouse-based drag and drop (more reliable than HTML5 drag in WebView)
  const handleMouseDown = useCallback((e: React.MouseEvent, index: number) => {
    // Only start drag on the grip handle
    const target = e.target as HTMLElement
    if (!target.classList.contains('drag-handle')) return
    
    e.preventDefault()
    isDragging.current = true
    setDraggedIndex(index)
  }, [])

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging.current || draggedIndex === null || !tableRef.current) return

    const rows = tableRef.current.querySelectorAll('tr')
    let newDropIndex: number | null = null

    rows.forEach((row, index) => {
      const rect = row.getBoundingClientRect()
      const midY = rect.top + rect.height / 2
      
      if (e.clientY >= rect.top && e.clientY < midY && index !== draggedIndex) {
        newDropIndex = index
      } else if (e.clientY >= midY && e.clientY <= rect.bottom && index !== draggedIndex) {
        newDropIndex = index + 1
      }
    })

    if (newDropIndex !== null && newDropIndex !== draggedIndex && newDropIndex !== draggedIndex + 1) {
      setDropTargetIndex(newDropIndex)
    } else {
      setDropTargetIndex(null)
    }
  }, [draggedIndex])

  const handleMouseUp = useCallback(() => {
    if (!isDragging.current) return
    
    if (draggedIndex !== null && dropTargetIndex !== null) {
      const newStructure = [...tournament.blind_structure]
      const [draggedItem] = newStructure.splice(draggedIndex, 1)
      const adjustedIndex = draggedIndex < dropTargetIndex ? dropTargetIndex - 1 : dropTargetIndex
      newStructure.splice(adjustedIndex, 0, draggedItem)
      setTournament({ ...tournament, blind_structure: newStructure })
      
      // Highlight the moved item briefly
      setJustMovedId(draggedItem.id)
      setTimeout(() => setJustMovedId(null), 1000)
    }

    isDragging.current = false
    setDraggedIndex(null)
    setDropTargetIndex(null)
  }, [draggedIndex, dropTargetIndex, tournament, setTournament])

  useEffect(() => {
    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }
  }, [handleMouseMove, handleMouseUp])

  const addLevel = (isBreak: boolean = false) => {
    const lastLevel = tournament.blind_structure.filter(l => !l.is_break).pop()
    const newLevel: BlindLevel = isBreak
      ? {
          id: generateId(),
          small_blind: 0,
          big_blind: 0,
          ante: 0,
          duration_minutes: 10,
          is_break: true,
        }
      : {
          id: generateId(),
          small_blind: lastLevel ? lastLevel.small_blind * 2 : 25,
          big_blind: lastLevel ? lastLevel.big_blind * 2 : 50,
          ante: lastLevel?.ante || 0,
          duration_minutes: 15,
          is_break: false,
        }

    setTournament({
      ...tournament,
      blind_structure: [...tournament.blind_structure, newLevel],
    })
  }

  const updateLevel = (id: string, updates: Partial<BlindLevel>) => {
    setTournament({
      ...tournament,
      blind_structure: tournament.blind_structure.map(l =>
        l.id === id ? { ...l, ...updates } : l
      ),
    })
  }

  const removeLevel = (id: string) => {
    setTournament({
      ...tournament,
      blind_structure: tournament.blind_structure.filter(l => l.id !== id),
    })
  }

  const moveLevel = (index: number, direction: 'up' | 'down') => {
    const newIndex = direction === 'up' ? index - 1 : index + 1
    if (newIndex < 0 || newIndex >= tournament.blind_structure.length) return

    const newStructure = [...tournament.blind_structure]
    const temp = newStructure[index]
    newStructure[index] = newStructure[newIndex]
    newStructure[newIndex] = temp

    setTournament({ ...tournament, blind_structure: newStructure })
  }

  // Save current blind structure as a custom template
  const saveAsTemplate = () => {
    if (!newTemplateName.trim()) return
    
    const template: SavedTemplate = {
      id: generateId(),
      name: newTemplateName.trim(),
      levels: tournament.blind_structure.map(({ id, ...rest }) => rest),
      createdAt: new Date().toISOString()
    }
    
    const updated = [...savedTemplates, template]
    setSavedTemplates(updated)
    localStorage.setItem(STORAGE_KEY_TEMPLATES, JSON.stringify(updated))
    setNewTemplateName('')
    setShowSaveModal(false)
  }

  // Load a saved custom template
  const loadCustomTemplate = (template: SavedTemplate) => {
    const levels = template.levels.map(level => ({
      ...level,
      id: generateId()
    }))
    
    setTournament({
      ...tournament,
      blind_structure: levels,
      current_level: 0,
      time_remaining_seconds: levels[0].duration_minutes * 60
    })
    setActiveTemplate(template.name)
    setShowCustomTemplates(false)
  }

  // Delete a saved template
  const deleteTemplate = (id: string) => {
    const updated = savedTemplates.filter(t => t.id !== id)
    setSavedTemplates(updated)
    localStorage.setItem(STORAGE_KEY_TEMPLATES, JSON.stringify(updated))
  }

  // Export a template to JSON file
  const exportTemplate = async (template?: SavedTemplate) => {
    const dataToExport = template 
      ? { name: template.name, levels: template.levels }
      : { 
          name: tournament.name + ' Blinds',
          levels: tournament.blind_structure.map(({ id, ...rest }) => rest)
        }
    
    const jsonString = JSON.stringify(dataToExport, null, 2)
    const fileName = `${dataToExport.name.replace(/[^a-z0-9]/gi, '_')}_blinds.json`
    
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

  const applyImportedTemplate = (imported: { name?: string, levels: Omit<BlindLevel, 'id'>[] }) => {
    if (!imported.levels || !Array.isArray(imported.levels)) {
      console.error('Invalid template format')
      return
    }
    
    const levels = imported.levels.map(level => ({
      ...level,
      id: generateId()
    }))
    
    setTournament({
      ...tournament,
      blind_structure: levels,
      current_level: 0,
      time_remaining_seconds: levels[0]?.duration_minutes * 60 || 900
    })
    setActiveTemplate(imported.name || t('blinds.importedTemplate'))
  }

  // Generate blinds based on target duration
  const generateByDuration = () => {
    const totalMinutes = targetHours * 60
    
    // Determine level duration and break frequency based on style
    const levelConfig = {
      turbo: { levelDuration: 10, breakDuration: 5, levelsPerBreak: 6 },
      regular: { levelDuration: 15, breakDuration: 10, levelsPerBreak: 5 },
      deep: { levelDuration: 20, breakDuration: 15, levelsPerBreak: 4 }
    }
    
    const config = levelConfig[levelStyle]
    
    // Calculate how many levels we can fit
    // Account for breaks: every N levels, add a break
    let remainingMinutes = totalMinutes
    const levels: BlindLevel[] = []
    let levelCount = 0
    
    // Standard blind progression (small blind values)
    const blindProgression = [
      25, 50, 75, 100, 150, 200, 300, 400, 500, 600, 800, 1000,
      1200, 1500, 2000, 2500, 3000, 4000, 5000, 6000, 8000, 10000,
      12000, 15000, 20000, 25000, 30000, 40000, 50000
    ]
    
    // Ante progression (starts after a few levels)
    const anteStartLevel = levelStyle === 'deep' ? 5 : levelStyle === 'regular' ? 4 : 3
    
    while (remainingMinutes >= config.levelDuration && levelCount < blindProgression.length) {
      // Check if we need a break
      if (levelCount > 0 && levelCount % config.levelsPerBreak === 0 && remainingMinutes >= config.breakDuration + config.levelDuration) {
        levels.push({
          id: generateId(),
          small_blind: 0,
          big_blind: 0,
          ante: 0,
          duration_minutes: config.breakDuration,
          is_break: true
        })
        remainingMinutes -= config.breakDuration
      }
      
      // Add blind level
      const smallBlind = blindProgression[levelCount]
      const bigBlind = smallBlind * 2
      const ante = levelCount >= anteStartLevel ? Math.round(smallBlind / 4) : 0
      
      levels.push({
        id: generateId(),
        small_blind: smallBlind,
        big_blind: bigBlind,
        ante: ante,
        duration_minutes: config.levelDuration,
        is_break: false
      })
      
      remainingMinutes -= config.levelDuration
      levelCount++
    }
    
    // Ensure we have at least 4 levels
    if (levels.filter(l => !l.is_break).length < 4) {
      return // Don't apply if too short
    }
    
    setTournament({
      ...tournament,
      blind_structure: levels,
      current_level: 0,
      time_remaining_seconds: levels[0].duration_minutes * 60
    })
    
    const styleNames = { turbo: 'Turbo', regular: 'Regular', deep: 'Deep' }
    setActiveTemplate(`${targetHours}h ${styleNames[levelStyle]}`)
    setShowDurationGenerator(false)
  }

  // Calculate estimated duration for preview
  const getEstimatedDuration = () => {
    const config = {
      turbo: { levelDuration: 10, breakDuration: 5, levelsPerBreak: 6 },
      regular: { levelDuration: 15, breakDuration: 10, levelsPerBreak: 5 },
      deep: { levelDuration: 20, breakDuration: 15, levelsPerBreak: 4 }
    }[levelStyle]
    
    const totalMinutes = targetHours * 60
    let remaining = totalMinutes
    let levels = 0
    let breaks = 0
    
    while (remaining >= config.levelDuration && levels < 29) {
      if (levels > 0 && levels % config.levelsPerBreak === 0 && remaining >= config.breakDuration + config.levelDuration) {
        breaks++
        remaining -= config.breakDuration
      }
      levels++
      remaining -= config.levelDuration
    }
    
    return { levels, breaks }
  }

  const applyTemplate = (template: 'turbo' | 'regular' | 'deep') => {
    const templates: Record<string, BlindLevel[]> = {
      turbo: [
        { id: generateId(), small_blind: 25, big_blind: 50, ante: 0, duration_minutes: 10, is_break: false },
        { id: generateId(), small_blind: 50, big_blind: 100, ante: 0, duration_minutes: 10, is_break: false },
        { id: generateId(), small_blind: 100, big_blind: 200, ante: 25, duration_minutes: 10, is_break: false },
        { id: generateId(), small_blind: 150, big_blind: 300, ante: 25, duration_minutes: 10, is_break: false },
        { id: generateId(), small_blind: 200, big_blind: 400, ante: 50, duration_minutes: 10, is_break: false },
        { id: generateId(), small_blind: 300, big_blind: 600, ante: 75, duration_minutes: 10, is_break: false },
        { id: generateId(), small_blind: 400, big_blind: 800, ante: 100, duration_minutes: 10, is_break: false },
        { id: generateId(), small_blind: 500, big_blind: 1000, ante: 100, duration_minutes: 10, is_break: false },
      ],
      regular: [
        { id: generateId(), small_blind: 25, big_blind: 50, ante: 0, duration_minutes: 15, is_break: false },
        { id: generateId(), small_blind: 50, big_blind: 100, ante: 0, duration_minutes: 15, is_break: false },
        { id: generateId(), small_blind: 75, big_blind: 150, ante: 0, duration_minutes: 15, is_break: false },
        { id: generateId(), small_blind: 100, big_blind: 200, ante: 25, duration_minutes: 15, is_break: false },
        { id: generateId(), small_blind: 0, big_blind: 0, ante: 0, duration_minutes: 10, is_break: true },
        { id: generateId(), small_blind: 150, big_blind: 300, ante: 25, duration_minutes: 15, is_break: false },
        { id: generateId(), small_blind: 200, big_blind: 400, ante: 50, duration_minutes: 15, is_break: false },
        { id: generateId(), small_blind: 300, big_blind: 600, ante: 75, duration_minutes: 15, is_break: false },
        { id: generateId(), small_blind: 400, big_blind: 800, ante: 100, duration_minutes: 15, is_break: false },
        { id: generateId(), small_blind: 0, big_blind: 0, ante: 0, duration_minutes: 10, is_break: true },
        { id: generateId(), small_blind: 500, big_blind: 1000, ante: 100, duration_minutes: 15, is_break: false },
        { id: generateId(), small_blind: 700, big_blind: 1400, ante: 200, duration_minutes: 15, is_break: false },
        { id: generateId(), small_blind: 1000, big_blind: 2000, ante: 300, duration_minutes: 15, is_break: false },
      ],
      deep: [
        { id: generateId(), small_blind: 25, big_blind: 50, ante: 0, duration_minutes: 20, is_break: false },
        { id: generateId(), small_blind: 50, big_blind: 100, ante: 0, duration_minutes: 20, is_break: false },
        { id: generateId(), small_blind: 75, big_blind: 150, ante: 0, duration_minutes: 20, is_break: false },
        { id: generateId(), small_blind: 100, big_blind: 200, ante: 0, duration_minutes: 20, is_break: false },
        { id: generateId(), small_blind: 0, big_blind: 0, ante: 0, duration_minutes: 15, is_break: true },
        { id: generateId(), small_blind: 125, big_blind: 250, ante: 25, duration_minutes: 20, is_break: false },
        { id: generateId(), small_blind: 150, big_blind: 300, ante: 25, duration_minutes: 20, is_break: false },
        { id: generateId(), small_blind: 200, big_blind: 400, ante: 50, duration_minutes: 20, is_break: false },
        { id: generateId(), small_blind: 250, big_blind: 500, ante: 50, duration_minutes: 20, is_break: false },
        { id: generateId(), small_blind: 0, big_blind: 0, ante: 0, duration_minutes: 15, is_break: true },
        { id: generateId(), small_blind: 300, big_blind: 600, ante: 75, duration_minutes: 20, is_break: false },
        { id: generateId(), small_blind: 400, big_blind: 800, ante: 100, duration_minutes: 20, is_break: false },
        { id: generateId(), small_blind: 500, big_blind: 1000, ante: 100, duration_minutes: 20, is_break: false },
        { id: generateId(), small_blind: 600, big_blind: 1200, ante: 200, duration_minutes: 20, is_break: false },
        { id: generateId(), small_blind: 800, big_blind: 1600, ante: 200, duration_minutes: 20, is_break: false },
      ],
    }

    setTournament({
      ...tournament,
      blind_structure: templates[template],
      current_level: 0,
      time_remaining_seconds: templates[template][0].duration_minutes * 60,
    })
    
    const templateNames: Record<string, string> = {
      turbo: 'Turbo',
      regular: 'Regular',
      deep: 'Deep Stack'
    }
    setActiveTemplate(templateNames[template])
  }

  let levelNumber = 0

  return (
    <div className="max-w-4xl mx-auto">
      {/* Templates */}
      <div className="card p-5 mb-6">
        {/* Quick Templates Header with Active Template */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className="text-lg">🎲</span>
            <h3 className="text-sm font-medium text-themed-primary">{t('blinds.quickTemplates')}</h3>
          </div>
          {activeTemplate && (
            <div 
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-accent/10"
              style={{ border: '1px solid rgba(var(--accent-rgb), 0.3)' }}
            >
              <svg className="w-4 h-4 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span className="text-sm font-medium text-accent">{activeTemplate}</span>
              <button 
                onClick={() => setActiveTemplate(null)}
                className="ml-1 text-accent/60 hover:text-accent transition-colors"
                title={t('blinds.clearTemplate')}
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          )}
        </div>
        <div className="grid grid-cols-3 gap-3 mb-4">
          <button 
            onClick={() => applyTemplate('turbo')} 
            className="group p-3 rounded-xl bg-themed-tertiary/50 hover:bg-themed-tertiary border border-transparent hover:border-accent/30 transition-all text-center"
          >
            <div className="text-2xl mb-1 group-hover:scale-110 transition-transform">⚡</div>
            <div className="text-sm font-medium text-themed-primary">Turbo</div>
            <div className="text-xs text-themed-muted">10m {t('blinds.levels')}</div>
          </button>
          <button 
            onClick={() => applyTemplate('regular')} 
            className="group p-3 rounded-xl bg-themed-tertiary/50 hover:bg-themed-tertiary border border-transparent hover:border-accent/30 transition-all text-center"
          >
            <div className="text-2xl mb-1 group-hover:scale-110 transition-transform">🎯</div>
            <div className="text-sm font-medium text-themed-primary">Regular</div>
            <div className="text-xs text-themed-muted">15m {t('blinds.levels')}</div>
          </button>
          <button 
            onClick={() => applyTemplate('deep')} 
            className="group p-3 rounded-xl bg-themed-tertiary/50 hover:bg-themed-tertiary border border-transparent hover:border-accent/30 transition-all text-center"
          >
            <div className="text-2xl mb-1 group-hover:scale-110 transition-transform">🏔️</div>
            <div className="text-sm font-medium text-themed-primary">Deep Stack</div>
            <div className="text-xs text-themed-muted">20m {t('blinds.levels')}</div>
          </button>
        </div>

        {/* Generate by Duration */}
        <div className="border-t border-zinc-700/20 pt-4 mt-4">
          <button
            onClick={() => setShowDurationGenerator(!showDurationGenerator)}
            className={`w-full group p-3 rounded-xl bg-themed-tertiary/50 hover:bg-themed-tertiary border transition-all text-left flex items-center gap-3 ${
              showDurationGenerator ? 'border-accent/30 bg-themed-tertiary' : 'border-transparent hover:border-accent/30'
            }`}
          >
            <div className="text-2xl group-hover:scale-110 transition-transform">⏱️</div>
            <div className="flex-1">
              <div className="text-sm font-medium text-themed-primary">{t('blinds.generateByDuration')}</div>
              <div className="text-xs text-themed-muted">{t('blinds.generateByDurationDesc')}</div>
            </div>
            <svg 
              className={`w-5 h-5 text-themed-muted transition-transform ${showDurationGenerator ? 'rotate-180' : ''}`} 
              fill="none" viewBox="0 0 24 24" stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {showDurationGenerator && (
            <div className="mt-4 p-4 rounded-xl bg-themed-tertiary/30 border border-themed space-y-4">
              {/* Duration Input */}
              <div>
                <label className="block text-sm font-medium text-themed-primary mb-2">
                  {t('blinds.targetDuration')}
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min="1"
                    max="8"
                    step="0.5"
                    value={targetHours}
                    onChange={(e) => setTargetHours(parseFloat(e.target.value))}
                    className="flex-1 accent-accent"
                  />
                  <div className="w-20 text-center">
                    <span className="text-2xl font-bold text-accent">{targetHours}</span>
                    <span className="text-sm text-themed-muted ml-1">{t('blinds.hours')}</span>
                  </div>
                </div>
                <div className="flex justify-between text-xs text-themed-muted mt-1">
                  <span>1h</span>
                  <span>4h</span>
                  <span>8h</span>
                </div>
              </div>

              {/* Style Selection */}
              <div>
                <label className="block text-sm font-medium text-themed-primary mb-2">
                  {t('blinds.levelStyle')}
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(['turbo', 'regular', 'deep'] as const).map((style) => {
                    const styleInfo = {
                      turbo: { icon: '⚡', label: 'Turbo', duration: '10m' },
                      regular: { icon: '🎯', label: 'Regular', duration: '15m' },
                      deep: { icon: '🏔️', label: 'Deep', duration: '20m' }
                    }[style]
                    return (
                      <button
                        key={style}
                        onClick={() => setLevelStyle(style)}
                        className={`p-2 rounded-lg border transition-all text-center ${
                          levelStyle === style
                            ? 'border-accent bg-accent/10 text-accent'
                            : 'border-transparent bg-themed-tertiary/50 hover:border-accent/30 text-themed-primary'
                        }`}
                      >
                        <span className="text-lg">{styleInfo.icon}</span>
                        <div className="text-xs font-medium">{styleInfo.label}</div>
                        <div className="text-xs text-themed-muted">{styleInfo.duration}</div>
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Preview */}
              <div className="p-3 rounded-lg bg-themed-secondary/30 border border-themed">
                <div className="text-xs text-themed-muted mb-1">{t('blinds.preview')}</div>
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-lg font-semibold text-themed-primary">
                      {getEstimatedDuration().levels} {t('blinds.levels')}
                    </span>
                    {getEstimatedDuration().breaks > 0 && (
                      <span className="text-sm text-themed-muted ml-2">
                        + {getEstimatedDuration().breaks} {t('blinds.breaks')}
                      </span>
                    )}
                  </div>
                  <button
                    onClick={generateByDuration}
                    className="btn btn-primary text-sm"
                  >
                    {t('blinds.generate')}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Custom Templates */}
        <div className="border-t border-zinc-700/20 pt-4 mt-4">
          <div className="grid grid-cols-4 gap-2">
            <button 
              onClick={importTemplate} 
              className="btn btn-secondary flex items-center justify-center gap-2 text-sm"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              {t('blinds.import')}
            </button>
            <button 
              onClick={() => exportTemplate()} 
              className="btn btn-secondary flex items-center justify-center gap-2 text-sm"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
              {t('blinds.export')}
            </button>
            <button 
              onClick={() => setShowSaveModal(true)} 
              className="btn btn-primary flex items-center justify-center gap-2 text-sm"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
              </svg>
              {t('blinds.save')}
            </button>
            <button 
              onClick={() => setShowCustomTemplates(!showCustomTemplates)}
              className={`btn flex items-center justify-center gap-2 text-sm ${
                showCustomTemplates 
                  ? 'btn-secondary bg-accent/10 border-accent/30 text-accent' 
                  : 'btn-secondary'
              }`}
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 19a2 2 0 01-2-2V7a2 2 0 012-2h4l2 2h4a2 2 0 012 2v1M5 19h14a2 2 0 002-2v-5a2 2 0 00-2-2H9a2 2 0 00-2 2v5a2 2 0 01-2 2z" />
              </svg>
              {t('blinds.myTemplates')}
              {savedTemplates.length > 0 && (
                <span className="px-1.5 py-0.5 text-xs rounded-full bg-accent/20 text-accent">
                  {savedTemplates.length}
                </span>
              )}
            </button>
          </div>

          {showCustomTemplates && (
            <div className="mt-3 space-y-1.5">
              {savedTemplates.length === 0 ? (
                <div className="text-center py-6 text-themed-muted">
                  <div className="text-3xl mb-2 opacity-50">📋</div>
                  <p className="text-sm">{t('blinds.noCustomTemplates')}</p>
                </div>
              ) : (
                savedTemplates.map((template) => (
                  <div 
                    key={template.id}
                    className="group flex items-center justify-between p-3 rounded-lg bg-themed-tertiary/30 hover:bg-themed-tertiary/60 transition-colors cursor-pointer"
                    onClick={() => loadCustomTemplate(template)}
                  >
                    <div className="flex items-center gap-3">
                      <svg className="w-5 h-5 text-themed-muted group-hover:text-accent transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <div>
                        <div className="text-sm font-medium text-themed-primary">{template.name}</div>
                        <div className="text-xs text-themed-muted">
                          {template.levels.length} {t('blinds.levels')} • {template.levels.filter(l => !l.is_break).length} {t('blinds.blindLevels')}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={(e) => { e.stopPropagation(); exportTemplate(template); }}
                        className="p-1.5 rounded text-themed-muted hover:text-accent hover:bg-themed-tertiary transition-colors"
                        title={t('blinds.export')}
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                        </svg>
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); deleteTemplate(template.id); }}
                        className="p-1.5 rounded text-themed-muted hover:text-red-400 hover:bg-red-500/10 transition-colors"
                        title={t('blinds.delete')}
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>

      {/* Save Template Modal */}
      {showSaveModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50" onClick={() => setShowSaveModal(false)}>
          <div className="card p-6 w-96 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-lg bg-accent/10">
                <svg className="w-5 h-5 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-themed-primary">{t('blinds.saveAsTemplate')}</h3>
            </div>
            <input
              type="text"
              value={newTemplateName}
              onChange={(e) => setNewTemplateName(e.target.value)}
              placeholder={t('blinds.templateNamePlaceholder')}
              className="input w-full mb-4"
              autoFocus
              onKeyDown={(e) => e.key === 'Enter' && saveAsTemplate()}
            />
            <p className="text-xs text-themed-muted mb-4">
              {tournament.blind_structure.length} {t('blinds.levels')} will be saved
            </p>
            <div className="flex gap-3 justify-end">
              <button onClick={() => setShowSaveModal(false)} className="btn btn-secondary">
                {t('blinds.cancel')}
              </button>
              <button 
                onClick={saveAsTemplate} 
                className="btn btn-primary"
                disabled={!newTemplateName.trim()}
              >
                {t('blinds.save')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Blind Structure Table */}
      <div className="card overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-themed text-left text-sm text-themed-muted">
              <th className="p-4 w-20">{t('blinds.level')}</th>
              <th className="p-4">{t('blinds.smallBlind')}</th>
              <th className="p-4">{t('blinds.bigBlind')}</th>
              <th className="p-4">{t('blinds.ante')}</th>
              <th className="p-4 w-32">{t('blinds.duration')}</th>
              <th className="p-4 w-32">{t('blinds.actions')}</th>
            </tr>
          </thead>
          <tbody ref={tableRef}>
            {tournament.blind_structure.map((level, index) => {
              const isCurrent = index === tournament.current_level
              if (!level.is_break) levelNumber++
              const isBeingDragged = draggedIndex === index
              const showDropIndicatorAbove = dropTargetIndex === index
              const showDropIndicatorBelow = dropTargetIndex === tournament.blind_structure.length && index === tournament.blind_structure.length - 1
              const wasJustMoved = justMovedId === level.id

              return (
                <tr
                  key={level.id}
                  onMouseDown={(e) => handleMouseDown(e, index)}
                  className={`
                    border-b border-zinc-700/30 dark:border-zinc-700/30 transition-all select-none
                    ${isCurrent ? 'bg-accent/10' : 'hover:bg-themed-tertiary/30'}
                    ${level.is_break ? 'bg-amber-500/5' : ''}
                    ${isBeingDragged ? 'opacity-50 bg-themed-tertiary/50' : ''}
                    ${wasJustMoved ? 'animate-highlight-fade' : ''}
                  `}
                  style={{
                    ...(showDropIndicatorAbove ? {
                      borderTopWidth: '3px',
                      borderTopColor: `rgb(var(--accent-rgb))`,
                      boxShadow: `0 -4px 12px rgba(var(--accent-rgb), 0.6)`
                    } : {}),
                    ...(showDropIndicatorBelow ? {
                      borderBottomWidth: '3px',
                      borderBottomColor: `rgb(var(--accent-rgb))`,
                      boxShadow: `0 4px 12px rgba(var(--accent-rgb), 0.6)`
                    } : {}),
                    ...(wasJustMoved ? {
                      backgroundColor: `rgba(var(--accent-rgb), 0.15)`
                    } : {})
                  }}
                >
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <span className="drag-handle text-themed-muted hover:text-themed-primary cursor-grab active:cursor-grabbing text-lg select-none">⋮⋮</span>
                      {level.is_break ? (
                        <span className="text-amber-400"><svg className="inline w-4 h-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path d="M2 19h18v2H2v-2zm2-4h2v3H4v-3zm4 0h2v3H8v-3zm4 0h2v3h-2v-3zm-9-6h14v6c0 1.1-.9 2-2 2H5c-1.1 0-2-.9-2-2V9h0zm16 0h2c1.1 0 2 .9 2 2v2c0 1.1-.9 2-2 2h-2V9zm0 4h2v-2h-2v2zM2 7h16l-1-4H3L2 7z"/></svg></span>
                      ) : (
                        <span className={isCurrent ? 'text-accent font-semibold' : 'text-themed-secondary'}>
                          {levelNumber}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="p-4">
                    {level.is_break ? (
                      <span className="text-amber-400 font-medium">{t('blinds.break')}</span>
                    ) : editingId === level.id ? (
                      <input
                        type="number"
                        value={level.small_blind}
                        onChange={(e) => updateLevel(level.id, { small_blind: parseInt(e.target.value) || 0 })}
                        className="input w-24"
                      />
                    ) : (
                      <span className="font-medium">{level.small_blind.toLocaleString()}</span>
                    )}
                  </td>
                  <td className="p-4">
                    {!level.is_break && (
                      editingId === level.id ? (
                        <input
                          type="number"
                          value={level.big_blind}
                          onChange={(e) => updateLevel(level.id, { big_blind: parseInt(e.target.value) || 0 })}
                          className="input w-24"
                        />
                      ) : (
                        <span className="font-medium">{level.big_blind.toLocaleString()}</span>
                      )
                    )}
                  </td>
                  <td className="p-4">
                    {!level.is_break && (
                      editingId === level.id ? (
                        <input
                          type="number"
                          value={level.ante}
                          onChange={(e) => updateLevel(level.id, { ante: parseInt(e.target.value) || 0 })}
                          className="input w-24"
                        />
                      ) : level.ante > 0 ? (
                        <span className="text-accent font-medium">{level.ante.toLocaleString()}</span>
                      ) : (
                        <span className="text-themed-muted">—</span>
                      )
                    )}
                  </td>
                  <td className="p-4">
                    {editingId === level.id ? (
                      <input
                        type="number"
                        value={level.duration_minutes}
                        onChange={(e) => updateLevel(level.id, { duration_minutes: parseInt(e.target.value) || 1 })}
                        className="input w-20"
                      />
                    ) : (
                      <span className="text-themed-secondary">{level.duration_minutes}m</span>
                    )}
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => moveLevel(index, 'up')}
                        disabled={index === 0}
                        className="btn btn-ghost p-1 w-7 h-7 disabled:opacity-30"
                      >
                        ↑
                      </button>
                      <button
                        onClick={() => moveLevel(index, 'down')}
                        disabled={index === tournament.blind_structure.length - 1}
                        className="btn btn-ghost p-1 w-7 h-7 disabled:opacity-30"
                      >
                        ↓
                      </button>
                      <button
                        onClick={() => setEditingId(editingId === level.id ? null : level.id)}
                        className={`btn btn-ghost p-1 w-7 h-7 ${editingId === level.id ? 'text-accent' : ''}`}
                      >
                        {editingId === level.id ? '✓' : '✎'}
                      </button>
                      <button
                        onClick={() => removeLevel(level.id)}
                        className="btn btn-ghost p-1 w-7 h-7 text-zinc-500 hover:text-red-400"
                      >
                        ×
                      </button>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Add Level Buttons */}
      <div className="flex gap-3 mt-4">
        <button onClick={() => addLevel(false)} className="btn btn-secondary flex-1">
          + {t('blinds.addLevel')}
        </button>
        <button onClick={() => addLevel(true)} className="btn btn-secondary">
          + {t('blinds.addBreak')}
        </button>
      </div>
    </div>
  )
}
