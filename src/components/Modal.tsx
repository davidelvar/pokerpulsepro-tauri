import { useState, useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title: string
  children: React.ReactNode
  size?: 'sm' | 'md' | 'lg'
}

export function Modal({ isOpen, onClose, title, children, size = 'md' }: ModalProps) {
  const modalRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    if (isOpen) {
      document.addEventListener('keydown', handleEscape)
      document.body.style.overflow = 'hidden'
    }
    return () => {
      document.removeEventListener('keydown', handleEscape)
      document.body.style.overflow = ''
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  const sizeClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div 
        ref={modalRef}
        className={`relative ${sizeClasses[size]} w-full mx-4 bg-themed-primary border border-themed rounded-xl shadow-2xl transform transition-all`}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-themed">
          <h3 className="text-lg font-semibold text-themed-primary">{title}</h3>
          <button
            onClick={onClose}
            className="p-1 text-themed-muted hover:text-themed-primary transition-colors rounded-lg hover:bg-themed-secondary"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-4">
          {children}
        </div>
      </div>
    </div>
  )
}

// Alert Modal
interface AlertModalProps {
  isOpen: boolean
  onClose: () => void
  title?: string
  message: string
  type?: 'success' | 'error' | 'info' | 'warning'
}

export function AlertModal({ isOpen, onClose, title, message, type = 'info' }: AlertModalProps) {
  const { t } = useTranslation()
  
  const icons = {
    success: (
      <div className="w-12 h-12 rounded-full bg-emerald-500/20 flex items-center justify-center mb-4">
        <svg className="w-6 h-6 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      </div>
    ),
    error: (
      <div className="w-12 h-12 rounded-full bg-red-500/20 flex items-center justify-center mb-4">
        <svg className="w-6 h-6 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </div>
    ),
    warning: (
      <div className="w-12 h-12 rounded-full bg-amber-500/20 flex items-center justify-center mb-4">
        <svg className="w-6 h-6 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      </div>
    ),
    info: (
      <div className="w-12 h-12 rounded-full bg-accent/20 flex items-center justify-center mb-4">
        <svg className="w-6 h-6 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </div>
    ),
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title || t('modal.notice')} size="sm">
      <div className="text-center">
        <div className="flex justify-center">{icons[type]}</div>
        <p className="text-themed-secondary mb-6">{message}</p>
        <button onClick={onClose} className="btn btn-primary w-full">
          {t('modal.ok')}
        </button>
      </div>
    </Modal>
  )
}

// Confirm Modal
interface ConfirmModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  title?: string
  message: string
  confirmText?: string
  cancelText?: string
  variant?: 'danger' | 'primary'
}

export function ConfirmModal({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title, 
  message, 
  confirmText,
  cancelText,
  variant = 'primary'
}: ConfirmModalProps) {
  const { t } = useTranslation()
  
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title || t('modal.confirm')} size="sm">
      <div>
        <p className="text-themed-secondary mb-6">{message}</p>
        <div className="flex gap-3">
          <button onClick={onClose} className="btn btn-secondary flex-1">
            {cancelText || t('modal.cancel')}
          </button>
          <button 
            onClick={() => { onConfirm(); onClose(); }} 
            className={`btn flex-1 ${variant === 'danger' ? 'btn-danger' : 'btn-primary'}`}
          >
            {confirmText || t('modal.confirm')}
          </button>
        </div>
      </div>
    </Modal>
  )
}

// Prompt Modal
interface PromptModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (value: string) => void
  title?: string
  message?: string
  placeholder?: string
  defaultValue?: string
  submitText?: string
}

export function PromptModal({ 
  isOpen, 
  onClose, 
  onSubmit, 
  title, 
  message,
  placeholder = '',
  defaultValue = '',
  submitText
}: PromptModalProps) {
  const { t } = useTranslation()
  const [value, setValue] = useState(defaultValue)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (isOpen) {
      setValue(defaultValue)
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }, [isOpen, defaultValue])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (value.trim()) {
      onSubmit(value.trim())
      onClose()
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title || t('modal.enterValue')} size="sm">
      <form onSubmit={handleSubmit}>
        {message && <p className="text-themed-secondary mb-4">{message}</p>}
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder={placeholder}
          className="w-full px-4 py-3 bg-themed-secondary border border-themed rounded-lg text-themed-primary placeholder-themed-muted focus:outline-none focus:ring-2 focus:ring-accent/50 mb-4"
        />
        <div className="flex gap-3">
          <button type="button" onClick={onClose} className="btn btn-secondary flex-1">
            {t('modal.cancel')}
          </button>
          <button type="submit" className="btn btn-primary flex-1" disabled={!value.trim()}>
            {submitText || t('modal.submit')}
          </button>
        </div>
      </form>
    </Modal>
  )
}
