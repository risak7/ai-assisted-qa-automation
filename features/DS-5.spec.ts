import { expect, test } from '@playwright/test';
import {
  confirmDelete,
  createButton,
  createProgram,
  createProgramModal,
  description1000,
  descriptionField,
  emptyProgramsMessage,
  expectProgramInList,
  expectProgramNotInList,
  gotoPrograms,
  listedDescription,
  loginAsAdmin,
  openNewProgramModal,
  openNewProgramTrigger,
  programListTable,
  programNameField,
  programRowByName,
  programRowByNameAndDescription,
  programRowCount,
  readProgramFields,
  skipWithoutAdminCredentials,
  submitCreateProgram,
  textOfLength,
  uniqueSuffix,
} from '../tests/helpers/didaxis-programs';

test.describe('DS-5: Program list filtering and display', () => {
  test.describe.configure({ mode: 'serial', timeout: 120_000 });

test.describe('Positive flows', () => {
  test.beforeEach(async ({ page }) => {
    skipWithoutAdminCredentials();
    await loginAsAdmin(page);
    await gotoPrograms(page);
  });

  test("TC-001: The Programs page lists each program's Name and Description", async ({ page }) => {
    const suffix = uniqueSuffix();
    const webName = `Web Development 2026 ${suffix}`;
    const webDescription = 'Full-stack web development program';
    const testName = `Test Program ${suffix}`;
    const testDescription = 'Temporary program used for deletion checks';
    await createProgram(page, webName, webDescription);
    await createProgram(page, testName, testDescription);

    const webRow = programRowByName(page, webName).first();
    const testRow = programRowByName(page, testName).first();
    await expect(webRow).toContainText(webName);
    await expect(webRow).toContainText(webDescription);
    await expect(testRow).toContainText(testName);
    await expect(testRow).toContainText(testDescription);
  });

  test('TC-002: An empty Programs page shows a no-programs message and a create prompt', async ({ page }) => {
    test.skip(
      (await programRowCount(page)) > 0,
      'Skipped: the shared Programs catalog is not empty, and clearing it would delete every program.',
    );

    await expect(page.getByText(emptyProgramsMessage)).toBeVisible();
    await expect(page.getByRole('button', { name: 'Create Program' })).toBeVisible();
    await expect(programListTable(page)).toHaveCount(0);
  });

  test('TC-003: A program is shown with its Name and Description', async ({ page }) => {
    const programName = `Web Development 2026 ${uniqueSuffix()}`;
    const description = 'Full-stack web development program';
    await createProgram(page, programName, description);

    const row = programRowByName(page, programName).first();
    await expect(row).toContainText(programName);
    await expect(row).toContainText(description);
    await expect(page.getByText(emptyProgramsMessage)).toHaveCount(0);
  });

  test('TC-004: Creating the first program replaces the empty state with that program', async ({ page }) => {
    test.skip(
      (await programRowCount(page)) > 0,
      'Skipped: the shared Programs catalog is not empty, so the first-program transition cannot be observed.',
    );

    const programName = `Web Development 2026 ${uniqueSuffix()}`;
    const description = 'Full-stack web development program';
    await expect(page.getByText(emptyProgramsMessage)).toBeVisible();
    await page.getByRole('button', { name: 'Create Program' }).click();
    await expect(createProgramModal(page)).toBeVisible();
    await programNameField(page).fill(programName);
    await descriptionField(page).fill(description);
    await submitCreateProgram(page);

    await expectProgramInList(page, programName);
    await expect(programRowByName(page, programName).first()).toContainText(description);
    await expect(page.getByText(emptyProgramsMessage)).toHaveCount(0);
  });
});

test.describe('Negative flows', () => {
  test.beforeEach(async ({ page }) => {
    skipWithoutAdminCredentials();
    await loginAsAdmin(page);
    await gotoPrograms(page);
  });

  test('TC-005: Programs that exist are not hidden behind the empty state', async ({ page }) => {
    const programName = `Web Development 2026 ${uniqueSuffix()}`;
    const description = 'Full-stack web development program';
    await createProgram(page, programName, description);

    await expect(programRowByName(page, programName).first()).toContainText(description);
    await expect(page.getByText(emptyProgramsMessage)).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'Create Program' })).toHaveCount(0);
    await expect(openNewProgramTrigger(page)).toBeVisible();
  });

  test('TC-006: The empty state does not invent a program row', async ({ page }) => {
    test.skip(
      (await programRowCount(page)) > 0,
      'Skipped: the shared Programs catalog is not empty, and clearing it would delete every program.',
    );

    await expect(page.getByText(emptyProgramsMessage)).toBeVisible();
    await expect(page.getByText('Web Development 2026', { exact: true })).toHaveCount(0);
    await expect(page.getByText('Test Program', { exact: true })).toHaveCount(0);
    await expect(page.getByText('Informatique & IA - Niveau 2', { exact: true })).toHaveCount(0);
  });

  test("TC-007: One program's Description is not shown on another program", async ({ page }) => {
    const suffix = uniqueSuffix();
    const webName = `Web Development 2026 ${suffix}`;
    const webDescription = 'Full-stack web development program';
    const testName = `Test Program ${suffix}`;
    const testDescription = 'Temporary program used for deletion checks';
    await createProgram(page, webName, webDescription);
    await createProgram(page, testName, testDescription);

    const webRow = programRowByName(page, webName).first();
    const testRow = programRowByName(page, testName).first();
    await expect(webRow).toContainText(webDescription);
    await expect(webRow).not.toContainText(testDescription);
    await expect(testRow).toContainText(testDescription);
    await expect(testRow).not.toContainText(webDescription);
  });

  test('TC-008: A deleted program is absent from the list', async ({ page }) => {
    const suffix = uniqueSuffix();
    const deletedName = `Test Program ${suffix}`;
    const webName = `Web Development 2026 ${suffix}`;
    const webDescription = 'Full-stack web development program';
    await createProgram(page, deletedName, 'Temporary program used for deletion checks');
    await createProgram(page, webName, webDescription);

    await confirmDelete(page, deletedName);
    await gotoPrograms(page);

    await expectProgramNotInList(page, deletedName);
    await expect(programRowByName(page, webName).first()).toContainText(webDescription);
    await expect(page.getByText(emptyProgramsMessage)).toHaveCount(0);
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

    await createProgram(page, programName, description);

    await expectProgramInList(page, programName);
    await expect(programRowByName(page, programName).first()).toContainText(description);
    expect(alertSeen).toBe(false);
  });

  test('TC-010: The list does not drop a program when no filter is applied', async ({ page }) => {
    const suffix = uniqueSuffix();
    const webName = `Web Development 2026 ${suffix}`;
    const webDescription = 'Full-stack web development program';
    const testName = `Test Program ${suffix}`;
    const testDescription = 'Temporary program used for deletion checks';
    const infoName = `Informatique & IA - Niveau 2 ${suffix}`;
    const infoDescription = "Programme d'informatique et d'intelligence artificielle, niveau 2";
    await createProgram(page, webName, webDescription);
    await createProgram(page, testName, testDescription);
    await createProgram(page, infoName, infoDescription);

    await expect(page.getByRole('searchbox')).toHaveCount(0);
    await expect(programRowByName(page, webName).first()).toContainText(webDescription);
    await expect(programRowByName(page, testName).first()).toContainText(testDescription);
    await expect(programRowByName(page, infoName).first()).toContainText(infoDescription);
  });
});

