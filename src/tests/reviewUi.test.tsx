import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { ResumePage } from '../components/ResumePage'
import { ReviewPanel } from '../components/ReviewPanel'
import {
  ReviewCategorySelector,
  selectLargestDeficitCategory,
} from '../components/ReviewCategorySelector'
import {
  ReviewRail,
  getReviewRailPresentation,
} from '../components/ReviewRail'
import type { ResumeReviewState } from '../useResumeReview'
import type { ReviewCategory, ReviewResult } from '../reviewTypes'
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

const emptyReviewResult: ReviewResult = {
  id: 'review_empty',
  reviewedAt: '2026-06-29T12:00:00Z',
  totalScore: 0,
  maxScore: 100,
  tier: 'incomplete',
  categories: [],
  strengths: [],
  improvements: [],
  bonuses: [],
  deductions: [],
  annotations: [],
}

describe('ReviewPanel', () => {
  it('selects the largest raw point deficit in stock rubric order', () => {
    const tiedCategories: ReviewCategory[] = [
      { key: 'technical_skills', label: 'Technical Skills', score: 5, maxScore: 10, evidence: ['Technical evidence'], suggestions: [] },
      { key: 'production', label: 'Production', score: 20, maxScore: 25, evidence: ['Production evidence'], suggestions: [] },
      { key: 'open_source', label: 'Open Source', score: 30, maxScore: 35, evidence: ['Open-source evidence'], suggestions: [] },
    ]

    expect(selectLargestDeficitCategory(tiedCategories)).toBe('open_source')
    expect(selectLargestDeficitCategory([])).toBeNull()
  })

  it('shows evidence for the selected category without mutating scores', () => {
    const onSelect = vi.fn()
    const categories = [
      reviewResult.categories[0],
      {
        key: 'technical_skills' as const,
        label: 'Technical Skills',
        score: 8,
        maxScore: 10,
        evidence: ['Broad supported toolset.'],
        suggestions: ['Add systems evidence.'],
      },
    ]

    const { rerender } = render(
      <ReviewCategorySelector
        categories={categories}
        selectedKey="production"
        onSelect={onSelect}
      />
    )

    expect(screen.getByRole('button', { name: /Production Experience, 18 of 25/i }))
      .toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('heading', { name: 'Production Experience evidence' }))
      .toBeInTheDocument()
    expect(screen.getByText('Experience section shows engineering work.'))
      .toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: /Technical Skills, 8 of 10/i }))
    expect(onSelect).toHaveBeenCalledWith('technical_skills')

    rerender(
      <ReviewCategorySelector
        categories={categories}
        selectedKey="technical_skills"
        onSelect={onSelect}
      />
    )
    expect(screen.getByText('Broad supported toolset.')).toBeInTheDocument()
    expect(categories[1].score).toBe(8)
  })

  it('renders the idle state with an enabled review action', () => {
    const onRequestReview = vi.fn()

    render(<ReviewPanel state={{ status: 'idle' }} onRequestReview={onRequestReview} />)

    expect(screen.getByRole('heading', { name: 'Review', level: 2 }))
      .toBeInTheDocument()
    expect(screen.getByText('Ready for review')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Review resume' }))

    expect(onRequestReview).toHaveBeenCalledTimes(1)
  })

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

  it('renders the checking state without requesting review', () => {
    const onRequestReview = vi.fn()

    render(<ReviewPanel state={{ status: 'checking' }} onRequestReview={onRequestReview} />)

    expect(screen.getByText('Checking review service')).toBeInTheDocument()
    const button = screen.getByRole('button', { name: 'Review resume' })
    expect(button).toBeDisabled()

    fireEvent.click(button)

    expect(onRequestReview).not.toHaveBeenCalled()
  })

  it('renders the disabled service state without requesting review', () => {
    const onRequestReview = vi.fn()

    render(<ReviewPanel state={{ status: 'disabled' }} onRequestReview={onRequestReview} />)

    expect(screen.getByText('Review service unavailable')).toBeInTheDocument()
    expect(
      screen.getByText(
        'The configured service is reachable, but review is disabled. Check provider setup and Hiring Agent readiness.'
      )
    ).toBeInTheDocument()
    const button = screen.getByRole('button', { name: 'Review resume' })
    expect(button).toBeDisabled()

    fireEvent.click(button)

    expect(onRequestReview).not.toHaveBeenCalled()
  })

  it('renders the config error state without requesting review', () => {
    const onRequestReview = vi.fn()

    render(
      <ReviewPanel
        state={{
          status: 'config_error',
          error: new Error('Could not reach the review service.'),
        }}
        onRequestReview={onRequestReview}
      />
    )

    expect(screen.getByText('Review service unavailable')).toBeInTheDocument()
    expect(screen.getByText('Could not reach the review service.')).toBeInTheDocument()
    const button = screen.getByRole('button', { name: 'Review resume' })
    expect(button).toBeDisabled()

    fireEvent.click(button)

    expect(onRequestReview).not.toHaveBeenCalled()
  })

  it('renders the loading state with a disabled review action', () => {
    const onRequestReview = vi.fn()

    render(<ReviewPanel state={{ status: 'loading' }} onRequestReview={onRequestReview} />)

    expect(screen.getByText('Review request is in progress.')).toBeInTheDocument()
    const button = screen.getByRole('button', { name: 'Reviewing' })
    expect(button).toBeDisabled()
    expect(button).not.toHaveAttribute('data-loading')

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
    expect(screen.getByText('Competitive')).toHaveAttribute('data-slot', 'badge')
    expect(screen.getByText('Production Experience')).toBeInTheDocument()
    expect(screen.getByText('Quantify production impact.')).toBeInTheDocument()
    expect(screen.getByText('Needs attention', { selector: '[data-slot="badge"]' }))
      .toBeInTheDocument()
    expect(screen.getByRole('separator')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /Adjustment details/i }))
    expect(screen.getByText('Open source signal')).toBeInTheDocument()
    expect(screen.getByText('Missing scale')).toBeInTheDocument()
    expect(screen.getByText('Add measurable impact.')).toBeInTheDocument()
    expect(screen.getByText('Advisory evaluation')).toBeInTheDocument()
  })

  it('defaults to the largest-deficit category and resets for a new review', () => {
    const { rerender } = render(
      <ReviewPanel
        state={{ status: 'success', result: reviewResult }}
        onRequestReview={vi.fn()}
      />
    )

    expect(screen.getByRole('button', { name: /Production Experience, 18 of 25/i }))
      .toHaveAttribute('aria-pressed', 'true')

    const nextResult: ReviewResult = {
      ...reviewResult,
      id: 'review_456',
      categories: [
        ...reviewResult.categories,
        {
          key: 'open_source',
          label: 'Open Source',
          score: 5,
          maxScore: 35,
          evidence: ['External contributions are limited.'],
          suggestions: [],
        },
      ],
    }

    rerender(
      <ReviewPanel
        state={{ status: 'success', result: nextResult }}
        onRequestReview={vi.fn()}
      />
    )
    expect(screen.getByRole('button', { name: /Open Source, 5 of 35/i }))
      .toHaveAttribute('aria-pressed', 'true')
  })

  it('preserves a valid category selection when the same review gets a new categories array', () => {
    const categories: ReviewCategory[] = [
      ...reviewResult.categories,
      {
        key: 'technical_skills',
        label: 'Technical Skills',
        score: 8,
        maxScore: 10,
        evidence: ['Broad supported toolset.'],
        suggestions: [],
      },
    ]
    const result = { ...reviewResult, categories }
    const { rerender } = render(
      <ReviewPanel state={{ status: 'success', result }} onRequestReview={vi.fn()} />
    )

    fireEvent.click(screen.getByRole('button', { name: /Technical Skills, 8 of 10/i }))
    expect(screen.getByText('Broad supported toolset.')).toBeVisible()

    const normalizedResult = { ...result, categories: [...categories] }
    rerender(
      <ReviewPanel
        state={{ status: 'stale', result: normalizedResult }}
        onRequestReview={vi.fn()}
      />
    )

    expect(screen.getByRole('button', { name: /Technical Skills, 8 of 10/i }))
      .toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByText('Broad supported toolset.')).toBeVisible()

    rerender(
      <ReviewPanel
        state={{ status: 'success', result: { ...normalizedResult, id: 'review_new' } }}
        onRequestReview={vi.fn()}
      />
    )
    expect(screen.getByRole('button', { name: /Production Experience, 18 of 25/i }))
      .toHaveAttribute('aria-pressed', 'true')
  })

  it('keeps improvements visible and supporting details closed by default', () => {
    render(
      <ReviewPanel
        state={{ status: 'success', result: reviewResult }}
        onRequestReview={vi.fn()}
      />
    )

    expect(screen.getByText('Quantify production impact.')).toBeVisible()
    expect(screen.getByRole('button', { name: /Key strengths/i }))
      .toHaveAttribute('aria-expanded', 'false')
    expect(screen.queryByText('Clear technical ownership.')).not.toBeInTheDocument()
    expect(screen.getByText('Bonus').parentElement).toHaveTextContent('Bonus +3')
    expect(screen.getByText('Deductions').parentElement)
      .toHaveTextContent('Deductions −2')
    expect(screen.getByRole('button', { name: /Adjustment details/i }))
      .toHaveAttribute('aria-expanded', 'false')

    fireEvent.click(screen.getByRole('button', { name: /Key strengths/i }))
    expect(screen.getByText('Clear technical ownership.')).toBeVisible()
  })

  it('renders only populated adjustment ledger sides', () => {
    const { rerender } = render(
      <ReviewPanel
        state={{ status: 'success', result: { ...reviewResult, bonuses: [], deductions: [{ label: 'Penalty', points: -2 }] } }}
        onRequestReview={vi.fn()}
      />
    )

    expect(screen.getByText('Deductions').parentElement).toHaveTextContent('Deductions −2')
    expect(screen.queryByText('Bonus')).not.toBeInTheDocument()
    expect(screen.queryByRole('separator')).not.toBeInTheDocument()

    rerender(
      <ReviewPanel
        state={{ status: 'success', result: { ...reviewResult, bonuses: [{ label: 'Signal', points: 3 }], deductions: [] } }}
        onRequestReview={vi.fn()}
      />
    )

    expect(screen.getByText('Bonus').parentElement).toHaveTextContent('Bonus +3')
    expect(screen.queryByText('Deductions')).not.toBeInTheDocument()
    expect(screen.queryByRole('separator')).not.toBeInTheDocument()
  })

  it('preserves signed adjustment values in totals and details', () => {
    render(
      <ReviewPanel
        state={{
          status: 'success',
          result: {
            ...reviewResult,
            bonuses: [
              { label: 'Negative bonus', points: -2 },
              { label: 'Positive bonus', points: 3 },
              { label: 'Zero bonus', points: 0 },
            ],
            deductions: [
              { label: 'Positive deduction', points: 2 },
              { label: 'Negative deduction', points: -4 },
              { label: 'Zero deduction', points: 0 },
            ],
          },
        }}
        onRequestReview={vi.fn()}
      />
    )

    expect(screen.getByText('Bonus').parentElement).toHaveTextContent('Bonus +1')
    expect(screen.getByText('Deductions').parentElement)
      .toHaveTextContent('Deductions −2')

    fireEvent.click(screen.getByRole('button', { name: /Adjustment details/i }))
    expect(screen.getByText('Negative bonus').parentElement).toHaveTextContent('(−2)')
    expect(screen.getByText('Positive deduction').parentElement).toHaveTextContent('(+2)')
    expect(screen.getByText('Zero bonus').parentElement).toHaveTextContent('(0)')
    expect(screen.getByText('Zero deduction').parentElement).toHaveTextContent('(0)')
  })

  it('groups evidence under the selected category result', () => {
    render(
      <ReviewPanel
        state={{ status: 'success', result: reviewResult }}
        onRequestReview={vi.fn()}
      />
    )

    expect(screen.getByRole('heading', { name: 'Production Experience evidence' }))
      .toBeInTheDocument()
    expect(screen.getByText('Experience section shows engineering work.'))
      .toBeInTheDocument()
  })

  it('renders a clean empty-result state when no detailed review arrays are returned', () => {
    render(
      <ReviewPanel
        state={{ status: 'success', result: emptyReviewResult }}
        onRequestReview={vi.fn()}
      />
    )

    expect(screen.getByText('0 / 100')).toBeInTheDocument()
    expect(screen.getByText('No detailed findings returned.')).toBeInTheDocument()
    expect(screen.queryByText('Strengths')).not.toBeInTheDocument()
    expect(screen.queryByText('Findings')).not.toBeInTheDocument()
  })

  it('keeps stale review results visible with a stale label', () => {
    const state: ResumeReviewState = { status: 'stale', result: reviewResult }

    render(<ReviewPanel state={state} onRequestReview={vi.fn()} />)

    expect(screen.getByText('Review is stale')).toBeInTheDocument()
    expect(
      screen.getByText('Previous results are still shown. Re-run review after editing.')
    ).toBeInTheDocument()
    expect(screen.getByText('72 / 100')).toBeInTheDocument()
  })

  it('explains request errors while preserving a previous stale result', () => {
    const state: ResumeReviewState = {
      status: 'error',
      error: new Error('Could not reach the review service.'),
      result: reviewResult,
      resultIsStale: true,
    }

    render(<ReviewPanel state={state} onRequestReview={vi.fn()} />)

    expect(screen.getByText('Review request failed')).toBeInTheDocument()
    expect(screen.getByText('Could not reach the review service.')).toBeInTheDocument()
    expect(screen.getByText('Review is stale')).toBeInTheDocument()
    expect(screen.getByText(
      'Previous results are still shown. Re-run review after editing.'
    )).toBeInTheDocument()
    expect(screen.getByText('72 / 100')).toBeInTheDocument()
  })

  it('renders normalized review errors', () => {
    render(
      <ReviewPanel
        state={{
          status: 'error',
          error: new Error('Could not reach the review service.'),
        }}
        onRequestReview={vi.fn()}
      />
    )

    expect(screen.getByText('Could not reach the review service.')).toBeInTheDocument()
  })

  it('uses a stable review shell and semantic alerts for service states', () => {
    const { rerender } = render(
      <ReviewPanel state={{ status: 'checking' }} onRequestReview={vi.fn()} />
    )

    expect(screen.getByRole('complementary', { name: 'Resume review' }))
      .toBeInTheDocument()
    expect(screen.getByRole('alert')).toHaveTextContent('Checking review service')

    rerender(
      <ReviewPanel
        state={{ status: 'config_error', error: new Error('Could not reach the review service.') }}
        onRequestReview={vi.fn()}
      />
    )
    expect(screen.getByRole('alert')).toHaveTextContent('Review service unavailable')
    expect(screen.getByRole('alert')).toHaveAttribute('data-variant', 'destructive')
  })

  it('shows annotation legend and target context in the review panel', () => {
    render(
      <ReviewPanel
        state={{ status: 'success', result: reviewResult }}
        onRequestReview={vi.fn()}
      />
    )

    expect(screen.getByText('Annotation legend')).toBeInTheDocument()
    expect(screen.getAllByText('Needs attention')).toHaveLength(2)
    expect(screen.getByText('Experience / Engineer')).toBeInTheDocument()
    expect(screen.getByText('Add measurable impact.')).toBeInTheDocument()
  })

  it('keeps ambiguous annotations visible in the panel', () => {
    const result: ReviewResult = {
      ...reviewResult,
      annotations: [
        {
          id: 'ann_ambiguous',
          entryTitle: 'Engineer',
          message: 'Ambiguous entry title.',
          severity: 'info',
        },
      ],
    }

    render(
      <ReviewPanel state={{ status: 'success', result }} onRequestReview={vi.fn()} />
    )

    expect(screen.getByText('Ambiguous entry title.')).toBeInTheDocument()
    expect(screen.getByText('Target not matched inline')).toBeInTheDocument()
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

  it('summarizes multiple inline annotations on one target', () => {
    render(
      <ResumePage
        resume={resume}
        warnings={new Map()}
        reviewAnnotations={[
          ...reviewResult.annotations,
          {
            id: 'ann_2',
            sectionTitle: 'Experience',
            entryTitle: 'Engineer',
            bulletText: 'Documented a general-purpose computing system.',
            message: 'Tie this to a user outcome.',
            severity: 'info',
          },
        ]}
        onResumeChange={vi.fn()}
      />
    )

    expect(
      screen.getByLabelText(
        '2 review notes: Add measurable impact.; Tie this to a user outcome.'
      )
    ).toBeInTheDocument()
    expect(screen.getByText('2')).toHaveClass('review-annotation-marker')
  })

  it('renders an inline annotation for one exact entry match', () => {
    render(
      <ResumePage
        resume={resume}
        warnings={new Map()}
        reviewAnnotations={[
          {
            id: 'ann_entry',
            sectionTitle: 'Experience',
            entryTitle: 'Engineer',
            message: 'Clarify scope for this role.',
            severity: 'info',
          },
        ]}
        onResumeChange={vi.fn()}
      />
    )

    const entry = screen.getByText('Engineer').closest('.resume-entry')

    expect(entry).toHaveClass('review-annotation--info')
    expect(screen.getByLabelText('Review note: Clarify scope for this role.')).toBeInTheDocument()
  })

  it('renders an inline annotation for one exact section match', () => {
    render(
      <ResumePage
        resume={resume}
        warnings={new Map()}
        reviewAnnotations={[
          {
            id: 'ann_section',
            sectionTitle: 'Projects',
            message: 'Strong project signal.',
            severity: 'strong',
          },
        ]}
        onResumeChange={vi.fn()}
      />
    )

    const section = screen.getByText('Projects').closest('section')

    expect(section).toHaveClass('review-annotation--strong')
    expect(screen.getByLabelText('Review note: Strong project signal.')).toBeInTheDocument()
  })

  it('does not render a bullet annotation when sectionTitle is missing', () => {
    const singleCandidateResume: Resume = {
      ...resume,
      sections: [
        {
          ...resume.sections[0],
          entries: [resume.sections[0].entries[0]],
        },
      ],
    }

    render(
      <ResumePage
        resume={singleCandidateResume}
        warnings={new Map()}
        reviewAnnotations={[
          {
            id: 'ann_missing_section',
            entryTitle: 'Engineer',
            bulletText: 'Documented a general-purpose computing system.',
            message: 'Missing section title.',
            severity: 'warning',
          },
        ]}
        onResumeChange={vi.fn()}
      />
    )

    const bullet = screen
      .getByText('Documented a general-purpose computing system.')
      .closest('li')

    expect(bullet).not.toHaveClass('bullet-item--review-warning')
    expect(screen.queryByLabelText('Review note: Missing section title.')).not.toBeInTheDocument()
  })

  it('does not render a bullet annotation when entryTitle is missing', () => {
    const singleCandidateResume: Resume = {
      ...resume,
      sections: [
        {
          ...resume.sections[0],
          entries: [resume.sections[0].entries[0]],
        },
      ],
    }

    render(
      <ResumePage
        resume={singleCandidateResume}
        warnings={new Map()}
        reviewAnnotations={[
          {
            id: 'ann_missing_entry',
            sectionTitle: 'Experience',
            bulletText: 'Documented a general-purpose computing system.',
            message: 'Missing entry title.',
            severity: 'warning',
          },
        ]}
        onResumeChange={vi.fn()}
      />
    )

    const bullet = screen
      .getByText('Documented a general-purpose computing system.')
      .closest('li')

    expect(bullet).not.toHaveClass('bullet-item--review-warning')
    expect(screen.queryByLabelText('Review note: Missing entry title.')).not.toBeInTheDocument()
  })

  it('does not render a bullet annotation when bulletText is missing', () => {
    render(
      <ResumePage
        resume={resume}
        warnings={new Map()}
        reviewAnnotations={[
          {
            id: 'ann_missing_bullet',
            sectionTitle: 'Experience',
            entryTitle: 'Engineer',
            message: 'Missing bullet text.',
            severity: 'warning',
          },
        ]}
        onResumeChange={vi.fn()}
      />
    )

    const bullet = screen
      .getByText('Documented a general-purpose computing system.')
      .closest('li')

    expect(bullet).not.toHaveClass('bullet-item--review-warning')
    expect(screen.queryByLabelText('Review note: Missing bullet text.')).toBeInTheDocument()
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

  it('does not render inline annotations for duplicate section titles', () => {
    const duplicateSectionResume: Resume = {
      ...resume,
      sections: [
        resume.sections[0],
        {
          ...resume.sections[1],
          title: 'Experience',
        },
      ],
    }

    render(
      <ResumePage
        resume={duplicateSectionResume}
        warnings={new Map()}
        reviewAnnotations={[
          {
            id: 'ann_duplicate_section',
            sectionTitle: 'Experience',
            message: 'Duplicate section title.',
            severity: 'info',
          },
        ]}
        onResumeChange={vi.fn()}
      />
    )

    expect(screen.queryByLabelText('Review note: Duplicate section title.')).not.toBeInTheDocument()
  })

  it('does not render inline annotations for duplicate entry titles within a section', () => {
    const duplicateEntryResume: Resume = {
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
        resume={duplicateEntryResume}
        warnings={new Map()}
        reviewAnnotations={[
          {
            id: 'ann_duplicate_entry',
            sectionTitle: 'Experience',
            entryTitle: 'Engineer',
            message: 'Duplicate entry title.',
            severity: 'info',
          },
        ]}
        onResumeChange={vi.fn()}
      />
    )

    expect(screen.queryByLabelText('Review note: Duplicate entry title.')).not.toBeInTheDocument()
  })

  it('does not render inline annotations for duplicate bullet text within an entry', () => {
    const duplicateBulletResume: Resume = {
      ...resume,
      sections: [
        {
          ...resume.sections[0],
          entries: [
            {
              ...resume.sections[0].entries[0],
              bullets: [
                'Documented a general-purpose computing system.',
                'Documented a general-purpose computing system.',
              ],
            },
            resume.sections[0].entries[1],
          ],
        },
        resume.sections[1],
      ],
    }

    render(
      <ResumePage
        resume={duplicateBulletResume}
        warnings={new Map()}
        reviewAnnotations={reviewResult.annotations}
        onResumeChange={vi.fn()}
      />
    )

    expect(screen.queryByLabelText('Review note: Add measurable impact.')).not.toBeInTheDocument()
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

describe('ReviewRail', () => {
  const railReviewResult = { ...reviewResult, totalScore: 81 }

  it('routes review states to one stable rail action', () => {
    const cases: Array<
      [ResumeReviewState, Partial<ReturnType<typeof getReviewRailPresentation>>]
    > = [
      [{ status: 'unconfigured' }, { label: 'Review unavailable', action: 'open', actionLabel: 'Details', tone: 'warning' }],
      [{ status: 'checking' }, { label: 'Checking review', action: 'none', loading: false }],
      [{ status: 'idle' }, { label: 'Review resume', action: 'request', actionLabel: 'Start' }],
      [{ status: 'loading' }, { label: 'Reviewing', detail: 'In progress', action: 'none', loading: true }],
      [{ status: 'loading', result: railReviewResult }, { label: 'Updating review', score: '81 / 100', action: 'open', actionLabel: 'View', loading: true }],
      [{ status: 'success', result: railReviewResult }, { label: 'Review ready', score: '81 / 100', action: 'open', actionLabel: 'View', tone: 'success' }],
      [{ status: 'stale', result: railReviewResult }, { label: 'Review stale', score: '81 / 100', action: 'open', actionLabel: 'View', tone: 'warning' }],
      [{ status: 'error', error: new Error('Review failed.') }, { label: 'Review failed', action: 'open', actionLabel: 'Details', tone: 'destructive' }],
      [{ status: 'error', error: new Error('Update failed.'), result: railReviewResult }, { label: 'Update failed', score: '81 / 100', action: 'open', actionLabel: 'View', tone: 'destructive' }],
    ]

    cases.forEach(([state, expected]) => {
      expect(getReviewRailPresentation(state)).toMatchObject(expected)
    })
  })

  it('keeps first-review loading inert but lets a preserved result reopen', () => {
    const onOpenPanel = vi.fn()
    const { rerender } = render(
      <ReviewRail
        state={{ status: 'loading' }}
        panelId="resume-review-panel"
        onOpenPanel={onOpenPanel}
        onRequestReview={vi.fn()}
      />
    )

    const firstLoad = screen.getByLabelText('Resume review')
    expect(firstLoad).toHaveAttribute('aria-busy', 'true')
    expect(firstLoad).toHaveAttribute('data-loading', '')
    expect(screen.queryByRole('button')).not.toBeInTheDocument()

    rerender(
      <ReviewRail
        state={{ status: 'loading', result: railReviewResult }}
        panelId="resume-review-panel"
        onOpenPanel={onOpenPanel}
        onRequestReview={vi.fn()}
      />
    )

    const view = screen.getByRole('button', { name: 'View review' })
    expect(view).toHaveAttribute('aria-controls', 'resume-review-panel')
    expect(view).toHaveAttribute('aria-expanded', 'false')
    fireEvent.click(view)
    expect(onOpenPanel).toHaveBeenCalledTimes(1)
  })
})
