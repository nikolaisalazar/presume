export type LandingConcept = 'workbench' | 'manual' | 'exhibit'

export const HERO_CONTENT = {
  workbench: {
    eyebrow: 'A local-first resume workbench',
    title: 'Write against the constraints that shape the final page.',
    description:
      'Presume keeps direct editing, fit guidance, optional review, and stable export on one precise surface—without an account.',
  },
  manual: {
    eyebrow: 'Presume · System overview',
    title: 'A resume workbench, documented from the inside out.',
    description:
      'Edit the final document directly, measure its fit while you write, request advisory evidence when configured, and export from the same controlled surface.',
  },
  exhibit: {
    eyebrow: 'An open technical project you can use',
    title: 'The mechanics behind a finished document, made visible.',
    description:
      'Presume turns text measurement, direct editing, optional review, and deterministic export into one local-first resume workflow.',
  },
} as const

export const CAPABILITIES = [
  {
    title: 'Edit directly',
    description:
      'Work on the document itself instead of translating your history through a separate form.',
  },
  {
    title: 'Fit continuously',
    description:
      'Keep page count, bullet wrapping, and minimum type size visible while the content changes.',
  },
  {
    title: 'Review without rewriting',
    description:
      'When configured, request advisory evidence that never edits or replaces your words.',
  },
  {
    title: 'Export predictably',
    description:
      'Produce a stable Letter PDF and a portable JSON backup from the same source.',
  },
] as const

export const WORKFLOW_STEPS = [
  {
    title: 'Write',
    description:
      'Edit names, dates, sections, and bullets directly on the document.',
  },
  {
    title: 'Measure',
    description:
      'Pretext-powered fit checks expose wrapping and page pressure while you work.',
  },
  {
    title: 'Review',
    description:
      'Optionally run the configured Hiring Agent boundary and inspect evidence without mutation.',
    optional: true,
  },
  {
    title: 'Export',
    description: 'Create the PDF or carry the resume data forward as JSON.',
  },
] as const

export const PROVENANCE = [
  {
    source: 'Pretext',
    heading: 'Measured with Pretext',
    description:
      "Presume uses Cheng Lou's open-source text layout engine to measure multiline wrapping without treating browser layout as a guess. The Fit Lab exposes the same line-statistics family used by the editor's fit system.",
    linkLabel: 'Explore Pretext',
    href: 'https://github.com/chenglou/pretext',
  },
  {
    source: 'Hiring Agent',
    heading: 'Reviewed through an open boundary',
    description:
      "Presume's optional Review workflow adapts HackerRank's open-source Hiring Agent behind a normalized service boundary. It returns category scores and evidence for the user to assess; Presume does not present it as an ATS or let it rewrite the resume.",
    linkLabel: 'Explore Hiring Agent',
    href: 'https://github.com/interviewstreet/hiring-agent',
  },
] as const

export function getLandingConcept(search: string): LandingConcept {
  const concept = new URLSearchParams(search).get('concept')
  return concept === 'manual' || concept === 'exhibit' ? concept : 'workbench'
}
