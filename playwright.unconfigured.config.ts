import { defineConfig } from '@playwright/test'
import { sharedPlaywrightConfig } from './playwright.config'

export default defineConfig({
  ...sharedPlaywrightConfig,
  testMatch: /unconfigured\.spec\.ts/,
})
