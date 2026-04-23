import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  timeout: 30_000,
  retries: 1,
  reporter: [['list'], ['html', { open: 'never', outputFolder: 'report' }]],
  use: {
    baseURL: process.env.BASE_URL || 'http://localhost',
    headless: true,
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
});
