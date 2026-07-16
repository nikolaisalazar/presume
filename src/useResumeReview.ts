import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { renderResumeToPDFBlob } from './export'
import {
  fetchReviewConfig,
  getReviewApiState,
  submitResumeForReview,
} from './reviewApi'
import type { ReviewResult } from './reviewTypes'
import type { Resume } from './types'

export type ResumeReviewState =
  | { status: 'unconfigured' }
  | { status: 'checking' }
  | { status: 'disabled' }
  | { status: 'config_error'; error: Error }
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
  globalScale: number
}

export type UseResumeReviewResult = {
  state: ResumeReviewState
  requestReview: () => Promise<void>
}

export function useResumeReview({
  resume,
  globalScale,
}: UseResumeReviewOptions): UseResumeReviewResult {
  const resumeKey = useMemo(() => serializeResume(resume), [resume])
  const currentResumeKeyRef = useRef(resumeKey)
  const latestSubmittedResumeKeyRef = useRef<string | null>(null)
  const activeRequestIdRef = useRef(0)
  const [state, setState] = useState<ResumeReviewState>(() =>
    getReviewApiState().status === 'unconfigured'
      ? { status: 'unconfigured' }
      : { status: 'checking' }
  )

  useEffect(() => {
    if (getReviewApiState().status === 'unconfigured') {
      setState({ status: 'unconfigured' })
      return
    }

    let isActive = true

    fetchReviewConfig()
      .then(config => {
        if (!isActive) return

        setState(current => {
          if (current.status !== 'checking') return current
          if (!config) return { status: 'unconfigured' }
          return config.reviewEnabled
            ? { status: 'idle' }
            : { status: 'disabled' }
        })
      })
      .catch(error => {
        if (!isActive) return

        setState(current =>
          current.status === 'checking'
            ? { status: 'config_error', error: normalizeError(error) }
            : current
        )
      })

    return () => {
      isActive = false
    }
  }, [])

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

    if (
      state.status === 'checking' ||
      state.status === 'disabled' ||
      state.status === 'config_error'
    ) {
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
      // Let React commit and paint the loading state before the cached PDF
      // renderer begins its CPU-heavy synchronous layout work on repeat reviews.
      await yieldForBrowserPaint()
      const pdf = await renderResumeToPDFBlob(resume, globalScale)
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
  }, [globalScale, resume, state])

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

function yieldForBrowserPaint(): Promise<void> {
  if (typeof requestAnimationFrame !== 'function') {
    return new Promise(resolve => setTimeout(resolve, 0))
  }

  return new Promise(resolve => {
    requestAnimationFrame(() => requestAnimationFrame(() => resolve()))
  })
}
