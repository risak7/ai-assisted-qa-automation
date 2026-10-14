import baseConfig from './playwright.config';
import { devices } from '@playwright/test';

export default {
  ...baseConfig,
  testMatch: ['tests/manual/**/*.spec.ts'],
  testIgnore: [],
  timeout: 60 * 60 * 1000,
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'], channel: 'chrome' },
    },
  ],
};
