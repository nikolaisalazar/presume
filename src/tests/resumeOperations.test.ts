import { describe, expect, it } from 'vitest'
import type { Resume, ResumeEntry, ResumeSection } from '../types'
import {
  DEFAULT_BULLET,
  DEFAULT_CONTACT_ITEM,
  DEFAULT_ENTRY,
  DEFAULT_SECTION,
  addBullet,
  addContactItem,
  addEntry,
  addSection,
  removeBullet,
  removeContactItem,
  removeEntry,
  removeSection,
  updateBullet,
  updateContactItem,
  updateEntry,
  updateResumeName,
  updateSection,
} from '../resumeOperations'

const entry: ResumeEntry = {
  title: 'Engineer',
  subtitle: 'Acme',
  location: 'Remote',
  dateRange: '2024 – Present',
  bullets: ['Built tooling', 'Improved tests'],
}

const section: ResumeSection = {
  title: 'Experience',
  entries: [entry],
}

const resume: Resume = {
  name: 'Alex Johnson',
  contact: ['alex@example.com', 'github.com/alex'],
  sections: [section],
}

function cloneResume(value: Resume): Resume {
  return JSON.parse(JSON.stringify(value)) as Resume
}

function cloneSection(value: ResumeSection): ResumeSection {
  return JSON.parse(JSON.stringify(value)) as ResumeSection
}

function cloneEntry(value: ResumeEntry): ResumeEntry {
  return JSON.parse(JSON.stringify(value)) as ResumeEntry
}

describe('resume operation helpers', () => {
  it('updates the resume name without mutating the input resume', () => {
    const original = cloneResume(resume)
    const updated = updateResumeName(original, 'Ada Lovelace')

    expect(updated).toEqual({ ...resume, name: 'Ada Lovelace' })
    expect(original).toEqual(resume)
    expect(updated).not.toBe(original)
  })

  it('updates, adds, and removes contact items immutably', () => {
    const original = cloneResume(resume)

    expect(updateContactItem(original, 1, 'linkedin.com/in/alex')).toEqual({
      ...resume,
      contact: ['alex@example.com', 'linkedin.com/in/alex'],
    })
    expect(addContactItem(original)).toEqual({
      ...resume,
      contact: ['alex@example.com', 'github.com/alex', DEFAULT_CONTACT_ITEM],
    })
    expect(addContactItem(original, 'portfolio.example.com')).toEqual({
      ...resume,
      contact: ['alex@example.com', 'github.com/alex', 'portfolio.example.com'],
    })
    expect(removeContactItem(original, 0)).toEqual({
      ...resume,
      contact: ['github.com/alex'],
    })
    expect(original).toEqual(resume)
  })

  it('safely ignores out-of-range contact operations', () => {
    const original = cloneResume(resume)

    expect(updateContactItem(original, -1, 'bad')).toBe(original)
    expect(updateContactItem(original, 99, 'bad')).toBe(original)
    expect(removeContactItem(original, -1)).toBe(original)
    expect(removeContactItem(original, 99)).toBe(original)
  })

  it('updates, adds, and removes sections immutably', () => {
    const original = cloneResume(resume)
    const projects: ResumeSection = { title: 'Projects', entries: [] }

    expect(updateSection(original, 0, projects)).toEqual({
      ...resume,
      sections: [projects],
    })
    expect(addSection(original)).toEqual({
      ...resume,
      sections: [section, DEFAULT_SECTION],
    })
    expect(addSection(original, projects)).toEqual({
      ...resume,
      sections: [section, projects],
    })
    expect(removeSection(original, 0)).toEqual({ ...resume, sections: [] })
    expect(original).toEqual(resume)
  })

  it('safely ignores out-of-range section operations', () => {
    const original = cloneResume(resume)
    const projects: ResumeSection = { title: 'Projects', entries: [] }

    expect(updateSection(original, -1, projects)).toBe(original)
    expect(updateSection(original, 99, projects)).toBe(original)
    expect(removeSection(original, -1)).toBe(original)
    expect(removeSection(original, 99)).toBe(original)
  })

  it('updates, adds, and removes entries immutably', () => {
    const original = cloneSection(section)
    const projectEntry: ResumeEntry = {
      title: 'Project Lead',
      subtitle: 'Open Source',
      location: '',
      dateRange: '2024',
      bullets: ['Maintained project'],
    }

    expect(updateEntry(original, 0, projectEntry)).toEqual({
      ...section,
      entries: [projectEntry],
    })
    expect(addEntry(original)).toEqual({
      ...section,
      entries: [entry, DEFAULT_ENTRY],
    })
    expect(addEntry(original, projectEntry)).toEqual({
      ...section,
      entries: [entry, projectEntry],
    })
    expect(removeEntry(original, 0)).toEqual({ ...section, entries: [] })
    expect(original).toEqual(section)
  })

  it('safely ignores out-of-range entry operations', () => {
    const original = cloneSection(section)

    expect(updateEntry(original, -1, DEFAULT_ENTRY)).toBe(original)
    expect(updateEntry(original, 99, DEFAULT_ENTRY)).toBe(original)
    expect(removeEntry(original, -1)).toBe(original)
    expect(removeEntry(original, 99)).toBe(original)
  })

  it('updates, adds, and removes bullets immutably', () => {
    const original = cloneEntry(entry)

    expect(updateBullet(original, 1, 'Improved reliability')).toEqual({
      ...entry,
      bullets: ['Built tooling', 'Improved reliability'],
    })
    expect(addBullet(original)).toEqual({
      ...entry,
      bullets: ['Built tooling', 'Improved tests', DEFAULT_BULLET],
    })
    expect(addBullet(original, 'Added coverage')).toEqual({
      ...entry,
      bullets: ['Built tooling', 'Improved tests', 'Added coverage'],
    })
    expect(removeBullet(original, 0)).toEqual({
      ...entry,
      bullets: ['Improved tests'],
    })
    expect(original).toEqual(entry)
  })

  it('safely ignores out-of-range bullet operations', () => {
    const original = cloneEntry(entry)

    expect(updateBullet(original, -1, 'bad')).toBe(original)
    expect(updateBullet(original, 99, 'bad')).toBe(original)
    expect(removeBullet(original, -1)).toBe(original)
    expect(removeBullet(original, 99)).toBe(original)
  })
})
