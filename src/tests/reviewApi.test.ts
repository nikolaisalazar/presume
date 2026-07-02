import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  ReviewApiError,
  getReviewApiState,
  fetchReviewConfig,
  submitResumeForReview,
} from '../reviewApi'

const validReviewResult = {
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

const validConfig = {
  reviewEnabled: true,
  llmProvider: 'ollama',
  defaultModel: 'gemma3:4b',
  githubEnrichmentEnabled: false,
  maxUploadBytes: 10485760,
}

function response(body: unknown, init: ResponseInit = {}): Response {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { 'content-type': 'application/json' },
    ...init,
  })
}

function malformedJsonResponse(init: ResponseInit = {}): Response {
  return new Response('{not valid json', {
    status: 200,
    headers: { 'content-type': 'application/json' },
    ...init,
  })
}

function emptyJsonResponse(init: ResponseInit = {}): Response {
  return new Response('', {
    status: 200,
    headers: { 'content-type': 'application/json' },
    ...init,
  })
}

function textResponse(body: string, init: ResponseInit = {}): Response {
  return new Response(body, {
    status: 500,
    headers: { 'content-type': 'text/plain' },
    ...init,
  })
}

describe('reviewApi', () => {
  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it('reports review API configuration from VITE_REVIEW_API_URL', () => {
    vi.stubEnv('VITE_REVIEW_API_URL', ' https://reviews.example.test/ ')

    expect(getReviewApiState()).toEqual({
      status: 'configured',
      baseUrl: 'https://reviews.example.test',
    })
  })

  it('reports an unconfigured state when VITE_REVIEW_API_URL is missing', () => {
    vi.stubEnv('VITE_REVIEW_API_URL', '')

    expect(getReviewApiState()).toEqual({ status: 'unconfigured' })
  })

  it('fetches public review service configuration', async () => {
    vi.stubEnv('VITE_REVIEW_API_URL', 'https://reviews.example.test/api/')
    const fetchMock = vi.fn().mockResolvedValue(response(validConfig))

    await expect(fetchReviewConfig({ fetch: fetchMock })).resolves.toEqual(
      validConfig
    )

    expect(fetchMock).toHaveBeenCalledOnce()
    expect(fetchMock).toHaveBeenCalledWith(
      'https://reviews.example.test/api/config',
      { method: 'GET' }
    )
  })

  it('returns null for config discovery when review API is unconfigured', async () => {
    vi.stubEnv('VITE_REVIEW_API_URL', '')
    const fetchMock = vi.fn()

    await expect(fetchReviewConfig({ fetch: fetchMock })).resolves.toBeNull()

    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('normalizes malformed successful config responses', async () => {
    vi.stubEnv('VITE_REVIEW_API_URL', 'https://reviews.example.test')
    const fetchMock = vi.fn().mockResolvedValue(malformedJsonResponse())

    await expect(fetchReviewConfig({ fetch: fetchMock })).rejects.toMatchObject({
      code: 'invalid_response',
      status: 200,
      message: 'Review service returned an invalid configuration.',
    })
    expect(fetchMock).toHaveBeenCalledOnce()
  })

  it('normalizes empty successful config responses', async () => {
    vi.stubEnv('VITE_REVIEW_API_URL', 'https://reviews.example.test')
    const fetchMock = vi.fn().mockResolvedValue(emptyJsonResponse())

    await expect(fetchReviewConfig({ fetch: fetchMock })).rejects.toMatchObject({
      code: 'invalid_response',
      status: 200,
      message: 'Review service returned an invalid configuration.',
    })
    expect(fetchMock).toHaveBeenCalledOnce()
  })

  it('submits the generated PDF as multipart form data and validates the result', async () => {
    vi.stubEnv('VITE_REVIEW_API_URL', 'https://reviews.example.test')
    const fetchMock = vi.fn().mockResolvedValue(response(validReviewResult))
    const pdf = new Blob(['%PDF-1.7'], { type: 'application/pdf' })

    await expect(
      submitResumeForReview(pdf, { fetch: fetchMock })
    ).resolves.toEqual(validReviewResult)

    expect(fetchMock).toHaveBeenCalledOnce()
    const [url, init] = fetchMock.mock.calls[0]
    expect(url).toBe('https://reviews.example.test/reviews')
    expect(init).toMatchObject({ method: 'POST' })
    expect(init.body).toBeInstanceOf(FormData)

    const file = init.body.get('file')
    expect(file).toBeInstanceOf(File)
    expect((file as File).name).toBe('resume.pdf')
    expect((file as File).type).toBe('application/pdf')
  })

  it('rejects review submission when the API is unconfigured', async () => {
    vi.stubEnv('VITE_REVIEW_API_URL', '')
    const fetchMock = vi.fn()
    const pdf = new Blob(['%PDF-1.7'], { type: 'application/pdf' })

    await expect(
      submitResumeForReview(pdf, { fetch: fetchMock })
    ).rejects.toMatchObject({
      code: 'unconfigured',
      message: 'Review API is not configured.',
    })
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it.each([
    'invalid_upload',
    'upload_too_large',
    'pdf_parse_failed',
    'llm_provider_unavailable',
    'github_rate_limited',
    'hiring_agent_failed',
    'review_timeout',
    'internal_error',
  ] as const)('normalizes documented backend error code %s', async code => {
    vi.stubEnv('VITE_REVIEW_API_URL', 'https://reviews.example.test')
    const status = code === 'internal_error' ? 500 : 400
    const requestId = `req_${code}`
    const message = `Frontend-safe message for ${code}.`
    const fetchMock = vi.fn().mockResolvedValue(
      response(
        {
          error: {
            code,
            message,
            requestId,
          },
        },
        { status }
      )
    )
    const pdf = new Blob(['not a pdf'], { type: 'application/pdf' })

    await expect(
      submitResumeForReview(pdf, { fetch: fetchMock })
    ).rejects.toEqual(
      new ReviewApiError(message, {
        code,
        status,
        requestId,
      })
    )
    expect(fetchMock).toHaveBeenCalledOnce()
  })

  it('normalizes the documented upload_too_large backend response shape', async () => {
    vi.stubEnv('VITE_REVIEW_API_URL', 'https://reviews.example.test')
    const fetchMock = vi.fn().mockResolvedValue(
      response(
        {
          error: {
            code: 'upload_too_large',
            message: 'Upload exceeds the review service size limit.',
            requestId: 'req_upload_limit',
          },
        },
        { status: 413 }
      )
    )
    const pdf = new Blob(['%PDF-1.7'], { type: 'application/pdf' })

    await expect(
      submitResumeForReview(pdf, { fetch: fetchMock })
    ).rejects.toEqual(
      new ReviewApiError('Upload exceeds the review service size limit.', {
        code: 'upload_too_large',
        status: 413,
        requestId: 'req_upload_limit',
      })
    )
    expect(fetchMock).toHaveBeenCalledOnce()
  })

  it('does not expose messages from undocumented backend error codes', async () => {
    vi.stubEnv('VITE_REVIEW_API_URL', 'https://reviews.example.test')
    const fetchMock = vi.fn().mockResolvedValue(
      response(
        {
          error: {
            code: 'provider_secret_leaked',
            message: 'raw provider stack trace with /local/path and token',
            requestId: 'req_unknown',
          },
        },
        { status: 502 }
      )
    )
    const pdf = new Blob(['%PDF-1.7'], { type: 'application/pdf' })

    await expect(
      submitResumeForReview(pdf, { fetch: fetchMock })
    ).rejects.toEqual(
      new ReviewApiError('Review service request failed.', {
        code: 'internal_error',
        status: 502,
      })
    )
    expect(fetchMock).toHaveBeenCalledOnce()
  })

  it('normalizes non-JSON backend error responses without retrying', async () => {
    vi.stubEnv('VITE_REVIEW_API_URL', 'https://reviews.example.test')
    const fetchMock = vi
      .fn()
      .mockResolvedValue(textResponse('raw stack trace', { status: 503 }))
    const pdf = new Blob(['%PDF-1.7'], { type: 'application/pdf' })

    await expect(
      submitResumeForReview(pdf, { fetch: fetchMock })
    ).rejects.toEqual(
      new ReviewApiError('Review service request failed.', {
        code: 'internal_error',
        status: 503,
      })
    )
    expect(fetchMock).toHaveBeenCalledOnce()
  })

  it('rejects malformed successful review responses', async () => {
    vi.stubEnv('VITE_REVIEW_API_URL', 'https://reviews.example.test')
    const fetchMock = vi.fn().mockResolvedValue(
      response({ ...validReviewResult, totalScore: Number.NaN })
    )
    const pdf = new Blob(['%PDF-1.7'], { type: 'application/pdf' })

    await expect(
      submitResumeForReview(pdf, { fetch: fetchMock })
    ).rejects.toMatchObject({
      code: 'invalid_response',
      message: 'Review service returned an invalid review result.',
    })
  })

  it('normalizes malformed successful review JSON without retrying', async () => {
    vi.stubEnv('VITE_REVIEW_API_URL', 'https://reviews.example.test')
    const fetchMock = vi.fn().mockResolvedValue(malformedJsonResponse())
    const pdf = new Blob(['%PDF-1.7'], { type: 'application/pdf' })

    await expect(
      submitResumeForReview(pdf, { fetch: fetchMock })
    ).rejects.toMatchObject({
      code: 'invalid_response',
      status: 200,
      message: 'Review service returned an invalid review result.',
    })
    expect(fetchMock).toHaveBeenCalledOnce()
  })

  it('normalizes network failures without retrying automatically', async () => {
    vi.stubEnv('VITE_REVIEW_API_URL', 'https://reviews.example.test')
    const fetchMock = vi.fn().mockRejectedValue(new TypeError('Failed to fetch'))
    const pdf = new Blob(['%PDF-1.7'], { type: 'application/pdf' })

    await expect(
      submitResumeForReview(pdf, { fetch: fetchMock })
    ).rejects.toMatchObject({
      code: 'network_error',
      message: 'Could not reach the review service.',
    })
    expect(fetchMock).toHaveBeenCalledOnce()
  })
})
