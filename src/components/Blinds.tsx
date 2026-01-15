import { useState, useRef, useEffect, useCallback } from 'react'
import type { Tournament, BlindLevel } from '../types'
import { generateId } from '../utils'

interface BlindsProps {
  tournament: Tournament
  setTournament: (t: Tournament) => void
}

export function Blinds({ tournament, setTournament }: BlindsProps) {
  const [editingId, setEditingId] = useState<string | null>(null)
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null)
  const [dropTargetIndex, setDropTargetIndex] = useState<number | null>(null)
  const tableRef = useRef<HTMLTableSectionElement>(null)
  const isDragging = useRef(false)

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
  }

  let levelNumber = 0

  return (
    <div className="max-w-4xl mx-auto">
      {/* Templates */}
      <div className="card p-4 mb-6">
        <div className="text-sm text-themed-muted mb-3">Quick Templates</div>
        <div className="flex gap-3">
          <button onClick={() => applyTemplate('turbo')} className="btn btn-secondary flex-1">
            ⚡ Turbo (10m levels)
          </button>
          <button onClick={() => applyTemplate('regular')} className="btn btn-secondary flex-1">
            🎯 Regular (15m levels)
          </button>
          <button onClick={() => applyTemplate('deep')} className="btn btn-secondary flex-1">
            🏔️ Deep Stack (20m levels)
          </button>
        </div>
      </div>

      {/* Blind Structure Table */}
      <div className="card overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-themed text-left text-sm text-themed-muted">
              <th className="p-4 w-20">Level</th>
              <th className="p-4">Small Blind</th>
              <th className="p-4">Big Blind</th>
              <th className="p-4">Ante</th>
              <th className="p-4 w-32">Duration</th>
              <th className="p-4 w-32">Actions</th>
            </tr>
          </thead>
          <tbody ref={tableRef}>
            {tournament.blind_structure.map((level, index) => {
              const isCurrent = index === tournament.current_level
              if (!level.is_break) levelNumber++
              const isBeingDragged = draggedIndex === index
              const showDropIndicatorAbove = dropTargetIndex === index
              const showDropIndicatorBelow = dropTargetIndex === tournament.blind_structure.length && index === tournament.blind_structure.length - 1

              return (
                <tr
                  key={level.id}
                  onMouseDown={(e) => handleMouseDown(e, index)}
                  className={`
                    border-b border-themed/50 transition-all select-none
                    ${isCurrent ? 'bg-accent/10' : 'hover:bg-themed-tertiary/30'}
                    ${level.is_break ? 'bg-amber-500/5' : ''}
                    ${isBeingDragged ? 'opacity-50 bg-themed-tertiary/50' : ''}
                    ${showDropIndicatorAbove ? 'border-t-2 border-t-accent' : ''}
                    ${showDropIndicatorBelow ? 'border-b-2 border-b-accent' : ''}
                  `}
                >
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <span className="drag-handle text-themed-muted hover:text-themed-primary cursor-grab active:cursor-grabbing text-lg select-none">⋮⋮</span>
                      {level.is_break ? (
                        <span className="text-amber-400">☕</span>
                      ) : (
                        <span className={isCurrent ? 'text-accent font-semibold' : 'text-themed-secondary'}>
                          {levelNumber}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="p-4">
                    {level.is_break ? (
                      <span className="text-amber-400 font-medium">Break</span>
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
                        ✎
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
          + Add Level
        </button>
        <button onClick={() => addLevel(true)} className="btn btn-secondary">
          + Add Break
        </button>
      </div>
    </div>
  )
}
