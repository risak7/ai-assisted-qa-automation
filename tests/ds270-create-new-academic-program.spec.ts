import type { Page } from '@playwright/test';
import { expect, test } from '../fixtures/cleanup.fixture';
import { ProgramsPage } from '../pages/ProgramsPage';
import { expectProgramInList, uniqueSuffix } from './helpers/didaxis-programs';

const originalDescription = 'Full-stack web development program';

function pathnameOf(url: string): string {
  return new URL(url).pathname.replace(/\/$/, '');
}

function isProgramsCollectionGet(method: string, url: string): boolean {
  return method === 'GET' && pathnameOf(url).endsWith('/programs');
}

function isProgramPatch(method: string, url: string): boolean {
  return method === 'PATCH' && /\/programs\/[^/]+$/.test(pathnameOf(url));
}

function attachPageErrorCollector(page: Page): Error[] {
  const errors: Error[] = [];
  page.on('pageerror', (error) => errors.push(error));
  return errors;
}

async function routeProgramsListGet(
  page: Page,
  status: number,
  body: string,
): Promise<void> {
  await page.route('**/api/programs', async (route) => {
    if (!isProgramsCollectionGet(route.request().method(), route.request().url())) {
      await route.continue();
      return;
    }
    await route.fulfill({
      status,
      contentType: 'application/json',
      body,
    });
  });
}

async function routeProgramsPatch(page: Page, status: number): Promise<void> {
  await page.route('**/api/programs/*', async (route) => {
    if (!isProgramPatch(route.request().method(), route.request().url())) {
      await route.continue();
      return;
    }
    await route.fulfill({
      status,
      contentType: 'application/json',
      body: JSON.stringify({ error: 'mocked for test' }),
    });
  });
}

async function assertProgramsPageStable(programs: ProgramsPage, pageErrors: Error[]): Promise<void> {
  expect(pageErrors).toEqual([]);
  await expect(programs.heading).toBeVisible();
}

