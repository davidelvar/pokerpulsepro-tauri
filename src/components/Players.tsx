import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { Tournament, Player } from '../types'
import { 
  formatCurrency, 
  generateId, 
  getTableInfo, 
  getUnassignedPlayers,
  assignPlayersToTables,
  clearTableAssignments,
  getTableBalanceSuggestions,
  movePlayerToSeat,
  getNextAvailableSeat
} from '../utils'

interface PlayersProps {
  tournament: Tournament
  setTournament: (t: Tournament) => void
}

type Filter = 'all' | 'active' | 'eliminated'
type ViewMode = 'list' | 'tables'

export function Players({ tournament, setTournament }: PlayersProps) {
  const { t } = useTranslation()
  const [newPlayerName, setNewPlayerName] = useState('')
  const [filter, setFilter] = useState<Filter>('all')
  const [search, setSearch] = useState('')
  const [viewMode, setViewMode] = useState<ViewMode>('list')

  const addPlayer = () => {
    if (!newPlayerName.trim()) return
    
    const player: Player = {
      id: generateId(),
      name: newPlayerName.trim(),
      buyins: 1,
      rebuys: 0,
      addons: 0,
      eliminated: false,
      placement: null,
      tableNumber: null,
      seatNumber: null,
    }
    
    setTournament({
      ...tournament,
      players: [...tournament.players, player],
    })
    setNewPlayerName('')
  }

  const updatePlayer = (id: string, updates: Partial<Player>) => {
    setTournament({
      ...tournament,
      players: tournament.players.map(p => 
        p.id === id ? { ...p, ...updates } : p
      ),
    })
  }

  const removePlayer = (id: string) => {
    setTournament({
      ...tournament,
      players: tournament.players.filter(p => p.id !== id),
    })
  }

  const eliminatePlayer = (id: string) => {
    const activeCount = tournament.players.filter(p => !p.eliminated).length
    updatePlayer(id, { eliminated: true, placement: activeCount })
  }

  const reinstatePlayer = (id: string) => {
    updatePlayer(id, { eliminated: false, placement: null })
  }

  // Table management functions
  const handleRandomAssign = () => {
    const newPlayers = assignPlayersToTables(tournament.players, tournament.tableCount, tournament.seatsPerTable)
    setTournament({ ...tournament, players: newPlayers })
  }

  const handleClearAssignments = () => {
    const newPlayers = clearTableAssignments(tournament.players)
    setTournament({ ...tournament, players: newPlayers })
  }

  const handleMovePlayer = (playerId: string, tableNumber: number) => {
    const seat = getNextAvailableSeat(tournament.players, tableNumber, tournament.seatsPerTable)
    if (seat !== null) {
      const newPlayers = movePlayerToSeat(tournament.players, playerId, tableNumber, seat)
      setTournament({ ...tournament, players: newPlayers })
    }
  }

  // Filter players - works for both views
  const filteredPlayers = tournament.players
    .filter(p => {
      if (filter === 'active') return !p.eliminated
      if (filter === 'eliminated') return p.eliminated
      return true
    })
    .filter(p => p.name.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => {
      if (a.eliminated !== b.eliminated) return a.eliminated ? 1 : -1
      return a.name.localeCompare(b.name)
    })

  const tableInfo = getTableInfo(tournament.players, tournament.tableCount, tournament.seatsPerTable)
  const filteredTableInfo = tableInfo.map(table => ({
    ...table,
    players: table.players.filter(p => filteredPlayers.some(fp => fp.id === p.id))
  }))
  
  const unassignedPlayers = getUnassignedPlayers(tournament.players)
  const filteredUnassigned = unassignedPlayers.filter(p => filteredPlayers.some(fp => fp.id === p.id))
  const balanceSuggestions = getTableBalanceSuggestions(tournament.players, tournament.tableCount, tournament.seatsPerTable)

  const totalBuyins = tournament.players.reduce((sum, p) => sum + p.buyins, 0)
  const totalRebuys = tournament.players.reduce((sum, p) => sum + p.rebuys, 0)
  const totalAddons = tournament.players.reduce((sum, p) => sum + p.addons, 0)
  const activePlayers = tournament.players.filter(p => !p.eliminated).length

  return (
    <div className="max-w-5xl mx-auto">
      {/* Unified Header: Stats + Add Player + View Toggle */}
      <div className="card p-4 mb-4">
        {/* Row 1: Stats */}
        <div className="flex items-center gap-6 mb-4 pb-4 border-b border-themed-tertiary/30">
          <div className="flex items-center gap-2">
            <span className="text-themed-muted text-sm">{t('players.totalPlayers')}:</span>
            <span className="font-bold text-themed-primary">{tournament.players.length}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-themed-muted text-sm">{t('players.activePlayers')}:</span>
            <span className="font-bold text-accent">{activePlayers}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-themed-muted text-sm">{t('players.buyins')}:</span>
            <span className="font-bold text-themed-primary">{totalBuyins}</span>
          </div>
          {totalRebuys > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-themed-muted text-sm">{t('players.rebuys')}:</span>
              <span className="font-bold text-themed-primary">{totalRebuys}</span>
            </div>
          )}
          {totalAddons > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-themed-muted text-sm">{t('players.addons')}:</span>
              <span className="font-bold text-themed-primary">{totalAddons}</span>
            </div>
          )}
        </div>

        {/* Row 2: Add Player + View Toggle */}
        <div className="flex items-center gap-4">
          <input
            type="text"
            value={newPlayerName}
            onChange={(e) => setNewPlayerName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addPlayer()}
            placeholder={t('players.enterName')}
            className="input flex-1"
          />
          <button onClick={addPlayer} className="btn btn-primary">
            {t('players.addPlayer')}
          </button>
          
          {/* View Mode Toggle - Prominent Tabs */}
          <div className="flex gap-0 p-1 bg-themed-tertiary/40 rounded-xl ml-4">
            <button
              onClick={() => setViewMode('list')}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                viewMode === 'list' 
                  ? 'bg-accent text-white shadow-lg shadow-accent/30' 
                  : 'text-themed-muted hover:text-themed-primary hover:bg-themed-tertiary/50'
              }`}
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
              </svg>
              <span>{t('players.viewList')}</span>
            </button>
            <button
              onClick={() => setViewMode('tables')}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                viewMode === 'tables' 
                  ? 'bg-accent text-white shadow-lg shadow-accent/30' 
                  : 'text-themed-muted hover:text-themed-primary hover:bg-themed-tertiary/50'
              }`}
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM14 5a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1v-4zM14 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" />
              </svg>
              <span>{t('players.viewTables')}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Unified Toolbar: Filters + Table Config + Search */}
      <div className="card p-3 mb-4">
        <div className="flex items-center gap-4">
          {/* Filters with counts */}
          <div className="flex gap-1">
            {(['all', 'active', 'eliminated'] as Filter[]).map((f) => {
              const count = f === 'all' 
                ? tournament.players.length 
                : f === 'active' 
                  ? activePlayers 
                  : tournament.players.filter(p => p.eliminated).length
              return (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 ${
                    filter === f
                      ? 'bg-accent text-white'
                      : 'bg-themed-tertiary/50 text-themed-muted hover:text-themed-primary'
                  }`}
                >
                  {t(`players.filter.${f}`)}
                  <span className={`text-xs px-1.5 py-0.5 rounded ${filter === f ? 'bg-white/20' : 'bg-themed-tertiary'}`}>
                    {count}
                  </span>
                </button>
              )
            })}
          </div>

          <div className="h-6 w-px bg-themed-tertiary/50" />

          {/* Table Configuration - Always visible */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-themed-muted">{t('players.tables')}:</span>
            <button
              onClick={() => setTournament({ ...tournament, tableCount: Math.max(1, tournament.tableCount - 1) })}
              className="btn btn-ghost p-0.5 w-6 h-6 text-sm"
              disabled={tournament.tableCount <= 1}
            >
              −
            </button>
            <span className="w-6 text-center font-bold text-themed-primary">{tournament.tableCount}</span>
            <button
              onClick={() => setTournament({ ...tournament, tableCount: Math.min(20, tournament.tableCount + 1) })}
              className="btn btn-ghost p-0.5 w-6 h-6 text-sm"
              disabled={tournament.tableCount >= 20}
            >
              +
            </button>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-themed-muted">{t('players.seatsEach')}:</span>
            <button
              onClick={() => setTournament({ ...tournament, seatsPerTable: Math.max(2, tournament.seatsPerTable - 1) })}
              className="btn btn-ghost p-0.5 w-6 h-6 text-sm"
              disabled={tournament.seatsPerTable <= 2}
            >
              −
            </button>
            <span className="w-6 text-center font-bold text-themed-primary">{tournament.seatsPerTable}</span>
            <button
              onClick={() => setTournament({ ...tournament, seatsPerTable: Math.min(10, tournament.seatsPerTable + 1) })}
              className="btn btn-ghost p-0.5 w-6 h-6 text-sm"
              disabled={tournament.seatsPerTable >= 10}
            >
              +
            </button>
          </div>

          <div className="flex-1" />

          {/* Search */}
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t('players.search')}
            className="input w-48 text-sm py-1.5"
          />
        </div>
      </div>

      {/* Table Status Indicators - Show when multiple tables */}
      {tournament.tableCount > 1 && (
        <div className="flex items-center gap-3 mb-4 px-1">
          {tableInfo.map((table) => {
            const filteredCount = filteredTableInfo.find(t => t.tableNumber === table.tableNumber)?.players.length || 0
            const isFiltered = filter !== 'all'
            return (
              <div 
                key={table.tableNumber} 
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm ${
                  table.players.length === 0 ? 'bg-themed-tertiary/30 text-themed-muted' : 'bg-themed-tertiary/50'
                }`}
              >
                <span className="font-medium">T{table.tableNumber}</span>
                <span className="text-themed-muted">
                  {isFiltered ? `${filteredCount}/` : ''}{table.players.length}/{tournament.seatsPerTable}
                </span>
              </div>
            )
          })}
          {unassignedPlayers.length > 0 && (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm bg-amber-500/10 text-amber-500">
              <span>⚠️</span>
              <span>{filteredUnassigned.length > 0 && filter !== 'all' ? `${filteredUnassigned.length}/` : ''}{unassignedPlayers.length} {t('players.unassigned')}</span>
            </div>
          )}
        </div>
      )}

      {/* Table Management Actions - Only in Tables View */}
      {viewMode === 'tables' && (
        <div className="card p-3 mb-4 bg-themed-tertiary/20">
          <div className="flex flex-wrap items-center gap-3">
            {/* Quick Table Presets */}
            <div className="flex items-center gap-1">
              <span className="text-xs text-themed-muted mr-2">{t('players.quickSet')}:</span>
              {[1, 2, 3, 4, 5].map(num => (
                <button
                  key={num}
                  onClick={() => setTournament({ ...tournament, tableCount: num })}
                  className={`btn p-1 w-7 h-7 text-xs ${tournament.tableCount === num ? 'btn-primary' : 'btn-ghost'}`}
                >
                  {num}
                </button>
              ))}
            </div>

            <div className="h-5 w-px bg-themed-tertiary/50" />

            {/* Action Buttons */}
            <button onClick={handleRandomAssign} className="btn btn-primary text-sm py-1.5">
              🎲 {t('players.randomAssign')}
            </button>
            <button onClick={handleClearAssignments} className="btn btn-secondary text-sm py-1.5">
              {t('players.clearAssignments')}
            </button>

            <div className="flex-1" />

            {/* Status Indicators */}
            {unassignedPlayers.length === 0 && balanceSuggestions.length === 0 && activePlayers > 0 && (
              <span className="text-green-500 flex items-center gap-1 text-sm">
                <span>✓</span> {t('players.allSeated')}
              </span>
            )}
            {balanceSuggestions.length > 0 && (
              <span className="text-amber-500 flex items-center gap-1 text-sm">
                <span>⚖️</span> {t('players.tablesUnbalanced')}
              </span>
            )}
          </div>

          {/* Smart Recommendation Banner */}
          {(() => {
            const recommendedTables = Math.max(1, Math.ceil(activePlayers / tournament.seatsPerTable))
            const currentCapacity = tournament.tableCount * tournament.seatsPerTable
            const needsMoreTables = currentCapacity < activePlayers
            const hasTooManyTables = tournament.tableCount > recommendedTables && activePlayers > 0
            
            if (activePlayers === 0) return null
            
            if (needsMoreTables) {
              return (
                <div className="flex items-center justify-between p-2 mt-3 bg-red-500/10 border border-red-500/30 rounded-lg">
                  <div className="flex items-center gap-2">
                    <span className="text-red-400">⚠️</span>
                    <span className="text-sm text-red-400">
                      {t('players.notEnoughSeats', { players: activePlayers, capacity: currentCapacity })}
                    </span>
                  </div>
                  <button
                    onClick={() => setTournament({ ...tournament, tableCount: recommendedTables })}
                    className="btn btn-primary text-xs"
                  >
                    {t('players.addTable', { count: recommendedTables })}
                  </button>
                </div>
              )
            }
            
            if (hasTooManyTables) {
              return (
                <div className="flex items-center justify-between p-2 mt-3 bg-accent/10 border border-accent/30 rounded-lg">
                  <div className="flex items-center gap-2">
                    <span className="text-accent">💡</span>
                    <span className="text-sm text-themed-secondary">
                      {t('players.couldConsolidate', { players: activePlayers, tables: recommendedTables })}
                    </span>
                  </div>
                  <button
                    onClick={() => setTournament({ ...tournament, tableCount: recommendedTables })}
                    className="btn btn-ghost text-accent text-xs"
                  >
                    {t('players.consolidate')}
                  </button>
                </div>
              )
            }
            
            return null
          })()}

          {balanceSuggestions.length > 0 && (
            <div className="mt-3 p-2 bg-amber-500/10 border border-amber-500/30 rounded-lg">
              <div className="text-sm text-amber-400 font-medium mb-2">{t('players.balanceSuggestion')}</div>
              {balanceSuggestions.map((suggestion, i) => (
                <div key={i} className="flex items-center justify-between text-sm">
                  <span className="text-themed-secondary">
                    {t('players.moveSuggestion', { 
                      player: suggestion.player.name, 
                      from: suggestion.fromTable, 
                      to: suggestion.toTable 
                    })}
                  </span>
                  <button
                    onClick={() => handleMovePlayer(suggestion.player.id, suggestion.toTable)}
                    className="btn btn-ghost text-accent text-xs"
                  >
                    {t('players.applyMove')}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tables View - Shows Unassigned + Tables with filtered players */}
      {viewMode === 'tables' && (
        <>
          {/* Unassigned Players Section */}
          {filteredUnassigned.length > 0 && (
            <div className="card p-4 mb-4 border-2 border-dashed border-amber-500/30 bg-amber-500/5">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-medium text-amber-500 flex items-center gap-2">
                  <span>⚠️</span> {t('players.unassignedPlayers')}
                  <span className="text-sm font-normal text-themed-muted">
                    ({filteredUnassigned.length}{filter !== 'all' ? ` ${t('players.filtered')}` : ''})
                  </span>
                </h4>
                <button
                  onClick={handleRandomAssign}
                  className="btn btn-primary text-xs py-1"
                >
                  {t('players.assignAll')}
                </button>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                {filteredUnassigned.map((player) => (
                  <div key={player.id} className="flex items-center justify-between p-2 bg-themed-tertiary/30 rounded">
                    <span className={`text-sm truncate ${player.eliminated ? 'text-themed-muted line-through' : 'text-themed-primary'}`}>
                      {player.name}
                    </span>
                    <select
                      value=""
                      onChange={(e) => handleMovePlayer(player.id, parseInt(e.target.value))}
                      className="input text-xs py-0.5 px-1 w-16"
                    >
                      <option value="">→</option>
                      {Array.from({ length: tournament.tableCount }, (_, i) => i + 1).map((tableNum) => (
                        <option key={tableNum} value={tableNum}>T{tableNum}</option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Table Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            {filteredTableInfo.map((table) => {
              const totalPlayers = tableInfo.find(t => t.tableNumber === table.tableNumber)?.players.length || 0
              const showingFiltered = filter !== 'all' && table.players.length !== totalPlayers
              return (
                <div key={table.tableNumber} className="card p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-medium text-themed-primary">
                      {t('players.table')} {table.tableNumber}
                    </h4>
                    <span className="text-sm text-themed-muted">
                      {showingFiltered && <span className="text-accent">{table.players.length}/</span>}
                      {totalPlayers}/{tournament.seatsPerTable} {t('players.seats')}
                    </span>
                  </div>
                  <div className="space-y-1">
                    {table.players.length === 0 ? (
                      <div className="text-sm text-themed-muted text-center py-4">
                        {filter !== 'all' ? t('players.noMatchingPlayers') : t('players.emptyTable')}
                      </div>
                    ) : (
                      table.players.map((player) => (
                        <div 
                          key={player.id} 
                          className={`flex items-center justify-between p-2 rounded hover:bg-themed-tertiary/50 ${
                            player.eliminated ? 'bg-themed-tertiary/20 opacity-60' : 'bg-themed-tertiary/30'
                          }`}
                        >
                          <div className="flex items-center gap-2 flex-1 min-w-0">
                            <span className="text-xs text-themed-muted w-5">#{player.seatNumber}</span>
                            <span className={`text-sm truncate ${player.eliminated ? 'line-through text-themed-muted' : 'text-themed-primary'}`}>
                              {player.name}
                            </span>
                            {player.eliminated && (
                              <span className="text-xs px-1.5 py-0.5 bg-red-500/20 text-red-400 rounded">
                                {t('players.filter.eliminated')}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-1">
                            <select
                              value={player.tableNumber || ''}
                              onChange={(e) => handleMovePlayer(player.id, parseInt(e.target.value))}
                              className="input text-xs py-0.5 px-1 w-16"
                            >
                              {Array.from({ length: tournament.tableCount }, (_, i) => i + 1).map((tableNum) => (
                                <option key={tableNum} value={tableNum}>T{tableNum}</option>
                              ))}
                            </select>
                            {!player.eliminated ? (
                              <button
                                onClick={() => eliminatePlayer(player.id)}
                                className="btn btn-ghost p-1 text-red-400 hover:bg-red-500/10"
                                title={t('players.eliminate')}
                              >
                                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                              </button>
                            ) : (
                              <button
                                onClick={() => reinstatePlayer(player.id)}
                                className="btn btn-ghost p-1 text-accent hover:bg-accent/10"
                                title={t('players.reinstate')}
                              >
                                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                </svg>
                              </button>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </>
      )}

      {/* Players List */}
      {viewMode === 'list' && (
      <div className="space-y-2">
        {filteredPlayers.map((player) => (
          <div
            key={player.id}
            className={`card p-4 flex items-center gap-4 transition-opacity ${
              player.eliminated ? 'opacity-50' : ''
            }`}
          >
            {/* Player Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3">
                <span className={`font-medium ${player.eliminated ? 'line-through text-themed-muted' : 'text-themed-primary'}`}>
                  {player.name}
                </span>
                {player.placement && (
                  <span className="px-2 py-0.5 bg-themed-tertiary rounded text-sm text-themed-secondary">
                    #{player.placement}
                  </span>
                )}
              </div>
            </div>

            {/* Table Assignment - Quick select in list view */}
            {tournament.tableCount > 1 && !player.eliminated && (
              <div className="flex items-center gap-2">
                <select
                  value={player.tableNumber || ''}
                  onChange={(e) => {
                    const tableNum = parseInt(e.target.value)
                    if (tableNum) handleMovePlayer(player.id, tableNum)
                  }}
                  className="input text-xs py-1 px-2 w-20"
                >
                  <option value="">{t('players.noTable')}</option>
                  {Array.from({ length: tournament.tableCount }, (_, i) => i + 1).map((tableNum) => (
                    <option key={tableNum} value={tableNum}>T{tableNum}</option>
                  ))}
                </select>
              </div>
            )}

            {/* Buy-ins Control */}
            <div className="flex items-center gap-2">
              <span className="text-themed-muted text-sm w-16">{t('players.buyins')}</span>
              <button
                onClick={() => updatePlayer(player.id, { buyins: Math.max(1, player.buyins - 1) })}
                className="btn btn-ghost p-1 w-8 h-8"
                disabled={player.buyins <= 1}
              >
                −
              </button>
              <span className="w-8 text-center font-medium">{player.buyins}</span>
              <button
                onClick={() => updatePlayer(player.id, { buyins: player.buyins + 1 })}
                className="btn btn-ghost p-1 w-8 h-8"
              >
                +
              </button>
            </div>

            {/* Rebuys Control */}
            <div className="flex items-center gap-2">
              <span className="text-themed-muted text-sm w-16">{t('players.rebuys')}</span>
              <button
                onClick={() => updatePlayer(player.id, { rebuys: Math.max(0, player.rebuys - 1) })}
                className="btn btn-ghost p-1 w-8 h-8"
                disabled={player.rebuys <= 0}
              >
                −
              </button>
              <span className="w-8 text-center font-medium">{player.rebuys}</span>
              <button
                onClick={() => updatePlayer(player.id, { rebuys: player.rebuys + 1 })}
                className="btn btn-ghost p-1 w-8 h-8"
              >
                +
              </button>
            </div>

            {/* Add-ons Control */}
            <div className="flex items-center gap-2">
              <span className="text-themed-muted text-sm w-16">{t('players.addons')}</span>
              <button
                onClick={() => updatePlayer(player.id, { addons: Math.max(0, player.addons - 1) })}
                className="btn btn-ghost p-1 w-8 h-8"
                disabled={player.addons <= 0}
              >
                −
              </button>
              <span className="w-8 text-center font-medium">{player.addons}</span>
              <button
                onClick={() => updatePlayer(player.id, { addons: player.addons + 1 })}
                className="btn btn-ghost p-1 w-8 h-8"
              >
                +
              </button>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2">
              {player.eliminated ? (
                <button
                  onClick={() => reinstatePlayer(player.id)}
                  className="btn btn-ghost text-accent text-sm"
                >
                  {t('players.reinstate')}
                </button>
              ) : (
                <button
                  onClick={() => eliminatePlayer(player.id)}
                  className="btn btn-danger text-sm"
                >
                  {t('players.eliminate')}
                </button>
              )}
              <button
                onClick={() => removePlayer(player.id)}
                className="btn btn-ghost p-2 text-themed-muted hover:text-red-400"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
          </div>
        ))}

        {filteredPlayers.length === 0 && (
          <div className="text-center py-12 text-themed-muted">
            {search ? t('players.noMatch') : t('players.noPlayers')}
          </div>
        )}
      </div>
      )}
    </div>
  )
}
