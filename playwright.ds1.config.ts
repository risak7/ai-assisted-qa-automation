import baseConfig from './playwright.config';

export default {
  ...baseConfig,
  testMatch: ['tests/ds1-create-program.spec.ts'],
};
