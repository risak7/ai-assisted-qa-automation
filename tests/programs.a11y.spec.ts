import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import { NewProgramModal } from '../pages/NewProgramModal';
import { ProgramsPage } from '../pages/ProgramsPage';

test.describe('Programs page accessibility', () => {
  test('has no WCAG 2 A or AA violations', { tag: '@a11y' }, async ({ page }) => {
    const programs = new ProgramsPage(page);
    await programs.goto();
    await expect(programs.heading).toBeVisible();
    await expect(programs.openNewProgramTrigger).toBeVisible();

    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa'])
      .analyze();

    await expect(results.violations).toEqual([]);
  });

  test('Enter on New Program opens the dialog', { tag: '@a11y' }, async ({ page }) => {
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

  test('New Program modal has no WCAG 2 A or AA violations', { tag: '@a11y' }, async ({ page }) => {
    const programs = new ProgramsPage(page);
    await programs.goto();
    await programs.openNewProgramForm();
    await expect(programs.newProgramDialog).toBeVisible();

    const results = await new AxeBuilder({ page })
      .include(NewProgramModal.axeIncludeSelector())
      .withTags(['wcag2a', 'wcag2aa'])
      .analyze();

    await expect(results.violations).toEqual([]);
  });
});
