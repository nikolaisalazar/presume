import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { ResumePage } from '../components/ResumePage'
import { ReviewPanel } from '../components/ReviewPanel'
import type { ResumeReviewState } from '../useResumeReview'
import type { ReviewResult } from '../reviewTypes'
import type { Resume } from '../types'

const resume: Resume = {
  name: 'Ada Lovelace',
  contact: ['ada@example.test'],
  sections: [
    {
      title: 'Experience',
      entries: [
        {
          title: 'Engineer',
          subtitle: 'Analytical Engines',
          location: 'London',
          dateRange: '1842 - 1843',
          bullets: ['Documented a general-purpose computing system.'],
        },
        {
          title: 'Analyst',
          subtitle: 'Difference Institute',
          location: 'London',
          dateRange: '1841 - 1842',
          bullets: ['Maintained duplicate title coverage.'],
        },
      ],
    },
    {
      title: 'Projects',
      entries: [
        {
          title: 'Compiler Notes',
          subtitle: 'Independent',
          location: 'Remote',
          dateRange: '1843',
          bullets: ['Translated notes into an executable process.'],
        },
      ],
    },
  ],
}

const reviewResult: ReviewResult = {
  id: 'review_123',
  reviewedAt: '2026-06-29T12:00:00Z',
  totalScore: 72,
  maxScore: 100,
  tier: 'competitive',
  categories: [
    {
      key: 'production',
      label: 'Production Experience',
      score: 18,
      maxScore: 25,
      evidence: ['Experience section shows engineering work.'],
      suggestions: ['Clarify user or business impact.'],
    },
  ],
  strengths: ['Clear technical ownership.'],
  improvements: ['Quantify production impact.'],
  bonuses: [{ label: 'Open source signal', points: 3, evidence: 'Public work.' }],
  deductions: [{ label: 'Missing scale', points: -2 }],
  annotations: [
    {
      id: 'ann_1',
      sectionTitle: 'Experience',
      entryTitle: 'Engineer',
      bulletText: 'Documented a general-purpose computing system.',
      message: 'Add measurable impact.',
      severity: 'warning',
    },
  ],
}

describe('ReviewPanel', () => {
  it('renders the unconfigured state without requesting review', () => {
    const onRequestReview = vi.fn()

    render(
      <ReviewPanel state={{ status: 'unconfigured' }} onRequestReview={onRequestReview} />
    )

    expect(screen.getByText('Review service not configured')).toBeInTheDocument()
    const button = screen.getByRole('button', { name: 'Review resume' })
    expect(button).toBeDisabled()

    fireEvent.click(button)

    expect(onRequestReview).not.toHaveBeenCalled()
  })

  it('renders successful review details as advisory findings', () => {
    render(
      <ReviewPanel
        state={{ status: 'success', result: reviewResult }}
        onRequestReview={vi.fn()}
      />
    )

    expect(screen.getByText('72 / 100')).toBeInTheDocument()
    expect(screen.getByText('Competitive')).toBeInTheDocument()
    expect(screen.getByText('Production Experience')).toBeInTheDocument()
    expect(screen.getByText('Clear technical ownership.')).toBeInTheDocument()
    expect(screen.getByText('Quantify production impact.')).toBeInTheDocument()
    expect(screen.getByText('Open source signal')).toBeInTheDocument()
    expect(screen.getByText('Missing scale')).toBeInTheDocument()
    expect(screen.getByText('Add measurable impact.')).toBeInTheDocument()
    expect(screen.getByText('Advisory only')).toBeInTheDocument()
  })

  it('keeps stale review results visible with a stale label', () => {
    const state: ResumeReviewState = { status: 'stale', result: reviewResult }

    render(<ReviewPanel state={state} onRequestReview={vi.fn()} />)

    expect(screen.getByText('Review is stale')).toBeInTheDocument()
    expect(screen.getByText('72 / 100')).toBeInTheDocument()
  })
})

describe('review annotations', () => {
  it('renders an inline annotation for one exact bullet match', () => {
    render(
      <ResumePage
        resume={resume}
        warnings={new Map()}
        reviewAnnotations={reviewResult.annotations}
        onResumeChange={vi.fn()}
      />
    )

    const bullet = screen
      .getByText('Documented a general-purpose computing system.')
      .closest('li')

    expect(bullet).toHaveClass('bullet-item--review-warning')
    expect(screen.getByLabelText('Review note: Add measurable impact.')).toBeInTheDocument()
  })

  it('does not render inline annotations for ambiguous matches', () => {
    const ambiguousResume: Resume = {
      ...resume,
      sections: [
        {
          ...resume.sections[0],
          entries: resume.sections[0].entries.map(entry => ({
            ...entry,
            title: 'Engineer',
          })),
        },
        resume.sections[1],
      ],
    }

    render(
      <ResumePage
        resume={ambiguousResume}
        warnings={new Map()}
        reviewAnnotations={[
          {
            id: 'ann_ambiguous',
            entryTitle: 'Engineer',
            message: 'Ambiguous entry title.',
            severity: 'info',
          },
        ]}
        onResumeChange={vi.fn()}
      />
    )

    expect(screen.queryByLabelText('Review note: Ambiguous entry title.')).not.toBeInTheDocument()
  })

  it('keeps formatting warnings visually distinct from review annotations', () => {
    render(
      <ResumePage
        resume={resume}
        warnings={new Map([['bullet-0-0-0', true]])}
        reviewAnnotations={reviewResult.annotations}
        onResumeChange={vi.fn()}
      />
    )

    const bullet = screen
      .getByText('Documented a general-purpose computing system.')
      .closest('li')

    expect(bullet).toHaveClass('bullet-item--warning')
    expect(bullet).toHaveClass('bullet-item--review-warning')
  })
})
