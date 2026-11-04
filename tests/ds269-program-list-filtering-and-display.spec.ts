import type { Page } from '@playwright/test';
import { expect, test } from '../fixtures/cleanup.fixture';
import { ProgramsPage } from '../pages/ProgramsPage';
import {
  expectProgramInList,
  expectProgramNotInList,
  uniqueSuffix,
} from './helpers/didaxis-programs';

function ds269Name(base: string): string {
  return `DS-269 ${base} ${uniqueSuffix()}`;
}

function collectPageErrors(page: Page): Error[] {
  const errors: Error[] = [];
  page.on('pageerror', (error) => errors.push(error));
  return errors;
}

async function routeProgramsListGet(
  page: Page,
  status: number,
  body?: Record<string, unknown>,
): Promise<void> {
  await page.route('**/api/programs', async (route) => {
    const path = new URL(route.request().url()).pathname.replace(/\/$/, '');
    if (route.request().method() !== 'GET' || !path.endsWith('/programs')) {
      await route.continue();
      return;
    }
    await route.fulfill({
      status,
      contentType: 'application/json',
      body: body !== undefined ? JSON.stringify(body) : '{}',
    });
  });
}

async function routeProgramsPatchStatus(page: Page, programId: string, status: number): Promise<void> {
  await page.route('**/api/programs/**', async (route) => {
    const path = new URL(route.request().url()).pathname.replace(/\/$/, '');
    if (route.request().method() !== 'PATCH' || !path.endsWith(`/programs/${programId}`)) {
      await route.continue();
      return;
    }
    await route.fulfill({
      status,
      contentType: 'application/json',
      body: '{}',
    });
  });
}

async function expectProgramsShellStable(programs: ProgramsPage, pageErrors: Error[]): Promise<void> {
  await expect(programs.heading).toBeVisible();
  expect(pageErrors).toEqual([]);
}

async function gotoProgramsAfterListRoute(page: Page): Promise<ProgramsPage> {
  const programs = new ProgramsPage(page);
  await programs.goto();
  await expect(page).toHaveURL(/\/programs\/?$/);
  return programs;
}

