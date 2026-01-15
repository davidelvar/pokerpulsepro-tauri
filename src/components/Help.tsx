export function Help() {
  const hands = [
    {
      rank: 1,
      name: 'Royal Flush',
      description: 'A, K, Q, J, 10, all the same suit',
      cards: ['A♠', 'K♠', 'Q♠', 'J♠', '10♠'],
      color: 'text-amber-400',
      bgColor: 'bg-amber-500/10 border-amber-500/30',
    },
    {
      rank: 2,
      name: 'Straight Flush',
      description: 'Five cards in sequence, all the same suit',
      cards: ['9♥', '8♥', '7♥', '6♥', '5♥'],
      color: 'text-amber-400',
      bgColor: 'bg-amber-500/10 border-amber-500/30',
    },
    {
      rank: 3,
      name: 'Four of a Kind',
      description: 'Four cards of the same rank',
      cards: ['K♠', 'K♥', 'K♦', 'K♣', '2♠'],
      color: 'text-purple-400',
      bgColor: 'bg-purple-500/10 border-purple-500/30',
    },
    {
      rank: 4,
      name: 'Full House',
      description: 'Three of a kind plus a pair',
      cards: ['Q♠', 'Q♥', 'Q♦', '7♣', '7♠'],
      color: 'text-purple-400',
      bgColor: 'bg-purple-500/10 border-purple-500/30',
    },
    {
      rank: 5,
      name: 'Flush',
      description: 'Five cards of the same suit, not in sequence',
      cards: ['A♦', 'J♦', '8♦', '4♦', '2♦'],
      color: 'text-blue-400',
      bgColor: 'bg-blue-500/10 border-blue-500/30',
    },
    {
      rank: 6,
      name: 'Straight',
      description: 'Five cards in sequence, different suits',
      cards: ['10♠', '9♦', '8♥', '7♣', '6♠'],
      color: 'text-blue-400',
      bgColor: 'bg-blue-500/10 border-blue-500/30',
    },
    {
      rank: 7,
      name: 'Three of a Kind',
      description: 'Three cards of the same rank',
      cards: ['8♠', '8♥', '8♦', 'K♣', '4♠'],
      color: 'text-emerald-400',
      bgColor: 'bg-emerald-500/10 border-emerald-500/30',
    },
    {
      rank: 8,
      name: 'Two Pair',
      description: 'Two different pairs',
      cards: ['J♠', 'J♦', '5♥', '5♣', 'A♠'],
      color: 'text-emerald-400',
      bgColor: 'bg-emerald-500/10 border-emerald-500/30',
    },
    {
      rank: 9,
      name: 'One Pair',
      description: 'Two cards of the same rank',
      cards: ['10♥', '10♦', 'A♠', '7♣', '3♦'],
      color: 'text-zinc-300',
      bgColor: 'bg-zinc-500/10 border-zinc-500/30',
    },
    {
      rank: 10,
      name: 'High Card',
      description: 'No matching cards - highest card plays',
      cards: ['A♣', 'J♠', '8♦', '5♥', '2♣'],
      color: 'text-zinc-400',
      bgColor: 'bg-zinc-500/10 border-zinc-500/30',
    },
  ]

  const getCardColor = (card: string) => {
    if (card.includes('♥') || card.includes('♦')) {
      return 'text-red-500'
    }
    return 'text-zinc-900'
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-themed-primary mb-2">Poker Hand Rankings</h1>
        <p className="text-themed-muted">From highest to lowest - memorize these to play like a pro!</p>
      </div>

      {/* Hand Rankings Grid */}
      <div className="space-y-3">
        {hands.map((hand) => (
          <div
            key={hand.rank}
            className={`card p-4 border ${hand.bgColor} flex items-center gap-4`}
          >
            {/* Rank Number */}
            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg ${hand.color} bg-zinc-800`}>
              {hand.rank}
            </div>

            {/* Hand Info */}
            <div className="flex-1 min-w-0">
              <div className={`font-bold text-lg ${hand.color}`}>{hand.name}</div>
              <div className="text-sm text-themed-muted">{hand.description}</div>
            </div>

            {/* Card Display */}
            <div className="flex gap-1">
              {hand.cards.map((card, i) => (
                <div
                  key={i}
                  className="w-12 h-16 bg-white rounded-lg flex items-center justify-center font-bold text-lg shadow-md"
                >
                  <span className={getCardColor(card)}>{card}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Quick Tips */}
      <div className="mt-8 grid grid-cols-2 gap-4">
        <div className="card p-6">
          <h3 className="text-lg font-semibold text-emerald-400 mb-4 flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Quick Tips
          </h3>
          <ul className="space-y-2 text-sm text-zinc-400">
            <li>• <span className="text-zinc-300">Suit doesn't matter</span> when comparing hands of the same type</li>
            <li>• <span className="text-zinc-300">Ace can be high or low</span> in a straight (A-2-3-4-5 or 10-J-Q-K-A)</li>
            <li>• <span className="text-zinc-300">Kickers matter</span> when hands are tied - highest side cards win</li>
            <li>• <span className="text-zinc-300">Best 5 cards</span> from 7 available (2 hole + 5 community)</li>
          </ul>
        </div>

        <div className="card p-6">
          <h3 className="text-lg font-semibold text-amber-400 mb-4 flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            Common Mistakes
          </h3>
          <ul className="space-y-2 text-sm text-zinc-400">
            <li>• <span className="text-zinc-300">Flush beats straight</span> - many beginners get this wrong!</li>
            <li>• <span className="text-zinc-300">Full house beats flush</span> - it's harder to make</li>
            <li>• <span className="text-zinc-300">Two pair doesn't beat three of a kind</span></li>
            <li>• <span className="text-zinc-300">A-2-3-4-5</span> is the lowest straight (the "wheel")</li>
          </ul>
        </div>
      </div>

      {/* Betting Order Reference */}
      <div className="mt-4 card p-6">
        <h3 className="text-lg font-semibold text-blue-400 mb-4 flex items-center gap-2">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Texas Hold'em Game Flow
        </h3>
        <div className="flex items-center justify-between text-sm">
          <div className="text-center">
            <div className="w-16 h-16 rounded-full bg-zinc-800 flex items-center justify-center text-2xl mb-2">🃏</div>
            <div className="text-zinc-300 font-medium">Pre-Flop</div>
            <div className="text-themed-muted text-xs">2 hole cards</div>
          </div>
          <div className="text-zinc-600">→</div>
          <div className="text-center">
            <div className="w-16 h-16 rounded-full bg-zinc-800 flex items-center justify-center text-2xl mb-2">🎴</div>
            <div className="text-zinc-300 font-medium">Flop</div>
            <div className="text-themed-muted text-xs">3 community</div>
          </div>
          <div className="text-zinc-600">→</div>
          <div className="text-center">
            <div className="w-16 h-16 rounded-full bg-zinc-800 flex items-center justify-center text-2xl mb-2">🎯</div>
            <div className="text-zinc-300 font-medium">Turn</div>
            <div className="text-themed-muted text-xs">4th community</div>
          </div>
          <div className="text-zinc-600">→</div>
          <div className="text-center">
            <div className="w-16 h-16 rounded-full bg-zinc-800 flex items-center justify-center text-2xl mb-2">🏆</div>
            <div className="text-zinc-300 font-medium">River</div>
            <div className="text-themed-muted text-xs">5th community</div>
          </div>
          <div className="text-zinc-600">→</div>
          <div className="text-center">
            <div className="w-16 h-16 rounded-full bg-emerald-600/20 flex items-center justify-center text-2xl mb-2">💰</div>
            <div className="text-emerald-400 font-medium">Showdown</div>
            <div className="text-themed-muted text-xs">Best hand wins</div>
          </div>
        </div>
      </div>
    </div>
  )
}
