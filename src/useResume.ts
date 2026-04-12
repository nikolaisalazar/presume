import { useState, useEffect } from 'react'
import type { Constraints, Resume } from './types'
import { DEFAULT_CONSTRAINTS } from './types'
import { loadConstraints, loadResume, saveConstraints, saveResume } from './storage'
import { DEFAULT_RESUME } from './defaultResume'

export function useResume() {
  const [resume, setResume] = useState<Resume>(() => loadResume() ?? DEFAULT_RESUME)
  const [constraints, setConstraints] = useState<Constraints>(
    () => loadConstraints() ?? DEFAULT_CONSTRAINTS
  )

  useEffect(() => {
    saveResume(resume)
  }, [resume])

  useEffect(() => {
    saveConstraints(constraints)
  }, [constraints])

  return { resume, setResume, constraints, setConstraints }
}
