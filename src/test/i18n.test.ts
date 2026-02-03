import { describe, it, expect } from 'vitest'
import { SUPPORTED_LANGUAGES, type LanguageCode } from '../i18n'

describe('i18n Configuration', () => {
  describe('SUPPORTED_LANGUAGES', () => {
    it('exports supported languages array', () => {
      expect(Array.isArray(SUPPORTED_LANGUAGES)).toBe(true)
      expect(SUPPORTED_LANGUAGES.length).toBeGreaterThan(0)
    })

    it('includes English as a supported language', () => {
      const english = SUPPORTED_LANGUAGES.find(lang => lang.code === 'en')
      expect(english).toBeDefined()
      expect(english?.name).toBe('English')
      expect(english?.flag).toBe('🇺🇸')
    })

    it('includes Spanish as a supported language', () => {
      const spanish = SUPPORTED_LANGUAGES.find(lang => lang.code === 'es')
      expect(spanish).toBeDefined()
      expect(spanish?.name).toBe('Español')
      expect(spanish?.flag).toBe('🇪🇸')
    })

    it('includes German as a supported language', () => {
      const german = SUPPORTED_LANGUAGES.find(lang => lang.code === 'de')
      expect(german).toBeDefined()
      expect(german?.name).toBe('Deutsch')
      expect(german?.flag).toBe('🇩🇪')
    })

    it('includes French as a supported language', () => {
      const french = SUPPORTED_LANGUAGES.find(lang => lang.code === 'fr')
      expect(french).toBeDefined()
      expect(french?.name).toBe('Français')
      expect(french?.flag).toBe('🇫🇷')
    })

    it('includes Portuguese as a supported language', () => {
      const portuguese = SUPPORTED_LANGUAGES.find(lang => lang.code === 'pt')
      expect(portuguese).toBeDefined()
      expect(portuguese?.name).toBe('Português')
      expect(portuguese?.flag).toBe('🇧🇷')
    })

    it('includes Icelandic as a supported language', () => {
      const icelandic = SUPPORTED_LANGUAGES.find(lang => lang.code === 'is')
      expect(icelandic).toBeDefined()
      expect(icelandic?.name).toBe('Íslenska')
      expect(icelandic?.flag).toBe('🇮🇸')
    })

    it('has exactly 6 supported languages', () => {
      expect(SUPPORTED_LANGUAGES.length).toBe(6)
    })

    it('each language has required properties', () => {
      SUPPORTED_LANGUAGES.forEach(lang => {
        expect(lang).toHaveProperty('code')
        expect(lang).toHaveProperty('name')
        expect(lang).toHaveProperty('flag')
        expect(typeof lang.code).toBe('string')
        expect(typeof lang.name).toBe('string')
        expect(typeof lang.flag).toBe('string')
      })
    })
  })

  describe('LanguageCode type', () => {
    it('allows valid language codes', () => {
      const validCodes: LanguageCode[] = ['en', 'es', 'de', 'fr', 'pt', 'is']
      expect(validCodes.length).toBe(6)
    })
  })
})
