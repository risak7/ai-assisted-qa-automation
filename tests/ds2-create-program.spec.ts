import { expect, test } from '@playwright/test';
import {
  closeEditWithoutSaving,
  countProgramRowsNamed,
  createProgram,
  description1000,
  editDescriptionField,
  editLabeledField,
  editNameField,
  editProgramModal,
  emptyProgramsMessage,
  expectProgramCount,
  expectProgramInList,
  expectProgramNotInList,
  gotoPrograms,
  login,
  loginAsAdmin,
  newProgramButton,
  openEditProgram,
  programRowByName,
  readProgramFields,
  saveButton,
  skipWithoutAdminCredentials,
  submitSaveProgram,
  textOfLength,
  uniqueSuffix,
} from './helpers/didaxis-programs';

test.describe.configure({ mode: 'serial', timeout: 120_000 });

test.describe('Positive flows', () => {
  test.beforeEach(async ({ page }) => {
    skipWithoutAdminCredentials();
    await loginAsAdmin(page);
    await gotoPrograms(page);
  });

  test("TC-001: Edit form opens with the program's current Program Name and Description", async ({ page }) => {
    const programName = `Web Development 2026 ${uniqueSuffix()}`;
    const description = 'Full-stack web development program';
    await createProgram(page, programName, description);

    await openEditProgram(page, programName);

    await expect(editProgramModal(page).getByRole('heading', { name: 'Edit Program' })).toBeVisible();
    await expect(editNameField(page)).toHaveValue(programName);
    await expect(editDescriptionField(page)).toHaveValue(description);
    await expect(saveButton(page)).toBeVisible();
  });

  test('TC-002: Saved Program Name replaces the old name in the list and the dialog closes', async ({ page }) => {
    const programName = `Web Development 2026 ${uniqueSuffix()}`;
    const updatedName = `${programName} - Updated`;
    await createProgram(page, programName, 'Full-stack web development program');

    await openEditProgram(page, programName);
    await editNameField(page).fill(updatedName);
    await submitSaveProgram(page);

    await expectProgramInList(page, updatedName);
    await expectProgramNotInList(page, programName);
  });

  test('TC-003: Changing only Description leaves Program Name unchanged', async ({ page }) => {
    const programName = `Web Development 2026 ${uniqueSuffix()}`;
    const updatedDescription = 'Evening cohort for full-stack web development';
    await createProgram(page, programName, 'Full-stack web development program');

    await openEditProgram(page, programName);
    await editDescriptionField(page).fill(updatedDescription);
    await submitSaveProgram(page);

    await expectProgramCount(page, programName, 1);
    await expect(programRowByName(page, programName).first()).toContainText(updatedDescription);
    const stored = await readProgramFields(page, programName);
    expect(stored.name).toBe(programName);
    expect(stored.description).toBe(updatedDescription);
  });

  test('TC-004: Saving without changes keeps the current Program Name and Description', async ({ page }) => {
    const programName = `Web Development 2026 ${uniqueSuffix()}`;
    const description = 'Full-stack web development program';
    await createProgram(page, programName, description);

    await openEditProgram(page, programName);
    await expect(saveButton(page)).toBeEnabled();
    await submitSaveProgram(page);

    await expectProgramCount(page, programName, 1);
    await expect(programRowByName(page, programName).first()).toContainText(description);
    const stored = await readProgramFields(page, programName);
    expect(stored.name).toBe(programName);
    expect(stored.description).toBe(description);
  });
});

