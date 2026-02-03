import { useState, useEffect, useCallback } from 'react'
import { useTranslation } from 'react-i18next'

interface OnboardingProps {
  onComplete: () => void
  onSkip: () => void
}

interface Step {
  key: string
  icon: JSX.Element
  highlight?: string // data-onboarding attribute value to highlight
}

export function Onboarding({ onComplete, onSkip }: OnboardingProps) {
  const { t } = useTranslation()
  const [currentStep, setCurrentStep] = useState(0)
  const [highlightRect, setHighlightRect] = useState<DOMRect | null>(null)

  const steps: Step[] = [
    {
      key: 'welcome',
      icon: (
        <svg width="80" height="80" fill="none" viewBox="0 0 24 24" stroke="#10b981">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
    {
      key: 'timer',
      highlight: 'timer',
      icon: (
        <svg width="80" height="80" fill="none" viewBox="0 0 24 24" stroke="#10b981">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
    {
      key: 'players',
      highlight: 'players',
      icon: (
        <svg width="80" height="80" fill="none" viewBox="0 0 24 24" stroke="#10b981">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      ),
    },
    {
      key: 'blinds',
      highlight: 'blinds',
      icon: (
        <svg width="80" height="80" fill="none" viewBox="0 0 24 24" stroke="#10b981">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      ),
    },
    {
      key: 'prizes',
      highlight: 'prizes',
      icon: (
        <svg width="80" height="80" fill="none" viewBox="0 0 24 24" stroke="#10b981">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
    {
      key: 'settings',
      highlight: 'settings',
      icon: (
        <svg width="80" height="80" fill="none" viewBox="0 0 24 24" stroke="#10b981">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ),
    },
    {
      key: 'projector',
      highlight: 'projector',
      icon: (
        <svg width="80" height="80" fill="none" viewBox="0 0 24 24" stroke="#10b981">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
      ),
    },
    {
      key: 'fullscreen',
      highlight: 'fullscreen',
      icon: (
        <svg width="80" height="80" fill="none" viewBox="0 0 24 24" stroke="#10b981">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15M20.25 3.75h-4.5m4.5 0v4.5m0-4.5L15 9m5.25 11.25h-4.5m4.5 0v-4.5m0 4.5L15 15" />
        </svg>
      ),
    },
    {
      key: 'ready',
      icon: (
        <svg width="80" height="80" fill="none" viewBox="0 0 24 24" stroke="#10b981">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
  ]

  const currentStepData = steps[currentStep]
  const isLastStep = currentStep === steps.length - 1
  const isFirstStep = currentStep === 0

  // Find and highlight the target element
  const updateHighlight = useCallback(() => {
    const highlight = currentStepData.highlight
    if (highlight) {
      const element = document.querySelector(`[data-onboarding="${highlight}"]`)
      if (element) {
        const rect = element.getBoundingClientRect()
        setHighlightRect(rect)
        return
      }
    }
    setHighlightRect(null)
  }, [currentStepData.highlight])

  useEffect(() => {
    updateHighlight()
    // Also update on window resize
    window.addEventListener('resize', updateHighlight)
    return () => window.removeEventListener('resize', updateHighlight)
  }, [updateHighlight])

  const handleNext = () => {
    if (isLastStep) {
      onComplete()
    } else {
      setCurrentStep(currentStep + 1)
    }
  }

  const handlePrev = () => {
    if (!isFirstStep) {
      setCurrentStep(currentStep - 1)
    }
  }

  // Get features as array safely
  const getFeatures = (): string[] => {
    const features = t(`onboarding.steps.${currentStepData.key}.features`, { returnObjects: true, defaultValue: null })
    if (Array.isArray(features)) {
      return features.filter((f): f is string => typeof f === 'string')
    }
    return []
  }

  const features = getFeatures()

  // Calculate card position - position near the highlighted element if there is one
  const getCardPosition = () => {
    if (!highlightRect) {
      return { top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }
    }
    
    // Position card to the right of the highlighted element with some offset
    const cardWidth = 500
    const cardHeight = 400
    const padding = 24
    const windowWidth = window.innerWidth
    const windowHeight = window.innerHeight
    
    // Try to position to the right of the element
    let left = highlightRect.right + padding
    let top = highlightRect.top + (highlightRect.height / 2) - (cardHeight / 2)
    
    // If it would go off the right edge, position to the left instead
    if (left + cardWidth > windowWidth - padding) {
      left = highlightRect.left - cardWidth - padding
    }
    
    // If it would go off the left edge, center it
    if (left < padding) {
      left = (windowWidth - cardWidth) / 2
    }
    
    // Keep within vertical bounds
    if (top < padding) top = padding
    if (top + cardHeight > windowHeight - padding) {
      top = windowHeight - cardHeight - padding
    }
    
    return { top: `${top}px`, left: `${left}px`, transform: 'none' }
  }

  const cardPosition = getCardPosition()

  return (
    <>
      {/* Backdrop with cutout for highlighted element */}
      <div style={{ position: 'fixed', inset: 0, zIndex: 9998, pointerEvents: 'none' }}>
        <svg width="100%" height="100%" style={{ position: 'absolute', inset: 0 }}>
          <defs>
            <mask id="spotlight-mask">
              <rect width="100%" height="100%" fill="white" />
              {highlightRect && (
                <rect
                  x={highlightRect.left - 8}
                  y={highlightRect.top - 8}
                  width={highlightRect.width + 16}
                  height={highlightRect.height + 16}
                  rx="12"
                  fill="black"
                />
              )}
            </mask>
          </defs>
          <rect
            width="100%"
            height="100%"
            fill="rgba(0, 0, 0, 0.75)"
            mask="url(#spotlight-mask)"
            style={{ backdropFilter: 'blur(4px)' }}
          />
        </svg>
      </div>

      {/* Highlight ring around element */}
      {highlightRect && (
        <div
          style={{
            position: 'fixed',
            left: highlightRect.left - 8,
            top: highlightRect.top - 8,
            width: highlightRect.width + 16,
            height: highlightRect.height + 16,
            borderRadius: '12px',
            border: '2px solid #10b981',
            boxShadow: '0 0 0 4px rgba(16, 185, 129, 0.3), 0 0 20px rgba(16, 185, 129, 0.5)',
            zIndex: 9999,
            pointerEvents: 'none',
            animation: 'pulse-ring 2s ease-in-out infinite',
          }}
        />
      )}

      {/* Clickable overlay to prevent interaction */}
      <div
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 9998,
        }}
        onClick={(e) => e.stopPropagation()}
      />

      {/* Main content card */}
      <div
        style={{
          position: 'fixed',
          zIndex: 10000,
          width: '100%',
          maxWidth: '500px',
          padding: '0 16px',
          ...cardPosition,
        }}
      >
        {/* Card */}
        <div
          style={{
            padding: '28px',
            backgroundColor: '#18181b',
            borderRadius: '16px',
            border: '1px solid #3f3f46',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7)',
            position: 'relative',
          }}
        >
          {/* Skip button - top right of card */}
          {!isLastStep && (
            <button
              onClick={onSkip}
              style={{
                position: 'absolute',
                top: '12px',
                right: '12px',
                color: '#71717a',
                fontSize: '13px',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                background: 'none',
                border: '1px solid #3f3f46',
                borderRadius: '6px',
                padding: '6px 12px',
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.color = '#a1a1aa'
                e.currentTarget.style.borderColor = '#52525b'
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.color = '#71717a'
                e.currentTarget.style.borderColor = '#3f3f46'
              }}
            >
              {t('onboarding.skip')}
              <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}

          {/* Progress dots */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginBottom: '24px' }}>
            {steps.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentStep(index)}
                style={{
                  width: index === currentStep ? '28px' : '10px',
                  height: '10px',
                  borderRadius: '9999px',
                  border: 'none',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  backgroundColor:
                    index === currentStep
                      ? '#10b981'
                      : index < currentStep
                      ? 'rgba(16, 185, 129, 0.5)'
                      : '#3f3f46',
                }}
              />
            ))}
          </div>

          {/* Content */}
          <div style={{ textAlign: 'center', marginBottom: '24px' }}>
            {/* Icon */}
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '20px' }}>
              {currentStepData.icon}
            </div>

            {/* Title */}
            <h2 style={{ fontSize: '22px', fontWeight: 'bold', color: '#ffffff', marginBottom: '12px' }}>
              {t(`onboarding.steps.${currentStepData.key}.title`)}
            </h2>

            {/* Description */}
            <p style={{ color: '#d4d4d8', fontSize: '16px', lineHeight: 1.6, maxWidth: '380px', margin: '0 auto' }}>
              {t(`onboarding.steps.${currentStepData.key}.description`)}
            </p>

            {/* Features list */}
            {features.length > 0 && (
              <ul style={{ marginTop: '20px', textAlign: 'left', maxWidth: '320px', margin: '20px auto 0', listStyle: 'none', padding: 0 }}>
                {features.map((feature, i) => (
                  <li
                    key={i}
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '8px',
                      color: '#d4d4d8',
                      marginBottom: '6px',
                      fontSize: '14px',
                    }}
                  >
                    <svg
                      width="18"
                      height="18"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="#10b981"
                      style={{ flexShrink: 0, marginTop: '2px' }}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Navigation buttons */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <button
              onClick={handlePrev}
              disabled={isFirstStep}
              style={{
                display: 'flex',
                alignItems: 'center',
                padding: '10px 20px',
                backgroundColor: 'transparent',
                color: isFirstStep ? 'transparent' : '#d4d4d8',
                border: isFirstStep ? 'none' : '1px solid #3f3f46',
                borderRadius: '8px',
                cursor: isFirstStep ? 'default' : 'pointer',
                fontSize: '14px',
              }}
            >
              <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ marginRight: '4px' }}>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              {t('onboarding.previous')}
            </button>

            <span style={{ color: '#71717a', fontSize: '14px' }}>
              {currentStep + 1} / {steps.length}
            </span>

            <button
              onClick={handleNext}
              style={{
                display: 'flex',
                alignItems: 'center',
                padding: '10px 20px',
                backgroundColor: '#10b981',
                color: '#ffffff',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: 500,
              }}
            >
              {isLastStep ? t('onboarding.getStarted') : t('onboarding.next')}
              {!isLastStep && (
                <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ marginLeft: '4px' }}>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* Hint */}
        <p style={{ textAlign: 'center', color: '#71717a', fontSize: '13px', marginTop: '12px' }}>
          {t('onboarding.accessLater')}
        </p>
      </div>

      {/* CSS Animation for pulse effect */}
      <style>{`
        @keyframes pulse-ring {
          0%, 100% {
            box-shadow: 0 0 0 4px rgba(16, 185, 129, 0.3), 0 0 20px rgba(16, 185, 129, 0.5);
          }
          50% {
            box-shadow: 0 0 0 8px rgba(16, 185, 129, 0.1), 0 0 30px rgba(16, 185, 129, 0.7);
          }
        }
      `}</style>
    </>
  )
}
