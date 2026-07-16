import type { components } from './generated/reviewContract'

type WireReviewResult = components['schemas']['ReviewResult']
type WireReviewCategory = components['schemas']['ReviewCategory']
type WireReviewAdjustment = components['schemas']['ReviewAdjustment']
type WireReviewAnnotation = components['schemas']['ReviewAnnotation']

export type ReviewCategory = WireReviewCategory
export type ReviewTier = WireReviewResult['tier']
export type ReviewCategoryKey = ReviewCategory['key']
export type ReviewAnnotationSeverity = WireReviewAnnotation['severity']

export type ReviewAdjustment = Omit<WireReviewAdjustment, 'evidence'> & {
  evidence?: Exclude<WireReviewAdjustment['evidence'], null>
}

export type ReviewAnnotation = Omit<
  WireReviewAnnotation,
  'categoryKey' | 'sectionTitle' | 'entryTitle' | 'bulletText'
> & {
  categoryKey?: Exclude<WireReviewAnnotation['categoryKey'], null>
  sectionTitle?: Exclude<WireReviewAnnotation['sectionTitle'], null>
  entryTitle?: Exclude<WireReviewAnnotation['entryTitle'], null>
  bulletText?: Exclude<WireReviewAnnotation['bulletText'], null>
}

export type ReviewResult = Omit<
  WireReviewResult,
  'categories' | 'bonuses' | 'deductions' | 'annotations'
> & {
  categories: ReviewCategory[]
  bonuses: ReviewAdjustment[]
  deductions: ReviewAdjustment[]
  annotations: ReviewAnnotation[]
}

export type BackendReviewErrorCode =
  components['schemas']['ErrorBody']['code']
export const BACKEND_REVIEW_ERROR_CODES = [
  'invalid_upload',
  'upload_too_large',
  'pdf_parse_failed',
  'llm_provider_unavailable',
  'github_rate_limited',
  'hiring_agent_failed',
  'review_timeout',
  'internal_error',
] as const satisfies readonly BackendReviewErrorCode[]

export type ReviewServiceConfig = Pick<
  components['schemas']['PublicConfig'],
  | 'reviewEnabled'
  | 'llmProvider'
  | 'defaultModel'
  | 'githubEnrichmentEnabled'
  | 'maxUploadBytes'
>

const REVIEW_TIERS = new Set<ReviewTier>([
  'strong',
  'competitive',
  'needs_work',
  'incomplete',
])

const CATEGORY_KEYS = new Set<ReviewCategoryKey>([
  'open_source',
  'self_projects',
  'production',
  'technical_skills',
])

const ANNOTATION_SEVERITIES = new Set<ReviewAnnotationSeverity>([
  'info',
  'warning',
  'strong',
])

const hasOwn = Object.prototype.hasOwnProperty

function isRecord(data: unknown): data is Record<string, unknown> {
  return !!data && typeof data === 'object'
}

function isStringArray(data: unknown): data is string[] {
  return Array.isArray(data) && data.every(item => typeof item === 'string')
}

function isFiniteNumber(data: unknown): data is number {
  return typeof data === 'number' && Number.isFinite(data)
}

function validateOptionalString(data: unknown): string | undefined | null {
  if (data === undefined) return undefined
  if (typeof data !== 'string') return null
  return data
}

function validateReviewTier(data: unknown): ReviewTier | null {
  return typeof data === 'string' && REVIEW_TIERS.has(data as ReviewTier)
    ? (data as ReviewTier)
    : null
}

function validateCategoryKey(data: unknown): ReviewCategoryKey | null {
  return typeof data === 'string' && CATEGORY_KEYS.has(data as ReviewCategoryKey)
    ? (data as ReviewCategoryKey)
    : null
}

function validateAnnotationSeverity(
  data: unknown
): ReviewAnnotationSeverity | null {
  return typeof data === 'string' &&
    ANNOTATION_SEVERITIES.has(data as ReviewAnnotationSeverity)
    ? (data as ReviewAnnotationSeverity)
    : null
}

