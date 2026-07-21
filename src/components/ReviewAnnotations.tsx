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

  const label =
    annotations.length === 1
      ? `Review note: ${annotations[0].message}`
      : `${annotations.length} review notes: ${annotations
          .map(annotation => annotation.message)
          .join('; ')}`
  const severityClass = getReviewSeverityClass(annotations)

  return (
    <span className="review-annotation-list" aria-hidden="false">
      {annotations.length > 1 ? (
        <span
          className={`review-annotation-marker review-annotation-marker--count ${severityClass}`}
          aria-label={label}
          title={annotations.map(annotation => annotation.message).join('\n')}
          data-review-annotation-ids={annotations.map(annotation => annotation.id).join(' ')}
          tabIndex={-1}
        >
          {annotations.length}
        </span>
      ) : (
        <span
          className={`review-annotation-marker ${severityClass}`}
          aria-label={label}
          title={annotations[0].message}
          data-review-annotation-ids={annotations[0].id}
          tabIndex={-1}
        />
      )}
    </span>
  )
}

function findAnnotationTarget(
  resume: Resume,
  annotation: ReviewAnnotation
): ReviewAnnotationTargetKey | null {
  if (annotation.sectionTitle === undefined) {
    return null
  }

  const sectionMatches = findMatchingSections(
    resume.sections,
    annotation.sectionTitle
  )
  if (sectionMatches.length !== 1) return null

  const sectionMatch = sectionMatches[0]

  if (annotation.bulletText !== undefined) {
    if (annotation.entryTitle === undefined) {
      return null
    }

    const entryMatches = findMatchingEntries(
      sectionMatch.section,
      annotation.entryTitle
    )
    if (entryMatches.length !== 1) return null

    const entryMatch = entryMatches[0]
    const bulletMatches = findMatchingBullets(
      entryMatch.entry,
      annotation.bulletText
    )
    if (bulletMatches.length !== 1) return null

    return `bullet-${sectionMatch.sectionIdx}-${entryMatch.entryIdx}-${bulletMatches[0]}`
  }

  if (annotation.entryTitle !== undefined) {
    const entryMatches = findMatchingEntries(
      sectionMatch.section,
      annotation.entryTitle
    )
    if (entryMatches.length !== 1) return null

    return `entry-${sectionMatch.sectionIdx}-${entryMatches[0].entryIdx}`
  }

  return `section-${sectionMatch.sectionIdx}`
}

function findMatchingSections(
  sections: ResumeSection[],
  sectionTitle: string
): { section: ResumeSection; sectionIdx: number }[] {
  return sections.flatMap((section, sectionIdx) =>
    section.title === sectionTitle ? [{ section, sectionIdx }] : []
  )
}

function findMatchingEntries(
  section: ResumeSection,
  entryTitle: string
): { entry: ResumeEntry; entryIdx: number }[] {
  return section.entries.flatMap((entry, entryIdx) =>
    entry.title === entryTitle
      ? [{ entry, entryIdx }]
      : []
  )
}

function findMatchingBullets(
  entry: ResumeEntry,
  bulletText: string
): number[] {
  return entry.bullets.flatMap((bullet, bulletIdx) =>
    bullet === bulletText ? [bulletIdx] : []
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
