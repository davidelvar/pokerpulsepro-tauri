import { useState } from 'react'
import type { Tournament, Player } from '../types'
import { formatCurrency, generateId } from '../utils'

interface PlayersProps {
  tournament: Tournament
  setTournament: (t: Tournament) => void
}

type Filter = 'all' | 'active' | 'eliminated'

export function Players({ tournament, setTournament }: PlayersProps) {
  const [newPlayerName, setNewPlayerName] = useState('')
  const [filter, setFilter] = useState<Filter>('all')
  const [search, setSearch] = useState('')

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

  const totalBuyins = tournament.players.reduce((sum, p) => sum + p.buyins, 0)
  const totalRebuys = tournament.players.reduce((sum, p) => sum + p.rebuys, 0)
  const totalAddons = tournament.players.reduce((sum, p) => sum + p.addons, 0)

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header Stats */}
      <div className="grid grid-cols-5 gap-4 mb-6">
        <div className="card p-4">
          <div className="text-themed-muted text-sm">Total Players</div>
          <div className="text-2xl font-bold text-themed-primary">{tournament.players.length}</div>
        </div>
        <div className="card p-4">
          <div className="text-themed-muted text-sm">Active</div>
          <div className="text-2xl font-bold text-accent">
            {tournament.players.filter(p => !p.eliminated).length}
          </div>
        </div>
        <div className="card p-4">
          <div className="text-themed-muted text-sm">Buy-ins</div>
          <div className="text-2xl font-bold text-themed-primary">{totalBuyins}</div>
        </div>
        <div className="card p-4">
          <div className="text-themed-muted text-sm">Rebuys</div>
          <div className="text-2xl font-bold text-themed-primary">{totalRebuys}</div>
        </div>
        <div className="card p-4">
          <div className="text-themed-muted text-sm">Add-ons</div>
          <div className="text-2xl font-bold text-themed-primary">{totalAddons}</div>
        </div>
      </div>

      {/* Add Player Form */}
      <div className="card p-4 mb-6">
        <div className="flex gap-3">
          <input
            type="text"
            value={newPlayerName}
            onChange={(e) => setNewPlayerName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addPlayer()}
            placeholder="Enter player name..."
            className="input flex-1"
          />
          <button onClick={addPlayer} className="btn btn-primary">
            Add Player
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4 mb-4">
        <div className="flex gap-2">
          {(['all', 'active', 'eliminated'] as Filter[]).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                filter === f
                  ? 'bg-accent/20 text-accent'
                  : 'text-themed-muted hover:text-themed-primary'
              }`}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
        <div className="flex-1" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search players..."
          className="input w-64"
        />
      </div>

      {/* Players List */}
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

            {/* Buy-ins Control */}
            <div className="flex items-center gap-2">
              <span className="text-themed-muted text-sm w-16">Buy-ins</span>
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
              <span className="text-themed-muted text-sm w-16">Rebuys</span>
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
              <span className="text-themed-muted text-sm w-16">Add-ons</span>
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
                  Reinstate
                </button>
              ) : (
                <button
                  onClick={() => eliminatePlayer(player.id)}
                  className="btn btn-danger text-sm"
                >
                  Eliminate
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
            {search ? 'No players match your search' : 'No players yet. Add some above!'}
          </div>
        )}
      </div>
    </div>
  )
}
