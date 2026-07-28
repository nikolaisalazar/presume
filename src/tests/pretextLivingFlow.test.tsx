import { fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { PretextLivingFlow } from '@/components/landing/PretextLivingFlow'

const layout = vi.hoisted(() => ({
  layoutLivingFlow: vi.fn<
    () => Array<{ x: number; y: number; text: string }> | null
  >(() => [{ x: 28, y: 28, text: 'Projected passage line' }]),
}))

vi.mock('@/components/landing/pretextLivingFlowLayout', () => layout)

class ResizeObserverMock {
  observe() {}
  disconnect() {}
}

describe('Pretext living-flow exhibit', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    layout.layoutLivingFlow.mockReturnValue([
      { x: 28, y: 28, text: 'Projected passage line' },
    ])
    vi.stubGlobal('ResizeObserver', ResizeObserverMock)
    Object.defineProperty(document, 'fonts', {
      configurable: true,
      value: { ready: new Promise(() => undefined) },
    })
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('presents the draggable headline as the exhibit heading and keeps the passage semantic', async () => {
    render(<PretextLivingFlow />)

    expect(
      screen.getByRole('heading', {
        name: 'Text responds to its surroundings.',
      })
    ).toBeInTheDocument()
    expect(
      screen.getByText(/Text usually has to appear on a page before the browser/)
    ).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Explore Pretext/i })).toHaveAttribute(
      'href',
      'https://github.com/chenglou/pretext'
    )
  })

  it('moves the headline by keyboard without automatic movement', () => {
    render(<PretextLivingFlow />)

    const headline = screen.getByRole('button', {
      name: /Movable headline/i,
    })
    const initialPosition = headline.getAttribute('data-position')

    expect(initialPosition).toBe(headline.getAttribute('data-position'))
    fireEvent.keyDown(headline, { key: 'ArrowRight' })

    expect(headline.getAttribute('data-position')).not.toBe(initialPosition)
  })

  it('edits the passage and returns to the live flow', () => {
    render(<PretextLivingFlow />)

    fireEvent.click(screen.getByRole('button', { name: 'Edit passage' }))
    const textbox = screen.getByRole('textbox', {
      name: 'Pretext demonstration passage',
    })
    fireEvent.change(textbox, { target: { value: 'A revised passage.' } })
    fireEvent.click(screen.getByRole('button', { name: 'View flow' }))

    expect(screen.getByText('A revised passage.')).toBeInTheDocument()
  })

  it('keeps readable content available when Pretext layout is unavailable', () => {
    layout.layoutLivingFlow.mockReturnValueOnce(null)

    render(<PretextLivingFlow />)

    expect(
      screen.getByText(/Text usually has to appear on a page before the browser/)
    ).toBeVisible()
    expect(screen.getByRole('button', { name: 'Edit passage' })).toBeEnabled()
  })
})
