import baseConfig from './playwright.config';

export default {
  ...baseConfig,
  testMatch: ['tests/ds3-create-program.spec.ts'],
};
