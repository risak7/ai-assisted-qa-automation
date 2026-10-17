import { expect, test } from '@playwright/test';
import type { ProgramsPage } from '../pages/ProgramsPage';
import {
  description1000,
  expectProgramInList,
  expectProgramNotInList,
  gotoPrograms,
  loginAsAdmin,
  skipWithoutAdminCredentials,
  textOfLength,
  uniqueSuffix,
} from './helpers/didaxis-programs';

test.describe.configure({ mode: 'serial', timeout: 120_000 });

test.describe('Positive flows', () => {
  let programs: ProgramsPage;

  test.beforeEach(async ({ page }) => {
    skipWithoutAdminCredentials();
    await loginAsAdmin(page);
    programs = await gotoPrograms(page);
  });

  test("TC-001: The Programs page lists each program's Name and Description", async () => {
    const suffix = uniqueSuffix();
    const webName = `Web Development 2026 ${suffix}`;
    const webDescription = 'Full-stack web development program';
    const testName = `Test Program ${suffix}`;
    const testDescription = 'Temporary program used for deletion checks';
    await programs.createProgram(webName, webDescription);
    await programs.createProgram(testName, testDescription);

    const webRow = programs.programRow(webName).first();
    const testRow = programs.programRow(testName).first();
    await expect(webRow).toContainText(webName);
    await expect(webRow).toContainText(webDescription);
    await expect(testRow).toContainText(testName);
    await expect(testRow).toContainText(testDescription);
  });

  test('TC-002: An empty Programs page shows a no-programs message and a create prompt', async () => {
    test.skip(
      (await programs.programRowCount()) > 0,
      'Skipped: the shared Programs catalog is not empty, and clearing it would delete every program.',
    );

    await expect(programs.emptyProgramsText).toBeVisible();
    await expect(programs.createProgramButton).toBeVisible();
    await expect(programs.programTable).toHaveCount(0);
  });

  test('TC-003: A program is shown with its Name and Description', async () => {
    const programName = `Web Development 2026 ${uniqueSuffix()}`;
    const description = 'Full-stack web development program';
    await programs.createProgram(programName, description);

    const row = programs.programRow(programName).first();
    await expect(row).toContainText(programName);
    await expect(row).toContainText(description);
    await expect(programs.emptyProgramsText).toHaveCount(0);
  });

  test('TC-004: Creating the first program replaces the empty state with that program', async () => {
    test.skip(
      (await programs.programRowCount()) > 0,
      'Skipped: the shared Programs catalog is not empty, so the first-program transition cannot be observed.',
    );

    const programName = `Web Development 2026 ${uniqueSuffix()}`;
    const description = 'Full-stack web development program';
    await expect(programs.emptyProgramsText).toBeVisible();
    await programs.createProgramButton.click();
    await expect(programs.newProgramModal.dialog).toBeVisible();
    await programs.newProgramModal.fillProgramName(programName);
    await programs.newProgramModal.fillDescription(description);
    await programs.submitCreateProgram();

    await expectProgramInList(programs, programName);
    await expect(programs.programRow(programName).first()).toContainText(description);
    await expect(programs.emptyProgramsText).toHaveCount(0);
  });
});

