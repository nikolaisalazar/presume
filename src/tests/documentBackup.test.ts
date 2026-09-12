import { afterEach, describe, expect, it, vi } from 'vitest'
import { DEFAULT_RESUME } from '../defaultResume'
import {
  DocumentBackupError,
  downloadDocumentBackup,
  parseDocumentBackup,
  readDocumentBackup,
  serializeDocumentBackup,
} from '../documentBackup'

const data = {
  resume: {
    name: '  Zoë 李 👩🏽‍💻\n',
    contact: ['e\u0301\r\ncontact\r', ''],
    sections: [{
      title: '\nExperience\n\n',
      entries: [{
        title: 'Engineer\nLead', subtitle: '日本語', location: '\tNY ',
        dateRange: '2020–2026', bullets: ['\nFirst\n\nLast\n', ''],
      }],
    }],
  },
  constraints: { maxPages: 2, maxLinesPerBullet: 3, minFontSize: 12 },
}
const envelope = {
  format: 'presume-backup', version: 1, exportedAt: '2026-09-12T12:00:00.000Z', data,
}

afterEach(() => {
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
  vi.useRealTimers()
})

describe('document backup codec', () => {
  it('round-trips every text field exactly and includes non-default constraints', () => {
    const text = serializeDocumentBackup(data, new Date(envelope.exportedAt))
    expect(JSON.parse(text)).toEqual(envelope)
    const result = parseDocumentBackup(text)
    expect(result).toEqual({ kind: 'complete', data })
    if (result.kind !== 'complete') throw new Error('Expected complete backup')
    result.data.resume.contact.push('new contact')
    result.data.resume.sections[0].entries[0].bullets.push('new bullet')
    expect(data.resume.contact).toHaveLength(2)
    expect(data.resume.sections[0].entries[0].bullets).toHaveLength(2)
  })

  it('accepts existing bare Resume files and preserves their text without inventing settings', () => {
    expect(parseDocumentBackup(JSON.stringify(data.resume))).toEqual({ kind: 'legacy', resume: data.resume })
    expect(parseDocumentBackup(JSON.stringify(DEFAULT_RESUME))).toEqual({ kind: 'legacy', resume: DEFAULT_RESUME })
  })

  it('strips unknown fields throughout complete backups on import and export', () => {
    const extended = {
      ...data,
      history: ['private'], review: { token: 'secret' }, globalScale: 1.2,
      constraints: { ...data.constraints, zoom: 2 },
      resume: {
        ...data.resume, private: true,
        sections: data.resume.sections.map(section => ({
          ...section, id: 'unknown', entries: section.entries.map(entry => ({ ...entry, raw: 'private' })),
        })),
      },
    }
    const text = JSON.stringify({ ...envelope, revision: 'local', migration: 'raw', data: extended })
    expect(parseDocumentBackup(text)).toEqual({ kind: 'complete', data })
    expect(JSON.parse(serializeDocumentBackup(extended)).data).toEqual(data)
    expect(parseDocumentBackup(JSON.stringify(extended.resume))).toEqual({ kind: 'legacy', resume: data.resume })
  })

  it.each([
    ['null', 'invalid-resume'], ['[]', 'invalid-resume'], ['{}', 'invalid-resume'], ['{', 'invalid-json'],
    [JSON.stringify({ ...envelope, version: 2, ...data.resume }), 'unsupported-version'],
    [JSON.stringify({ ...envelope, version: 999 }), 'unsupported-version'],
    [JSON.stringify({ ...envelope, version: '1' }), 'invalid-backup'],
    [JSON.stringify({ ...envelope, version: undefined }), 'invalid-backup'],
    [JSON.stringify({ ...envelope, version: 0 }), 'invalid-backup'],
    [JSON.stringify({ ...envelope, version: 1.5 }), 'invalid-backup'],
    [JSON.stringify({ ...envelope, format: 'other', ...data.resume }), 'invalid-backup'],
    [JSON.stringify({ ...envelope, format: undefined, ...data.resume }), 'invalid-backup'],
    [JSON.stringify({ ...envelope, exportedAt: undefined }), 'invalid-backup'],
    [JSON.stringify({ ...envelope, exportedAt: 'invalid' }), 'invalid-backup'],
    [JSON.stringify({ ...envelope, exportedAt: 12 }), 'invalid-backup'],
    [JSON.stringify({ ...envelope, data: null }), 'invalid-backup'],
    [JSON.stringify({ ...envelope, data: { ...data, resume: {} } }), 'invalid-backup'],
    [JSON.stringify({ ...envelope, data: { resume: data.resume }, ...data.resume }), 'invalid-backup'],
  ])('rejects %s as %s without falling back to legacy parsing', (text, code) => {
    expect(() => parseDocumentBackup(text)).toThrowError(expect.objectContaining({ code }))
  })

  it.each([
    null, {}, [],
    { ...data.constraints, maxPages: 0 },
    { ...data.constraints, maxPages: 11 },
    { ...data.constraints, maxPages: 1.5 },
    { ...data.constraints, maxLinesPerBullet: 0 },
    { ...data.constraints, maxLinesPerBullet: 11 },
    { ...data.constraints, minFontSize: 3 },
    { ...data.constraints, minFontSize: 17 },
    { ...data.constraints, minFontSize: '12' },
  ])('rejects invalid settings instead of clamping: %o', constraints => {
    const text = JSON.stringify({ ...envelope, data: { ...data, constraints }, ...data.resume })
    expect(() => parseDocumentBackup(text)).toThrowError(expect.objectContaining({ code: 'invalid-backup' }))
  })

  it.each([
    { maxPages: 1, maxLinesPerBullet: 1, minFontSize: 4 },
    { maxPages: 10, maxLinesPerBullet: 10, minFontSize: 16 },
  ])('preserves exact valid boundary settings: %o', constraints => {
    const valid = { ...data, constraints }
    expect(parseDocumentBackup(serializeDocumentBackup(valid))).toEqual({ kind: 'complete', data: valid })
  })
})

