import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { PretextMeasureDemo } from '../components/landing/PretextMeasureDemo'

function deferred<T>() {
  let resolve!: (value: T) => void
  let reject!: (reason?: unknown) => void
  const promise = new Promise<T>((next, fail) => { resolve = next; reject = fail })
  return { promise, resolve, reject }
}

describe('PretextMeasureDemo', () => {
  let fontLoad: ReturnType<typeof deferred<FontFace[]>>

  beforeEach(() => {
    fontLoad = deferred<FontFace[]>()
    Object.defineProperty(document, 'fonts', {
      configurable: true,
      value: { load: vi.fn(() => fontLoad.promise), ready: Promise.resolve() },
    })
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue({
      measureText: (text: string) => ({ width: text.length * 13 }),
    } as unknown as CanvasRenderingContext2D)
  })

  it('reserves the instrument and exposes truthful loading semantics until named Geist is ready', () => {
    const { container } = render(<PretextMeasureDemo />)
    const instrument = container.querySelector('.landing-pretext')!
    const slider = screen.getByRole('slider', { name: 'Available text width' })

    expect(document.fonts.load).toHaveBeenCalledWith(
      '540 28px Geist',
      'Text changes shape as the space around it changes.'
    )
    expect(instrument).toHaveAttribute('aria-busy', 'true')
    expect(screen.getByText('Text changes shape as the space around it changes.')).toBeInTheDocument()
    expect(screen.getByText('—')).toBeInTheDocument()
    expect(slider).toHaveAttribute('aria-valuenow', '340')
    expect(slider).toHaveAttribute('aria-valuetext', '340 pixels available width, measurement loading')
    expect(slider).toHaveAttribute('aria-disabled', 'true')
    expect(slider).toHaveAttribute('tabindex', '-1')
  })

  it('uses Pretext line layout for live readouts and keeps keyboard input bounded', async () => {
    const { container } = render(<PretextMeasureDemo />)
    fontLoad.resolve([])

    await waitFor(() => expect(container.querySelector('.landing-pretext')).toHaveAttribute('aria-busy', 'false'))
    const slider = screen.getByRole('slider', { name: 'Available text width' })
    const initialLines = Number(container.querySelector('[data-pretext-lines]')?.textContent)
    expect(initialLines).toBeGreaterThanOrEqual(2)
    expect(container.querySelectorAll('.landing-pretext__text > span')).toHaveLength(initialLines)
    expect(container.querySelector('[data-pretext-widest]')).toHaveTextContent(/^Widest line \d+px\.$/)

    fireEvent.keyDown(slider, { key: 'Home' })
    expect(slider).toHaveAttribute('aria-valuenow', '116')
    expect(Number(container.querySelector('[data-pretext-lines]')?.textContent)).toBeGreaterThan(initialLines)

    fireEvent.keyDown(slider, { key: 'ArrowRight' })
    expect(slider).toHaveAttribute('aria-valuenow', '120')
    fireEvent.keyDown(slider, { key: 'ArrowRight', shiftKey: true })
    expect(slider).toHaveAttribute('aria-valuenow', '136')
    fireEvent.keyDown(slider, { key: 'End' })
    expect(slider).toHaveAttribute('aria-valuenow', slider.getAttribute('aria-valuemax'))
    fireEvent.keyDown(slider, { key: 'ArrowRight' })
    expect(slider).toHaveAttribute('aria-valuenow', slider.getAttribute('aria-valuemax'))
  })

  it('tracks captured pointer movement one-to-one and reports immediate active state', async () => {
    const { container } = render(<PretextMeasureDemo />)
    const stage = container.querySelector<HTMLElement>('[data-pretext-stage]')!
    Object.defineProperty(stage, 'clientWidth', { configurable: true, value: 600 })
    vi.spyOn(stage, 'getBoundingClientRect').mockReturnValue({ left: 100 } as DOMRect)
    fireEvent(window, new Event('resize'))
    fontLoad.resolve([])
    await screen.findByText('Pretext measures')
    await waitFor(() => expect(container.querySelector('.landing-pretext')).toHaveAttribute('aria-busy', 'false'))

    const slider = screen.getByRole('slider', { name: 'Available text width' })
    const pointer = (type: string, clientX: number, pointerId = 7) => {
      const event = new MouseEvent(type, { bubbles: true, button: 0, clientX })
      Object.defineProperty(event, 'pointerId', { value: pointerId })
      fireEvent(slider, event)
    }
    pointer('pointerdown', 328)
    expect(slider).toHaveClass('is-dragging')
    expect(slider).toHaveAttribute('aria-valuenow', '200')
    pointer('pointerdown', 500, 8)
    pointer('pointermove', 540, 8)
    expect(slider).toHaveAttribute('aria-valuenow', '200')
    pointer('pointermove', 368)
    expect(slider).toHaveAttribute('aria-valuenow', '240')
    pointer('pointerup', 368)
    expect(slider).not.toHaveClass('is-dragging')
  })

  it('settles into a stable unavailable state when named-font preparation fails', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined)
    const { container } = render(<PretextMeasureDemo />)

    fontLoad.reject(new Error('font unavailable'))

    expect(await screen.findByRole('status')).toHaveTextContent('Live measurement unavailable.')
    expect(container.querySelector('.landing-pretext')).toHaveAttribute('aria-busy', 'false')
    expect(container.querySelector('.landing-pretext')).toHaveAttribute('data-measurement-state', 'unavailable')
    expect(screen.queryByRole('slider', { name: 'Available text width' })).not.toBeInTheDocument()
    expect(screen.getByText('Line count')).toHaveTextContent('Unavailable')
    expect(container.querySelector('[data-pretext-widest]')).toHaveTextContent('Measurement unavailable.')
  })

  it('links safely to the live demos without introducing faux product UI', () => {
    const { container } = render(<PretextMeasureDemo />)
    const link = screen.getByRole('link', { name: 'Explore Pretext’s live demos ↗' })
    expect(link).toHaveAttribute('href', 'https://chenglou.me/pretext/')
    expect(link).toHaveAttribute('target', '_blank')
    expect(link).toHaveAttribute('rel', 'noreferrer')
    expect(screen.getByText(/Presume uses those measured lines to keep each bullet within its limit\./)).toBeInTheDocument()

    const instrument = within(container.querySelector('.landing-pretext') as HTMLElement)
    expect(instrument.queryByRole('tab')).not.toBeInTheDocument()
    expect(instrument.queryByRole('button')).not.toBeInTheDocument()
    expect(container).not.toHaveTextContent(/sample resume|experience|date|warning|target/i)
  })
})
