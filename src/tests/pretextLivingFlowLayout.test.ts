import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  layoutLivingFlow,
  type LivingFlowLayoutInput,
} from '@/components/landing/pretextLivingFlowLayout'

const pretext = vi.hoisted(() => ({
  prepareWithSegments: vi.fn((text: string) => ({ text })),
  layoutNextLine: vi.fn(
    (
      prepared: Readonly<{ text: string }>,
      cursor: Readonly<{ graphemeIndex: number }>,
      width: number
    ) => {
      if (cursor.graphemeIndex >= prepared.text.length) return null
      const length = Math.max(1, Math.floor(width / 10))
      const text = prepared.text.slice(
        cursor.graphemeIndex,
        cursor.graphemeIndex + length
      )
      return {
        text,
        width: text.length * 10,
        end: {
          segmentIndex: 0,
          graphemeIndex: cursor.graphemeIndex + text.length,
        },
      }
    }
  ),
}))

vi.mock('@chenglou/pretext', () => pretext)

const baseInput: LivingFlowLayoutInput = {
  text: 'abcdefghijklmnopqrstuvwxyz',
  font: '18px Geist',
  lineHeight: 30,
  stage: { width: 300, height: 150 },
  padding: 20,
  gap: 4,
  obstacle: {
    x: 120,
    y: 100,
    width: 60,
    height: 45,
    hull: [
      { x: 0, y: 0 },
      { x: 1, y: 0 },
      { x: 1, y: 1 },
      { x: 0, y: 1 },
    ],
  },
}

describe('Pretext living-flow layout', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('walks the full passage through each available slot around an obstacle', () => {
    const lines = layoutLivingFlow(baseInput)

    expect(lines?.[0]).toEqual({ x: 20, y: 20, text: 'abcdefghijklmnopqrstuvwxyz' })
    expect(lines?.slice(1)).toEqual([])
  })

  it('routes text into left and right slots when a baseline crosses the obstacle', () => {
    const lines = layoutLivingFlow({
      ...baseInput,
      text: 'a'.repeat(80),
      obstacle: {
        ...baseInput.obstacle,
        y: 45,
      },
    })

    expect(lines).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ x: 20, y: 50 }),
        expect.objectContaining({ x: 184, y: 50 }),
      ])
    )
  })

  it('leaves blocked rows empty when the obstacle spans the usable width', () => {
    const lines = layoutLivingFlow({
      ...baseInput,
      text: 'a'.repeat(100),
      stage: { width: 320, height: 220 },
      obstacle: {
        ...baseInput.obstacle,
        x: 20,
        y: 60,
        width: 280,
        height: 74,
      },
    })

    expect(lines?.some(line => [50, 80, 110].includes(line.y))).toBe(false)
    expect(lines).toEqual(
      expect.arrayContaining([expect.objectContaining({ y: 140 })])
    )
  })

  it('reuses prepared text while the obstacle moves', () => {
    const input = { ...baseInput, text: 'cache this passage' }

    layoutLivingFlow(input)
    layoutLivingFlow({
      ...input,
      obstacle: { ...input.obstacle, x: input.obstacle.x + 10 },
    })

    expect(pretext.prepareWithSegments).toHaveBeenCalledTimes(1)
  })

  it('returns an unavailable result when Pretext cannot prepare the passage', () => {
    pretext.prepareWithSegments.mockImplementationOnce(() => {
      throw new Error('font unavailable')
    })

    expect(
      layoutLivingFlow({ ...baseInput, text: 'font unavailable' })
    ).toBeNull()
  })
})
