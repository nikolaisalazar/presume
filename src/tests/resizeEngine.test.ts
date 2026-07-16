import { act, createElement, createRef } from 'react'
import { render, renderHook, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { DEFAULT_CONSTRAINTS } from '../constraints'
import type { Resume } from '../types'
import { useResizeEngine } from '../useResizeEngine'

const pretextMocks = vi.hoisted(() => ({
  prepareWithSegments: vi.fn((text: string, font: string) => ({ text, font })),
  measureLineStats: vi.fn((prepared: unknown) => {
    const { text } = prepared as { text: string }
    return { lineCount: text === 'impossible' ? 2 : 1 }
  }),
}))

vi.mock('@chenglou/pretext', () => pretextMocks)

function makeResume(bullets: string[]): Resume {
  return {
    name: 'Test',
    contact: [],
    sections: [
      {
        title: 'Experience',
        entries: [
          {
            title: '',
            subtitle: '',
            location: '',
            dateRange: '',
            bullets,
          },
        ],
      },
    ],
  }
}

function installFontReadiness(ready: Promise<unknown>): void {
  Object.defineProperty(document, 'fonts', {
    configurable: true,
    value: { ready },
  })
}

function renderMeasuredPage(
  measureHeight: (scale: number) => number
): React.RefObject<HTMLDivElement | null> {
  const pageRef = createRef<HTMLDivElement>()
  render(createElement('div', { ref: pageRef, className: 'resume-page' }))
  pageRef.current!.getBoundingClientRect = vi.fn(() => {
    const scale = Number(
      document.documentElement.style.getPropertyValue('--global-scale')
    )
    return { height: measureHeight(scale) } as DOMRect
  })
  return pageRef
}

function deferred(): {
  promise: Promise<void>
  resolve: () => void
} {
  let resolve!: () => void
  const promise = new Promise<void>(complete => {
    resolve = complete
  })
  return { promise, resolve }
}

describe('useResizeEngine', () => {
  beforeEach(() => {
    pretextMocks.prepareWithSegments.mockClear()
    pretextMocks.measureLineStats.mockClear()
  })

  afterEach(() => {
    const root = document.documentElement
    root.style.removeProperty('--global-scale')
    root.style.removeProperty('--resume-layout-scale')
    root.style.removeProperty('--resume-presentation-scale')
  })

  it('adapts Pretext and DOM measurements while restoring presentation variables', async () => {
    installFontReadiness(Promise.resolve())
    const root = document.documentElement
    root.style.setProperty('--resume-layout-scale', '4.5')
    root.style.setProperty(
      '--resume-presentation-scale',
      '0.2222222222222222'
    )
    const pageRef = renderMeasuredPage(scale =>
      scale <= 1.25 ? 1056 : 1200
    )

    const { result } = renderHook(() =>
      useResizeEngine(makeResume(['short']), DEFAULT_CONSTRAINTS, pageRef)
    )

    await waitFor(() => expect(result.current.isReady).toBe(true))

    expect(result.current.globalScale).toBeGreaterThanOrEqual(1.249)
    expect(result.current.globalScale).toBeLessThanOrEqual(1.25)
    expect(Number(root.style.getPropertyValue('--global-scale'))).toBe(
      result.current.globalScale
    )
    expect(root.style.getPropertyValue('--resume-layout-scale')).toBe('4.5')
    expect(root.style.getPropertyValue('--resume-presentation-scale')).toBe(
      '0.2222222222222222'
    )
    expect(pretextMocks.prepareWithSegments).toHaveBeenCalled()
    expect(pretextMocks.measureLineStats).toHaveBeenCalled()
  })

  it('does not let stale font-ready work overwrite the latest resume fit', async () => {
    const firstFontsReady = deferred()
    const latestFontsReady = deferred()
    let readinessReadCount = 0
    Object.defineProperty(document, 'fonts', {
      configurable: true,
      value: {
        get ready() {
          readinessReadCount += 1
          return readinessReadCount === 1
            ? firstFontsReady.promise
            : latestFontsReady.promise
        },
      },
    })
    const pageRef = renderMeasuredPage(scale =>
      scale <= 1.25 ? 1056 : 1200
    )
    const initialResume = makeResume(['short'])
    const latestResume = makeResume(['impossible'])

    const { result, rerender } = renderHook(
      ({ resume }: { resume: Resume }) =>
        useResizeEngine(resume, DEFAULT_CONSTRAINTS, pageRef),
      { initialProps: { resume: initialResume } }
    )

    rerender({ resume: latestResume })
    await act(async () => {
      latestFontsReady.resolve()
      await latestFontsReady.promise
    })
    await waitFor(() => expect(result.current.isReady).toBe(true))

    expect(result.current.globalScale).toBe(0.8)
    expect(result.current.warnings.bullets).toEqual([
      { sectionIndex: 0, entryIndex: 0, bulletIndex: 0 },
    ])

    await act(async () => {
      firstFontsReady.resolve()
      await firstFontsReady.promise
    })

    expect(result.current.isReady).toBe(true)
    expect(result.current.globalScale).toBe(0.8)
    expect(result.current.warnings.bullets).toEqual([
      { sectionIndex: 0, entryIndex: 0, bulletIndex: 0 },
    ])
    expect(document.documentElement.style.getPropertyValue('--global-scale')).toBe(
      '0.8'
    )
  })
})
