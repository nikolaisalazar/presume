import type { ReviewResult } from './reviewTypes'
import { validateReviewResult } from './reviewTypes'

export type ReviewApiState =
  | { status: 'unconfigured' }
  | { status: 'configured'; baseUrl: string }

export type ReviewServiceConfig = {
  reviewEnabled: boolean
  llmProvider: string
  defaultModel: string
  githubEnrichmentEnabled: boolean
  maxUploadBytes: number
}

export type ReviewApiErrorCode =
  | 'unconfigured'
  | 'invalid_response'
  | 'network_error'
  | 'invalid_upload'
  | 'pdf_parse_failed'
  | 'llm_provider_unavailable'
  | 'github_rate_limited'
  | 'hiring_agent_failed'
  | 'review_timeout'
  | 'internal_error'

type ReviewApiErrorOptions = {
  code: ReviewApiErrorCode
  status?: number
  requestId?: string
}

type FetchLike = (input: string, init?: RequestInit) => Promise<Response>

type ReviewApiOptions = {
  fetch?: FetchLike
}

const DOCUMENTED_BACKEND_ERROR_CODES = new Set<ReviewApiErrorCode>([
  'invalid_upload',
  'pdf_parse_failed',
  'llm_provider_unavailable',
  'github_rate_limited',
  'hiring_agent_failed',
  'review_timeout',
  'internal_error',
])

export class ReviewApiError extends Error {
  code: ReviewApiErrorCode
  status?: number
  requestId?: string

  constructor(message: string, options: ReviewApiErrorOptions) {
    super(message)
    this.name = 'ReviewApiError'
    this.code = options.code
    this.status = options.status
    this.requestId = options.requestId
  }
}

export function getReviewApiState(): ReviewApiState {
  const baseUrl = import.meta.env.VITE_REVIEW_API_URL?.trim()
  if (!baseUrl) {
    return { status: 'unconfigured' }
  }

  return {
    status: 'configured',
    baseUrl: baseUrl.replace(/\/+$/, ''),
  }
}

export async function fetchReviewConfig(
  options: ReviewApiOptions = {}
): Promise<ReviewServiceConfig | null> {
  const state = getReviewApiState()
  if (state.status === 'unconfigured') {
    return null
  }

  const response = await callFetch(options.fetch, `${state.baseUrl}/config`, {
    method: 'GET',
  })

  await throwForErrorResponse(response)
  const config = validateReviewServiceConfig(await response.json())
  if (!config) {
    throw new ReviewApiError(
      'Review service returned an invalid configuration.',
      { code: 'invalid_response', status: response.status }
    )
  }

  return config
}

export async function submitResumeForReview(
  pdf: Blob,
  options: ReviewApiOptions = {}
): Promise<ReviewResult> {
  const state = getReviewApiState()
  if (state.status === 'unconfigured') {
    throw new ReviewApiError('Review API is not configured.', {
      code: 'unconfigured',
    })
  }

  const body = new FormData()
  body.append('file', pdf, 'resume.pdf')

  const response = await callFetch(options.fetch, `${state.baseUrl}/reviews`, {
    method: 'POST',
    body,
  })

  await throwForErrorResponse(response)
  const result = validateReviewResult(await response.json())
  if (!result) {
    throw new ReviewApiError(
      'Review service returned an invalid review result.',
      { code: 'invalid_response', status: response.status }
    )
  }

  return result
}

async function callFetch(
  fetchImpl: FetchLike = fetch,
  url: string,
  init: RequestInit
): Promise<Response> {
  try {
    return await fetchImpl(url, init)
  } catch {
    throw new ReviewApiError('Could not reach the review service.', {
      code: 'network_error',
    })
  }
}

async function throwForErrorResponse(response: Response): Promise<void> {
  if (response.ok) {
    return
  }

  const fallbackCode =
    response.status >= 500 ? 'internal_error' : 'invalid_response'
  const payload = await readJson(response)
  const error = parseBackendError(payload)

  throw new ReviewApiError(
    error?.message ?? 'Review service request failed.',
    {
      code: error?.code ?? fallbackCode,
      status: response.status,
      requestId: error?.requestId,
    }
  )
}

async function readJson(response: Response): Promise<unknown> {
  try {
    return await response.json()
  } catch {
    return null
  }
}

function parseBackendError(
  payload: unknown
): { code: ReviewApiErrorCode; message: string; requestId?: string } | null {
  if (!isRecord(payload) || !isRecord(payload.error)) {
    return null
  }

  const { code, message, requestId } = payload.error
  if (
    typeof code !== 'string' ||
    !DOCUMENTED_BACKEND_ERROR_CODES.has(code as ReviewApiErrorCode) ||
    typeof message !== 'string'
  ) {
    return null
  }

  return {
    code: code as ReviewApiErrorCode,
    message,
    ...(typeof requestId === 'string' ? { requestId } : {}),
  }
}

function validateReviewServiceConfig(data: unknown): ReviewServiceConfig | null {
  if (!isRecord(data)) {
    return null
  }
  if (typeof data.reviewEnabled !== 'boolean') {
    return null
  }
  if (typeof data.llmProvider !== 'string') {
    return null
  }
  if (typeof data.defaultModel !== 'string') {
    return null
  }
  if (typeof data.githubEnrichmentEnabled !== 'boolean') {
    return null
  }
  if (
    typeof data.maxUploadBytes !== 'number' ||
    !Number.isFinite(data.maxUploadBytes)
  ) {
    return null
  }

  return {
    reviewEnabled: data.reviewEnabled,
    llmProvider: data.llmProvider,
    defaultModel: data.defaultModel,
    githubEnrichmentEnabled: data.githubEnrichmentEnabled,
    maxUploadBytes: data.maxUploadBytes,
  }
}

function isRecord(data: unknown): data is Record<string, unknown> {
  return !!data && typeof data === 'object'
}
