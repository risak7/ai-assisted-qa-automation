import baseConfig from './playwright.config';

export default {
  ...baseConfig,
  testMatch: ['tests/ds3-program-name-validation-and-duplicate-prevention.spec.ts'],
};