test.describe('DS-269: Program list filtering and display', () => {
  test.describe.configure({ mode: 'serial', timeout: 120_000 });

  test('TC-001: Display program list with key details', { tag: '@ds269' }, async ({ programs, trackProgram }) => {
    const webName = ds269Name('Web Development 2026');
    const webDescription = 'Full-stack web development program';
    const testName = ds269Name('Test Program');
    const testDescription = 'Temporary program used for deletion checks';

    trackProgram(await programs.createProgram(webName, webDescription));
    trackProgram(await programs.createProgram(testName, testDescription));

    await expect(programs.programRow(webName)).toContainText(webName);
    await expect(programs.programRow(webName)).toContainText(webDescription);
    await expect(programs.programRow(testName)).toContainText(testName);
    await expect(programs.programRow(testName)).toContainText(testDescription);
  });

  test('TC-002: Empty state when no programs exist', { tag: '@ds269' }, async ({ page }) => {
    await routeProgramsListGet(page, 200, { data: [] });
    const programs = await gotoProgramsAfterListRoute(page);

    await expect(programs.emptyProgramsText).toBeVisible();
    await expect(programs.openNewProgramTrigger).toBeVisible();
    await expect(programs.programTable).toHaveCount(0);
  });

  test('TC-003: One program is listed with its name and description', { tag: '@ds269' }, async ({
    programs,
    trackProgram,
  }) => {
    const programName = ds269Name('Web Development 2026');
    const description = 'Full-stack web development program';

    trackProgram(await programs.createProgram(programName, description));

    await expect(programs.programRow(programName)).toContainText(programName);
    await expect(programs.programRow(programName)).toContainText(description);
    await expect(programs.emptyProgramsText).toHaveCount(0);
  });

  test('TC-004: The empty state is hidden when a program exists', { tag: '@ds269' }, async ({
    programs,
    trackProgram,
  }) => {
    const programName = ds269Name('Web Development 2026');
    const description = 'Full-stack web development program';

    trackProgram(await programs.createProgram(programName, description));

    await expect(programs.programRow(programName)).toContainText(programName);
    await expect(programs.programRow(programName)).toContainText(description);
    await expect(programs.emptyProgramsText).toHaveCount(0);
  });

  test('TC-005: The empty state does not invent sample programs', { tag: '@ds269' }, async ({ page }) => {
    await routeProgramsListGet(page, 200, { data: [] });
    const programs = await gotoProgramsAfterListRoute(page);

    await expect(programs.emptyProgramsText).toBeVisible();
    await expect(programs.exactText('Web Development 2026')).toHaveCount(0);
    await expect(programs.exactText('Test Program')).toHaveCount(0);
  });

  test('TC-006: Each row keeps its own description', { tag: '@ds269' }, async ({ programs, trackProgram }) => {
    const webName = ds269Name('Web Development 2026');
    const webDescription = 'Full-stack web development program';
    const testName = ds269Name('Test Program');
    const testDescription = 'Temporary program used for deletion checks';

    trackProgram(await programs.createProgram(webName, webDescription));
    trackProgram(await programs.createProgram(testName, testDescription));

    const webRow = programs.programRow(webName);
    const testRow = programs.programRow(testName);
    await expect(webRow).toContainText(webDescription);
    await expect(webRow).not.toContainText(testDescription);
    await expect(testRow).toContainText(testDescription);
  });

  test('TC-007: A removed program is not displayed', { tag: '@ds269' }, async ({ programs, trackProgram }) => {
    const deletedName = ds269Name('Test Program');
    const webName = ds269Name('Web Development 2026');
    const webDescription = 'Full-stack web development program';

    trackProgram(await programs.createProgram(deletedName, 'Temporary program used for deletion checks'));
    trackProgram(await programs.createProgram(webName, webDescription));

    await programs.confirmDelete(deletedName);
    await programs.goto();

    await expectProgramNotInList(programs, deletedName);
    await expect(programs.programRow(webName)).toContainText(webName);
    await expect(programs.programRow(webName)).toContainText(webDescription);
  });

  test('TC-008: Special characters are preserved in the program list', { tag: '@ds269' }, async ({
    programs,
    trackProgram,
  }) => {
    const programName = ds269Name('Informatique & IA - Niveau 2');
    const description = "Programme d'informatique et d'intelligence artificielle, niveau 2";

    trackProgram(await programs.createProgram(programName, description));

    await expect(programs.programRow(programName)).toContainText(programName);
    await expect(programs.programRow(programName)).toContainText(description);
  });

  test('TC-009: An empty Description does not hide the program name', { tag: '@ds269' }, async ({
    programs,
    trackProgram,
  }) => {
    const emptyName = ds269Name('Data Analytics 2026');
    const webName = ds269Name('Web Development 2026');
    const webDescription = 'Full-stack web development program';

    trackProgram(await programs.createProgram(emptyName));
    trackProgram(await programs.createProgram(webName, webDescription));

    await expectProgramInList(programs, emptyName);
    expect((await programs.listedDescription(emptyName)).trim()).toBe('');
    await expect(programs.programRow(webName)).toContainText(webName);
    await expect(programs.programRow(webName)).toContainText(webDescription);
  });

  test('TC-010: Markup in the program list is shown as text', { tag: '@ds269' }, async ({
    page,
    programs,
    trackProgram,
  }) => {
    const programName = ds269Name('<script>alert("xss")</script>');
    const description = '<img src=x onerror=alert(1)>';
    let alertSeen = false;
    page.on('dialog', async (dialog) => {
      if (dialog.type() === 'alert') {
        alertSeen = true;
        await dialog.dismiss();
      }
    });

    trackProgram(await programs.createProgram(programName, description));

    await expect(programs.exactText(programName)).toBeVisible();
    await expect(programs.exactText(description)).toBeVisible();
    expect(alertSeen).toBe(false);
  });

  test('TC-011: A one-character program name is displayed', { tag: '@ds269' }, async ({ programs, trackProgram }) => {
    const programName = ds269Name('A');
    const description = 'Single-letter program name';

    trackProgram(await programs.createProgram(programName, description));

    await expectProgramInList(programs, programName);
    await expect(programs.programRow(programName)).toContainText(description);
  });

  test('TC-012: Saving a program fails when the service is unavailable', { tag: '@edge' }, async ({
    page,
    programs,
    trackProgram,
  }) => {
    const pageErrors = collectPageErrors(page);
    const programName = ds269Name('Test Program');
    const programId = await programs.createProgram(programName, 'Temporary program used for deletion checks');
    trackProgram(programId);

    await programs.openEditProgram(programName);
    await routeProgramsPatchStatus(page, programId, 503);
    await programs.attemptSaveProgram();

    await expectProgramsShellStable(programs, pageErrors);
    await expectProgramInList(programs, programName);
  });

  test('TC-013: An empty program catalog shows the empty state', { tag: '@edge' }, async ({ page }) => {
    await routeProgramsListGet(page, 200, { data: [] });
    const programs = await gotoProgramsAfterListRoute(page);

    await expect(programs.emptyProgramsText).toBeVisible();
    await expect(programs.exactText('Test Program')).toHaveCount(0);
  });

  test('TC-014: A malformed program catalog does not crash the page', { tag: '@edge' }, async ({ page }) => {
    const pageErrors = collectPageErrors(page);
    await routeProgramsListGet(page, 200, { data: { id: 'not-a-list' } });
    const programs = await gotoProgramsAfterListRoute(page);

    await expectProgramsShellStable(programs, pageErrors);
  });

  test('TC-015: Saving a program fails when the program is not found', { tag: '@edge' }, async ({
    page,
    programs,
    trackProgram,
  }) => {
    const pageErrors = collectPageErrors(page);
    const programName = ds269Name('Test Program');
    const programId = await programs.createProgram(programName);
    trackProgram(programId);

    await programs.openEditProgram(programName);
    await routeProgramsPatchStatus(page, programId, 404);
    await programs.attemptSaveProgram();

    await expectProgramsShellStable(programs, pageErrors);
  });

  test('TC-016: The program list stays up when the catalog request is unauthorized', { tag: '@edge' }, async ({
    page,
  }) => {
    const pageErrors = collectPageErrors(page);
    await routeProgramsListGet(page, 401);
    const programs = await gotoProgramsAfterListRoute(page);

    await expectProgramsShellStable(programs, pageErrors);
  });

  test('TC-017: Saving a program fails when the save is forbidden', { tag: '@edge' }, async ({
    page,
    programs,
    trackProgram,
  }) => {
    const pageErrors = collectPageErrors(page);
    const programName = ds269Name('Test Program');
    const programId = await programs.createProgram(programName);
    trackProgram(programId);

    await programs.openEditProgram(programName);
    await routeProgramsPatchStatus(page, programId, 403);
    await programs.attemptSaveProgram();

    await expectProgramsShellStable(programs, pageErrors);
    await expectProgramInList(programs, programName);
  });

  test('TC-018: Saving a program fails when the save is rejected as a bad request', { tag: '@edge' }, async ({
    page,
    programs,
    trackProgram,
  }) => {
    const pageErrors = collectPageErrors(page);
    const programName = ds269Name('Test Program');
    const programId = await programs.createProgram(programName);
    trackProgram(programId);

    await programs.openEditProgram(programName);
    await routeProgramsPatchStatus(page, programId, 400);
    await programs.attemptSaveProgram();

    await expectProgramsShellStable(programs, pageErrors);
  });

  test('TC-019: Saving a program fails when the server errors', { tag: '@edge' }, async ({
    page,
    programs,
    trackProgram,
  }) => {
    const pageErrors = collectPageErrors(page);
    const programName = ds269Name('Test Program');
    const programId = await programs.createProgram(programName);
    trackProgram(programId);

    await programs.openEditProgram(programName);
    await routeProgramsPatchStatus(page, programId, 500);
    await programs.attemptSaveProgram();

    await expectProgramsShellStable(programs, pageErrors);
  });

  test('TC-020: Saving a program fails when the save is not implemented', { tag: '@edge' }, async ({
    page,
    programs,
    trackProgram,
  }) => {
    const pageErrors = collectPageErrors(page);
    const programName = ds269Name('Test Program');
    const programId = await programs.createProgram(programName);
    trackProgram(programId);

    await programs.openEditProgram(programName);
    await routeProgramsPatchStatus(page, programId, 501);
    await programs.attemptSaveProgram();

    await expectProgramsShellStable(programs, pageErrors);
  });

  test('TC-021: The program list stays up when the catalog gateway fails', { tag: '@edge' }, async ({ page }) => {
    const pageErrors = collectPageErrors(page);
    await routeProgramsListGet(page, 502);
    const programs = await gotoProgramsAfterListRoute(page);

    await expectProgramsShellStable(programs, pageErrors);
  });

  test('TC-022: The program list stays up when the catalog request times out at the gateway', { tag: '@edge' }, async ({
    page,
  }) => {
    const pageErrors = collectPageErrors(page);
    await routeProgramsListGet(page, 504);
    const programs = await gotoProgramsAfterListRoute(page);

    await expectProgramsShellStable(programs, pageErrors);
  });

  test('TC-023: A multiple-choices catalog response does not crash the page', { tag: '@edge' }, async ({ page }) => {
    const pageErrors = collectPageErrors(page);
    await routeProgramsListGet(page, 300);
    const programs = await gotoProgramsAfterListRoute(page);

    await expectProgramsShellStable(programs, pageErrors);
  });
});
