import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { Modal, AlertModal, ConfirmModal, PromptModal } from '../components/Modal'

// Mock i18n with actual modal translation keys
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        'modal.ok': 'OK',
        'modal.cancel': 'Cancel',
        'modal.confirm': 'Confirm',
        'modal.submit': 'Submit',
        'modal.notice': 'Notice',
        'modal.enterValue': 'Enter Value',
      }
      return translations[key] || key
    },
  }),
}))

describe('Modal Component', () => {
  const mockOnClose = vi.fn()

  beforeEach(() => {
    mockOnClose.mockClear()
    document.body.style.overflow = ''
  })

  it('renders when open', () => {
    render(
      <Modal isOpen={true} onClose={mockOnClose} title="Test Modal">
        <p>Modal content</p>
      </Modal>
    )
    
    expect(screen.getByText('Test Modal')).toBeInTheDocument()
    expect(screen.getByText('Modal content')).toBeInTheDocument()
  })

  it('does not render when closed', () => {
    render(
      <Modal isOpen={false} onClose={mockOnClose} title="Test Modal">
        <p>Modal content</p>
      </Modal>
    )
    
    expect(screen.queryByText('Test Modal')).not.toBeInTheDocument()
  })

  it('calls onClose when clicking close button', () => {
    render(
      <Modal isOpen={true} onClose={mockOnClose} title="Test Modal">
        <p>Content</p>
      </Modal>
    )
    
    const closeButtons = screen.getAllByRole('button')
    fireEvent.click(closeButtons[0])
    expect(mockOnClose).toHaveBeenCalled()
  })

  it('calls onClose when clicking backdrop', () => {
    render(
      <Modal isOpen={true} onClose={mockOnClose} title="Test Modal">
        <p>Content</p>
      </Modal>
    )
    
    const backdrop = document.querySelector('.bg-black\\/60')
    if (backdrop) fireEvent.click(backdrop)
    expect(mockOnClose).toHaveBeenCalled()
  })

  it('calls onClose when pressing Escape', () => {
    render(
      <Modal isOpen={true} onClose={mockOnClose} title="Test Modal">
        <p>Content</p>
      </Modal>
    )
    
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(mockOnClose).toHaveBeenCalled()
  })

  it('applies correct size class', () => {
    const { rerender } = render(
      <Modal isOpen={true} onClose={mockOnClose} title="Small Modal" size="sm">
        <p>Content</p>
      </Modal>
    )
    
    expect(document.querySelector('.max-w-sm')).toBeInTheDocument()
    
    rerender(
      <Modal isOpen={true} onClose={mockOnClose} title="Large Modal" size="lg">
        <p>Content</p>
      </Modal>
    )
    
    expect(document.querySelector('.max-w-lg')).toBeInTheDocument()
  })
})

describe('AlertModal Component', () => {
  const mockOnClose = vi.fn()

  beforeEach(() => {
    mockOnClose.mockClear()
  })

  it('renders success alert', () => {
    render(
      <AlertModal
        isOpen={true}
        onClose={mockOnClose}
        title="Success"
        message="Operation completed successfully"
        type="success"
      />
    )
    
    expect(screen.getByText('Success')).toBeInTheDocument()
    expect(screen.getByText('Operation completed successfully')).toBeInTheDocument()
  })

  it('renders error alert', () => {
    render(
      <AlertModal
        isOpen={true}
        onClose={mockOnClose}
        title="Error"
        message="Something went wrong"
        type="error"
      />
    )
    
    expect(screen.getByText('Error')).toBeInTheDocument()
    expect(screen.getByText('Something went wrong')).toBeInTheDocument()
  })

  it('renders info alert by default', () => {
    render(
      <AlertModal
        isOpen={true}
        onClose={mockOnClose}
        message="Information message"
      />
    )
    
    expect(screen.getByText('Information message')).toBeInTheDocument()
  })

  it('closes when clicking OK button', () => {
    render(
      <AlertModal
        isOpen={true}
        onClose={mockOnClose}
        message="Test message"
      />
    )
    
    fireEvent.click(screen.getByText('OK'))
    expect(mockOnClose).toHaveBeenCalled()
  })
})

