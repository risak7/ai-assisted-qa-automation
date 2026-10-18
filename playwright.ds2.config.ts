import baseConfig from './playwright.config';

export default {
  ...baseConfig,
  testMatch: ['tests/ds2-edit-existing-program-details.spec.ts'],
};
