export type LandingIterationTwoConcept = 'standard' | 'folio'
export type FolioHeroVariant = 'quiet' | 'direct' | 'abstract'

export const ITERATION_TWO_HERO = {
  standard: {
    eyebrow: 'A local-first resume workbench',
    title: 'A resume editor that shows its work.',
    description:
      'Write on the document, inspect fit pressure while it changes, request optional advisory evidence, and export a stable PDF from the same controlled surface.',
  },
  folio: {
    eyebrow: 'The project behind Presume',
    title: 'It began as a resume project. The product grew around the document.',
    description:
      'Presume was not conceived as another account-gated resume service. It is a personal tool developed until editing, measurement, review, and export felt like one complete product.',
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

export const PROJECT_ORIGIN = {
  introduction:
    'Most resume builders begin with a form and reconstruct a document afterward. Presume began with the opposite question: what if the document stayed live while every supporting system formed around it?',
  pretext:
    "Cheng Lou's Pretext made the measurement layer both possible and legible. Presume uses its text-layout primitives to reason about multiline wrapping and exposes that relationship in the Fit Lab instead of hiding it behind marketing language.",
  hiringAgent:
    "HackerRank's open-source Hiring Agent helped make an evidence-oriented Review workflow concrete. Presume adapts that idea behind an optional service boundary, presents the result as advisory evidence, and never describes it as an ATS or lets it rewrite the resume.",
} as const

export function getIterationTwoConcept(search: string): LandingIterationTwoConcept {
  return new URLSearchParams(search).get('concept') === 'folio' ? 'folio' : 'standard'
}

export function getFolioHeroVariant(search: string): FolioHeroVariant {
  const variant = new URLSearchParams(search).get('hero')
  return variant === 'direct' || variant === 'abstract' ? variant : 'quiet'
}
