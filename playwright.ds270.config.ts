import baseConfig from './playwright.config';

export default {
  ...baseConfig,
  testMatch: ['tests/ds270-create-new-academic-program.spec.ts'],
};
