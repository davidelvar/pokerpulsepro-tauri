import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

describe('Tournament Calculations', () => {
  describe('Prize Pool Scenarios', () => {
    const calculatePrizePool = (
      players: { buyins: number; rebuys: number; addons: number }[],
      buyinAmount: number,
      rebuyAmount: number,
      addonAmount: number
    ) => {
      const totalBuyins = players.reduce((sum, p) => sum + p.buyins, 0)
      const totalRebuys = players.reduce((sum, p) => sum + p.rebuys, 0)
      const totalAddons = players.reduce((sum, p) => sum + p.addons, 0)
      return totalBuyins * buyinAmount + totalRebuys * rebuyAmount + totalAddons * addonAmount
    }

    it('calculates small home game (6 players, no rebuys)', () => {
      const players = Array(6).fill({ buyins: 1, rebuys: 0, addons: 0 })
      const prizePool = calculatePrizePool(players, 20, 10, 10)
      expect(prizePool).toBe(120) // 6 × $20
    })

    it('calculates medium tournament (20 players, some rebuys)', () => {
      const players = [
        ...Array(15).fill({ buyins: 1, rebuys: 0, addons: 0 }),
        ...Array(5).fill({ buyins: 1, rebuys: 1, addons: 0 }),
      ]
      const prizePool = calculatePrizePool(players, 50, 25, 25)
      expect(prizePool).toBe(1125) // 20 × $50 + 5 × $25
    })

    it('calculates large tournament with rebuys and addons', () => {
      const players = [
        ...Array(30).fill({ buyins: 1, rebuys: 0, addons: 1 }),
        ...Array(20).fill({ buyins: 1, rebuys: 2, addons: 1 }),
      ]
      const prizePool = calculatePrizePool(players, 100, 50, 25)
      // 50 buyins × $100 = 5000
      // 40 rebuys × $50 = 2000
      // 50 addons × $25 = 1250
      expect(prizePool).toBe(8250)
    })
  })

  describe('Average Stack Scenarios', () => {
    const calculateAverageStack = (
      players: { buyins: number; rebuys: number; addons: number; eliminated: boolean }[],
      startingChips: number,
      rebuyChips: number,
      addonChips: number
    ) => {
      const activePlayers = players.filter(p => !p.eliminated)
      if (activePlayers.length === 0) return 0

      const totalChips = players.reduce((sum, p) => {
        return sum + 
          p.buyins * startingChips + 
          p.rebuys * rebuyChips + 
          p.addons * addonChips
      }, 0)

      return Math.floor(totalChips / activePlayers.length)
    }

    it('calculates even stacks at tournament start', () => {
      const players = Array(9).fill({ buyins: 1, rebuys: 0, addons: 0, eliminated: false })
      const avgStack = calculateAverageStack(players, 10000, 5000, 5000)
      expect(avgStack).toBe(10000)
    })

    it('calculates stacks after eliminations', () => {
      const players = [
        ...Array(6).fill({ buyins: 1, rebuys: 0, addons: 0, eliminated: false }),
        ...Array(3).fill({ buyins: 1, rebuys: 0, addons: 0, eliminated: true }),
      ]
      // 9 buyins × 10000 = 90000 chips, 6 active players
      const avgStack = calculateAverageStack(players, 10000, 5000, 5000)
      expect(avgStack).toBe(15000)
    })

    it('calculates stacks with rebuys in play', () => {
      const players = [
        ...Array(5).fill({ buyins: 1, rebuys: 0, addons: 0, eliminated: false }),
        ...Array(3).fill({ buyins: 1, rebuys: 1, addons: 0, eliminated: false }),
        ...Array(2).fill({ buyins: 1, rebuys: 2, addons: 0, eliminated: true }),
      ]
      // Chips: 10 buyins × 10000 + 7 rebuys × 5000 = 135000
      // Active players: 8
      const avgStack = calculateAverageStack(players, 10000, 5000, 5000)
      expect(avgStack).toBe(16875)
    })

    it('handles heads-up final table', () => {
      const players = [
        { buyins: 1, rebuys: 0, addons: 0, eliminated: false },
        { buyins: 1, rebuys: 0, addons: 0, eliminated: false },
        ...Array(7).fill({ buyins: 1, rebuys: 1, addons: 0, eliminated: true }),
      ]
      // Chips: 9 buyins × 10000 + 7 rebuys × 5000 = 125000
      // Active players: 2
      const avgStack = calculateAverageStack(players, 10000, 5000, 5000)
      expect(avgStack).toBe(62500)
    })
  })

  describe('Table Balancing', () => {
    const getRecommendedTables = (playerCount: number, seatsPerTable: number) => {
      if (playerCount <= seatsPerTable) return 1
      return Math.ceil(playerCount / seatsPerTable)
    }

    const isTableBalanced = (
      tableCounts: number[],
      tolerance: number = 1
    ) => {
      const max = Math.max(...tableCounts)
      const min = Math.min(...tableCounts)
      return max - min <= tolerance
    }

    it('recommends 1 table for small group', () => {
      expect(getRecommendedTables(6, 9)).toBe(1)
      expect(getRecommendedTables(9, 9)).toBe(1)
    })

    it('recommends 2 tables for medium group', () => {
      expect(getRecommendedTables(10, 9)).toBe(2)
      expect(getRecommendedTables(15, 9)).toBe(2)
      expect(getRecommendedTables(18, 9)).toBe(2)
    })

    it('recommends correct tables for large groups', () => {
      expect(getRecommendedTables(19, 9)).toBe(3)
      expect(getRecommendedTables(27, 9)).toBe(3)
      expect(getRecommendedTables(28, 9)).toBe(4)
    })

    it('detects balanced tables', () => {
      expect(isTableBalanced([5, 5])).toBe(true)
      expect(isTableBalanced([5, 4])).toBe(true)
      expect(isTableBalanced([5, 6])).toBe(true)
    })

    it('detects unbalanced tables', () => {
      expect(isTableBalanced([7, 5])).toBe(false)
      expect(isTableBalanced([8, 5, 6])).toBe(false)
    })
  })

  describe('Blind Level Progression', () => {
    interface BlindLevel {
      smallBlind: number
      bigBlind: number
      ante: number
      durationMinutes: number
    }

    const generateBlindStructure = (
      style: 'turbo' | 'regular' | 'deep',
      levels: number
    ): BlindLevel[] => {
      const durations = { turbo: 10, regular: 15, deep: 20 }
      const duration = durations[style]
      
      const structure: BlindLevel[] = []
      let smallBlind = 25
      
      for (let i = 0; i < levels; i++) {
        const bigBlind = smallBlind * 2
        const ante = i >= 4 ? Math.floor(smallBlind / 2) : 0
        
        structure.push({
          smallBlind,
          bigBlind,
          ante,
          durationMinutes: duration,
        })
        
        // Increase blinds: ~50% increase each level
        smallBlind = Math.ceil(smallBlind * 1.5 / 25) * 25
      }
      
      return structure
    }

    it('generates turbo structure with 10-minute levels', () => {
      const structure = generateBlindStructure('turbo', 5)
      expect(structure).toHaveLength(5)
      structure.forEach(level => {
        expect(level.durationMinutes).toBe(10)
      })
    })

    it('generates regular structure with 15-minute levels', () => {
      const structure = generateBlindStructure('regular', 5)
      structure.forEach(level => {
        expect(level.durationMinutes).toBe(15)
      })
    })

    it('generates deep structure with 20-minute levels', () => {
      const structure = generateBlindStructure('deep', 5)
      structure.forEach(level => {
        expect(level.durationMinutes).toBe(20)
      })
    })

    it('has big blind always 2x small blind', () => {
      const structure = generateBlindStructure('regular', 10)
      structure.forEach(level => {
        expect(level.bigBlind).toBe(level.smallBlind * 2)
      })
    })

    it('introduces antes after level 4', () => {
      const structure = generateBlindStructure('regular', 8)
      expect(structure[3].ante).toBe(0) // Level 4 (index 3)
      expect(structure[4].ante).toBeGreaterThan(0) // Level 5 (index 4)
    })

    it('increases blinds progressively', () => {
      const structure = generateBlindStructure('regular', 10)
      for (let i = 1; i < structure.length; i++) {
        expect(structure[i].smallBlind).toBeGreaterThan(structure[i-1].smallBlind)
      }
    })
  })

  describe('Payout Calculations', () => {
    const calculatePayouts = (
      prizePool: number,
      percentages: number[]
    ): { place: number; amount: number }[] => {
      return percentages.map((pct, i) => ({
        place: i + 1,
        amount: Math.floor(prizePool * pct / 100),
      }))
    }

    it('calculates winner takes all', () => {
      const payouts = calculatePayouts(1000, [100])
      expect(payouts).toEqual([{ place: 1, amount: 1000 }])
    })

    it('calculates standard 3-way split', () => {
      const payouts = calculatePayouts(1000, [50, 30, 20])
      expect(payouts).toEqual([
        { place: 1, amount: 500 },
        { place: 2, amount: 300 },
        { place: 3, amount: 200 },
      ])
    })

    it('handles non-round numbers', () => {
      const payouts = calculatePayouts(333, [50, 30, 20])
      expect(payouts[0].amount).toBe(166) // floor(333 * 0.5)
      expect(payouts[1].amount).toBe(99)  // floor(333 * 0.3)
      expect(payouts[2].amount).toBe(66)  // floor(333 * 0.2)
    })

    it('calculates 8-place payout structure', () => {
      const percentages = [30, 18, 13, 10, 9, 8, 7, 5]
      const payouts = calculatePayouts(10000, percentages)
      
      expect(payouts).toHaveLength(8)
      expect(payouts[0].amount).toBe(3000) // 1st
      expect(payouts[7].amount).toBe(500)  // 8th
      
      const total = payouts.reduce((sum, p) => sum + p.amount, 0)
      expect(total).toBe(10000)
    })
  })
})

