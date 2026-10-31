import dotenv from 'dotenv';
import path from 'path';

const envPath = path.resolve(__dirname, '.env');
dotenv.config({ path: envPath });

import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: '.',
  testMatch: ['features/**/*.spec.ts', 'tests/**/*.a11y.spec.ts'],
  testIgnore: ['tests/manual/**'],
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? [['html'], ['github']] : 'list',
  use: {
    baseURL: process.env.DIDAXIS_URL,
    locale: 'en-US',
    timezoneId: 'America/Toronto',
    screenshot: 'only-on-failure',
    trace: 'on-first-retry',
    actionTimeout: 30_000,
    navigationTimeout: 60_000,
  },
  timeout: 180_000,
  projects: [
    {
      name: 'setup',
      testMatch: /.*\.setup\.ts/,
      use: { ...devices['Desktop Chrome'], channel: 'chrome' },
    },
    {
      name: 'chromium',
      testIgnore: ['tests/login.a11y.spec.ts'],
      use: {
        ...devices['Desktop Chrome'],
        channel: 'chrome',
        storageState: 'playwright/.auth/user.json',
      },
      dependencies: ['setup'],
    },
    {
      name: 'chromium-guest',
      testMatch: ['tests/login.a11y.spec.ts'],
      use: {
        ...devices['Desktop Chrome'],
        channel: 'chrome',
      },
    },
  ],
});
