import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';

test.describe('Login page accessibility', () => {
  test('has no WCAG 2 A or AA violations', { tag: '@a11y' }, async ({ page }) => {
    const login = new LoginPage(page);
    await login.goto();
    await expect(login.signInButton).toBeVisible();
    await expect(login.emailField).toBeVisible();

    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa'])
      .analyze();

    await expect(results.violations).toEqual([]);
  });

  test('Enter on Sign In keeps focus path reachable from keyboard', { tag: '@a11y' }, async ({ page }) => {
    const login = new LoginPage(page);
    await login.goto();
    await expect(login.signInButton).toBeVisible();

    for (let attempt = 0; attempt < 40; attempt += 1) {
      const focused = await login.signInButton.evaluate((button) => button === document.activeElement);
      if (focused) break;
      await page.keyboard.press('Tab');
    }

    await expect(login.signInButton).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(page).toHaveURL(/\/login/);
    await expect(login.signInButton).toBeVisible();
  });
});
