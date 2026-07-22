import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { FitLab } from '@/components/landing/FitLab'

const pretextMocks = vi.hoisted(() => ({
  prepareWithSegments: vi.fn((text: string) => ({ text })),
  measureLineStats: vi.fn((_prepared: unknown, width: number) => ({
    lineCount: width === 180 ? 3 : width === 240 ? 2 : 1,
    maxLineWidth: width - 12.4,
  })),
}))

vi.mock('@chenglou/pretext', () => pretextMocks)

describe('Pretext Fit Lab', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    pretextMocks.prepareWithSegments.mockImplementation((text: string) => ({ text }))
    pretextMocks.measureLineStats.mockImplementation((_prepared: unknown, width: number) => ({
      lineCount: width === 180 ? 3 : width === 240 ? 2 : 1,
      maxLineWidth: width - 12.4,
    }))
    Object.defineProperty(document, 'fonts', {
      configurable: true,
      value: { ready: Promise.resolve() },
    })
  })

  it('measures editable text against explicit width and line constraints', async () => {
    render(<FitLab />)

    expect(screen.getByRole('region', { name: 'Pretext Fit Lab' })).toBeInTheDocument()
    const textbox = screen.getByRole('textbox', { name: 'Text to measure' })
    expect(textbox).toHaveValue(
      'A precise tool should make invisible constraints visible before they become surprises.'
    )

    const widthGroup = screen.getByRole('group', { name: 'Measurement width' })
    expect(widthGroup).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '240px' })).toHaveAttribute(
      'aria-pressed',
      'true'
    )
    expect(await screen.findByText('Within constraint')).toBeInTheDocument()
    expect(screen.getByText('2 line target')).toBeInTheDocument()
    expect(screen.getByText('2 lines')).toBeInTheDocument()
    expect(screen.getByText('228px')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: '180px' }))

    expect(await screen.findByText('Over constraint')).toBeInTheDocument()
    expect(screen.getByText('3 lines')).toBeInTheDocument()
    expect(screen.getByText('168px')).toBeInTheDocument()

    fireEvent.change(textbox, { target: { value: 'Edited measurement copy.' } })

    await waitFor(() => {
      expect(pretextMocks.prepareWithSegments).toHaveBeenLastCalledWith(
        'Edited measurement copy.',
        '14px Geist'
      )
    })
  })

  it('keeps editing available when measurement fails', async () => {
    pretextMocks.measureLineStats.mockImplementationOnce(() => {
      throw new Error('measurement failed')
    })

    render(<FitLab />)

    expect(await screen.findByText('Measurement unavailable')).toBeInTheDocument()
    expect(screen.getByRole('textbox', { name: 'Text to measure' })).toBeEnabled()
  })
})
