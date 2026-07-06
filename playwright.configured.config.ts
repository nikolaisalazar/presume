import { defineConfig } from '@playwright/test'
import { sharedPlaywrightConfig } from './playwright.config'

export default defineConfig({
  ...sharedPlaywrightConfig,
  testMatch: /configured-review\.spec\.ts/,
})
