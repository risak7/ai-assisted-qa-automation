import dotenv from 'dotenv';
import path from 'path';

const envPath = path.resolve(__dirname, '.env');
dotenv.config({ path: envPath });

import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: '.',
  testMatch: ['features/**/*.spec.ts'],
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: process.env.DIDAXIS_URL ?? 'https://test.didaxis.studio',
    screenshot: 'only-on-failure',
    trace: 'on-first-retry',
    actionTimeout: 30_000,
    navigationTimeout: 60_000,
  },
  timeout: 180_000,
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'], channel: 'chrome' },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
  ],
});