describe('ConfirmModal Component', () => {
  const mockOnConfirm = vi.fn()
  const mockOnClose = vi.fn()

  beforeEach(() => {
    mockOnConfirm.mockClear()
    mockOnClose.mockClear()
  })

  it('renders with title and message', () => {
    render(
      <ConfirmModal
        isOpen={true}
        onConfirm={mockOnConfirm}
        onClose={mockOnClose}
        title="Confirm Action"
        message="Are you sure you want to proceed?"
      />
    )
    
    expect(screen.getByText('Confirm Action')).toBeInTheDocument()
    expect(screen.getByText('Are you sure you want to proceed?')).toBeInTheDocument()
  })

  it('calls onConfirm and onClose when clicking confirm button', () => {
    render(
      <ConfirmModal
        isOpen={true}
        onConfirm={mockOnConfirm}
        onClose={mockOnClose}
        title="Test Confirmation"
        message="Proceed?"
      />
    )
    
    fireEvent.click(screen.getByText('Confirm'))
    expect(mockOnConfirm).toHaveBeenCalled()
    expect(mockOnClose).toHaveBeenCalled()
  })

  it('calls onClose when clicking cancel button', () => {
    render(
      <ConfirmModal
        isOpen={true}
        onConfirm={mockOnConfirm}
        onClose={mockOnClose}
        title="Test Confirm"
        message="Proceed?"
      />
    )
    
    fireEvent.click(screen.getByText('Cancel'))
    expect(mockOnClose).toHaveBeenCalled()
  })

  it('supports danger variant', () => {
    render(
      <ConfirmModal
        isOpen={true}
        onConfirm={mockOnConfirm}
        onClose={mockOnClose}
        title="Delete"
        message="This action cannot be undone"
        variant="danger"
      />
    )
    
    const confirmButton = screen.getByText('Confirm')
    expect(confirmButton).toHaveClass('btn-danger')
  })
})

describe('PromptModal Component', () => {
  const mockOnSubmit = vi.fn()
  const mockOnClose = vi.fn()

  beforeEach(() => {
    mockOnSubmit.mockClear()
    mockOnClose.mockClear()
  })

  it('renders with title and placeholder', () => {
    render(
      <PromptModal
        isOpen={true}
        onSubmit={mockOnSubmit}
        onClose={mockOnClose}
        title="Enter Name"
        placeholder="Type here..."
      />
    )
    
    expect(screen.getByText('Enter Name')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Type here...')).toBeInTheDocument()
  })

  it('renders with default value', () => {
    render(
      <PromptModal
        isOpen={true}
        onSubmit={mockOnSubmit}
        onClose={mockOnClose}
        title="Edit Name"
        defaultValue="John Doe"
      />
    )
    
    expect(screen.getByDisplayValue('John Doe')).toBeInTheDocument()
  })

  it('submits with entered value', () => {
    render(
      <PromptModal
        isOpen={true}
        onSubmit={mockOnSubmit}
        onClose={mockOnClose}
        title="Enter Name"
      />
    )
    
    const input = screen.getByRole('textbox')
    fireEvent.change(input, { target: { value: 'Test Value' } })
    fireEvent.click(screen.getByText('Submit'))
    
    expect(mockOnSubmit).toHaveBeenCalledWith('Test Value')
  })

  it('cancels without submitting', () => {
    render(
      <PromptModal
        isOpen={true}
        onSubmit={mockOnSubmit}
        onClose={mockOnClose}
        title="Enter Name"
      />
    )
    
    fireEvent.click(screen.getByText('Cancel'))
    expect(mockOnClose).toHaveBeenCalled()
    expect(mockOnSubmit).not.toHaveBeenCalled()
  })

  it('submits on form submit', () => {
    render(
      <PromptModal
        isOpen={true}
        onSubmit={mockOnSubmit}
        onClose={mockOnClose}
        title="Enter Name"
      />
    )
    
    const input = screen.getByRole('textbox')
    fireEvent.change(input, { target: { value: 'Enter Test' } })
    
    // Submit the form
    const form = input.closest('form')
    if (form) fireEvent.submit(form)
    
    expect(mockOnSubmit).toHaveBeenCalledWith('Enter Test')
  })
})
