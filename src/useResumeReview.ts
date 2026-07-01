import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { renderResumePageToPDFBlob } from './export'
import { getReviewApiState, submitResumeForReview } from './reviewApi'
import type { ReviewResult } from './reviewTypes'
import type { Resume } from './types'

export type ResumeReviewState =
  | { status: 'unconfigured' }
  | { status: 'idle' }
  | { status: 'loading'; result?: ReviewResult; resultIsStale?: boolean }
  | { status: 'success'; result: ReviewResult }
  | { status: 'stale'; result: ReviewResult }
  | {
      status: 'error'
      error: Error
      result?: ReviewResult
      resultIsStale?: boolean
    }

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
  const activeRequestIdRef = useRef(0)
  const [state, setState] = useState<ResumeReviewState>(() =>
    getReviewApiState().status === 'unconfigured'
      ? { status: 'unconfigured' }
      : { status: 'idle' }
  )

  useEffect(() => {
    currentResumeKeyRef.current = resumeKey
    setState(current => {
      const latestReviewMatchesResume =
        latestSubmittedResumeKeyRef.current === resumeKey

      if (current.status === 'success') {
        return latestReviewMatchesResume
          ? current
          : { status: 'stale', result: current.result }
      }

      if (
        (current.status === 'loading' || current.status === 'error') &&
        current.result &&
        !latestReviewMatchesResume &&
        !current.resultIsStale
      ) {
        return { ...current, resultIsStale: true }
      }

      return current
    })
  }, [resumeKey])

  const requestReview = useCallback(async () => {
    const requestId = activeRequestIdRef.current + 1
    activeRequestIdRef.current = requestId

    if (getReviewApiState().status === 'unconfigured') {
      setState({ status: 'unconfigured' })
      return
    }

    const previousReview = getCurrentReview(state)
    setState({
      status: 'loading',
      ...(previousReview.result ? { result: previousReview.result } : {}),
      ...(previousReview.resultIsStale ? { resultIsStale: true } : {}),
    })

    const submittedResumeKey = currentResumeKeyRef.current

    try {
      const pageElement = pageRef.current
      if (!pageElement) {
        throw new Error('Resume page is not available for review.')
      }

      const pdf = await renderResumePageToPDFBlob(pageElement)
      const result = await submitResumeForReview(pdf)
      if (activeRequestIdRef.current !== requestId) {
        return
      }

      latestSubmittedResumeKeyRef.current = submittedResumeKey

      setState(
        currentResumeKeyRef.current === submittedResumeKey
          ? { status: 'success', result }
          : { status: 'stale', result }
      )
    } catch (error) {
      if (activeRequestIdRef.current !== requestId) {
        return
      }

      setState({
        status: 'error',
        error: normalizeError(error),
        ...(previousReview.result ? { result: previousReview.result } : {}),
        ...(previousReview.resultIsStale ? { resultIsStale: true } : {}),
      })
    }
  }, [pageRef, state])

  return { state, requestReview }
}

function serializeResume(resume: Resume): string {
  return JSON.stringify(resume)
}

function getCurrentReview(state: ResumeReviewState): {
  result?: ReviewResult
  resultIsStale?: boolean
} {
  if (!('result' in state) || !state.result) {
    return {}
  }

  const resultIsStale =
    state.status === 'stale' ||
    (state.status !== 'success' && state.resultIsStale)

  return {
    result: state.result,
    ...(resultIsStale ? { resultIsStale: true } : {}),
  }
}

function normalizeError(error: unknown): Error {
  return error instanceof Error
    ? error
    : new Error('Review request failed.')
}