describe('Timer Logic', () => {
  describe('Time Formatting', () => {
    const formatTime = (seconds: number): string => {
      const mins = Math.floor(seconds / 60)
      const secs = seconds % 60
      return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
    }

    it('formats standard tournament times', () => {
      expect(formatTime(900)).toBe('15:00')  // 15 minutes
      expect(formatTime(600)).toBe('10:00')  // 10 minutes
      expect(formatTime(1200)).toBe('20:00') // 20 minutes
    })

    it('formats countdown times', () => {
      expect(formatTime(65)).toBe('01:05')
      expect(formatTime(30)).toBe('00:30')
      expect(formatTime(5)).toBe('00:05')
      expect(formatTime(0)).toBe('00:00')
    })

    it('handles long tournaments', () => {
      expect(formatTime(3600)).toBe('60:00')  // 1 hour
      expect(formatTime(7200)).toBe('120:00') // 2 hours
    })
  })

  describe('Level Progression', () => {
    it('advances to next level correctly', () => {
      let currentLevel = 0
      const totalLevels = 10
      
      const advanceLevel = () => {
        if (currentLevel < totalLevels - 1) {
          currentLevel++
        }
        return currentLevel
      }

      expect(advanceLevel()).toBe(1)
      expect(advanceLevel()).toBe(2)
      
      currentLevel = 9 // Last level
      expect(advanceLevel()).toBe(9) // Should not exceed
    })

    it('goes back to previous level correctly', () => {
      let currentLevel = 5
      
      const previousLevel = () => {
        if (currentLevel > 0) {
          currentLevel--
        }
        return currentLevel
      }

      expect(previousLevel()).toBe(4)
      expect(previousLevel()).toBe(3)
      
      currentLevel = 0
      expect(previousLevel()).toBe(0) // Should not go negative
    })
  })
})

describe('i18n Language Support', () => {
  const supportedLanguages = ['en', 'es', 'de', 'fr', 'pt', 'is']

  it('supports 6 languages', () => {
    expect(supportedLanguages).toHaveLength(6)
  })

  it('includes English as primary language', () => {
    expect(supportedLanguages).toContain('en')
  })

  it('includes European languages', () => {
    expect(supportedLanguages).toContain('es')
    expect(supportedLanguages).toContain('de')
    expect(supportedLanguages).toContain('fr')
    expect(supportedLanguages).toContain('pt')
    expect(supportedLanguages).toContain('is')
  })
})
