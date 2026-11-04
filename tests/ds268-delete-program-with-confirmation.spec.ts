import type { Page } from '@playwright/test';
import { expect, test } from '../fixtures/cleanup.fixture';
import { ProgramsPage } from '../pages/ProgramsPage';
import {
  deleteConfirmMessage,
  expectProgramInList,
  expectProgramNotInList,
  uniqueSuffix,
} from './helpers/didaxis-programs';

async function createTrackedProgram(
  programs: ProgramsPage,
  trackProgram: (uuid: string) => void,
  name: string,
  description = '',
): Promise<string> {
  const id = await programs.createProgram(name, description);
  trackProgram(id);
  return id;
}

function watchPageErrors(page: Page): Error[] {
  const errors: Error[] = [];
  page.on('pageerror', (err) => errors.push(err));
  return errors;
}

async function routeProgramsListGet(
  page: Page,
  status: number,
  body: string,
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
      body,
    });
  });
}

async function routeProgramPatch(
  page: Page,
  programId: string,
  status: number,
): Promise<void> {
  await page.route(`**/api/programs/${programId}`, async (route) => {
    if (route.request().method() !== 'PATCH') {
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

test.describe('DS-268: Delete program with confirmation', () => {
  test.describe.configure({ mode: 'serial', timeout: 120_000 });

  test('TC-001: Delete program with confirmation', { tag: '@ds268' }, async ({ programs, trackProgram }) => {
    const programName = `Test Program ${uniqueSuffix()}`;
    await createTrackedProgram(programs, trackProgram, programName, 'Temporary program used for deletion checks');

    const message = await programs.confirmDelete(programName);

    expect(message).toBe(deleteConfirmMessage(programName));
    await expectProgramNotInList(programs, programName);
  });

  test('TC-002: Cancel program deletion', { tag: '@ds268' }, async ({ programs, trackProgram }) => {
    const programName = `Test Program ${uniqueSuffix()}`;
    const description = 'Temporary program used for deletion checks';
    await createTrackedProgram(programs, trackProgram, programName, description);

    const message = await programs.dismissDeleteDialog(programName);

    expect(message).toBe(deleteConfirmMessage(programName));
    await expectProgramInList(programs, programName);
    const stored = await programs.readProgramFields(programName);
    expect(stored.description).toBe(description);
  });

  test('TC-003: Only the confirmed program is removed', { tag: '@ds268' }, async ({ programs, trackProgram }) => {
    const suffix = uniqueSuffix();
    const programName = `Test Program ${suffix}`;
    const otherName = `Web Development 2026 ${suffix}`;
    const otherDescription = 'Full-stack web development program';
    await createTrackedProgram(programs, trackProgram, programName, 'Temporary program used for deletion checks');
    await createTrackedProgram(programs, trackProgram, otherName, otherDescription);

    await programs.confirmDelete(programName);

    await expectProgramNotInList(programs, programName);
    await expectProgramInList(programs, otherName);
    await expect(programs.programRowWithDescription(otherName, otherDescription)).toBeVisible();
    const stored = await programs.readProgramFields(otherName);
    expect(stored.description).toBe(otherDescription);
  });

  test('TC-004: Opening the confirmation does not delete the program', { tag: '@ds268' }, async ({ programs, trackProgram }) => {
    const programName = `Test Program ${uniqueSuffix()}`;
    await createTrackedProgram(programs, trackProgram, programName, 'Temporary program used for deletion checks');

    const message = await programs.dismissDeleteDialog(programName);

    expect(message).toBe(deleteConfirmMessage(programName));
    await expectProgramInList(programs, programName);
  });

  test('TC-005: Cancelling does not remove a second program', { tag: '@ds268' }, async ({ programs, trackProgram }) => {
    const suffix = uniqueSuffix();
    const programName = `Test Program ${suffix}`;
    const otherName = `Web Development 2026 ${suffix}`;
    await createTrackedProgram(programs, trackProgram, programName, 'Temporary program used for deletion checks');
    await createTrackedProgram(programs, trackProgram, otherName, 'Full-stack web development program');

    await programs.dismissDeleteDialog(otherName);

    await expectProgramInList(programs, otherName);
    await expectProgramInList(programs, programName);
  });

  test('TC-006: A confirmed delete does not remove a different program', { tag: '@ds268' }, async ({ programs, trackProgram }) => {
    const suffix = uniqueSuffix();
    const programName = `Test Program ${suffix}`;
    const otherName = `Web Development 2026 ${suffix}`;
    await createTrackedProgram(programs, trackProgram, programName, 'Temporary program used for deletion checks');
    await createTrackedProgram(programs, trackProgram, otherName, 'Full-stack web development program');

    await programs.confirmDelete(programName);

    await expectProgramNotInList(programs, programName);
    await expectProgramInList(programs, otherName);

    await programs.goto();

    await expectProgramNotInList(programs, programName);
    await expectProgramInList(programs, otherName);
  });

  test('TC-007: A program name with special characters is deleted exactly', { tag: '@ds268' }, async ({ programs, trackProgram }) => {
    const suffix = uniqueSuffix();
    const programName = `Informatique & IA - Niveau 2 ${suffix}`;
    const otherName = `Test Program ${suffix}`;
    await createTrackedProgram(
      programs,
      trackProgram,
      programName,
      "Programme d'informatique et d'intelligence artificielle, niveau 2",
    );
    await createTrackedProgram(programs, trackProgram, otherName, 'Temporary program used for deletion checks');

    const message = await programs.confirmDelete(programName);

    expect(message).toContain('Informatique & IA - Niveau 2');
    await expectProgramNotInList(programs, programName);
    await expectProgramInList(programs, otherName);
  });

  test('TC-008: Cancel preserves a program name with special characters', { tag: '@ds268' }, async ({ programs, trackProgram }) => {
    const programName = `Informatique & IA - Niveau 2 ${uniqueSuffix()}`;
    await createTrackedProgram(
      programs,
      trackProgram,
      programName,
      "Programme d'informatique et d'intelligence artificielle, niveau 2",
    );

    await programs.dismissDeleteDialog(programName);

    await expectProgramInList(programs, programName);
  });

  test('TC-009: A one-character program name is removed after confirmation', { tag: '@ds268' }, async ({ programs, trackProgram }) => {
    const suffix = uniqueSuffix();
    const programName = `A${suffix}`;
    const otherName = `Test Program ${suffix}`;
    await createTrackedProgram(programs, trackProgram, programName, 'Single-letter program name');
    await createTrackedProgram(programs, trackProgram, otherName, 'Temporary program used for deletion checks');

    const message = await programs.confirmDelete(programName);

    expect(message).toContain(programName);
    await expectProgramNotInList(programs, programName);
    await expectProgramInList(programs, otherName);
  });

  test('TC-010: The last remaining program can be deleted', { tag: '@ds268' }, async ({ programs, trackProgram }) => {
    const programName = `Test Program ${uniqueSuffix()}`;
    await createTrackedProgram(programs, trackProgram, programName, 'Temporary program used for deletion checks');

    await programs.confirmDelete(programName);

    await expectProgramNotInList(programs, programName);
  });

  test('TC-011: Markup in the program name is shown as text in the confirmation', { tag: '@ds268' }, async ({
    page,
    programs,
    trackProgram,
  }) => {
    const suffix = uniqueSuffix();
    const programName = `<script>alert("xss")</script> ${suffix}`;
    const otherName = `Test Program ${suffix}`;
    let alertSeen = false;
    const trackAlerts = async (dialog: { type: () => string; dismiss: () => Promise<void> }) => {
      if (dialog.type() === 'alert') {
        alertSeen = true;
        await dialog.dismiss();
      }
    };
    page.on('dialog', trackAlerts);
    await createTrackedProgram(programs, trackProgram, programName, 'Markup should be plain text');
    await createTrackedProgram(programs, trackProgram, otherName, 'Temporary program used for deletion checks');
    page.off('dialog', trackAlerts);

    const message = await programs.confirmDelete(programName);

    expect(message).toContain(programName);
    expect(alertSeen).toBe(false);
    await expectProgramNotInList(programs, programName);
    await expectProgramInList(programs, otherName);
  });

  test('TC-012: A cancelled deletion can be confirmed later', { tag: '@ds268' }, async ({ programs, trackProgram }) => {
    const programName = `Test Program ${uniqueSuffix()}`;
    await createTrackedProgram(programs, trackProgram, programName, 'Temporary program used for deletion checks');

    await programs.dismissDeleteDialog(programName);
    await expectProgramInList(programs, programName);

    await programs.confirmDelete(programName);
    await expectProgramNotInList(programs, programName);
  });

  test('TC-013: Saving a program fails when the service is unavailable', { tag: '@edge' }, async ({
    page,
    programs,
    trackProgram,
  }) => {
    const pageErrors = watchPageErrors(page);
    const programName = `Test Program ${uniqueSuffix()}`;
    const id = await createTrackedProgram(programs, trackProgram, programName, 'Temporary program used for deletion checks');

    await programs.openEditProgram(programName);
    await routeProgramPatch(page, id, 503);
    await programs.attemptSaveProgram();

    await expect(programs.heading).toBeVisible();
    await expectProgramInList(programs, programName);
    expect(pageErrors).toEqual([]);
  });

  test('TC-014: An empty program catalog shows the empty state', { tag: '@edge' }, async ({ page }) => {
    const pageErrors = watchPageErrors(page);
    await routeProgramsListGet(page, 200, JSON.stringify({ data: [] }));
    const programs = new ProgramsPage(page);
    await programs.goto();

    await expect(programs.emptyProgramsText).toBeVisible();
    await expect(programs.programRow('Test Program')).toHaveCount(0);
    expect(pageErrors).toEqual([]);
  });

  test('TC-015: A malformed program catalog does not crash the page', { tag: '@edge' }, async ({ page }) => {
    const pageErrors = watchPageErrors(page);
    await routeProgramsListGet(page, 200, JSON.stringify({ data: { id: 'not-a-list' } }));
    const programs = new ProgramsPage(page);
    await programs.goto();

    await expect(programs.heading).toBeVisible();
    expect(pageErrors).toEqual([]);
  });

  test('TC-016: Saving a program fails when the program is not found', { tag: '@edge' }, async ({
    page,
    programs,
    trackProgram,
  }) => {
    const pageErrors = watchPageErrors(page);
    const programName = `Test Program ${uniqueSuffix()}`;
    const id = await createTrackedProgram(programs, trackProgram, programName, 'Temporary program used for deletion checks');

    await programs.openEditProgram(programName);
    await routeProgramPatch(page, id, 404);
    await programs.attemptSaveProgram();

    await expect(programs.heading).toBeVisible();
    expect(pageErrors).toEqual([]);
  });

  test('TC-017: The program list stays up when the catalog request is unauthorized', { tag: '@edge' }, async ({ page }) => {
    const pageErrors = watchPageErrors(page);
    await routeProgramsListGet(page, 401, '{}');
    const programs = new ProgramsPage(page);
    await programs.goto();

    await expect(programs.heading).toBeVisible();
    expect(pageErrors).toEqual([]);
  });

  test('TC-018: Saving a program fails when the save is forbidden', { tag: '@edge' }, async ({
    page,
    programs,
    trackProgram,
  }) => {
    const pageErrors = watchPageErrors(page);
    const programName = `Test Program ${uniqueSuffix()}`;
    const id = await createTrackedProgram(programs, trackProgram, programName, 'Temporary program used for deletion checks');

    await programs.openEditProgram(programName);
    await routeProgramPatch(page, id, 403);
    await programs.attemptSaveProgram();

    await expect(programs.heading).toBeVisible();
    await expectProgramInList(programs, programName);
    expect(pageErrors).toEqual([]);
  });

  test('TC-019: Saving a program fails when the save is rejected as a bad request', { tag: '@edge' }, async ({
    page,
    programs,
    trackProgram,
  }) => {
    const pageErrors = watchPageErrors(page);
    const programName = `Test Program ${uniqueSuffix()}`;
    const id = await createTrackedProgram(programs, trackProgram, programName, 'Temporary program used for deletion checks');

    await programs.openEditProgram(programName);
    await routeProgramPatch(page, id, 400);
    await programs.attemptSaveProgram();

    await expect(programs.heading).toBeVisible();
    expect(pageErrors).toEqual([]);
  });

  test('TC-020: Saving a program fails when the server errors', { tag: '@edge' }, async ({
    page,
    programs,
    trackProgram,
  }) => {
    const pageErrors = watchPageErrors(page);
    const programName = `Test Program ${uniqueSuffix()}`;
    const id = await createTrackedProgram(programs, trackProgram, programName, 'Temporary program used for deletion checks');

    await programs.openEditProgram(programName);
    await routeProgramPatch(page, id, 500);
    await programs.attemptSaveProgram();

    await expect(programs.heading).toBeVisible();
    expect(pageErrors).toEqual([]);
  });

  test('TC-021: Saving a program fails when the save is not implemented', { tag: '@edge' }, async ({
    page,
    programs,
    trackProgram,
  }) => {
    const pageErrors = watchPageErrors(page);
    const programName = `Test Program ${uniqueSuffix()}`;
    const id = await createTrackedProgram(programs, trackProgram, programName, 'Temporary program used for deletion checks');

    await programs.openEditProgram(programName);
    await routeProgramPatch(page, id, 501);
    await programs.attemptSaveProgram();

    await expect(programs.heading).toBeVisible();
    expect(pageErrors).toEqual([]);
  });

  test('TC-022: The program list stays up when the catalog gateway fails', { tag: '@edge' }, async ({ page }) => {
    const pageErrors = watchPageErrors(page);
    await routeProgramsListGet(page, 502, '{}');
    const programs = new ProgramsPage(page);
    await programs.goto();

    await expect(programs.heading).toBeVisible();
    expect(pageErrors).toEqual([]);
  });

  test('TC-023: The program list stays up when the catalog request times out at the gateway', { tag: '@edge' }, async ({
    page,
  }) => {
    const pageErrors = watchPageErrors(page);
    await routeProgramsListGet(page, 504, '{}');
    const programs = new ProgramsPage(page);
    await programs.goto();

    await expect(programs.heading).toBeVisible();
    expect(pageErrors).toEqual([]);
  });

  test('TC-024: A multiple-choices catalog response does not crash the page', { tag: '@edge' }, async ({ page }) => {
    const pageErrors = watchPageErrors(page);
    await routeProgramsListGet(page, 300, '{}');
    const programs = new ProgramsPage(page);
    await programs.goto();

    await expect(programs.heading).toBeVisible();
    expect(pageErrors).toEqual([]);
  });
});
