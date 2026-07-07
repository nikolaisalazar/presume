import type { Resume, ResumeEntry, ResumeSection } from './types'

export const DEFAULT_CONTACT_ITEM = 'contact@example.com'

export const DEFAULT_SECTION: ResumeSection = {
  title: 'New Section',
  entries: [],
}

export const DEFAULT_ENTRY: ResumeEntry = {
  title: 'Job Title',
  subtitle: 'Company',
  location: 'City, ST',
  dateRange: 'Jan 2020 – Present',
  bullets: [],
}

export const DEFAULT_BULLET = 'New bullet point'

export function updateResumeName(resume: Resume, name: string): Resume {
  return { ...resume, name }
}

export function updateContactItem(
  resume: Resume,
  index: number,
  value: string
): Resume {
  if (!isValidIndex(resume.contact, index)) return resume

  const contact = [...resume.contact]
  contact[index] = value
  return { ...resume, contact }
}

export function addContactItem(
  resume: Resume,
  value = DEFAULT_CONTACT_ITEM
): Resume {
  return { ...resume, contact: [...resume.contact, value] }
}

export function removeContactItem(resume: Resume, index: number): Resume {
  if (!isValidIndex(resume.contact, index)) return resume
  return { ...resume, contact: resume.contact.filter((_, i) => i !== index) }
}

export function updateSection(
  resume: Resume,
  sectionIndex: number,
  section: ResumeSection
): Resume {
  if (!isValidIndex(resume.sections, sectionIndex)) return resume

  const sections = [...resume.sections]
  sections[sectionIndex] = section
  return { ...resume, sections }
}

export function addSection(
  resume: Resume,
  section = DEFAULT_SECTION
): Resume {
  return { ...resume, sections: [...resume.sections, cloneSection(section)] }
}

export function removeSection(resume: Resume, sectionIndex: number): Resume {
  if (!isValidIndex(resume.sections, sectionIndex)) return resume
  return {
    ...resume,
    sections: resume.sections.filter((_, i) => i !== sectionIndex),
  }
}

export function updateEntry(
  section: ResumeSection,
  entryIndex: number,
  entry: ResumeEntry
): ResumeSection {
  if (!isValidIndex(section.entries, entryIndex)) return section

  const entries = [...section.entries]
  entries[entryIndex] = entry
  return { ...section, entries }
}

export function addEntry(
  section: ResumeSection,
  entry = DEFAULT_ENTRY
): ResumeSection {
  return { ...section, entries: [...section.entries, cloneEntry(entry)] }
}

export function removeEntry(
  section: ResumeSection,
  entryIndex: number
): ResumeSection {
  if (!isValidIndex(section.entries, entryIndex)) return section
  return {
    ...section,
    entries: section.entries.filter((_, i) => i !== entryIndex),
  }
}

export function updateBullet(
  entry: ResumeEntry,
  bulletIndex: number,
  text: string
): ResumeEntry {
  if (!isValidIndex(entry.bullets, bulletIndex)) return entry

  const bullets = [...entry.bullets]
  bullets[bulletIndex] = text
  return { ...entry, bullets }
}

export function addBullet(
  entry: ResumeEntry,
  text = DEFAULT_BULLET
): ResumeEntry {
  return { ...entry, bullets: [...entry.bullets, text] }
}

export function removeBullet(
  entry: ResumeEntry,
  bulletIndex: number
): ResumeEntry {
  if (!isValidIndex(entry.bullets, bulletIndex)) return entry
  return { ...entry, bullets: entry.bullets.filter((_, i) => i !== bulletIndex) }
}

function isValidIndex<T>(items: T[], index: number): boolean {
  return Number.isInteger(index) && index >= 0 && index < items.length
}

function cloneSection(section: ResumeSection): ResumeSection {
  return {
    title: section.title,
    entries: section.entries.map(cloneEntry),
  }
}

function cloneEntry(entry: ResumeEntry): ResumeEntry {
  return {
    title: entry.title,
    subtitle: entry.subtitle,
    location: entry.location,
    dateRange: entry.dateRange,
    bullets: [...entry.bullets],
  }
}
