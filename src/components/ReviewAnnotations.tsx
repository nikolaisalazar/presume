import type {
  ReviewAnnotation,
  ReviewAnnotationSeverity,
} from '../reviewTypes'
import type { Resume, ResumeEntry, ResumeSection } from '../types'

export type ReviewAnnotationTargetKey =
  | `section-${number}`
  | `entry-${number}-${number}`
  | `bullet-${number}-${number}-${number}`

export type ReviewAnnotationTargets = Map<
  ReviewAnnotationTargetKey,
  ReviewAnnotation[]
>

type MatchContext = {
  section: ResumeSection
  sectionIdx: number
  entry?: ResumeEntry
  entryIdx?: number
}

export function getReviewAnnotationTargets(
  resume: Resume,
  annotations: ReviewAnnotation[] = []
): ReviewAnnotationTargets {
  const targets: ReviewAnnotationTargets = new Map()

  for (const annotation of annotations) {
    const key = findAnnotationTarget(resume, annotation)
    if (!key) continue

    const current = targets.get(key) ?? []
    targets.set(key, [...current, annotation])
  }

  return targets
}

export function getReviewAnnotationsForTarget(
  targets: ReviewAnnotationTargets | undefined,
  key: ReviewAnnotationTargetKey
): ReviewAnnotation[] {
  return targets?.get(key) ?? []
}

export function getReviewSeverityClass(
  annotations: ReviewAnnotation[]
): string {
  const severity = getHighestSeverity(annotations)
  return severity ? `review-annotation--${severity}` : ''
}

export function ReviewAnnotations({
  annotations,
}: {
  annotations: ReviewAnnotation[]
}) {
  if (annotations.length === 0) {
    return null
  }

  return (
    <span className="review-annotation-list" aria-hidden="false">
      {annotations.map(annotation => (
        <span
          key={annotation.id}
          className={`review-annotation-marker ${getReviewSeverityClass([
            annotation,
          ])}`}
          aria-label={`Review note: ${annotation.message}`}
          title={annotation.message}
        />
      ))}
    </span>
  )
}

function findAnnotationTarget(
  resume: Resume,
  annotation: ReviewAnnotation
): ReviewAnnotationTargetKey | null {
  const sectionMatches = findMatchingSections(resume.sections, annotation)
  if (sectionMatches.length !== 1) return null

  const sectionMatch = sectionMatches[0]

  if (annotation.entryTitle !== undefined || annotation.bulletText !== undefined) {
    const entryMatches = findMatchingEntries(sectionMatch, annotation)
    if (entryMatches.length !== 1) return null

    const entryMatch = entryMatches[0]

    if (annotation.bulletText !== undefined) {
      const bulletMatches = findMatchingBullets(entryMatch, annotation)
      if (bulletMatches.length !== 1) return null

      return `bullet-${sectionMatch.sectionIdx}-${entryMatch.entryIdx}-${bulletMatches[0]}`
    }

    return `entry-${sectionMatch.sectionIdx}-${entryMatch.entryIdx}`
  }

  if (annotation.sectionTitle !== undefined) {
    return `section-${sectionMatch.sectionIdx}`
  }

  return null
}

function findMatchingSections(
  sections: ResumeSection[],
  annotation: ReviewAnnotation
): MatchContext[] {
  if (annotation.sectionTitle === undefined) {
    return sections.map((section, sectionIdx) => ({ section, sectionIdx }))
  }

  return sections.flatMap((section, sectionIdx) =>
    section.title === annotation.sectionTitle ? [{ section, sectionIdx }] : []
  )
}

function findMatchingEntries(
  sectionMatch: MatchContext,
  annotation: ReviewAnnotation
): Required<Pick<MatchContext, 'section' | 'sectionIdx' | 'entry' | 'entryIdx'>>[] {
  const entries = sectionMatch.section.entries

  if (annotation.entryTitle === undefined) {
    return entries.map((entry, entryIdx) => ({
      section: sectionMatch.section,
      sectionIdx: sectionMatch.sectionIdx,
      entry,
      entryIdx,
    }))
  }

  return entries.flatMap((entry, entryIdx) =>
    entry.title === annotation.entryTitle
      ? [
          {
            section: sectionMatch.section,
            sectionIdx: sectionMatch.sectionIdx,
            entry,
            entryIdx,
          },
        ]
      : []
  )
}

function findMatchingBullets(
  entryMatch: Required<
    Pick<MatchContext, 'section' | 'sectionIdx' | 'entry' | 'entryIdx'>
  >,
  annotation: ReviewAnnotation
): number[] {
  return entryMatch.entry.bullets.flatMap((bullet, bulletIdx) =>
    bullet === annotation.bulletText ? [bulletIdx] : []
  )
}

function getHighestSeverity(
  annotations: ReviewAnnotation[]
): ReviewAnnotationSeverity | null {
  if (annotations.some(annotation => annotation.severity === 'warning')) {
    return 'warning'
  }
  if (annotations.some(annotation => annotation.severity === 'strong')) {
    return 'strong'
  }
  if (annotations.some(annotation => annotation.severity === 'info')) {
    return 'info'
  }
  return null
}
