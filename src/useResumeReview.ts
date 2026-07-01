import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { renderResumePageToPDFBlob } from './export'
import { getReviewApiState, submitResumeForReview } from './reviewApi'
import type { ReviewResult } from './reviewTypes'
import type { Resume } from './types'

export type ResumeReviewState =
  | { status: 'unconfigured' }
  | { status: 'idle' }
  | { status: 'loading'; result?: ReviewResult }
  | { status: 'success'; result: ReviewResult }
  | { status: 'stale'; result: ReviewResult }
  | { status: 'error'; error: Error; result?: ReviewResult }

export type UseResumeReviewOptions = {
  resume: Resume
  pageRef: React.RefObject<HTMLElement>
}

export type UseResumeReviewResult = {
  state: ResumeReviewState
  requestReview: () => Promise<void>
}

export function useResumeReview({
  resume,
  pageRef,
}: UseResumeReviewOptions): UseResumeReviewResult {
  const resumeKey = useMemo(() => serializeResume(resume), [resume])
  const currentResumeKeyRef = useRef(resumeKey)
  const latestSubmittedResumeKeyRef = useRef<string | null>(null)
  const [state, setState] = useState<ResumeReviewState>(() =>
    getReviewApiState().status === 'unconfigured'
      ? { status: 'unconfigured' }
      : { status: 'idle' }
  )

  useEffect(() => {
    currentResumeKeyRef.current = resumeKey
    setState(current => {
      if (current.status !== 'success') {
        return current
      }
      if (latestSubmittedResumeKeyRef.current === resumeKey) {
        return current
      }
      return { status: 'stale', result: current.result }
    })
  }, [resumeKey])

  const requestReview = useCallback(async () => {
    if (getReviewApiState().status === 'unconfigured') {
      setState({ status: 'unconfigured' })
      return
    }

    const previousResult = getCurrentResult(state)
    setState(
      previousResult
        ? { status: 'loading', result: previousResult }
        : { status: 'loading' }
    )

    const submittedResumeKey = currentResumeKeyRef.current

    try {
      const pageElement = pageRef.current
      if (!pageElement) {
        throw new Error('Resume page is not available for review.')
      }

      const pdf = await renderResumePageToPDFBlob(pageElement)
      const result = await submitResumeForReview(pdf)
      latestSubmittedResumeKeyRef.current = submittedResumeKey

      setState(
        currentResumeKeyRef.current === submittedResumeKey
          ? { status: 'success', result }
          : { status: 'stale', result }
      )
    } catch (error) {
      setState({
        status: 'error',
        error: normalizeError(error),
        ...(previousResult ? { result: previousResult } : {}),
      })
    }
  }, [pageRef, state])

  return { state, requestReview }
}

function serializeResume(resume: Resume): string {
  return JSON.stringify(resume)
}

function getCurrentResult(state: ResumeReviewState): ReviewResult | undefined {
  return 'result' in state ? state.result : undefined
}

function normalizeError(error: unknown): Error {
  return error instanceof Error
    ? error
    : new Error('Review request failed.')
}
