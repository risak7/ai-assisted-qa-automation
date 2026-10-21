import { expect, test } from '@playwright/test';
import { NewProgramModal } from '../pages/NewProgramModal';
import { ProgramsPage } from '../pages/ProgramsPage';
import { expectNoAxeViolations, runCiSoftA11y } from './helpers/accessibility';

test.describe('Programs page accessibility', () => {
  test('has no WCAG 2 A or AA violations', { tag: '@a11y' }, async ({ page }) => {
    const programs = new ProgramsPage(page);
    await programs.goto();
    await expect(programs.heading).toBeVisible();
    await expect(programs.openNewProgramTrigger).toBeVisible();

    await expectNoAxeViolations(page, { tags: ['wcag2a', 'wcag2aa'] });
  });

  test('Enter on New Program opens the dialog', { tag: '@a11y' }, async ({ page }) => {
    await runCiSoftA11y('programs-new-program-keyboard', async () => {
      const programs = new ProgramsPage(page);
      await programs.goto();
      await expect(programs.newProgramButton).toBeVisible();

      for (let attempt = 0; attempt < 40; attempt += 1) {
        const focused = await programs.newProgramButton.evaluate((button) => button === document.activeElement);
        if (focused) break;
        await page.keyboard.press('Tab');
      }

      await expect(programs.newProgramButton).toBeFocused();
      await page.keyboard.press('Enter');
      await expect(programs.newProgramDialog).toBeVisible();
    });
  });

  test('New Program modal has no WCAG 2 A or AA violations', { tag: '@a11y' }, async ({ page }) => {
    const programs = new ProgramsPage(page);
    await programs.goto();
    await programs.openNewProgramForm();
    await expect(programs.newProgramDialog).toBeVisible();

    await expectNoAxeViolations(page, {
      include: NewProgramModal.axeIncludeSelector(),
      tags: ['wcag2a', 'wcag2aa'],
    });
  });
});
