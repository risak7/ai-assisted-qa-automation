import baseConfig from './playwright.config';

export default {
  ...baseConfig,
  testMatch: ['tests/ds271-program-name-validation-and-duplicate-prevention.spec.ts'],
};
