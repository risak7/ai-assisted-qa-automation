import { expect, test } from '../fixtures/cleanup.fixture';
import { LoginPage } from '../pages/LoginPage';
import { expectNoAxeViolations, openDialog, repeatedProgramRows } from './helpers/accessibility';

test.describe('Accessibility', () => {
  test.describe('Login page', () => {
    test.use({ storageState: { cookies: [], origins: [] } });

    test('has no automatically detectable accessibility issues', async ({ page }) => {
      const login = new LoginPage(page);
      await login.goto();
      await expect(login.signInButton).toBeVisible();
      await expectNoAxeViolations(page);
    });
  });

  test('Programs page has no automatically detectable accessibility issues', async ({ programs }) => {
    await expect(programs.heading).toBeVisible();
    await expectNoAxeViolations(programs.page, { exclude: [repeatedProgramRows] });
  });

  test('New Program modal has no automatically detectable accessibility issues', async ({ programs }) => {
    await programs.openNewProgramForm();
    await expect(programs.newProgramDialog).toBeVisible();
    await expectNoAxeViolations(programs.page, { include: openDialog });
  });
});