test.describe('Negative flows', () => {
  test.beforeEach(async ({ page }) => {
    skipWithoutAdminCredentials();
    await loginAsAdmin(page);
    await gotoPrograms(page);
  });

  test('TC-005: An empty Program Name is not saved', async ({ page }) => {
    const programName = `Web Development 2026 ${uniqueSuffix()}`;
    const description = 'Full-stack web development program';
    await createProgram(page, programName, description);

    await openEditProgram(page, programName);
    await editNameField(page).fill('');
    await expect(saveButton(page)).toBeDisabled();
    await expect(editNameField(page)).toHaveAttribute('aria-invalid', 'false');
    await expect(editProgramModal(page).locator('.mantine-InputWrapper-error')).toHaveCount(0);
    await closeEditWithoutSaving(page);

    await expectProgramInList(page, programName);
    const stored = await readProgramFields(page, programName);
    expect(stored.name).toBe(programName);
    expect(stored.description).toBe(description);
  });

  test('TC-006: A whitespace-only Program Name is not saved', async ({ page }) => {
    const programName = `Web Development 2026 ${uniqueSuffix()}`;
    const description = 'Full-stack web development program';
    await createProgram(page, programName, description);

    await openEditProgram(page, programName);
    await editNameField(page).fill('   ');
    await expect(editNameField(page)).toHaveValue('   ');
    await expect(saveButton(page)).toBeDisabled();
    await closeEditWithoutSaving(page);

    await expectProgramInList(page, programName);
    const stored = await readProgramFields(page, programName);
    expect(stored.name).toBe(programName);
    expect(stored.description).toBe(description);
  });

  test('TC-007: Renaming onto an existing Program Name keeps both programs', async ({ page }) => {
    const suffix = uniqueSuffix();
    const sourceName = `Web Development 2026 ${suffix}`;
    const targetName = `Data Analytics 2026 ${suffix}`;
    const sourceDescription = 'Full-stack web development program';
    const targetDescription = 'Analytics program';
    await createProgram(page, targetName, targetDescription);
    await createProgram(page, sourceName, sourceDescription);

    await openEditProgram(page, sourceName);
    await editNameField(page).fill(targetName);
    await submitSaveProgram(page);

    await expectProgramNotInList(page, sourceName);
    await expectProgramCount(page, targetName, 2);
    const original = await readProgramFields(page, targetName, targetDescription);
    expect(original.description).toBe(targetDescription);
    const renamed = await readProgramFields(page, targetName, sourceDescription);
    expect(renamed.description).toBe(sourceDescription);
  });

  test('TC-008: Closing the dialog without Save discards the new Program Name', async ({ page }) => {
    const programName = `Web Development 2026 ${uniqueSuffix()}`;
    const updatedName = `${programName} - Updated`;
    await createProgram(page, programName, 'Full-stack web development program');

    await openEditProgram(page, programName);
    await editNameField(page).fill(updatedName);
    await closeEditWithoutSaving(page);

    await expectProgramInList(page, programName);
    await expectProgramNotInList(page, updatedName);
    const stored = await readProgramFields(page, programName);
    expect(stored.name).toBe(programName);
  });

  test('TC-010: Saving an edit does not add a second program', async ({ page }) => {
    const programName = `Web Development 2026 ${uniqueSuffix()}`;
    const updatedName = `${programName} - Updated`;
    await createProgram(page, programName, 'Full-stack web development program');

    await openEditProgram(page, programName);
    await editNameField(page).fill(updatedName);
    await submitSaveProgram(page);

    await expectProgramCount(page, updatedName, 1);
    await expectProgramNotInList(page, programName);
  });
});

test.describe('Non-admin access', () => {
  test('TC-009: A non-admin cannot change program details', async ({ page }) => {
    const email = process.env.DIDAXIS_NON_ADMIN_EMAIL;
    const password = process.env.DIDAXIS_NON_ADMIN_PASSWORD;
    if (!email || !password) {
      test.skip(true, 'Set DIDAXIS_NON_ADMIN_EMAIL and DIDAXIS_NON_ADMIN_PASSWORD for TC-009');
      return;
    }

    const programName = `Web Development 2026 ${uniqueSuffix()}`;
    await loginAsAdmin(page);
    await gotoPrograms(page);
    await createProgram(page, programName, 'Full-stack web development program');

    await login(page, email, password);
    await gotoPrograms(page);

    const row = programRowByName(page, programName).first();
    await row.scrollIntoViewIfNeeded();
    await expect(row.getByRole('button', { name: `Edit ${programName}`, exact: true })).toHaveCount(0);
    await expect(page.getByText(emptyProgramsMessage)).toHaveCount(0);
    await expect(newProgramButton(page)).toHaveCount(0);
  });
});

