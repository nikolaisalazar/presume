import { act, renderHook, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import type { ReviewResult } from '../reviewTypes'
import type { Resume } from '../types'
import { useResumeReview } from '../useResumeReview'
import {
  ReviewApiError,
  fetchReviewConfig,
  getReviewApiState,
  submitResumeForReview,
} from '../reviewApi'
import { renderResumeToPDFBlob } from '../export'

vi.mock('../export', () => ({
  renderResumeToPDFBlob: vi.fn(),
}))

vi.mock('../reviewApi', async importOriginal => {
  const actual = await importOriginal<typeof import('../reviewApi')>()
  return {
    ...actual,
    fetchReviewConfig: vi.fn(),
    getReviewApiState: vi.fn(),
    submitResumeForReview: vi.fn(),
  }
})

const fetchReviewConfigMock = vi.mocked(fetchReviewConfig)
const getReviewApiStateMock = vi.mocked(getReviewApiState)
const renderResumeToPDFBlobMock = vi.mocked(renderResumeToPDFBlob)
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

const enabledReviewConfig = {
  reviewEnabled: true,
  llmProvider: 'ollama',
  defaultModel: 'gemma3:4b',
  githubEnrichmentEnabled: false,
  maxUploadBytes: 10_485_760,
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

function mockConfiguredApi() {
  getReviewApiStateMock.mockReturnValue({
    status: 'configured',
    baseUrl: 'https://reviews.example.test',
  })
  fetchReviewConfigMock.mockResolvedValue(enabledReviewConfig)
}

async function waitForReviewReady(result: {
  current: ReturnType<typeof useResumeReview>
}) {
  await waitFor(() => expect(result.current.state.status).toBe('idle'))
}

describe('useResumeReview', () => {
  afterEach(() => {
    vi.clearAllMocks()
  })

  it('starts unconfigured when the review API is missing', async () => {
    getReviewApiStateMock.mockReturnValue({ status: 'unconfigured' })
    const pdf = new Blob(['%PDF-1.7'], { type: 'application/pdf' })
    renderResumeToPDFBlobMock.mockResolvedValue(pdf)

    const { result } = renderHook(() =>
      useResumeReview({ resume, globalScale: 1.0584 })
    )

    expect(result.current.state).toEqual({ status: 'unconfigured' })

    await act(async () => {
      await result.current.requestReview()
    })

    expect(result.current.state).toEqual({ status: 'unconfigured' })
    expect(renderResumeToPDFBlobMock).not.toHaveBeenCalled()
    expect(submitResumeForReviewMock).not.toHaveBeenCalled()
  })

  it('checks service configuration when review API configuration exists', async () => {
    mockConfiguredApi()

    const { result } = renderHook(() =>
      useResumeReview({ resume, globalScale: 1.0584 })
    )

    expect(result.current.state).toEqual({ status: 'checking' })
    expect(fetchReviewConfigMock).toHaveBeenCalledOnce()

    await waitForReviewReady(result)

    expect(result.current.state).toEqual({ status: 'idle' })
  })

  it('disables review when service configuration reports review disabled', async () => {
    getReviewApiStateMock.mockReturnValue({
      status: 'configured',
      baseUrl: 'https://reviews.example.test',
    })
    fetchReviewConfigMock.mockResolvedValue({
      ...enabledReviewConfig,
      reviewEnabled: false,
    })

    const { result } = renderHook(() =>
      useResumeReview({ resume, globalScale: 1.0584 })
    )

    await waitFor(() => expect(result.current.state.status).toBe('disabled'))

    await act(async () => {
      await result.current.requestReview()
    })

    expect(result.current.state).toEqual({ status: 'disabled' })
    expect(renderResumeToPDFBlobMock).not.toHaveBeenCalled()
    expect(submitResumeForReviewMock).not.toHaveBeenCalled()
  })

  it('does not submit review when service configuration discovery fails on the network', async () => {
    getReviewApiStateMock.mockReturnValue({
      status: 'configured',
      baseUrl: 'https://reviews.example.test',
    })
    const error = new ReviewApiError('Could not reach the review service.', {
      code: 'network_error',
    })
    fetchReviewConfigMock.mockRejectedValue(error)

    const { result } = renderHook(() =>
      useResumeReview({ resume, globalScale: 1.0584 })
    )

    await waitFor(() =>
      expect(result.current.state).toEqual({
        status: 'config_error',
        error,
      })
    )

    await act(async () => {
      await result.current.requestReview()
    })

    expect(result.current.state).toEqual({
      status: 'config_error',
      error,
    })
    expect(renderResumeToPDFBlobMock).not.toHaveBeenCalled()
    expect(submitResumeForReviewMock).not.toHaveBeenCalled()
  })

  it('does not submit review when service configuration response is invalid', async () => {
    getReviewApiStateMock.mockReturnValue({
      status: 'configured',
      baseUrl: 'https://reviews.example.test',
    })
    const error = new ReviewApiError(
      'Review service returned an invalid configuration.',
      {
        code: 'invalid_response',
        status: 200,
      }
    )
    fetchReviewConfigMock.mockRejectedValue(error)

    const { result } = renderHook(() =>
      useResumeReview({ resume, globalScale: 1.0584 })
    )

    await waitFor(() =>
      expect(result.current.state).toEqual({
        status: 'config_error',
        error,
      })
    )

    await act(async () => {
      await result.current.requestReview()
    })

    expect(result.current.state).toEqual({
      status: 'config_error',
      error,
    })
    expect(renderResumeToPDFBlobMock).not.toHaveBeenCalled()
    expect(submitResumeForReviewMock).not.toHaveBeenCalled()
  })

  it('generates a PDF blob, submits it, and stores the review result', async () => {
    mockConfiguredApi()
    const pdf = new Blob(['%PDF-1.7'], { type: 'application/pdf' })
    renderResumeToPDFBlobMock.mockResolvedValue(pdf)
    submitResumeForReviewMock.mockResolvedValue(reviewResult)

    const { result } = renderHook(() =>
      useResumeReview({ resume, globalScale: 1.0584 })
    )

    await waitForReviewReady(result)

    await act(async () => {
      await result.current.requestReview()
    })

    expect(renderResumeToPDFBlobMock).toHaveBeenCalledWith(resume, 1.0584)
    expect(submitResumeForReviewMock).toHaveBeenCalledWith(pdf)
    expect(result.current.state).toEqual({
      status: 'success',
      result: reviewResult,
    })
  })

  it('exposes loading while review submission is in flight', async () => {
    mockConfiguredApi()
    const pdf = new Blob(['%PDF-1.7'], { type: 'application/pdf' })
    const pendingPdf = deferred<Blob>()
    renderResumeToPDFBlobMock.mockReturnValue(pendingPdf.promise)
    submitResumeForReviewMock.mockResolvedValue(reviewResult)

    const { result } = renderHook(() =>
      useResumeReview({ resume, globalScale: 1.0584 })
    )

    await waitForReviewReady(result)

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
    mockConfiguredApi()
    const pendingReview = deferred<ReviewResult>()
    renderResumeToPDFBlobMock.mockResolvedValue(
      new Blob(['%PDF-1.7'], { type: 'application/pdf' })
    )
    submitResumeForReviewMock
      .mockResolvedValueOnce(reviewResult)
      .mockReturnValueOnce(pendingReview.promise)

    const { result } = renderHook(() =>
      useResumeReview({ resume, globalScale: 1.0584 })
    )

    await waitForReviewReady(result)
    await completeSuccessfulReview(result)

    let rerun!: Promise<void>
    act(() => {
      rerun = result.current.requestReview()
    })

    expect(result.current.state).toEqual({
      status: 'loading',
      result: reviewResult,
    })

    await act(async () => {
      pendingReview.resolve(newerReviewResult)
      await rerun
    })
  })

  it('marks a successful result stale after resume content changes', async () => {
    mockConfiguredApi()
    renderResumeToPDFBlobMock.mockResolvedValue(
      new Blob(['%PDF-1.7'], { type: 'application/pdf' })
    )
    submitResumeForReviewMock.mockResolvedValue(reviewResult)
    const editedResume = cloneResume(resume)
    editedResume.sections[0].entries[0].bullets[0] =
      'Documented the first published computer program.'

    const { result, rerender } = renderHook(
      ({ currentResume }) =>
        useResumeReview({ resume: currentResume, globalScale: 1.0584 }),
      { initialProps: { currentResume: resume } }
    )

    await waitForReviewReady(result)

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
    mockConfiguredApi()
    renderResumeToPDFBlobMock.mockResolvedValue(
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
        useResumeReview({ resume: currentResume, globalScale: 1.0584 }),
      { initialProps: { currentResume: resume } }
    )

    await waitForReviewReady(result)
    await completeSuccessfulReview(result)
    rerender({ currentResume: editedResume })

    let rerun!: Promise<void>
    act(() => {
      rerun = result.current.requestReview()
    })

    expect(result.current.state).toEqual({
      status: 'loading',
      result: reviewResult,
      resultIsStale: true,
    })

    await act(async () => {
      pendingReview.resolve(newerReviewResult)
      await rerun
    })
  })

  it('does not let an older successful request overwrite a newer successful request', async () => {
    mockConfiguredApi()
    renderResumeToPDFBlobMock.mockResolvedValue(
      new Blob(['%PDF-1.7'], { type: 'application/pdf' })
    )
    const olderReview = deferred<ReviewResult>()
    const newerReview = deferred<ReviewResult>()
    submitResumeForReviewMock
      .mockReturnValueOnce(olderReview.promise)
      .mockReturnValueOnce(newerReview.promise)

    const { result } = renderHook(() =>
      useResumeReview({ resume, globalScale: 1.0584 })
    )

    await waitForReviewReady(result)

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
    mockConfiguredApi()
    renderResumeToPDFBlobMock.mockResolvedValue(
      new Blob(['%PDF-1.7'], { type: 'application/pdf' })
    )
    const olderReview = deferred<ReviewResult>()
    const newerReview = deferred<ReviewResult>()
    submitResumeForReviewMock
      .mockReturnValueOnce(olderReview.promise)
      .mockReturnValueOnce(newerReview.promise)

    const { result } = renderHook(() =>
      useResumeReview({ resume, globalScale: 1.0584 })
    )

    await waitForReviewReady(result)

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
    mockConfiguredApi()
    renderResumeToPDFBlobMock.mockResolvedValue(
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
      useResumeReview({ resume, globalScale: 1.0584 })
    )

    await waitForReviewReady(result)

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
    mockConfiguredApi()
    renderResumeToPDFBlobMock.mockResolvedValue(
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
        useResumeReview({ resume: currentResume, globalScale: 1.0584 }),
      { initialProps: { currentResume: resume } }
    )

    await waitForReviewReady(result)
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
    mockConfiguredApi()
    const originalResume = cloneResume(resume)
    const workingResume = cloneResume(resume)
    const error = new ReviewApiError('Could not reach the review service.', {
      code: 'network_error',
    })
    renderResumeToPDFBlobMock.mockResolvedValue(
      new Blob(['%PDF-1.7'], { type: 'application/pdf' })
    )
    submitResumeForReviewMock.mockRejectedValue(error)

    const { result } = renderHook(() =>
      useResumeReview({ resume: workingResume, globalScale: 1.0584 })
    )

    await waitForReviewReady(result)

    await act(async () => {
      await result.current.requestReview()
    })

    expect(result.current.state).toEqual({
      status: 'error',
      error,
    })
    expect(workingResume).toEqual(originalResume)
  })

})