test.describe('DS-270: Create new academic program', () => {
  test.describe.configure({ mode: 'serial', timeout: 120_000 });

  test('TC-001: Navigate to program creation form', { tag: '@ds270' }, async ({ programs }) => {
    await programs.openNewProgramForm();

    await expect(programs.newProgramDialog).toBeVisible();
    await expect(programs.newProgramNameField).toBeVisible();
    await expect(programs.newProgramDescriptionField).toBeVisible();
  });

  test('TC-002: Successfully create a program', { tag: '@ds270' }, async ({ programs, trackProgram }) => {
    const programName = `Web Development 2026 ${uniqueSuffix()}`;

    await programs.openAndFillNewProgram(programName, originalDescription);
    trackProgram(await programs.submitCreateProgram());

    await expect(programs.newProgramDialog).toBeHidden();
    await expectProgramInList(programs, programName);
  });

  test('TC-003: Create a program without a description', { tag: '@ds270' }, async ({ programs, trackProgram }) => {
    const programName = `Data Analytics 2026 ${uniqueSuffix()}`;

    await programs.openAndFillNewProgram(programName);
    trackProgram(await programs.submitCreateProgram());

    await expect(programs.newProgramDialog).toBeHidden();
    await expectProgramInList(programs, programName);
  });

  test('TC-004: Validation prevents empty program name', { tag: '@ds270' }, async ({ programs }) => {
    await programs.openNewProgramForm();

    await expect(programs.newProgramNameField).toHaveValue('');
    await expect(programs.newProgramDescriptionField).toHaveValue('');
    await expect(programs.newProgramCreateButton).toBeDisabled();
    await expect(programs.newProgramDialog).toBeVisible();
  });

  test('TC-005: Description alone does not allow program creation', { tag: '@ds270' }, async ({ programs }) => {
    await programs.openNewProgramForm();
    await programs.fillNewProgramDescription(originalDescription);

    await expect(programs.newProgramNameField).toHaveValue('');
    await expect(programs.newProgramCreateButton).toBeDisabled();
    await expect(programs.newProgramDialog).toBeVisible();
  });

  test('TC-006: Whitespace-only program name does not create a program', { tag: '@ds270' }, async ({ programs }) => {
    await programs.openAndFillNewProgram('   ', originalDescription);

    const createDisabled = await programs.newProgramCreateButton.isDisabled();
    if (createDisabled) {
      await expect(programs.newProgramCreateButton).toBeDisabled();
      await expect(programs.newProgramDialog).toBeVisible();
      return;
    }

    await programs.clickCreateOnNewProgram();
    await expect(programs.newProgramDialog).toBeVisible();
    await expect.poll(async () => programs.countProgramRowsNamed('')).toBe(0);
    await expect.poll(async () => programs.countProgramRowsNamed('   ')).toBe(0);
  });

  test('TC-007: Special characters in Program Name are preserved', { tag: '@ds270' }, async ({
    programs,
    trackProgram,
  }) => {
    const programName = `C++ & .NET (Cohort #1) ${uniqueSuffix()}`;

    trackProgram(
      await programs.createProgram(programName, 'Systems programming with C++ and .NET'),
    );
    await expect(programs.newProgramDialog).toBeHidden();
    await expectProgramInList(programs, programName);
  });

  test('TC-008: A one-character Program Name can be created', { tag: '@ds270' }, async ({
    programs,
    trackProgram,
  }) => {
    const programName = `A${uniqueSuffix()}`;

    trackProgram(await programs.createProgram(programName, 'Single-letter program name'));
    await expect(programs.newProgramDialog).toBeHidden();
    await expectProgramInList(programs, programName);
  });

  test('TC-009: Markup in Program Name is stored as text', { tag: '@ds270' }, async ({
    page,
    programs,
    trackProgram,
  }) => {
    const markup = '<script>alert("xss")</script>';
    const programName = `${markup} ${uniqueSuffix()}`;
    let dialogSeen = false;
    page.on('dialog', async (dialog) => {
      dialogSeen = true;
      await dialog.dismiss();
    });

    trackProgram(await programs.createProgram(programName, 'Markup should be plain text'));
    await expect(programs.newProgramDialog).toBeHidden();
    await expectProgramInList(programs, programName);
    await expect(programs.programRow(programName)).toContainText(markup);
    expect(dialogSeen).toBe(false);
  });

  test('TC-010: Saving a program fails when the service is unavailable', { tag: '@edge' }, async ({
    page,
    programs,
    trackProgram,
  }) => {
    const programName = `Web Development 2026 ${uniqueSuffix()}`;
    const pageErrors = attachPageErrorCollector(page);

    trackProgram(await programs.createProgram(programName, originalDescription));
    await expectProgramInList(programs, programName);

    await programs.openEditProgram(programName);
    await routeProgramsPatch(page, 503);
    await programs.attemptSaveProgram();

    await assertProgramsPageStable(programs, pageErrors);
    await expectProgramInList(programs, programName);
  });

  test('TC-011: An empty program catalog shows the empty state', { tag: '@edge' }, async ({ page }) => {
    const pageErrors = attachPageErrorCollector(page);
    await routeProgramsListGet(page, 200, JSON.stringify({ data: [] }));

    const programs = new ProgramsPage(page);
    await programs.goto();

    await expect(programs.emptyProgramsText).toBeVisible();
    await expect(programs.programRow('Web Development 2026')).toHaveCount(0);
    expect(pageErrors).toEqual([]);
  });

  test('TC-012: A malformed program catalog does not crash the page', { tag: '@edge' }, async ({ page }) => {
    const pageErrors = attachPageErrorCollector(page);
    await routeProgramsListGet(
      page,
      200,
      JSON.stringify({ data: { id: 'not-a-list' } }),
    );

    const programs = new ProgramsPage(page);
    await programs.goto();

    await assertProgramsPageStable(programs, pageErrors);
  });

  test('TC-013: Saving a program fails when the program is not found', { tag: '@edge' }, async ({
    page,
    programs,
    trackProgram,
  }) => {
    const programName = `Web Development 2026 ${uniqueSuffix()}`;
    const pageErrors = attachPageErrorCollector(page);

    trackProgram(await programs.createProgram(programName, originalDescription));
    await programs.openEditProgram(programName);
    await routeProgramsPatch(page, 404);
    await programs.attemptSaveProgram();

    await assertProgramsPageStable(programs, pageErrors);
  });

  test('TC-014: The program list stays up when the catalog request is unauthorized', { tag: '@edge' }, async ({
    page,
  }) => {
    const pageErrors = attachPageErrorCollector(page);
    await routeProgramsListGet(page, 401, JSON.stringify({ error: 'Unauthorized' }));

    const programs = new ProgramsPage(page);
    await programs.goto();

    await assertProgramsPageStable(programs, pageErrors);
  });

  test('TC-015: Saving a program fails when the save is forbidden', { tag: '@edge' }, async ({
    page,
    programs,
    trackProgram,
  }) => {
    const programName = `Web Development 2026 ${uniqueSuffix()}`;
    const pageErrors = attachPageErrorCollector(page);

    trackProgram(await programs.createProgram(programName, originalDescription));
    await expectProgramInList(programs, programName);

    await programs.openEditProgram(programName);
    await routeProgramsPatch(page, 403);
    await programs.attemptSaveProgram();

    await assertProgramsPageStable(programs, pageErrors);
    await expectProgramInList(programs, programName);
  });

  test('TC-016: Saving a program fails when the save is rejected as a bad request', { tag: '@edge' }, async ({
    page,
    programs,
    trackProgram,
  }) => {
    const programName = `Web Development 2026 ${uniqueSuffix()}`;
    const pageErrors = attachPageErrorCollector(page);

    trackProgram(await programs.createProgram(programName, originalDescription));
    await programs.openEditProgram(programName);
    await routeProgramsPatch(page, 400);
    await programs.attemptSaveProgram();

    await assertProgramsPageStable(programs, pageErrors);
  });

  test('TC-017: Saving a program fails when the server errors', { tag: '@edge' }, async ({
    page,
    programs,
    trackProgram,
  }) => {
    const programName = `Web Development 2026 ${uniqueSuffix()}`;
    const pageErrors = attachPageErrorCollector(page);

    trackProgram(await programs.createProgram(programName, originalDescription));
    await programs.openEditProgram(programName);
    await routeProgramsPatch(page, 500);
    await programs.attemptSaveProgram();

    await assertProgramsPageStable(programs, pageErrors);
  });

  test('TC-018: Saving a program fails when the save is not implemented', { tag: '@edge' }, async ({
    page,
    programs,
    trackProgram,
  }) => {
    const programName = `Web Development 2026 ${uniqueSuffix()}`;
    const pageErrors = attachPageErrorCollector(page);

    trackProgram(await programs.createProgram(programName, originalDescription));
    await programs.openEditProgram(programName);
    await routeProgramsPatch(page, 501);
    await programs.attemptSaveProgram();

    await assertProgramsPageStable(programs, pageErrors);
  });

  test('TC-019: The program list stays up when the catalog gateway fails', { tag: '@edge' }, async ({ page }) => {
    const pageErrors = attachPageErrorCollector(page);
    await routeProgramsListGet(page, 502, JSON.stringify({ error: 'Bad Gateway' }));

    const programs = new ProgramsPage(page);
    await programs.goto();

    await assertProgramsPageStable(programs, pageErrors);
  });

  test('TC-020: The program list stays up when the catalog request times out at the gateway', { tag: '@edge' }, async ({
    page,
  }) => {
    const pageErrors = attachPageErrorCollector(page);
    await routeProgramsListGet(page, 504, JSON.stringify({ error: 'Gateway Timeout' }));

    const programs = new ProgramsPage(page);
    await programs.goto();

    await assertProgramsPageStable(programs, pageErrors);
  });

  test('TC-021: A multiple-choices catalog response does not crash the page', { tag: '@edge' }, async ({ page }) => {
    const pageErrors = attachPageErrorCollector(page);
    await routeProgramsListGet(page, 300, JSON.stringify({ choices: [] }));

    const programs = new ProgramsPage(page);
    await programs.goto();

    await assertProgramsPageStable(programs, pageErrors);
  });
});