test.describe('Edge cases', () => {
  test.beforeEach(async ({ page }) => {
    skipWithoutAdminCredentials();
    await loginAsAdmin(page);
    await gotoPrograms(page);
  });

  test('TC-011: A one-character Program Name is saved', async ({ page }) => {
    const programName = `Web Development 2026 ${uniqueSuffix()}`;
    const description = 'Full-stack web development program';
    const candidates = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789ΑΒΓΔΕΖΗΘΙΚΛΜΝΞΟΠΡΣΤΥΦΧΨΩ';
    let shortName = '';
    for (const candidate of candidates) {
      if ((await countProgramRowsNamed(page, candidate)) === 0) {
        shortName = candidate;
        break;
      }
    }
    expect(shortName, 'an unused one-character Program Name').toHaveLength(1);
    await createProgram(page, programName, description);

    await openEditProgram(page, programName);
    await editNameField(page).fill(shortName);
    expect(await editNameField(page).inputValue()).toHaveLength(1);
    await expect(saveButton(page)).toBeEnabled();
    await submitSaveProgram(page);

    await expectProgramInList(page, shortName);
    await expectProgramNotInList(page, programName);
    const stored = await readProgramFields(page, shortName);
    expect(stored.name).toBe(shortName);
    expect(stored.description).toBe(description);
  });

  test('TC-012: Special characters in Program Name are stored and shown as entered', async ({ page }) => {
    const programName = `Web Development 2026 ${uniqueSuffix()}`;
    const specialName = `C++ & .NET (Cohort #1) ${uniqueSuffix()}`;
    await createProgram(page, programName, 'Full-stack web development program');

    await openEditProgram(page, programName);
    await editNameField(page).fill(specialName);
    await submitSaveProgram(page);

    await expectProgramInList(page, specialName);
    const stored = await readProgramFields(page, specialName);
    expect(stored.name).toBe(specialName);
  });

  test('TC-013: Leading and trailing spaces in Program Name are trimmed before save', async ({ page }) => {
    const programName = `Web Development 2026 ${uniqueSuffix()}`;
    const trimmedName = `Cybersecurity 2026 ${uniqueSuffix()}`;
    const spacedName = `  ${trimmedName}  `;
    await createProgram(page, programName, 'Defensive security program');

    await openEditProgram(page, programName);
    await editNameField(page).fill(spacedName);
    await submitSaveProgram(page);

    await expectProgramInList(page, trimmedName);
    await expectProgramNotInList(page, spacedName);
    const stored = await readProgramFields(page, trimmedName);
    expect(stored.name).toBe(trimmedName);
  });

  test('TC-014: A 255-character Program Name is saved and shown in full', async ({ page }) => {
    const programName = `Web Development 2026 ${uniqueSuffix()}`;
    const longName = textOfLength(255, `Web Development 2026 - Updated ${uniqueSuffix()} `);
    await createProgram(page, programName, 'Boundary length name');

    await openEditProgram(page, programName);
    await expect(editNameField(page)).not.toHaveAttribute('maxlength');
    await editNameField(page).fill(longName);
    expect(await editNameField(page).inputValue()).toHaveLength(255);
    await expect(saveButton(page)).toBeEnabled();
    await submitSaveProgram(page);

    await expectProgramInList(page, longName);
    await expectProgramNotInList(page, programName);
  });

  test('TC-015: A 256-character Program Name is saved', async ({ page }) => {
    const programName = `Web Development 2026 ${uniqueSuffix()}`;
    const longName = textOfLength(256, `Web Development 2026 - Updated ${uniqueSuffix()} `);
    await createProgram(page, programName, 'Over max length name');

    await openEditProgram(page, programName);
    await expect(editNameField(page)).not.toHaveAttribute('maxlength');
    await editNameField(page).fill(longName);
    expect(await editNameField(page).inputValue()).toHaveLength(256);
    await expect(saveButton(page)).toBeEnabled();
    await expect(editProgramModal(page).locator('.mantine-InputWrapper-error')).toHaveCount(0);
    await submitSaveProgram(page);

    await expectProgramInList(page, longName);
    await expectProgramNotInList(page, programName);
  });

  test('TC-016: A Program Name that differs only by letter case is saved as entered', async ({ page }) => {
    const suffix = uniqueSuffix();
    const existingName = `Data Analytics 2026 ${suffix}`;
    const sourceName = `Web Development 2026 ${suffix}`;
    const caseVariant = existingName.toLowerCase();
    await createProgram(page, existingName, 'Analytics program');
    await createProgram(page, sourceName, 'Full-stack web development program');

    await openEditProgram(page, sourceName);
    await editNameField(page).fill(caseVariant);
    await submitSaveProgram(page);

    await expectProgramInList(page, existingName);
    await expectProgramInList(page, caseVariant);
    await expectProgramNotInList(page, sourceName);
  });

  test('TC-017: Markup entered in Program Name is shown as text', async ({ page }) => {
    const programName = `Web Development 2026 ${uniqueSuffix()}`;
    const markupName = `<script>alert("xss")</script> ${uniqueSuffix()}`;
    let alertSeen = false;
    page.on('dialog', async (dialog) => {
      if (dialog.type() === 'alert') {
        alertSeen = true;
        await dialog.dismiss();
      }
    });

    await createProgram(page, programName, 'Markup should be plain text');
    await openEditProgram(page, programName);
    await editNameField(page).fill(markupName);
    await submitSaveProgram(page);

    await expectProgramInList(page, markupName);
    expect(alertSeen).toBe(false);
  });

  test('TC-018: Clearing Description keeps the current Program Name', async ({ page }) => {
    const programName = `Web Development 2026 ${uniqueSuffix()}`;
    await createProgram(page, programName, 'Full-stack web development program');

    await openEditProgram(page, programName);
    await editDescriptionField(page).fill('');
    await expect(saveButton(page)).toBeEnabled();
    await submitSaveProgram(page);

    await expectProgramInList(page, programName);
    const stored = await readProgramFields(page, programName);
    expect(stored.name).toBe(programName);
    expect(stored.description).toBe('');
  });

  test('TC-019: A 1000-character Description is saved and Program Name stays the same', async ({ page }) => {
    const programName = `Web Development 2026 ${uniqueSuffix()}`;
    const description = description1000('Full-stack web development program');
    await createProgram(page, programName, 'Short description');

    await openEditProgram(page, programName);
    await editDescriptionField(page).fill(description);
    await submitSaveProgram(page);

    await expectProgramInList(page, programName);
    await expect(programRowByName(page, programName).first()).toContainText(description.slice(0, 80));
    const stored = await readProgramFields(page, programName);
    expect(stored.name).toBe(programName);
    expect(stored.description).toBe(description);
  });

  test('TC-020: Edit form shows the AI generation fields with their current values', async ({ page }) => {
    const programName = `Web Development 2026 ${uniqueSuffix()}`;
    await createProgram(page, programName, 'Full-stack web development program');

    await openEditProgram(page, programName);

    const dialog = editProgramModal(page);
    await expect(dialog.getByRole('heading', { name: 'Edit Program' })).toBeVisible();
    await expect(dialog.getByRole('button', { name: /Show AI Generation Config/ })).toBeVisible();
    await expect(editLabeledField(page, 'Total Program Hours')).toHaveValue('');
    await expect(editLabeledField(page, 'Total Program Hours')).toHaveAttribute('placeholder', 'e.g. 900');
    await expect(dialog.getByText('Required for AI curriculum generation')).toBeVisible();
    await expect(editLabeledField(page, 'Default Session Hours')).toHaveValue('4');
    await expect(editLabeledField(page, 'Default Exam Hours')).toHaveValue('3');
    await expect(editLabeledField(page, 'Target Audience')).toHaveValue('');
    await expect(editLabeledField(page, 'Target Audience')).toHaveAttribute('placeholder', 'e.g. Career changers, no CS background');
    await expect(editLabeledField(page, 'Focus Areas')).toHaveValue('');
    await expect(editLabeledField(page, 'Focus Areas')).toHaveAttribute('placeholder', 'e.g. Python, SQL, Machine Learning, Data Visualization');
    await expect(dialog.getByText('Sync/Async Ratio: 70% sync / 30% async')).toBeVisible();
  });

  test('TC-021: Changing only Description leaves session and exam hours unchanged', async ({ page }) => {
    const programName = `Web Development 2026 ${uniqueSuffix()}`;
    const updatedDescription = 'Evening cohort for full-stack web development';
    await createProgram(page, programName, 'Full-stack web development program');

    await openEditProgram(page, programName);
    await editDescriptionField(page).fill(updatedDescription);
    await submitSaveProgram(page);

    await openEditProgram(page, programName);
    await expect(editNameField(page)).toHaveValue(programName);
    await expect(editDescriptionField(page)).toHaveValue(updatedDescription);
    await expect(editLabeledField(page, 'Default Session Hours')).toHaveValue('4');
    await expect(editLabeledField(page, 'Default Exam Hours')).toHaveValue('3');
    await expect(editLabeledField(page, 'Total Program Hours')).toHaveValue('');
  });
});
