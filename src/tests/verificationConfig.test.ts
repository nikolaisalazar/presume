import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

const packageJson = JSON.parse(
  readFileSync(`${process.cwd()}/package.json`, 'utf8')
) as { scripts: Record<string, string> }
const workflow = readFileSync(
  `${process.cwd()}/.github/workflows/deploy.yml`,
  'utf8'
)

function workflowValues(key: string) {
  const pattern = new RegExp(`^\\s+${key}:\\s+(\\S+)\\s*$`, 'gm')
  return Array.from(workflow.matchAll(pattern), (match) => match[1])
}

describe('repository verification configuration', () => {
  it('offers one local full-verification command', () => {
    expect(packageJson.scripts.typecheck).toBe(
      'tsc -p tsconfig.app.json --noEmit && tsc -p tsconfig.node.json --noEmit'
    )
    expect(packageJson.scripts['test:backend']).toBe(
      'python3 -m pytest review-service/tests -q'
    )
    expect(packageJson.scripts.verify).toContain('npm run typecheck')
    expect(packageJson.scripts.verify).toContain('npm test -- --run')
    expect(packageJson.scripts.verify).toContain('npm run test:backend')
    expect(packageJson.scripts['verify:full']).toBe(
      'npm run verify && npm run test:e2e'
    )
  })

  it('gates pull requests and deployment on the full command', () => {
    expect(workflow).toContain('pull_request:')
    expect(workflow).toContain("python-version: '3.11'")
    expect(workflow).toContain('pip install -r review-service/requirements.txt')
    expect(workflow).toContain('playwright install --with-deps chromium')
    expect(workflow).toContain('npm run verify:full')
    expect(workflow).toContain('needs: verify')
    expect(workflow).toContain("github.event_name != 'pull_request'")
  })

  it('runs the workflow and official actions on Node 24', () => {
    expect(workflowValues('uses')).toEqual([
      'actions/checkout@v7',
      'actions/setup-node@v7',
      'actions/setup-python@v7',
      'actions/checkout@v7',
      'actions/setup-node@v7',
      'actions/configure-pages@v6',
      'actions/upload-pages-artifact@v5',
      'actions/deploy-pages@v5',
    ])
    expect(workflowValues('node-version')).toEqual(['24', '24'])
  })
})
