import { parseDocumentData, type DocumentData } from './document'
import { validateResume, type Resume } from './types'

export type DocumentBackup = {
  format: 'presume-backup'
  version: 1
  exportedAt: string
  data: DocumentData
}

export type ParsedDocumentBackup =
  | { kind: 'complete'; data: DocumentData }
  | { kind: 'legacy'; resume: Resume }

const messages = {
  'invalid-json': 'Could not parse the file as JSON.',
  'invalid-backup': 'File does not match the expected backup format, including valid formatting settings.',
  'unsupported-version': 'This backup version is not supported. Open it with a newer version of Presume.',
  'invalid-resume': 'File does not match the expected resume format.',
  'read-failed': 'Failed to read the file.',
} as const

export class DocumentBackupError extends Error {
  constructor(readonly code: keyof typeof messages) {
    super(messages[code])
    this.name = 'DocumentBackupError'
  }
}

export function serializeDocumentBackup(data: DocumentData, now = new Date()): string {
  const validated = parseDocumentData(data)
  if (!validated) throw new DocumentBackupError('invalid-backup')
  const backup: DocumentBackup = {
    format: 'presume-backup',
    version: 1,
    exportedAt: now.toISOString(),
    data: validated,
  }
  return JSON.stringify(backup, null, 2)
}

export function parseDocumentBackup(text: string): ParsedDocumentBackup {
  let value: unknown
  try {
    value = JSON.parse(text)
  } catch {
    throw new DocumentBackupError('invalid-json')
  }

  if (value && typeof value === 'object' && !Array.isArray(value)) {
    const envelope = value as Record<string, unknown>
    // Reserved envelope markers cannot fall through to the legacy decoder,
    // even if the file also contains a valid bare Resume at the top level.
    if ('format' in envelope || 'version' in envelope) {
      if (envelope.format !== 'presume-backup') {
        throw new DocumentBackupError('invalid-backup')
      }
      if (envelope.version !== 1) {
        if (typeof envelope.version === 'number' && Number.isInteger(envelope.version) && envelope.version > 1) {
          throw new DocumentBackupError('unsupported-version')
        }
        throw new DocumentBackupError('invalid-backup')
      }
      const data = parseDocumentData(envelope.data)
      if (!data || typeof envelope.exportedAt !== 'string' || !Number.isFinite(Date.parse(envelope.exportedAt))) {
        throw new DocumentBackupError('invalid-backup')
      }
      return { kind: 'complete', data }
    }
  }

  const resume = validateResume(value)
  if (!resume) throw new DocumentBackupError('invalid-resume')
  return { kind: 'legacy', resume }
}

export function readDocumentBackup(file: File): Promise<ParsedDocumentBackup> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      try {
        if (typeof reader.result !== 'string') throw new DocumentBackupError('read-failed')
        resolve(parseDocumentBackup(reader.result))
      } catch (error) {
        reject(error)
      }
    }
    reader.onerror = reader.onabort = () => reject(new DocumentBackupError('read-failed'))
    try {
      reader.readAsText(file)
    } catch {
      reject(new DocumentBackupError('read-failed'))
    }
  })
}

/** Initiates a browser download; this cannot establish that a file was saved. */
export function downloadDocumentBackup(data: DocumentData): void {
  const blob = new Blob([serializeDocumentBackup(data)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = 'presume-backup.json'
  try {
    document.body.appendChild(anchor)
    anchor.click()
  } finally {
    anchor.remove()
    setTimeout(() => URL.revokeObjectURL(url), 100)
  }
}
