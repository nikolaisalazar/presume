import { useState, useEffect, type SetStateAction } from 'react'
import type { Constraints, Resume } from './types'
import { DEFAULT_CONSTRAINTS } from './constraints'
import { loadConstraints, loadResume, saveConstraints, saveResume } from './storage'
import { DEFAULT_RESUME } from './defaultResume'
import type { DocumentData } from './document'
import type { ParsedDocumentBackup } from './documentBackup'

export function useResume() {
  const [data, setData] = useState<DocumentData>(() => ({
    resume: loadResume() ?? DEFAULT_RESUME,
    constraints: loadConstraints() ?? DEFAULT_CONSTRAINTS,
  }))
  const { resume, constraints } = data
  const setResume = (next: SetStateAction<Resume>) => setData(current => ({
    ...current,
    resume: typeof next === 'function' ? next(current.resume) : next,
  }))
  const setConstraints = (next: SetStateAction<Constraints>) => setData(current => ({
    ...current,
    constraints: typeof next === 'function' ? next(current.constraints) : next,
  }))
  const restoreBackup = (backup: ParsedDocumentBackup) => setData(current =>
    backup.kind === 'complete' ? backup.data : { ...current, resume: backup.resume }
  )

  useEffect(() => {
    saveResume(resume)
  }, [resume])

  useEffect(() => {
    saveConstraints(constraints)
  }, [constraints])

  return { data, resume, setResume, constraints, setConstraints, restoreBackup }
}