test.describe('Edge cases', () => {
  test.beforeEach(async ({ page }) => {
    skipWithoutAdminCredentials();
    await loginAsAdmin(page);
    await gotoPrograms(page);
  });

  test('TC-011: Special characters in Name and Description are shown as stored', async ({ page }) => {
    const programName = `Informatique & IA - Niveau 2 ${uniqueSuffix()}`;
    const description = "Programme d'informatique et d'intelligence artificielle, niveau 2";
    await createProgram(page, programName, description);

    const row = programRowByName(page, programName).first();
    await expect(row).toContainText(programName);
    await expect(row).toContainText(description);
    const stored = await readProgramFields(page, programName);
    expect(stored.name).toBe(programName);
    expect(stored.description).toBe(description);
  });

  test('TC-012: A program with an empty Description is still listed', async ({ page }) => {
    const suffix = uniqueSuffix();
    const emptyName = `Data Analytics 2026 ${suffix}`;
    const webName = `Web Development 2026 ${suffix}`;
    const webDescription = 'Full-stack web development program';
    await createProgram(page, emptyName);
    await createProgram(page, webName, webDescription);

    await expectProgramInList(page, emptyName);
    expect((await listedDescription(page, emptyName)).trim()).toBe('');
    await expect(programRowByName(page, webName).first()).toContainText(webDescription);
    await expect(page.getByText(emptyProgramsMessage)).toHaveCount(0);
    const stored = await readProgramFields(page, emptyName);
    expect(stored.description).toBe('');
  });

  test('TC-013: A short Name is shown in full', async ({ page }) => {
    const programName = `A${uniqueSuffix()}`;
    const description = 'Single-letter program name';
    await createProgram(page, programName, description);

    const row = programRowByName(page, programName).first();
    await expect(row).toContainText(programName);
    await expect(row).toContainText(description);
  });

  test('TC-014: A 255-character Name and a 1000-character Description remain available', async ({ page }) => {
    const programName = textOfLength(255, `Web Development 2026 ${uniqueSuffix()} `);
    const description = description1000('Full-stack web development program ');
    await createProgram(page, programName, description);

    const row = programRowByName(page, programName).first();
    await row.scrollIntoViewIfNeeded();
    await expect(row).toContainText(programName);
    await expect(row).toContainText(description.slice(0, 80));
    const stored = await readProgramFields(page, programName);
    expect(stored.name).toBe(programName);
    expect(stored.description).toBe(description);
  });

  test('TC-015: Two programs with the same Name are both listed with their own Descriptions', async ({ page }) => {
    const programName = `Test Program ${uniqueSuffix()}`;
    const morning = 'Morning cohort';
    const evening = 'Evening cohort';
    await createProgram(page, programName, morning);

    await openNewProgramModal(page);
    await programNameField(page).fill(programName);
    await descriptionField(page).fill(evening);
    await expect(createButton(page)).toBeEnabled();
    await submitCreateProgram(page);

    await expect(programRowByNameAndDescription(page, programName, morning)).toHaveCount(1);
    await expect(programRowByNameAndDescription(page, programName, evening)).toHaveCount(1);
  });

  test('TC-016: Surrounding spaces in a Name are not kept in the list', async ({ page }) => {
    const suffix = uniqueSuffix();
    const trimmedName = `Test Program ${suffix}`;
    const otherName = `Kept Program ${suffix}`;
    const otherDescription = 'Temporary program used for deletion checks';
    await createProgram(page, otherName, otherDescription);

    await openNewProgramModal(page);
    await programNameField(page).fill(`  ${trimmedName}  `);
    await descriptionField(page).fill('Padded name');
    await submitCreateProgram(page);

    await expectProgramInList(page, trimmedName);
    const stored = await readProgramFields(page, trimmedName);
    expect(stored.name).toBe(trimmedName);
    await expect(programRowByName(page, otherName).first()).toContainText(otherDescription);
  });

  test('TC-017: A whitespace-only Description is shown as blank', async ({ page }) => {
    const programName = `Cloud Engineering 2026 ${uniqueSuffix()}`;

    await openNewProgramModal(page);
    await programNameField(page).fill(programName);
    await descriptionField(page).fill('   ');
    await submitCreateProgram(page);
    await expectProgramInList(page, programName);

    expect((await listedDescription(page, programName)).trim()).toBe('');
    await expect(programRowByName(page, programName).first()).not.toContainText('No programs yet');
    const stored = await readProgramFields(page, programName);
    expect(stored.description.trim()).toBe('');
  });

  test('TC-018: Every program remains listed when the list is longer than one screen', async ({ page }) => {
    const suffix = uniqueSuffix();
    const webName = `Web Development 2026 ${suffix}`;
    const webDescription = 'Full-stack web development program';
    const testName = `Test Program ${suffix}`;
    const testDescription = 'Temporary program used for deletion checks';
    await createProgram(page, webName, webDescription);
    await createProgram(page, testName, testDescription);

    const rows = programListTable(page).locator('tbody tr');
    const count = await rows.count();
    expect(count).toBeGreaterThanOrEqual(25);
    await rows.nth(count - 1).scrollIntoViewIfNeeded();

    await expectProgramInList(page, webName);
    await expect(programRowByName(page, webName).first()).toContainText(webDescription);
    await expectProgramInList(page, testName);
    await expect(programRowByName(page, testName).first()).toContainText(testDescription);
  });
});
});
