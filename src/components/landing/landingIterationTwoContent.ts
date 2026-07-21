export type LandingIterationTwoConcept = 'standard' | 'folio'

export const ITERATION_TWO_HERO = {
  standard: {
    eyebrow: 'A local-first resume editor',
    title: 'A precise place to write, measure, and finish your resume.',
    description:
      'Edit the document directly, see fit pressure while you write, request an optional evidence-based review, and export a stable PDF without creating an account.',
  },
  folio: {
    eyebrow: 'Presume · Working notes 01',
    title: 'A working document, with its constraints left visible.',
    description:
      'Presume is a resume project built as a complete product: direct editing, measurable fit, optional advisory review, and deterministic export on one local-first surface.',
  },
} as const

export const ITERATION_TWO_CAPABILITIES = [
  {
    title: 'Write on the document',
    description:
      'Edit names, dates, sections, and bullets where they appear instead of translating them through a separate form.',
  },
  {
    title: 'Measure while it changes',
    description:
      'Page count, line wrapping, and minimum type size remain visible while the content is still editable.',
  },
  {
    title: 'Review as evidence',
    description:
      'When configured, the advisory Review returns category scores and supporting evidence without rewriting your words.',
  },
  {
    title: 'Leave with a stable artifact',
    description:
      'Export a Letter-size PDF or a portable JSON backup from the same source used by the editor.',
  },
] as const

export const ITERATION_TWO_WORKFLOW = [
  ['Write', 'Work directly on the live document.'],
  ['Measure', 'Expose wrapping and page pressure.'],
  ['Review', 'Optionally inspect advisory evidence.'],
  ['Export', 'Create the PDF or carry the data forward.'],
] as const

export function getIterationTwoConcept(search: string): LandingIterationTwoConcept {
  return new URLSearchParams(search).get('concept') === 'folio' ? 'folio' : 'standard'
}
