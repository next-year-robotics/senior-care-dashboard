import { defineConfig } from '@playwright/test'
export default defineConfig({
  testDir: './e2e', fullyParallel: false, workers: 1, timeout: 90_000,
  use: { actionTimeout: 10_000, baseURL: 'http://127.0.0.1:5173', locale: 'ko-KR', timezoneId: 'Asia/Seoul', trace: 'off', screenshot: 'off' },
  webServer: { command: 'npm run dev', url: 'http://127.0.0.1:5173', reuseExistingServer: true },
})
