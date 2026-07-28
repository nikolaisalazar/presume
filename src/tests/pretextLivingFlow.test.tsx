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
    vi.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockReturnValue(720)
    vi.spyOn(HTMLElement.prototype, 'clientHeight', 'get').mockReturnValue(320)
    vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockReturnValue({
      width: 280,
      height: 74,
      top: 0,
      right: 280,
      bottom: 74,
      left: 0,
      x: 0,
      y: 0,
      toJSON: () => ({}),
    })
    Object.defineProperty(document, 'fonts', {
      configurable: true,
      value: { ready: Promise.resolve() },
    })
  })

  afterEach(() => {
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
  })

  it('presents a subsection-owned interactive title and keeps the passage semantic', async () => {
    render(<PretextLivingFlow />)

    expect(
      screen.queryByRole('heading', {
        name: 'Text responds to its surroundings.',
      })
    ).not.toBeInTheDocument()
    expect(
      await screen.findByRole('button', {
        name: /Move “Text responds to its surroundings” by dragging or using the arrow keys/i,
      })
    ).toBeInTheDocument()
    expect(
      screen.getByText(/Changing a sentence changes where every line ends/i)
    ).toBeInTheDocument()
    expect(screen.queryByText('A working example')).not.toBeInTheDocument()
    expect(
      screen.queryByRole('link', { name: /Explore Pretext/i })
    ).not.toBeInTheDocument()
  })

  it('moves and resets the title by keyboard without automatic movement', async () => {
    render(<PretextLivingFlow />)

    const title = await screen.findByRole('button', {
      name: /Move “Text responds to its surroundings”/i,
    })
    const initialPosition = title.getAttribute('data-position')

    expect(initialPosition).toBe(title.getAttribute('data-position'))
    expect(
      screen.queryByRole('button', { name: 'Reset position' })
    ).not.toBeInTheDocument()

    fireEvent.keyDown(title, { key: 'ArrowRight' })

    expect(title.getAttribute('data-position')).not.toBe(initialPosition)
    fireEvent.click(screen.getByRole('button', { name: 'Reset position' }))
    expect(title).toHaveAttribute('data-position', initialPosition)
    expect(
      screen.queryByRole('button', { name: 'Reset position' })
    ).not.toBeInTheDocument()
  })

  it('moves farther when an arrow key is modified with Shift', async () => {
    render(<PretextLivingFlow />)

    const title = await screen.findByRole('button', {
      name: /Move “Text responds to its surroundings”/i,
    })
    const initialX = Number(title.getAttribute('data-position')?.split(',')[0])

    fireEvent.keyDown(title, { key: 'ArrowRight' })
    const fineX = Number(title.getAttribute('data-position')?.split(',')[0])
    fireEvent.click(screen.getByRole('button', { name: 'Reset position' }))
    fireEvent.keyDown(title, { key: 'ArrowRight', shiftKey: true })
    const acceleratedX = Number(
      title.getAttribute('data-position')?.split(',')[0]
    )

    expect(fineX - initialX).toBe(8)
    expect(acceleratedX - initialX).toBe(24)
  })

  it('edits the passage and returns to the live flow', async () => {
    render(<PretextLivingFlow />)

    await screen.findByRole('button', {
      name: /Move “Text responds to its surroundings”/i,
    })
    fireEvent.click(screen.getByRole('button', { name: 'Edit passage' }))
    const textbox = screen.getByRole('textbox', {
      name: 'Pretext demonstration passage',
    })
    fireEvent.change(textbox, { target: { value: 'A revised passage.' } })
    fireEvent.click(screen.getByRole('button', { name: 'View flow' }))

    expect(screen.getByText('A revised passage.')).toBeInTheDocument()
  })

  it('keeps readable content available and removes the unavailable interaction', async () => {
    layout.layoutLivingFlow.mockReturnValue(null)

    render(<PretextLivingFlow />)

    expect(
      await screen.findByText(/Changing a sentence changes where every line ends/)
    ).toBeVisible()
    expect(screen.getByRole('button', { name: 'Edit passage' })).toBeEnabled()
    expect(
      screen.queryByRole('button', {
        name: /Move “Text responds to its surroundings”/i,
      })
    ).not.toBeInTheDocument()
  })
})
