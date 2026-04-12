/**
 * Core data types for Presume.
 *
 * Resume/ResumeSection/ResumeEntry form the JSON data model — both the in-memory
 * state and the on-disk (localStorage + export) format.
 *
 * All ResumeEntry fields are required strings (empty string is valid). This is
 * intentional: the WYSIWYG editor always populates new entries from a full
 * template, so partial entries never appear in the persisted model. Omitting a
 * field causes validateResume to return null, protecting against stale or
 * externally-authored JSON with missing keys.
 */

export type Resume = {
  name: string
  contact: string[]
  sections: ResumeSection[]
}

export type ResumeSection = {
  title: string
  entries: ResumeEntry[]
}

export type ResumeEntry = {
  title: string
  subtitle: string
  location: string
  dateRange: string
  bullets: string[]
}

export type Constraints = {
  maxPages: number
  maxLinesPerBullet: number
  minFontSize: number
}

export const DEFAULT_CONSTRAINTS: Constraints = {
  maxPages: 1,
  maxLinesPerBullet: 1,
  minFontSize: 8,
}

/**
 * Parses and validates an unknown value as a Resume.
 * Returns a freshly-constructed Resume (stripping unknown fields) or null if
 * the input doesn't match the expected shape.
 */
export function validateResume(data: unknown): Resume | null {
  if (!data || typeof data !== 'object') return null
  const d = data as Record<string, unknown>

  if (typeof d.name !== 'string') return null
  if (
    !Array.isArray(d.contact) ||
    !d.contact.every((c: unknown) => typeof c === 'string')
  )
    return null
  if (!Array.isArray(d.sections)) return null

  const sections: ResumeSection[] = []
  for (const section of d.sections) {
    if (!section || typeof section !== 'object') return null
    const s = section as Record<string, unknown>
    if (typeof s.title !== 'string') return null
    if (!Array.isArray(s.entries)) return null

    const entries: ResumeEntry[] = []
    for (const entry of s.entries) {
      if (!entry || typeof entry !== 'object') return null
      const e = entry as Record<string, unknown>
      if (typeof e.title !== 'string') return null
      if (typeof e.subtitle !== 'string') return null
      if (typeof e.location !== 'string') return null
      if (typeof e.dateRange !== 'string') return null
      if (
        !Array.isArray(e.bullets) ||
        !e.bullets.every((b: unknown) => typeof b === 'string')
      )
        return null

      entries.push({
        title: e.title,
        subtitle: e.subtitle,
        location: e.location,
        dateRange: e.dateRange,
        bullets: e.bullets as string[],
      })
    }
    sections.push({ title: s.title, entries })
  }

  return { name: d.name, contact: d.contact as string[], sections }
}

/**
 * Parses and validates an unknown value as Constraints.
 * Returns a freshly-constructed Constraints object or null if invalid.
 */
export function validateConstraints(data: unknown): Constraints | null {
  if (!data || typeof data !== 'object') return null
  const d = data as Record<string, unknown>
  if (typeof d.maxPages !== 'number') return null
  if (typeof d.maxLinesPerBullet !== 'number') return null
  if (typeof d.minFontSize !== 'number') return null
  return {
    maxPages: d.maxPages,
    maxLinesPerBullet: d.maxLinesPerBullet,
    minFontSize: d.minFontSize,
  }
}
