import type { Page } from '@playwright/test';
import { expect, test } from '../fixtures/cleanup.fixture';
import { ProgramsPage } from '../pages/ProgramsPage';
import {
  expectProgramCount,
  expectProgramInList,
  expectProgramNotInList,
  uniqueSuffix,
} from './helpers/didaxis-programs';

function collectPageErrors(page: Page): Error[] {
  const errors: Error[] = [];
  page.on('pageerror', (error) => errors.push(error));
  return errors;
}

async function routeProgramsListGet(
  page: Page,
  options: { status: number; body?: Record<string, unknown> },
): Promise<void> {
  await page.route('**/api/programs**', async (route) => {
    const path = new URL(route.request().url()).pathname.replace(/\/$/, '');
    if (route.request().method() !== 'GET' || !path.endsWith('/programs')) {
      await route.continue();
      return;
    }
    await route.fulfill({
      status: options.status,
      contentType: 'application/json',
      body: options.body !== undefined ? JSON.stringify(options.body) : '',
    });
  });
}

async function routeProgramsPatch(page: Page, status: number): Promise<void> {
  await page.route('**/api/programs/**', async (route) => {
    const path = new URL(route.request().url()).pathname.replace(/\/$/, '');
    if (route.request().method() !== 'PATCH' || !/\/programs\/[^/]+$/.test(path)) {
      await route.continue();
      return;
    }
    await route.fulfill({
      status,
      contentType: 'application/json',
      body: JSON.stringify({ message: 'mocked for test' }),
    });
  });
}

async function assertProgramsShellStable(programs: ProgramsPage, pageErrors: Error[]): Promise<void> {
  await expect(programs.heading).toBeVisible();
  expect(pageErrors).toEqual([]);
}

