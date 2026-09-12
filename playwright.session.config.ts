import { defineConfig } from '@playwright/test'
import backupConfig from './playwright.backup.config'

export default defineConfig({
  ...backupConfig,
  testMatch: /document-session\.spec\.ts/,
  use: { ...backupConfig.use, baseURL: 'http://127.0.0.1:4189/presume/' },
  webServer: {
    command: 'npm run preview -- --host 127.0.0.1 --port 4189 --strictPort',
    url: 'http://127.0.0.1:4189/presume/',
    reuseExistingServer: false,
    timeout: 120_000,
  },
})
