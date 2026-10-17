import baseConfig from './playwright.config';

export default {
  ...baseConfig,
  testMatch: ['tests/ds2-create-program.spec.ts'],
};
