import { execFileSync } from 'node:child_process'
import { mkdtempSync, readFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join, relative } from 'node:path'
import { fileURLToPath } from 'node:url'

const repositoryRoot = dirname(dirname(fileURLToPath(import.meta.url)))
const tempDirectory = mkdtempSync(join(tmpdir(), 'presume-review-contract-'))
const tempOpenApi = join(tempDirectory, 'review.openapi.json')
const tempTypes = join(tempDirectory, 'reviewContract.ts')

try {
  execFileSync(
    'python3',
    [
      join(repositoryRoot, 'scripts/export-review-openapi.py'),
      '--output',
      tempOpenApi,
    ],
    { cwd: repositoryRoot, stdio: 'inherit' }
  )
  execFileSync(
    'npm',
    [
      'exec',
      '--',
      'openapi-typescript',
      tempOpenApi,
      '-o',
      tempTypes,
    ],
    { cwd: repositoryRoot, stdio: 'inherit' }
  )

  const artifacts = [
    {
      committed: join(repositoryRoot, 'contracts/review.openapi.json'),
      generated: tempOpenApi,
    },
    {
      committed: join(repositoryRoot, 'src/generated/reviewContract.ts'),
      generated: tempTypes,
    },
  ]
  const staleArtifacts = artifacts.filter(
    ({ committed, generated }) =>
      !readFileSync(committed).equals(readFileSync(generated))
  )

  if (staleArtifacts.length > 0) {
    for (const { committed } of staleArtifacts) {
      console.error(relative(repositoryRoot, committed))
    }
    console.error(
      'Review contract artifacts are stale. Run: npm run generate:review-contract'
    )
    process.exitCode = 1
  }
} finally {
  rmSync(tempDirectory, { recursive: true, force: true })
}