describe('backup file helpers', () => {
  it('reads actual complete and legacy JSON Files', async () => {
    await expect(readDocumentBackup(new File([JSON.stringify(envelope)], 'backup.json')))
      .resolves.toEqual({ kind: 'complete', data })
    await expect(readDocumentBackup(new File([JSON.stringify(data.resume)], 'resume.json')))
      .resolves.toEqual({ kind: 'legacy', resume: data.resume })
    await expect(readDocumentBackup(new File(['{'], 'bad.json')))
      .rejects.toMatchObject({ code: 'invalid-json' })
  })

  it.each(['error', 'abort', 'throw'] as const)('reports a safe file-read failure on %s', failure => {
    vi.spyOn(FileReader.prototype, 'readAsText').mockImplementation(function (this: FileReader) {
      if (failure === 'throw') throw new Error('private filesystem details')
      this.dispatchEvent(new ProgressEvent(failure))
    })
    return expect(readDocumentBackup(new File(['{}'], 'resume.json')))
      .rejects.toEqual(new DocumentBackupError('read-failed'))
  })

  it('initiates a complete JSON download with a purpose-based name and releases resources', async () => {
    vi.useFakeTimers()
    const create = vi.fn().mockReturnValue('blob:backup')
    const revoke = vi.fn()
    vi.stubGlobal('URL', { createObjectURL: create, revokeObjectURL: revoke })
    const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function (this: HTMLAnchorElement) {
      expect(this.download).toBe('presume-backup.json')
      expect(this.href).toBe('blob:backup')
      expect(document.body.contains(this)).toBe(true)
    })
    downloadDocumentBackup(data)
    expect(click).toHaveBeenCalledOnce()
    const blob = create.mock.calls[0][0] as Blob
    expect(blob.type).toBe('application/json')
    vi.runAllTimers()
    expect(revoke).toHaveBeenCalledWith('blob:backup')
    vi.useRealTimers()
    await expect(readDocumentBackup(new File([blob], 'backup.json'))).resolves.toEqual({ kind: 'complete', data })
    expect(document.querySelector('a[download]')).toBeNull()
  })

  it('cleans up the download URL and anchor even when browser initiation fails', () => {
    vi.useFakeTimers()
    const revoke = vi.fn()
    vi.stubGlobal('URL', { createObjectURL: () => 'blob:failed', revokeObjectURL: revoke })
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => { throw new Error('blocked') })
    expect(() => downloadDocumentBackup(data)).toThrow('blocked')
    expect(document.querySelector('a[download]')).toBeNull()
    vi.runAllTimers()
    expect(revoke).toHaveBeenCalledWith('blob:failed')
  })
})
