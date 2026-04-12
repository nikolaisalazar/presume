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

  for (const section of d.sections) {
    if (!section || typeof section !== 'object') return null
    const s = section as Record<string, unknown>
    if (typeof s.title !== 'string') return null
    if (!Array.isArray(s.entries)) return null

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
    }
  }

  return data as Resume
}