test.describe('Negative flows', () => {
  let programs: ProgramsPage;

  test.beforeEach(async ({ page }) => {
    skipWithoutAdminCredentials();
    await loginAsAdmin(page);
    programs = await gotoPrograms(page);
  });

  test('TC-005: Programs that exist are not hidden behind the empty state', async () => {
    const programName = `Web Development 2026 ${uniqueSuffix()}`;
    const description = 'Full-stack web development program';
    await programs.createProgram(programName, description);

    await expect(programs.programRow(programName).first()).toContainText(description);
    await expect(programs.emptyProgramsText).toHaveCount(0);
    await expect(programs.createProgramButton).toHaveCount(0);
    await expect(programs.openNewProgramTrigger).toBeVisible();
  });

  test('TC-006: The empty state does not invent a program row', async () => {
    test.skip(
      (await programs.programRowCount()) > 0,
      'Skipped: the shared Programs catalog is not empty, and clearing it would delete every program.',
    );

    await expect(programs.emptyProgramsText).toBeVisible();
    await expect(programs.exactText('Web Development 2026')).toHaveCount(0);
    await expect(programs.exactText('Test Program')).toHaveCount(0);
    await expect(programs.exactText('Informatique & IA - Niveau 2')).toHaveCount(0);
  });

  test("TC-007: One program's Description is not shown on another program", async () => {
    const suffix = uniqueSuffix();
    const webName = `Web Development 2026 ${suffix}`;
    const webDescription = 'Full-stack web development program';
    const testName = `Test Program ${suffix}`;
    const testDescription = 'Temporary program used for deletion checks';
    await programs.createProgram(webName, webDescription);
    await programs.createProgram(testName, testDescription);

    const webRow = programs.programRow(webName).first();
    const testRow = programs.programRow(testName).first();
    await expect(webRow).toContainText(webDescription);
    await expect(webRow).not.toContainText(testDescription);
    await expect(testRow).toContainText(testDescription);
    await expect(testRow).not.toContainText(webDescription);
  });

  test('TC-008: A deleted program is absent from the list', async () => {
    const suffix = uniqueSuffix();
    const deletedName = `Test Program ${suffix}`;
    const webName = `Web Development 2026 ${suffix}`;
    const webDescription = 'Full-stack web development program';
    await programs.createProgram(deletedName, 'Temporary program used for deletion checks');
    await programs.createProgram(webName, webDescription);

    await programs.confirmDelete(deletedName);
    await programs.goto();

    await expectProgramNotInList(programs, deletedName);
    await expect(programs.programRow(webName).first()).toContainText(webDescription);
    await expect(programs.emptyProgramsText).toHaveCount(0);
  });

  test('TC-009: Markup in Name or Description is shown as text', async ({ page }) => {
    const programName = `<script>alert("xss")</script> ${uniqueSuffix()}`;
    const description = '<img src=x onerror=alert(1)>';
    let alertSeen = false;
    page.on('dialog', async (dialog) => {
      if (dialog.type() === 'alert') {
        alertSeen = true;
        await dialog.dismiss();
      }
    });

    await programs.createProgram(programName, description);

    await expectProgramInList(programs, programName);
    await expect(programs.programRow(programName).first()).toContainText(description);
    expect(alertSeen).toBe(false);
  });

  test('TC-010: The list does not drop a program when no filter is applied', async () => {
    const suffix = uniqueSuffix();
    const webName = `Web Development 2026 ${suffix}`;
    const webDescription = 'Full-stack web development program';
    const testName = `Test Program ${suffix}`;
    const testDescription = 'Temporary program used for deletion checks';
    const infoName = `Informatique & IA - Niveau 2 ${suffix}`;
    const infoDescription = "Programme d'informatique et d'intelligence artificielle, niveau 2";
    await programs.createProgram(webName, webDescription);
    await programs.createProgram(testName, testDescription);
    await programs.createProgram(infoName, infoDescription);

    await expect(programs.searchBox).toHaveCount(0);
    await expect(programs.programRow(webName).first()).toContainText(webDescription);
    await expect(programs.programRow(testName).first()).toContainText(testDescription);
    await expect(programs.programRow(infoName).first()).toContainText(infoDescription);
  });
});

