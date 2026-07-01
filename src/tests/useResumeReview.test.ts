import { act, renderHook, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import type { RefObject } from 'react'
import type { ReviewResult } from '../reviewTypes'
import type { Resume } from '../types'
import { useResumeReview } from '../useResumeReview'
import {
  ReviewApiError,
  getReviewApiState,
  submitResumeForReview,
} from '../reviewApi'
import { renderResumePageToPDFBlob } from '../export'

vi.mock('../export', () => ({
  renderResumePageToPDFBlob: vi.fn(),
}))

vi.mock('../reviewApi', async importOriginal => {
  const actual = await importOriginal<typeof import('../reviewApi')>()
  return {
    ...actual,
    getReviewApiState: vi.fn(),
    submitResumeForReview: vi.fn(),
  }
})

const getReviewApiStateMock = vi.mocked(getReviewApiState)
const renderResumePageToPDFBlobMock = vi.mocked(renderResumePageToPDFBlob)
const submitResumeForReviewMock = vi.mocked(submitResumeForReview)

const resume: Resume = {
  name: 'Ada Lovelace',
  contact: ['ada@example.test'],
  sections: [
    {
      title: 'Experience',
      entries: [
        {
          title: 'Engineer',
          subtitle: 'Analytical Engines',
          location: 'London',
          dateRange: '1842 - 1843',
          bullets: ['Documented a general-purpose computing system.'],
        },
      ],
    },
  ],
}

const reviewResult: ReviewResult = {
  id: 'review_123',
  reviewedAt: '2026-06-29T12:00:00Z',
  totalScore: 72,
  maxScore: 100,
  tier: 'competitive',
  categories: [],
  strengths: ['Clear technical ownership.'],
  improvements: ['Quantify production impact.'],
  bonuses: [],
  deductions: [],
  annotations: [],
}

const newerReviewResult: ReviewResult = {
  ...reviewResult,
  id: 'review_456',
  totalScore: 80,
  strengths: ['Newer review result.'],
}

function pageRef(): RefObject<HTMLElement> {
  return { current: document.createElement('div') }
}

function cloneResume(value: Resume): Resume {
  return JSON.parse(JSON.stringify(value)) as Resume
}

function deferred<T>() {
  let resolve!: (value: T) => void
  let reject!: (error: unknown) => void
  const promise = new Promise<T>((promiseResolve, promiseReject) => {
    resolve = promiseResolve
    reject = promiseReject
  })
  return { promise, resolve, reject }
}

async function completeSuccessfulReview(result: {
  current: ReturnType<typeof useResumeReview>
}) {
  await act(async () => {
    await result.current.requestReview()
  })
}

describe('useResumeReview', () => {
  afterEach(() => {
    vi.clearAllMocks()
  })

  it('starts unconfigured when the review API is missing', async () => {
    getReviewApiStateMock.mockReturnValue({ status: 'unconfigured' })
    const pdf = new Blob(['%PDF-1.7'], { type: 'application/pdf' })
    renderResumePageToPDFBlobMock.mockResolvedValue(pdf)

    const { result } = renderHook(() =>
      useResumeReview({ resume, pageRef: pageRef() })
    )

    expect(result.current.state).toEqual({ status: 'unconfigured' })

    await act(async () => {
      await result.current.requestReview()
    })

    expect(result.current.state).toEqual({ status: 'unconfigured' })
    expect(renderResumePageToPDFBlobMock).not.toHaveBeenCalled()
    expect(submitResumeForReviewMock).not.toHaveBeenCalled()
  })

  it('starts idle when review API configuration exists', () => {
    getReviewApiStateMock.mockReturnValue({
      status: 'configured',
      baseUrl: 'https://reviews.example.test',
    })

    const { result } = renderHook(() =>
      useResumeReview({ resume, pageRef: pageRef() })
    )

    expect(result.current.state).toEqual({ status: 'idle' })
  })

  it('generates a PDF blob, submits it, and stores the review result', async () => {
    getReviewApiStateMock.mockReturnValue({
      status: 'configured',
      baseUrl: 'https://reviews.example.test',
    })
    const pdf = new Blob(['%PDF-1.7'], { type: 'application/pdf' })
    const ref = pageRef()
    renderResumePageToPDFBlobMock.mockResolvedValue(pdf)
    submitResumeForReviewMock.mockResolvedValue(reviewResult)

    const { result } = renderHook(() =>
      useResumeReview({ resume, pageRef: ref })
    )

    await act(async () => {
      await result.current.requestReview()
    })

    expect(renderResumePageToPDFBlobMock).toHaveBeenCalledWith(ref.current)
    expect(submitResumeForReviewMock).toHaveBeenCalledWith(pdf)
    expect(result.current.state).toEqual({
      status: 'success',
      result: reviewResult,
    })
  })

  it('exposes loading while review submission is in flight', async () => {
    getReviewApiStateMock.mockReturnValue({
      status: 'configured',
      baseUrl: 'https://reviews.example.test',
    })
    const pdf = new Blob(['%PDF-1.7'], { type: 'application/pdf' })
    const pendingPdf = deferred<Blob>()
    renderResumePageToPDFBlobMock.mockReturnValue(pendingPdf.promise)
    submitResumeForReviewMock.mockResolvedValue(reviewResult)

    const { result } = renderHook(() =>
      useResumeReview({ resume, pageRef: pageRef() })
    )

    let reviewPromise!: Promise<void>
    act(() => {
      reviewPromise = result.current.requestReview()
    })

    expect(result.current.state).toEqual({ status: 'loading' })

    await act(async () => {
      pendingPdf.resolve(pdf)
      await reviewPromise
    })

    expect(result.current.state).toEqual({
      status: 'success',
      result: reviewResult,
    })
  })

  it('keeps the previous successful result visible while a rerun is loading', async () => {
    getReviewApiStateMock.mockReturnValue({
      status: 'configured',
      baseUrl: 'https://reviews.example.test',
    })
    const pendingReview = deferred<ReviewResult>()
    renderResumePageToPDFBlobMock.mockResolvedValue(
      new Blob(['%PDF-1.7'], { type: 'application/pdf' })
    )
    submitResumeForReviewMock
      .mockResolvedValueOnce(reviewResult)
      .mockReturnValueOnce(pendingReview.promise)

    const { result } = renderHook(() =>
      useResumeReview({ resume, pageRef: pageRef() })
    )

    await completeSuccessfulReview(result)

    act(() => {
      void result.current.requestReview()
    })

    expect(result.current.state).toEqual({
      status: 'loading',
      result: reviewResult,
    })

    await act(async () => {
      pendingReview.resolve(newerReviewResult)
    })
  })

  it('marks a successful result stale after resume content changes', async () => {
    getReviewApiStateMock.mockReturnValue({
      status: 'configured',
      baseUrl: 'https://reviews.example.test',
    })
    renderResumePageToPDFBlobMock.mockResolvedValue(
      new Blob(['%PDF-1.7'], { type: 'application/pdf' })
    )
    submitResumeForReviewMock.mockResolvedValue(reviewResult)
    const editedResume = cloneResume(resume)
    editedResume.sections[0].entries[0].bullets[0] =
      'Documented the first published computer program.'

    const { result, rerender } = renderHook(
      ({ currentResume }) =>
        useResumeReview({ resume: currentResume, pageRef: pageRef() }),
      { initialProps: { currentResume: resume } }
    )

    await act(async () => {
      await result.current.requestReview()
    })

    rerender({ currentResume: editedResume })

    expect(result.current.state).toEqual({
      status: 'stale',
      result: reviewResult,
    })
  })

  it('keeps a stale result marked stale while a rerun is loading', async () => {
    getReviewApiStateMock.mockReturnValue({
      status: 'configured',
      baseUrl: 'https://reviews.example.test',
    })
    renderResumePageToPDFBlobMock.mockResolvedValue(
      new Blob(['%PDF-1.7'], { type: 'application/pdf' })
    )
    const pendingReview = deferred<ReviewResult>()
    submitResumeForReviewMock
      .mockResolvedValueOnce(reviewResult)
      .mockReturnValueOnce(pendingReview.promise)
    const editedResume = cloneResume(resume)
    editedResume.sections[0].entries[0].bullets[0] =
      'Documented the first published computer program.'

    const { result, rerender } = renderHook(
      ({ currentResume }) =>
        useResumeReview({ resume: currentResume, pageRef: pageRef() }),
      { initialProps: { currentResume: resume } }
    )

    await completeSuccessfulReview(result)
    rerender({ currentResume: editedResume })

    act(() => {
      void result.current.requestReview()
    })

    expect(result.current.state).toEqual({
      status: 'loading',
      result: reviewResult,
      resultIsStale: true,
    })

    await act(async () => {
      pendingReview.resolve(newerReviewResult)
    })
  })

  it('does not let an older successful request overwrite a newer successful request', async () => {
    getReviewApiStateMock.mockReturnValue({
      status: 'configured',
      baseUrl: 'https://reviews.example.test',
    })
    renderResumePageToPDFBlobMock.mockResolvedValue(
      new Blob(['%PDF-1.7'], { type: 'application/pdf' })
    )
    const olderReview = deferred<ReviewResult>()
    const newerReview = deferred<ReviewResult>()
    submitResumeForReviewMock
      .mockReturnValueOnce(olderReview.promise)
      .mockReturnValueOnce(newerReview.promise)

    const { result } = renderHook(() =>
      useResumeReview({ resume, pageRef: pageRef() })
    )

    let olderRequest!: Promise<void>
    let newerRequest!: Promise<void>
    act(() => {
      olderRequest = result.current.requestReview()
      newerRequest = result.current.requestReview()
    })
    await waitFor(() => expect(submitResumeForReviewMock).toHaveBeenCalledTimes(2))

    await act(async () => {
      newerReview.resolve(newerReviewResult)
      await newerRequest
    })

    expect(result.current.state).toEqual({
      status: 'success',
      result: newerReviewResult,
    })

    await act(async () => {
      olderReview.resolve(reviewResult)
      await olderRequest
    })

    expect(result.current.state).toEqual({
      status: 'success',
      result: newerReviewResult,
    })
  })

  it('does not let an older failure replace a newer success', async () => {
    getReviewApiStateMock.mockReturnValue({
      status: 'configured',
      baseUrl: 'https://reviews.example.test',
    })
    renderResumePageToPDFBlobMock.mockResolvedValue(
      new Blob(['%PDF-1.7'], { type: 'application/pdf' })
    )
    const olderReview = deferred<ReviewResult>()
    const newerReview = deferred<ReviewResult>()
    submitResumeForReviewMock
      .mockReturnValueOnce(olderReview.promise)
      .mockReturnValueOnce(newerReview.promise)

    const { result } = renderHook(() =>
      useResumeReview({ resume, pageRef: pageRef() })
    )

    let olderRequest!: Promise<void>
    let newerRequest!: Promise<void>
    act(() => {
      olderRequest = result.current.requestReview()
      newerRequest = result.current.requestReview()
    })
    await waitFor(() => expect(submitResumeForReviewMock).toHaveBeenCalledTimes(2))

    await act(async () => {
      newerReview.resolve(newerReviewResult)
      await newerRequest
    })

    await act(async () => {
      olderReview.reject(
        new ReviewApiError('Older request failed.', { code: 'network_error' })
      )
      await olderRequest
    })

    expect(result.current.state).toEqual({
      status: 'success',
      result: newerReviewResult,
    })
  })

  it('does not let an older success hide a newer failure', async () => {
    getReviewApiStateMock.mockReturnValue({
      status: 'configured',
      baseUrl: 'https://reviews.example.test',
    })
    renderResumePageToPDFBlobMock.mockResolvedValue(
      new Blob(['%PDF-1.7'], { type: 'application/pdf' })
    )
    const olderReview = deferred<ReviewResult>()
    const newerReview = deferred<ReviewResult>()
    const newerError = new ReviewApiError('Newer request failed.', {
      code: 'network_error',
    })
    submitResumeForReviewMock
      .mockReturnValueOnce(olderReview.promise)
      .mockReturnValueOnce(newerReview.promise)

    const { result } = renderHook(() =>
      useResumeReview({ resume, pageRef: pageRef() })
    )

    let olderRequest!: Promise<void>
    let newerRequest!: Promise<void>
    act(() => {
      olderRequest = result.current.requestReview()
      newerRequest = result.current.requestReview()
    })
    await waitFor(() => expect(submitResumeForReviewMock).toHaveBeenCalledTimes(2))

    await act(async () => {
      newerReview.reject(newerError)
      await newerRequest
    })

    expect(result.current.state).toEqual({
      status: 'error',
      error: newerError,
    })

    await act(async () => {
      olderReview.resolve(reviewResult)
      await olderRequest
    })

    expect(result.current.state).toEqual({
      status: 'error',
      error: newerError,
    })
  })

  it('marks carried-forward stale results on errors after resume edits', async () => {
    getReviewApiStateMock.mockReturnValue({
      status: 'configured',
      baseUrl: 'https://reviews.example.test',
    })
    renderResumePageToPDFBlobMock.mockResolvedValue(
      new Blob(['%PDF-1.7'], { type: 'application/pdf' })
    )
    const error = new ReviewApiError('Could not reach the review service.', {
      code: 'network_error',
    })
    submitResumeForReviewMock
      .mockResolvedValueOnce(reviewResult)
      .mockRejectedValueOnce(error)
    const editedResume = cloneResume(resume)
    editedResume.sections[0].entries[0].bullets[0] =
      'Documented the first published computer program.'

    const { result, rerender } = renderHook(
      ({ currentResume }) =>
        useResumeReview({ resume: currentResume, pageRef: pageRef() }),
      { initialProps: { currentResume: resume } }
    )

    await completeSuccessfulReview(result)
    rerender({ currentResume: editedResume })

    await act(async () => {
      await result.current.requestReview()
    })

    expect(result.current.state).toEqual({
      status: 'error',
      error,
      result: reviewResult,
      resultIsStale: true,
    })
  })

  it('stores normalized review errors without mutating resume content', async () => {
    getReviewApiStateMock.mockReturnValue({
      status: 'configured',
      baseUrl: 'https://reviews.example.test',
    })
    const originalResume = cloneResume(resume)
    const workingResume = cloneResume(resume)
    const error = new ReviewApiError('Could not reach the review service.', {
      code: 'network_error',
    })
    renderResumePageToPDFBlobMock.mockResolvedValue(
      new Blob(['%PDF-1.7'], { type: 'application/pdf' })
    )
    submitResumeForReviewMock.mockRejectedValue(error)

    const { result } = renderHook(() =>
      useResumeReview({ resume: workingResume, pageRef: pageRef() })
    )

    await act(async () => {
      await result.current.requestReview()
    })

    expect(result.current.state).toEqual({
      status: 'error',
      error,
    })
    expect(workingResume).toEqual(originalResume)
  })

  it('reports an error when review starts without a rendered resume page', async () => {
    getReviewApiStateMock.mockReturnValue({
      status: 'configured',
      baseUrl: 'https://reviews.example.test',
    })
    const ref: RefObject<HTMLElement> = { current: null }

    const { result } = renderHook(() =>
      useResumeReview({ resume, pageRef: ref })
    )

    await act(async () => {
      await result.current.requestReview()
    })

    const state = result.current.state
    expect(state.status).toBe('error')
    expect(state.status === 'error' ? state.error : null).toMatchObject({
      message: 'Resume page is not available for review.',
    })
    expect(renderResumePageToPDFBlobMock).not.toHaveBeenCalled()
    expect(submitResumeForReviewMock).not.toHaveBeenCalled()
  })
})