function validateCategory(data: unknown): ReviewCategory | null {
  if (!isRecord(data)) return null
  const key = validateCategoryKey(data.key)
  if (!key) return null
  if (typeof data.label !== 'string') return null
  if (!isFiniteNumber(data.score)) return null
  if (!isFiniteNumber(data.maxScore)) return null
  if (!isStringArray(data.evidence)) return null
  if (!isStringArray(data.suggestions)) return null

  return {
    key,
    label: data.label,
    score: data.score,
    maxScore: data.maxScore,
    evidence: data.evidence,
    suggestions: data.suggestions,
  }
}

function validateAdjustment(data: unknown): ReviewAdjustment | null {
  if (!isRecord(data)) return null
  if (typeof data.label !== 'string') return null
  if (!isFiniteNumber(data.points)) return null
  const evidence = validateOptionalString(data.evidence)
  if (evidence === null) return null

  return {
    label: data.label,
    points: data.points,
    ...(evidence !== undefined ? { evidence } : {}),
  }
}

function validateAnnotation(data: unknown): ReviewAnnotation | null {
  if (!isRecord(data)) return null
  if (typeof data.id !== 'string') return null
  if (typeof data.message !== 'string') return null
  const severity = validateAnnotationSeverity(data.severity)
  if (!severity) return null

  const categoryKey =
    data.categoryKey === undefined ? undefined : validateCategoryKey(data.categoryKey)
  if (categoryKey === null) return null
  const sectionTitle = validateOptionalString(data.sectionTitle)
  if (sectionTitle === null) return null
  const entryTitle = validateOptionalString(data.entryTitle)
  if (entryTitle === null) return null
  const bulletText = validateOptionalString(data.bulletText)
  if (bulletText === null) return null

  return {
    id: data.id,
    ...(categoryKey !== undefined ? { categoryKey } : {}),
    ...(sectionTitle !== undefined ? { sectionTitle } : {}),
    ...(entryTitle !== undefined ? { entryTitle } : {}),
    ...(bulletText !== undefined ? { bulletText } : {}),
    message: data.message,
    severity,
  }
}

function validateArray<T>(
  data: unknown,
  validateItem: (item: unknown) => T | null
): T[] | null {
  if (!Array.isArray(data)) return null

  const values: T[] = []
  for (const item of data) {
    const value = validateItem(item)
    if (!value) return null
    values.push(value)
  }
  return values
}

/**
 * Parses and validates an unknown value as a ReviewResult.
 * Returns a freshly-constructed ReviewResult with unknown fields stripped, or
 * null if the input does not match the planned frontend review contract.
 */
export function validateReviewResult(data: unknown): ReviewResult | null {
  if (!isRecord(data)) return null
  if (typeof data.id !== 'string') return null
  if (typeof data.reviewedAt !== 'string') return null
  if (!isFiniteNumber(data.totalScore)) return null
  if (!isFiniteNumber(data.maxScore)) return null
  const tier = validateReviewTier(data.tier)
  if (!tier) return null

  const categories = validateArray(data.categories, validateCategory)
  if (!categories) return null
  if (!isStringArray(data.strengths)) return null
  if (!isStringArray(data.improvements)) return null
  const bonuses = validateArray(data.bonuses, validateAdjustment)
  if (!bonuses) return null
  const deductions = validateArray(data.deductions, validateAdjustment)
  if (!deductions) return null
  const annotations = validateArray(data.annotations, validateAnnotation)
  if (!annotations) return null

  return {
    id: data.id,
    reviewedAt: data.reviewedAt,
    totalScore: data.totalScore,
    maxScore: data.maxScore,
    tier,
    categories,
    strengths: data.strengths,
    improvements: data.improvements,
    bonuses,
    deductions,
    annotations,
    ...(hasOwn.call(data, 'raw') ? { raw: data.raw } : {}),
  }
}