test.describe('Edge cases', () => {
  let programs: ProgramsPage;

  test.beforeEach(async ({ page }) => {
    skipWithoutAdminCredentials();
    await loginAsAdmin(page);
    programs = await gotoPrograms(page);
  });

  test('TC-011: Special characters in Name and Description are shown as stored', async () => {
    const programName = `Informatique & IA - Niveau 2 ${uniqueSuffix()}`;
    const description = "Programme d'informatique et d'intelligence artificielle, niveau 2";
    await programs.createProgram(programName, description);

    const row = programs.programRow(programName).first();
    await expect(row).toContainText(programName);
    await expect(row).toContainText(description);
    const stored = await programs.readProgramFields(programName);
    expect(stored.name).toBe(programName);
    expect(stored.description).toBe(description);
  });

  test('TC-012: A program with an empty Description is still listed', async () => {
    const suffix = uniqueSuffix();
    const emptyName = `Data Analytics 2026 ${suffix}`;
    const webName = `Web Development 2026 ${suffix}`;
    const webDescription = 'Full-stack web development program';
    await programs.createProgram(emptyName);
    await programs.createProgram(webName, webDescription);

    await expectProgramInList(programs, emptyName);
    expect((await programs.listedDescription(emptyName)).trim()).toBe('');
    await expect(programs.programRow(webName).first()).toContainText(webDescription);
    await expect(programs.emptyProgramsText).toHaveCount(0);
    const stored = await programs.readProgramFields(emptyName);
    expect(stored.description).toBe('');
  });

  test('TC-013: A short Name is shown in full', async () => {
    const programName = `A${uniqueSuffix()}`;
    const description = 'Single-letter program name';
    await programs.createProgram(programName, description);

    const row = programs.programRow(programName).first();
    await expect(row).toContainText(programName);
    await expect(row).toContainText(description);
  });

  test('TC-014: A 255-character Name and a 1000-character Description remain available', async () => {
    const programName = textOfLength(255, `Web Development 2026 ${uniqueSuffix()} `);
    const description = description1000('Full-stack web development program ');
    await programs.createProgram(programName, description);

    const row = programs.programRow(programName).first();
    await row.scrollIntoViewIfNeeded();
    await expect(row).toContainText(programName);
    await expect(row).toContainText(description.slice(0, 80));
    const stored = await programs.readProgramFields(programName);
    expect(stored.name).toBe(programName);
    expect(stored.description).toBe(description);
  });

  test('TC-015: Two programs with the same Name are both listed with their own Descriptions', async () => {
    const programName = `Test Program ${uniqueSuffix()}`;
    const morning = 'Morning cohort';
    const evening = 'Evening cohort';
    await programs.createProgram(programName, morning);

    await programs.openNewProgramForm();
    await programs.newProgramModal.fillProgramName(programName);
    await programs.newProgramModal.fillDescription(evening);
    await expect(programs.newProgramModal.createButton).toBeEnabled();
    await programs.submitCreateProgram();

    await expect(programs.programRowWithDescription(programName, morning)).toHaveCount(1);
    await expect(programs.programRowWithDescription(programName, evening)).toHaveCount(1);
  });

  test('TC-016: Surrounding spaces in a Name are not kept in the list', async () => {
    const suffix = uniqueSuffix();
    const trimmedName = `Test Program ${suffix}`;
    const otherName = `Kept Program ${suffix}`;
    const otherDescription = 'Temporary program used for deletion checks';
    await programs.createProgram(otherName, otherDescription);

    await programs.openNewProgramForm();
    await programs.newProgramModal.fillProgramName(`  ${trimmedName}  `);
    await programs.newProgramModal.fillDescription('Padded name');
    await programs.submitCreateProgram();

    await expectProgramInList(programs, trimmedName);
    const stored = await programs.readProgramFields(trimmedName);
    expect(stored.name).toBe(trimmedName);
    await expect(programs.programRow(otherName).first()).toContainText(otherDescription);
  });

  test('TC-017: A whitespace-only Description is shown as blank', async () => {
    const programName = `Cloud Engineering 2026 ${uniqueSuffix()}`;

    await programs.openNewProgramForm();
    await programs.newProgramModal.fillProgramName(programName);
    await programs.newProgramModal.fillDescription('   ');
    await programs.submitCreateProgram();
    await expectProgramInList(programs, programName);

    expect((await programs.listedDescription(programName)).trim()).toBe('');
    await expect(programs.programRow(programName).first()).not.toContainText('No programs yet');
    const stored = await programs.readProgramFields(programName);
    expect(stored.description.trim()).toBe('');
  });

  test('TC-018: Every program remains listed when the list is longer than one screen', async () => {
    const suffix = uniqueSuffix();
    const webName = `Web Development 2026 ${suffix}`;
    const webDescription = 'Full-stack web development program';
    const testName = `Test Program ${suffix}`;
    const testDescription = 'Temporary program used for deletion checks';
    await programs.createProgram(webName, webDescription);
    await programs.createProgram(testName, testDescription);

    const count = await programs.scrollToLastTableRow();
    expect(count).toBeGreaterThanOrEqual(25);

    await expectProgramInList(programs, webName);
    await expect(programs.programRow(webName).first()).toContainText(webDescription);
    await expectProgramInList(programs, testName);
    await expect(programs.programRow(testName).first()).toContainText(testDescription);
  });
});
