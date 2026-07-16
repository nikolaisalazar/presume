import type { Constraints } from '../constraints'
import { RESUME_DOCUMENT } from '../resumeDocumentTokens'
import type { Resume } from '../types'

export type BulletLocation = Readonly<{
  sectionIndex: number
  entryIndex: number
  bulletIndex: number
}>

export type FormattingWarnings = Readonly<{
  globalOverflow: boolean
  bullets: readonly BulletLocation[]
}>

export type ResumeFit = Readonly<{
  globalScale: number
  warnings: FormattingWarnings
}>

export type ResumeFitMeasurements = Readonly<{
  measureBulletLines: (text: string, scale: number) => number
  measurePageHeight: (scale: number) => number
}>

const MAX_SCALE = 2.0
const PAGE_HEIGHT_TOLERANCE_PX = 0.5

function bulletKey(location: BulletLocation): string {
  return `${location.sectionIndex}:${location.entryIndex}:${location.bulletIndex}`
}

function getImpossibleBullets(
  resume: Resume,
  minScale: number,
  maxLinesPerBullet: number,
  measureBulletLines: ResumeFitMeasurements['measureBulletLines']
): readonly BulletLocation[] {
  const impossibleBullets: BulletLocation[] = []

  resume.sections.forEach((section, sectionIndex) => {
    section.entries.forEach((entry, entryIndex) => {
      entry.bullets.forEach((text, bulletIndex) => {
        if (!text) return
        if (measureBulletLines(text, minScale) > maxLinesPerBullet) {
          impossibleBullets.push({ sectionIndex, entryIndex, bulletIndex })
        }
      })
    })
  })

  return impossibleBullets
}

function bulletsFitAtScale(
  resume: Resume,
  scale: number,
  impossibleBulletKeys: ReadonlySet<string>,
  maxLinesPerBullet: number,
  measureBulletLines: ResumeFitMeasurements['measureBulletLines']
): boolean {
  for (let sectionIndex = 0; sectionIndex < resume.sections.length; sectionIndex++) {
    const section = resume.sections[sectionIndex]
    for (let entryIndex = 0; entryIndex < section.entries.length; entryIndex++) {
      const entry = section.entries[entryIndex]
      for (let bulletIndex = 0; bulletIndex < entry.bullets.length; bulletIndex++) {
        const text = entry.bullets[bulletIndex]
        if (!text) continue

        const location = { sectionIndex, entryIndex, bulletIndex }
        if (impossibleBulletKeys.has(bulletKey(location))) continue
        if (measureBulletLines(text, scale) > maxLinesPerBullet) return false
      }
    }
  }

  return true
}

function fitsWithinPageHeight(
  measuredHeight: number,
  pageHeightLimit: number
): boolean {
  return measuredHeight <= pageHeightLimit + PAGE_HEIGHT_TOLERANCE_PX
}

function findLargestFittingScale(
  minScale: number,
  maxScale: number,
  fitsAtScale: (scale: number) => boolean
): number {
  let low = minScale
  let high = maxScale

  for (let iteration = 0; iteration < 30; iteration++) {
    if (high - low < 0.001) break
    const mid = (low + high) / 2
    if (fitsAtScale(mid)) {
      low = mid
    } else {
      high = mid
    }
  }

  return low
}

export function computeResumeFit(
  resume: Resume,
  constraints: Constraints,
  measurements: ResumeFitMeasurements
): ResumeFit {
  const minScale = constraints.minFontSize / RESUME_DOCUMENT.fontSizeBulletPx
  const pageHeightLimit = constraints.maxPages * RESUME_DOCUMENT.pageHeightPx
  const impossibleBullets = getImpossibleBullets(
    resume,
    minScale,
    constraints.maxLinesPerBullet,
    measurements.measureBulletLines
  )
  const impossibleBulletKeys = new Set(impossibleBullets.map(bulletKey))

  const fitsAtScale = (scale: number): boolean => {
    if (!fitsWithinPageHeight(measurements.measurePageHeight(scale), pageHeightLimit)) {
      return false
    }

    return bulletsFitAtScale(
      resume,
      scale,
      impossibleBulletKeys,
      constraints.maxLinesPerBullet,
      measurements.measureBulletLines
    )
  }

  const globalScale =
    impossibleBullets.length > 0
      ? minScale
      : findLargestFittingScale(minScale, MAX_SCALE, fitsAtScale)
  const globalOverflow = !fitsWithinPageHeight(
    measurements.measurePageHeight(minScale),
    pageHeightLimit
  )

  return {
    globalScale,
    warnings: {
      globalOverflow,
      bullets: impossibleBullets,
    },
  }
}

export function hasBulletWarning(
  warnings: FormattingWarnings,
  sectionIndex: number,
  entryIndex: number,
  bulletIndex: number
): boolean {
  return warnings.bullets.some(
    location =>
      location.sectionIndex === sectionIndex &&
      location.entryIndex === entryIndex &&
      location.bulletIndex === bulletIndex
  )
}
