import { act, fireEvent, render, screen } from '@testing-library/react'
import { StrictMode } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { PretextLivingFlow } from '@/components/landing/PretextLivingFlow'

const layout = vi.hoisted(() => ({
  layoutLivingFlow: vi.fn<
    (
      input?: Readonly<{ obstacle: Readonly<{ x: number }> }>
    ) => Array<{ x: number; y: number; text: string }> | null
  >(() => [{ x: 28, y: 28, text: 'Projected passage line' }]),
}))

vi.mock('@/components/landing/pretextLivingFlowLayout', () => layout)

let resizeCallbacks: ResizeObserverCallback[] = []

class ResizeObserverMock {
  constructor(callback: ResizeObserverCallback) {
    resizeCallbacks.push(callback)
  }
  observe() {}
  disconnect() {}
}

describe('Pretext living-flow exhibit', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    resizeCallbacks = []
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

  it('moves the title by keyboard without adding a reset control', async () => {
    render(<PretextLivingFlow />)

    const title = await screen.findByRole('button', {
      name: /Move “Text responds to its surroundings”/i,
    })
    const initialPosition = title.getAttribute('data-position')
    const initialTransform = title.style.transform

    expect(initialPosition).toBe(title.getAttribute('data-position'))
    expect(
      screen.queryByRole('button', { name: 'Reset position' })
    ).not.toBeInTheDocument()

    fireEvent.keyDown(title, { key: 'ArrowRight' })

    expect(title.getAttribute('data-position')).not.toBe(initialPosition)
    expect(title.style.transform).not.toBe(initialTransform)
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

    fireEvent.keyDown(title, { key: 'ArrowRight', shiftKey: true })
    const acceleratedX = Number(title.getAttribute('data-position')?.split(',')[0])

    expect(acceleratedX - initialX).toBe(24)
  })

  it('keeps the visible stair synchronized when the stage resizes after movement', async () => {
    render(<PretextLivingFlow />)

    const title = await screen.findByRole('button', {
      name: /Move “Text responds to its surroundings”/i,
    })
    const stage = title.closest('.pretext-living-flow__stage')
    expect(stage).toBeInstanceOf(HTMLElement)

    fireEvent.keyDown(title, { key: 'ArrowRight' })

    Object.defineProperties(stage, {
      clientWidth: {
        configurable: true,
        get: () => 500,
      },
      clientHeight: {
        configurable: true,
        get: () => 260,
      },
    })

    act(() => {
      resizeCallbacks.forEach(callback =>
        callback([], {} as ResizeObserver)
      )
    })

    expect(title).toHaveAttribute('data-position', '212,64')
    expect(title.style.transform).toBe('translate3d(212px, 64px, 0)')
  })

  it('accepts positions that add another visible passage row', async () => {
    layout.layoutLivingFlow.mockImplementation(input =>
      (input?.obstacle.x ?? 0) > 375
        ? [
            { x: 28, y: 28, text: 'First row' },
            { x: 28, y: 58, text: 'Second row' },
          ]
        : [{ x: 28, y: 28, text: 'First row' }]
    )

    render(<PretextLivingFlow />)

    const title = await screen.findByRole('button', {
      name: /Move “Text responds to its surroundings”/i,
    })
    const initialPosition = title.getAttribute('data-position')

    fireEvent.keyDown(title, { key: 'ArrowRight' })

    expect(title).not.toHaveAttribute('data-position', initialPosition)
  })

  it('reserves a stable stage height while the passage changes row count', async () => {
    layout.layoutLivingFlow.mockImplementation(input =>
      (input?.obstacle.x ?? 0) > 375
        ? [
            { x: 28, y: 28, text: 'First row' },
            { x: 28, y: 58, text: 'Second row' },
          ]
        : [{ x: 28, y: 28, text: 'First row' }]
    )

    render(<PretextLivingFlow />)

    const title = await screen.findByRole('button', {
      name: /Move “Text responds to its surroundings”/i,
    })
    const stage = title.closest('.pretext-living-flow__stage')
    expect(stage).toBeInstanceOf(HTMLElement)

    await act(async () => {})
    const reservedHeight = (stage as HTMLElement).style.height
    expect(reservedHeight).toBe('96px')

    fireEvent.keyDown(title, { key: 'ArrowRight' })

    expect((stage as HTMLElement).style.height).toBe(reservedHeight)
  })

  it('reuses the validated candidate layout after keyboard movement', async () => {
    render(<PretextLivingFlow />)

    const title = await screen.findByRole('button', {
      name: /Move “Text responds to its surroundings”/i,
    })
    await screen.findByText('Projected passage line')
    const callsBeforeMovement = layout.layoutLivingFlow.mock.calls.length

    fireEvent.keyDown(title, { key: 'ArrowRight' })

    expect(layout.layoutLivingFlow.mock.calls.length - callsBeforeMovement).toBe(
      1
    )
  })

  it('performs one keyboard layout calculation in React Strict Mode', async () => {
    render(
      <StrictMode>
        <PretextLivingFlow />
      </StrictMode>
    )

    const title = await screen.findByRole('button', {
      name: /Move “Text responds to its surroundings”/i,
    })
    await screen.findByText('Projected passage line')
    const callsBeforeMovement = layout.layoutLivingFlow.mock.calls.length

    fireEvent.keyDown(title, { key: 'ArrowRight' })

    expect(layout.layoutLivingFlow.mock.calls.length - callsBeforeMovement).toBe(
      1
    )
  })

  it('cancels default pointer behavior when a drag starts', async () => {
    vi.stubGlobal('PointerEvent', MouseEvent)
    Object.defineProperties(HTMLElement.prototype, {
      setPointerCapture: {
        configurable: true,
        value: vi.fn(),
      },
      hasPointerCapture: {
        configurable: true,
        value: vi.fn(() => true),
      },
    })

    render(<PretextLivingFlow />)

    const title = await screen.findByRole('button', {
      name: /Move “Text responds to its surroundings”/i,
    })

    expect(
      fireEvent.pointerDown(title, {
        pointerId: 1,
        clientX: 20,
        clientY: 20,
      })
    ).toBe(false)
  })

  it('does not start a drag from a secondary pointer button', async () => {
    const setPointerCapture = vi.fn()
    vi.stubGlobal('PointerEvent', MouseEvent)
    Object.defineProperties(HTMLElement.prototype, {
      setPointerCapture: {
        configurable: true,
        value: setPointerCapture,
      },
      hasPointerCapture: {
        configurable: true,
        value: vi.fn(() => false),
      },
    })

    render(<PretextLivingFlow />)

    const title = await screen.findByRole('button', {
      name: /Move “Text responds to its surroundings”/i,
    })

    expect(
      fireEvent.pointerDown(title, {
        pointerId: 1,
        button: 2,
        clientX: 20,
        clientY: 20,
      })
    ).toBe(true)
    expect(setPointerCapture).not.toHaveBeenCalled()
  })

  it('reuses drag-start geometry without layout reads during pointer frames', async () => {
    const frames: FrameRequestCallback[] = []
    vi.stubGlobal(
      'requestAnimationFrame',
      vi.fn((callback: FrameRequestCallback) => {
        frames.push(callback)
        return frames.length
      })
    )
    vi.stubGlobal('cancelAnimationFrame', vi.fn())
    vi.stubGlobal('PointerEvent', MouseEvent)
    Object.defineProperties(HTMLElement.prototype, {
      setPointerCapture: {
        configurable: true,
        value: vi.fn(),
      },
      hasPointerCapture: {
        configurable: true,
        value: vi.fn(() => true),
      },
    })

    render(<PretextLivingFlow />)

    const title = await screen.findByRole('button', {
      name: /Move “Text responds to its surroundings”/i,
    })
    const stage = title.closest('.pretext-living-flow__stage')
    expect(stage).toBeInstanceOf(HTMLElement)

    const titleRect = vi.spyOn(title, 'getBoundingClientRect')
    const stageRect = vi.spyOn(
      stage as HTMLElement,
      'getBoundingClientRect'
    )

    fireEvent.pointerDown(title, {
      pointerId: 1,
      clientX: 20,
      clientY: 20,
    })
    const titleReadsAtDragStart = titleRect.mock.calls.length
    const stageReadsAtDragStart = stageRect.mock.calls.length

    fireEvent.pointerMove(title, {
      pointerId: 1,
      clientX: 120,
      clientY: 100,
    })
    act(() => frames.shift()?.(0))
    fireEvent.pointerMove(title, {
      pointerId: 1,
      clientX: 160,
      clientY: 120,
    })
    act(() => frames.shift()?.(16))

    expect(titleRect).toHaveBeenCalledTimes(titleReadsAtDragStart)
    expect(stageRect).toHaveBeenCalledTimes(stageReadsAtDragStart)
  })

  it('updates the stair and projected line layer in every pointer frame', async () => {
    const frames: FrameRequestCallback[] = []
    vi.stubGlobal(
      'requestAnimationFrame',
      vi.fn((callback: FrameRequestCallback) => {
        frames.push(callback)
        return frames.length
      })
    )
    vi.stubGlobal('cancelAnimationFrame', vi.fn())
    vi.stubGlobal('PointerEvent', MouseEvent)
    Object.defineProperties(HTMLElement.prototype, {
      setPointerCapture: {
        configurable: true,
        value: vi.fn(),
      },
      hasPointerCapture: {
        configurable: true,
        value: vi.fn(() => true),
      },
    })

    render(<PretextLivingFlow />)

    const title = await screen.findByRole('button', {
      name: /Move “Text responds to its surroundings”/i,
    })
    await screen.findByText('Projected passage line')
    const callsBeforeMovement = layout.layoutLivingFlow.mock.calls.length

    fireEvent.pointerDown(title, {
      pointerId: 1,
      clientX: 20,
      clientY: 20,
    })
    fireEvent.pointerMove(title, {
      pointerId: 1,
      clientX: 120,
      clientY: 100,
    })
    expect(layout.layoutLivingFlow.mock.calls.length).toBe(callsBeforeMovement)
    act(() => frames.shift()?.(0))
    expect(layout.layoutLivingFlow.mock.calls.length - callsBeforeMovement).toBe(
      1
    )

    fireEvent.pointerMove(title, {
      pointerId: 1,
      clientX: 160,
      clientY: 120,
    })
    act(() => frames.shift()?.(16))
    expect(layout.layoutLivingFlow.mock.calls.length - callsBeforeMovement).toBe(
      2
    )
    expect(title.style.transform).toContain('140px')

    fireEvent.pointerMove(title, {
      pointerId: 1,
      clientX: 210,
      clientY: 140,
    })
    act(() => frames.shift()?.(32))
    expect(layout.layoutLivingFlow.mock.calls.length - callsBeforeMovement).toBe(
      3
    )
    expect(title.style.transform).toContain('190px')
  })

  it('keeps readable content available and removes unavailable or secondary controls', async () => {
    layout.layoutLivingFlow.mockReturnValue(null)

    render(<PretextLivingFlow />)

    expect(
      await screen.findByText(/Changing a sentence changes where every line ends/)
    ).toBeVisible()
    expect(
      screen.getByText(/Changing a sentence changes where every line ends/)
    ).toHaveClass('landing-origins__passage')
    expect(
      screen.queryByRole('button', { name: 'Edit passage' })
    ).not.toBeInTheDocument()
    expect(
      screen.queryByRole('button', { name: 'Reset position' })
    ).not.toBeInTheDocument()
    expect(
      screen.queryByRole('button', {
        name: /Move “Text responds to its surroundings”/i,
      })
    ).not.toBeInTheDocument()
  })

  it('clears projected visual lines when layout becomes unavailable', async () => {
    render(<PretextLivingFlow />)

    expect(await screen.findByText('Projected passage line')).toBeInTheDocument()

    layout.layoutLivingFlow.mockReturnValue(null)
    act(() => {
      resizeCallbacks.forEach(callback =>
        callback([], {} as ResizeObserver)
      )
    })

    expect(screen.queryByText('Projected passage line')).not.toBeInTheDocument()
    expect(
      screen.getByText(/Changing a sentence changes where every line ends/)
    ).toHaveClass('pretext-living-flow__fallback')
  })

  it('keeps the live exhibit focused on dragging without edit or reset controls', async () => {
    render(<PretextLivingFlow />)

    expect(
      await screen.findByRole('button', {
        name: /Move “Text responds to its surroundings”/i,
      })
    ).toBeInTheDocument()
    expect(
      screen.queryByRole('button', { name: 'Edit passage' })
    ).not.toBeInTheDocument()
    expect(
      screen.queryByRole('button', { name: 'Reset position' })
    ).not.toBeInTheDocument()
  })
})