test.describe('DS-271: Program name validation and duplicate prevention', () => {
  test('TC-001: Accept program name with special characters', { tag: '@ds271' }, async ({ programs, trackProgram }) => {
    const programName = `Informatique & IA - Niveau 2 ${uniqueSuffix()}`;
    const description = "Programme d'informatique et d'intelligence artificielle, niveau 2";

    trackProgram(await programs.createProgram(programName, description));
    await expectProgramInList(programs, programName);
    await expect(programs.programRow(programName)).toContainText(description);
  });

  test('TC-002: A different Program Name is accepted when the Description matches an existing program', { tag: '@ds271' }, async ({
    programs,
    trackProgram,
  }) => {
    const suffix = uniqueSuffix();
    const existingName = `Web Development 2026 ${suffix}`;
    const newName = `Data Analytics 2026 ${suffix}`;
    const description = 'Full-stack web development program';

    trackProgram(await programs.createProgram(existingName, description));
    trackProgram(await programs.createProgram(newName, description));

    await expectProgramInList(programs, existingName);
    await expectProgramInList(programs, newName);
  });

  test('TC-003: Reject program name with only whitespace', { tag: '@ds271' }, async ({ programs }) => {
    await programs.openAndFillNewProgram('   ', 'Full-stack web development program');

    if (await programs.newProgramCreateButton.isDisabled()) {
      await expect(programs.newProgramCreateButton).toBeDisabled();
      return;
    }

    await programs.newProgramCreateButton.click();
    await expect(programs.newProgramDialog).toBeVisible();
    await expectProgramNotInList(programs, '');
  });

  test('TC-004: Empty program name is not submitted', { tag: '@ds271' }, async ({ programs }) => {
    const before = await programs.programRowCount();

    await programs.openNewProgramForm();
    await programs.fillNewProgramDescription('Full-stack web development program');

    await expect(programs.newProgramNameField).toHaveValue('');
    await expect(programs.newProgramCreateButton).toBeDisabled();
    await expect.poll(async () => programs.programRowCount()).toBe(before);
  });

  test('TC-005: Reject duplicate program name', { tag: '@ds271' }, async ({ programs, trackProgram }) => {
    const programName = `Web Development 2026 ${uniqueSuffix()}`;
    trackProgram(await programs.createProgram(programName, 'Full-stack web development program'));

    await programs.openAndFillNewProgram(programName, 'Another full-stack cohort');
    await programs.clickCreateOnNewProgram();

    await expect(programs.duplicateNameMessage).toBeVisible();
    await expect(programs.newProgramDialog).toBeVisible();
    await expectProgramCount(programs, programName, 1);
  });

  test('TC-006: A rejected duplicate leaves the existing Description unchanged', { tag: '@ds271' }, async ({
    programs,
    trackProgram,
  }) => {
    const programName = `Web Development 2026 ${uniqueSuffix()}`;
    const originalDescription = 'Full-stack web development program';
    trackProgram(await programs.createProgram(programName, originalDescription));

    await programs.openAndFillNewProgram(programName, 'This description must not replace the original');
    await programs.clickCreateOnNewProgram();

    await expect(programs.duplicateNameMessage).toBeVisible();
    await expect(programs.newProgramDialog).toBeVisible();
    await expectProgramCount(programs, programName, 1);

    const stored = await programs.readProgramFields(programName, originalDescription);
    expect(stored.description).toBe(originalDescription);
  });

  test('TC-007: A one-character program name is accepted', { tag: '@ds271' }, async ({ programs, trackProgram }) => {
    const programName = `A${uniqueSuffix()}`;
    const description = 'Single-letter program name';

    trackProgram(await programs.createProgram(programName, description));
    await expectProgramInList(programs, programName);
    await expect(programs.programRow(programName)).toContainText(description);
  });

  test('TC-008: A punctuation difference is not treated as the same name', { tag: '@ds271' }, async ({
    programs,
    trackProgram,
  }) => {
    const programName = `Web Development 2026 ${uniqueSuffix()}`;
    const punctuatedName = `${programName}!`;

    trackProgram(await programs.createProgram(programName, 'Full-stack web development program'));
    trackProgram(await programs.createProgram(punctuatedName, 'Name differs by punctuation'));

    await expectProgramInList(programs, programName);
    await expectProgramInList(programs, punctuatedName);
  });

  test('TC-009: Markup in Program Name is stored as text', { tag: '@ds271' }, async ({ page, programs, trackProgram }) => {
    const programName = `<script>alert("xss")</script> ${uniqueSuffix()}`;
    let alertSeen = false;
    page.on('dialog', async (dialog) => {
      if (dialog.type() === 'alert') {
        alertSeen = true;
        await dialog.dismiss();
      }
    });

    trackProgram(await programs.createProgram(programName, 'Markup should be plain text'));
    await expectProgramInList(programs, programName);
    expect(alertSeen).toBe(false);
  });

  test('TC-010: Saving a program fails when the service is unavailable', { tag: '@edge' }, async ({
    page,
    programs,
    trackProgram,
  }) => {
    const pageErrors = collectPageErrors(page);
    const programName = `Web Development 2026 ${uniqueSuffix()}`;
    trackProgram(await programs.createProgram(programName, 'Full-stack web development program'));

    await routeProgramsPatch(page, 503);
    await programs.openEditProgram(programName);
    await programs.fillEditDescription('Updated after unavailable save');
    await programs.attemptSaveProgram();

    await assertProgramsShellStable(programs, pageErrors);
    await expectProgramInList(programs, programName);
  });

  test('TC-011: An empty program catalog shows the empty state', { tag: '@edge' }, async ({ page }) => {
    const pageErrors = collectPageErrors(page);
    await routeProgramsListGet(page, { status: 200, body: { data: [] } });

    const programs = new ProgramsPage(page);
    await programs.goto();
    await expect(programs.emptyProgramsText).toBeVisible();
    await expectProgramNotInList(programs, 'Web Development 2026');
    await assertProgramsShellStable(programs, pageErrors);
  });

  test('TC-012: A malformed program catalog does not crash the page', { tag: '@edge' }, async ({ page }) => {
    const pageErrors = collectPageErrors(page);
    await routeProgramsListGet(page, { status: 200, body: { data: { id: 'not-a-list' } } });

    const programs = new ProgramsPage(page);
    await programs.goto();
    await assertProgramsShellStable(programs, pageErrors);
  });

  test('TC-013: Saving a program fails when the program is not found', { tag: '@edge' }, async ({
    page,
    programs,
    trackProgram,
  }) => {
    const pageErrors = collectPageErrors(page);
    const programName = `Web Development 2026 ${uniqueSuffix()}`;
    trackProgram(await programs.createProgram(programName, 'Full-stack web development program'));

    await routeProgramsPatch(page, 404);
    await programs.openEditProgram(programName);
    await programs.fillEditDescription('Save after not found');
    await programs.attemptSaveProgram();

    await assertProgramsShellStable(programs, pageErrors);
  });

  test('TC-014: The program list stays up when the catalog request is unauthorized', { tag: '@edge' }, async ({ page }) => {
    const pageErrors = collectPageErrors(page);
    await routeProgramsListGet(page, { status: 401 });

    const programs = new ProgramsPage(page);
    await programs.goto();
    await assertProgramsShellStable(programs, pageErrors);
  });

  test('TC-015: Saving a program fails when the save is forbidden', { tag: '@edge' }, async ({
    page,
    programs,
    trackProgram,
  }) => {
    const pageErrors = collectPageErrors(page);
    const programName = `Web Development 2026 ${uniqueSuffix()}`;
    trackProgram(await programs.createProgram(programName, 'Full-stack web development program'));

    await routeProgramsPatch(page, 403);
    await programs.openEditProgram(programName);
    await programs.fillEditDescription('Forbidden save attempt');
    await programs.attemptSaveProgram();

    await assertProgramsShellStable(programs, pageErrors);
    await expectProgramInList(programs, programName);
  });

  test('TC-016: Saving a program fails when the save is rejected as a bad request', { tag: '@edge' }, async ({
    page,
    programs,
    trackProgram,
  }) => {
    const pageErrors = collectPageErrors(page);
    const programName = `Web Development 2026 ${uniqueSuffix()}`;
    trackProgram(await programs.createProgram(programName, 'Full-stack web development program'));

    await routeProgramsPatch(page, 400);
    await programs.openEditProgram(programName);
    await programs.fillEditDescription('Bad request save attempt');
    await programs.attemptSaveProgram();

    await assertProgramsShellStable(programs, pageErrors);
  });

  test('TC-017: Saving a program fails when the server errors', { tag: '@edge' }, async ({
    page,
    programs,
    trackProgram,
  }) => {
    const pageErrors = collectPageErrors(page);
    const programName = `Web Development 2026 ${uniqueSuffix()}`;
    trackProgram(await programs.createProgram(programName, 'Full-stack web development program'));

    await routeProgramsPatch(page, 500);
    await programs.openEditProgram(programName);
    await programs.fillEditDescription('Server error save attempt');
    await programs.attemptSaveProgram();

    await assertProgramsShellStable(programs, pageErrors);
  });

  test('TC-018: Saving a program fails when the save is not implemented', { tag: '@edge' }, async ({
    page,
    programs,
    trackProgram,
  }) => {
    const pageErrors = collectPageErrors(page);
    const programName = `Web Development 2026 ${uniqueSuffix()}`;
    trackProgram(await programs.createProgram(programName, 'Full-stack web development program'));

    await routeProgramsPatch(page, 501);
    await programs.openEditProgram(programName);
    await programs.fillEditDescription('Not implemented save attempt');
    await programs.attemptSaveProgram();

    await assertProgramsShellStable(programs, pageErrors);
  });

  test('TC-019: The program list stays up when the catalog gateway fails', { tag: '@edge' }, async ({ page }) => {
    const pageErrors = collectPageErrors(page);
    await routeProgramsListGet(page, { status: 502 });

    const programs = new ProgramsPage(page);
    await programs.goto();
    await assertProgramsShellStable(programs, pageErrors);
  });

  test('TC-020: The program list stays up when the catalog request times out at the gateway', { tag: '@edge' }, async ({
    page,
  }) => {
    const pageErrors = collectPageErrors(page);
    await routeProgramsListGet(page, { status: 504 });

    const programs = new ProgramsPage(page);
    await programs.goto();
    await assertProgramsShellStable(programs, pageErrors);
  });

  test('TC-021: A multiple-choices catalog response does not crash the page', { tag: '@edge' }, async ({ page }) => {
    const pageErrors = collectPageErrors(page);
    await routeProgramsListGet(page, { status: 300 });

    const programs = new ProgramsPage(page);
    await programs.goto();
    await assertProgramsShellStable(programs, pageErrors);
  });
});
