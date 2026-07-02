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
  it('renders the idle state with an enabled review action', () => {
    const onRequestReview = vi.fn()

    render(<ReviewPanel state={{ status: 'idle' }} onRequestReview={onRequestReview} />)

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
      screen.getByText('The configured review service is not ready to review resumes.')
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
    const button = screen.getByRole('button', { name: 'Reviewing...' })
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
