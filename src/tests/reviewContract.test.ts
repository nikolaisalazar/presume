import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { BACKEND_REVIEW_ERROR_CODES } from '../reviewTypes'

type Schema = {
  components: {
    schemas: Record<
      string,
      {
        required?: string[]
        properties?: Record<string, { enum?: string[]; $ref?: string }>
      }
    >
  }
}

const schema = JSON.parse(
  readFileSync(`${process.cwd()}/contracts/review.openapi.json`, 'utf8')
) as Schema

describe('generated review wire contract', () => {
  it('requires the complete normalized review result', () => {
    expect(schema.components.schemas.ReviewResult.required).toEqual([
      'id',
      'reviewedAt',
      'totalScore',
      'maxScore',
      'tier',
      'categories',
      'strengths',
      'improvements',
      'bonuses',
      'deductions',
      'annotations',
    ])
  })

  it('publishes the backend error-code enum consumed by the frontend', () => {
    expect(schema.components.schemas.ErrorBody.properties?.code.enum).toEqual(
      BACKEND_REVIEW_ERROR_CODES
    )
  })
})
