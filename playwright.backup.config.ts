import { defineConfig } from '@playwright/test'
import { sharedPlaywrightConfig } from './playwright.config'

// An isolated server prevents another worktree's bundle from satisfying this gate.
const baseURL = 'http://127.0.0.1:4188/presume/'

export default defineConfig({
  ...sharedPlaywrightConfig,
  testMatch: /document-backup\.spec\.ts/,
  use: { ...sharedPlaywrightConfig.use, baseURL },
  projects: [
    { name: 'chromium', use: { browserName: 'chromium' } },
    { name: 'firefox', use: { browserName: 'firefox' } },
    { name: 'webkit', use: { browserName: 'webkit' } },
  ],
  webServer: {
    command: 'npm run preview -- --host 127.0.0.1 --port 4188 --strictPort',
    url: baseURL,
    reuseExistingServer: false,
    timeout: 120_000,
  },
})
