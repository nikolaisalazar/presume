import { describe, it, expect } from 'vitest'
import { validateResume } from '../types'

describe('validateResume', () => {
  it('accepts a valid resume', () => {
    const valid = {
      name: 'Jake Ryan',
      contact: ['jake@example.com'],
      sections: [
        {
          title: 'Experience',
          entries: [
            {
              title: 'Engineer',
              subtitle: 'Acme',
              location: 'NYC',
              dateRange: '2020–2022',
              bullets: ['Did things'],
            },
          ],
        },
      ],
    }
    expect(validateResume(valid)).toEqual(valid)
  })

  it('rejects null', () => {
    expect(validateResume(null)).toBeNull()
  })

  it('rejects missing name', () => {
    expect(validateResume({ contact: [], sections: [] })).toBeNull()
  })

  it('rejects non-string contact items', () => {
    expect(validateResume({ name: 'Jake', contact: [123], sections: [] })).toBeNull()
  })

  it('rejects missing entry fields', () => {
    const bad = {
      name: 'Jake',
      contact: [],
      sections: [
        {
          title: 'Experience',
          entries: [{ title: 'Eng' }], // missing subtitle, location, dateRange, bullets
        },
      ],
    }
    expect(validateResume(bad)).toBeNull()
  })

  it('rejects non-string bullets', () => {
    const bad = {
      name: 'Jake',
      contact: [],
      sections: [
        {
          title: 'Experience',
          entries: [
            {
              title: 'Eng',
              subtitle: 'Acme',
              location: 'NYC',
              dateRange: '2020',
              bullets: [42],
            },
          ],
        },
      ],
    }
    expect(validateResume(bad)).toBeNull()
  })
})
