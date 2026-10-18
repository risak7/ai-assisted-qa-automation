import { expect, test } from '../fixtures/cleanup.fixture';
import type { ProgramsPage } from '../pages/ProgramsPage';
import {
  description1000,
  expectProgramCount,
  expectProgramInList,
  expectProgramNotInList,
  gotoPrograms,
  textOfLength,
  uniqueSuffix,
} from './helpers/didaxis-programs';

test.describe.configure({ mode: 'serial', timeout: 120_000 });

test.describe('Positive flows', () => {
  let programs: ProgramsPage;

  test.beforeEach(async ({ page }) => {
    programs = await gotoPrograms(page);
  });

  test("TC-001: Edit form opens with the program's current Program Name and Description", async ({ trackProgram }) => {
    const programName = `Web Development 2026 ${uniqueSuffix()}`;
    const description = 'Full-stack web development program';
    trackProgram(await programs.createProgram(programName, description));

    await programs.openEditProgram(programName);

    await expect(programs.editDialog.getByRole('heading', { name: 'Edit Program' })).toBeVisible();
    await expect(programs.editProgramNameField).toHaveValue(programName);
    await expect(programs.editDescriptionField).toHaveValue(description);
    await expect(programs.editSaveButton).toBeVisible();
  });

  test('TC-002: Saved Program Name replaces the old name in the list and the dialog closes', async ({ trackProgram }) => {
    const programName = `Web Development 2026 ${uniqueSuffix()}`;
    const updatedName = `${programName} - Updated`;
    trackProgram(await programs.createProgram(programName, 'Full-stack web development program'));

    await programs.openEditProgram(programName);
    await programs.editProgramNameField.fill(updatedName);
    await programs.submitSaveProgram();

    await expectProgramInList(programs, updatedName);
    await expectProgramNotInList(programs, programName);
  });

  test('TC-003: Changing only Description leaves Program Name unchanged', async ({ trackProgram }) => {
    const programName = `Web Development 2026 ${uniqueSuffix()}`;
    const updatedDescription = 'Evening cohort for full-stack web development';
    trackProgram(await programs.createProgram(programName, 'Full-stack web development program'));

    await programs.openEditProgram(programName);
    await programs.editDescriptionField.fill(updatedDescription);
    await programs.submitSaveProgram();

    await expectProgramCount(programs, programName, 1);
    await expect(programs.programRow(programName).first()).toContainText(updatedDescription);
    const stored = await programs.readProgramFields(programName);
    expect(stored.name).toBe(programName);
    expect(stored.description).toBe(updatedDescription);
  });

  test('TC-004: Saving without changes keeps the current Program Name and Description', async ({ trackProgram }) => {
    const programName = `Web Development 2026 ${uniqueSuffix()}`;
    const description = 'Full-stack web development program';
    trackProgram(await programs.createProgram(programName, description));

    await programs.openEditProgram(programName);
    await expect(programs.editSaveButton).toBeEnabled();
    await programs.submitSaveProgram();

    await expectProgramCount(programs, programName, 1);
    await expect(programs.programRow(programName).first()).toContainText(description);
    const stored = await programs.readProgramFields(programName);
    expect(stored.name).toBe(programName);
    expect(stored.description).toBe(description);
  });
});

test.describe('Negative flows', () => {
  let programs: ProgramsPage;

  test.beforeEach(async ({ page }) => {
    programs = await gotoPrograms(page);
  });

  test('TC-005: An empty Program Name is not saved', async ({ trackProgram }) => {
    const programName = `Web Development 2026 ${uniqueSuffix()}`;
    const description = 'Full-stack web development program';
    trackProgram(await programs.createProgram(programName, description));

    await programs.openEditProgram(programName);
    await programs.editProgramNameField.fill('');
    await expect(programs.editSaveButton).toBeDisabled();
    await expect(programs.editProgramNameField).toHaveAttribute('aria-invalid', 'false');
    await expect(programs.editDialog.getByRole('alert')).toHaveCount(0);
    await programs.closeEditWithoutSaving();

    await expectProgramInList(programs, programName);
    const stored = await programs.readProgramFields(programName);
    expect(stored.name).toBe(programName);
    expect(stored.description).toBe(description);
  });

  test('TC-006: A whitespace-only Program Name is not saved', async ({ trackProgram }) => {
    const programName = `Web Development 2026 ${uniqueSuffix()}`;
    const description = 'Full-stack web development program';
    trackProgram(await programs.createProgram(programName, description));

    await programs.openEditProgram(programName);
    await programs.editProgramNameField.fill('   ');
    await expect(programs.editProgramNameField).toHaveValue('   ');
    await expect(programs.editSaveButton).toBeDisabled();
    await programs.closeEditWithoutSaving();

    await expectProgramInList(programs, programName);
    const stored = await programs.readProgramFields(programName);
    expect(stored.name).toBe(programName);
    expect(stored.description).toBe(description);
  });

  test('TC-007: Renaming onto an existing Program Name keeps both programs', async ({ trackProgram }) => {
    const suffix = uniqueSuffix();
    const sourceName = `Web Development 2026 ${suffix}`;
    const targetName = `Data Analytics 2026 ${suffix}`;
    const sourceDescription = 'Full-stack web development program';
    const targetDescription = 'Analytics program';
    trackProgram(await programs.createProgram(targetName, targetDescription));
    trackProgram(await programs.createProgram(sourceName, sourceDescription));

    await programs.openEditProgram(sourceName);
    await programs.editProgramNameField.fill(targetName);
    await programs.submitSaveProgram();

    await expectProgramNotInList(programs, sourceName);
    await expectProgramCount(programs, targetName, 2);
    const original = await programs.readProgramFields(targetName, targetDescription);
    expect(original.description).toBe(targetDescription);
    const renamed = await programs.readProgramFields(targetName, sourceDescription);
    expect(renamed.description).toBe(sourceDescription);
  });

  test('TC-008: Closing the dialog without Save discards the new Program Name', async ({ trackProgram }) => {
    const programName = `Web Development 2026 ${uniqueSuffix()}`;
    const updatedName = `${programName} - Updated`;
    trackProgram(await programs.createProgram(programName, 'Full-stack web development program'));

    await programs.openEditProgram(programName);
    await programs.editProgramNameField.fill(updatedName);
    await programs.closeEditWithoutSaving();

    await expectProgramInList(programs, programName);
    await expectProgramNotInList(programs, updatedName);
    const stored = await programs.readProgramFields(programName);
    expect(stored.name).toBe(programName);
  });

  test('TC-010: Saving an edit does not add a second program', async ({ trackProgram }) => {
    const programName = `Web Development 2026 ${uniqueSuffix()}`;
    const updatedName = `${programName} - Updated`;
    trackProgram(await programs.createProgram(programName, 'Full-stack web development program'));

    await programs.openEditProgram(programName);
    await programs.editProgramNameField.fill(updatedName);
    await programs.submitSaveProgram();

    await expectProgramCount(programs, updatedName, 1);
    await expectProgramNotInList(programs, programName);
  });
});

test.describe('Edge cases', () => {
  let programs: ProgramsPage;

  test.beforeEach(async ({ page }) => {
    programs = await gotoPrograms(page);
  });

  test('TC-011: A one-character Program Name is saved', async ({ trackProgram }) => {
    const programName = `Web Development 2026 ${uniqueSuffix()}`;
    const description = 'Full-stack web development program';
    const candidates = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789ΑΒΓΔΕΖΗΘΙΚΛΜΝΞΟΠΡΣΤΥΦΧΨΩ';
    let shortName = '';
    for (const candidate of candidates) {
      if ((await programs.countProgramRowsNamed(candidate)) === 0) {
        shortName = candidate;
        break;
      }
    }
    expect(shortName, 'an unused one-character Program Name').toHaveLength(1);
    trackProgram(await programs.createProgram(programName, description));

    await programs.openEditProgram(programName);
    await programs.editProgramNameField.fill(shortName);
    expect(await programs.editProgramNameField.inputValue()).toHaveLength(1);
    await expect(programs.editSaveButton).toBeEnabled();
    await programs.submitSaveProgram();

    await expectProgramInList(programs, shortName);
    await expectProgramNotInList(programs, programName);
    const stored = await programs.readProgramFields(shortName);
    expect(stored.name).toBe(shortName);
    expect(stored.description).toBe(description);
  });

  test('TC-012: Special characters in Program Name are stored and shown as entered', async ({ trackProgram }) => {
    const programName = `Web Development 2026 ${uniqueSuffix()}`;
    const specialName = `C++ & .NET (Cohort #1) ${uniqueSuffix()}`;
    trackProgram(await programs.createProgram(programName, 'Full-stack web development program'));

    await programs.openEditProgram(programName);
    await programs.editProgramNameField.fill(specialName);
    await programs.submitSaveProgram();

    await expectProgramInList(programs, specialName);
    const stored = await programs.readProgramFields(specialName);
    expect(stored.name).toBe(specialName);
  });

  test('TC-013: Leading and trailing spaces in Program Name are trimmed before save', async ({ trackProgram }) => {
    const programName = `Web Development 2026 ${uniqueSuffix()}`;
    const trimmedName = `Cybersecurity 2026 ${uniqueSuffix()}`;
    const spacedName = `  ${trimmedName}  `;
    trackProgram(await programs.createProgram(programName, 'Defensive security program'));

    await programs.openEditProgram(programName);
    await programs.editProgramNameField.fill(spacedName);
    await programs.submitSaveProgram();

    await expectProgramInList(programs, trimmedName);
    await expectProgramNotInList(programs, spacedName);
    const stored = await programs.readProgramFields(trimmedName);
    expect(stored.name).toBe(trimmedName);
  });

  test('TC-014: A 255-character Program Name is saved and shown in full', async ({ trackProgram }) => {
    const programName = `Web Development 2026 ${uniqueSuffix()}`;
    const longName = textOfLength(255, `Web Development 2026 - Updated ${uniqueSuffix()} `);
    trackProgram(await programs.createProgram(programName, 'Boundary length name'));

    await programs.openEditProgram(programName);
    await expect(programs.editProgramNameField).not.toHaveAttribute('maxlength');
    await programs.editProgramNameField.fill(longName);
    expect(await programs.editProgramNameField.inputValue()).toHaveLength(255);
    await expect(programs.editSaveButton).toBeEnabled();
    await programs.submitSaveProgram();

    await expectProgramInList(programs, longName);
    await expectProgramNotInList(programs, programName);
  });

  test('TC-015: A 256-character Program Name is saved', async ({ trackProgram }) => {
    const programName = `Web Development 2026 ${uniqueSuffix()}`;
    const longName = textOfLength(256, `Web Development 2026 - Updated ${uniqueSuffix()} `);
    trackProgram(await programs.createProgram(programName, 'Over max length name'));

    await programs.openEditProgram(programName);
    await expect(programs.editProgramNameField).not.toHaveAttribute('maxlength');
    await programs.editProgramNameField.fill(longName);
    expect(await programs.editProgramNameField.inputValue()).toHaveLength(256);
    await expect(programs.editSaveButton).toBeEnabled();
    await expect(programs.editDialog.getByRole('alert')).toHaveCount(0);
    await programs.submitSaveProgram();

    await expectProgramInList(programs, longName);
    await expectProgramNotInList(programs, programName);
  });

  test('TC-016: A Program Name that differs only by letter case is saved as entered', async ({ trackProgram }) => {
    const suffix = uniqueSuffix();
    const existingName = `Data Analytics 2026 ${suffix}`;
    const sourceName = `Web Development 2026 ${suffix}`;
    const caseVariant = existingName.toLowerCase();
    trackProgram(await programs.createProgram(existingName, 'Analytics program'));
    trackProgram(await programs.createProgram(sourceName, 'Full-stack web development program'));

    await programs.openEditProgram(sourceName);
    await programs.editProgramNameField.fill(caseVariant);
    await programs.submitSaveProgram();

    await expectProgramInList(programs, existingName);
    await expectProgramInList(programs, caseVariant);
    await expectProgramNotInList(programs, sourceName);
  });

  test('TC-017: Markup entered in Program Name is shown as text', async ({ page, trackProgram }) => {
    const programName = `Web Development 2026 ${uniqueSuffix()}`;
    const markupName = `<script>alert("xss")</script> ${uniqueSuffix()}`;
    let alertSeen = false;
    page.on('dialog', async (dialog) => {
      if (dialog.type() === 'alert') {
        alertSeen = true;
        await dialog.dismiss();
      }
    });

    trackProgram(await programs.createProgram(programName, 'Markup should be plain text'));
    await programs.openEditProgram(programName);
    await programs.editProgramNameField.fill(markupName);
    await programs.submitSaveProgram();

    await expectProgramInList(programs, markupName);
    expect(alertSeen).toBe(false);
  });

  test('TC-018: Clearing Description keeps the current Program Name', async ({ trackProgram }) => {
    const programName = `Web Development 2026 ${uniqueSuffix()}`;
    trackProgram(await programs.createProgram(programName, 'Full-stack web development program'));

    await programs.openEditProgram(programName);
    await programs.editDescriptionField.fill('');
    await expect(programs.editSaveButton).toBeEnabled();
    await programs.submitSaveProgram();

    await expectProgramInList(programs, programName);
    const stored = await programs.readProgramFields(programName);
    expect(stored.name).toBe(programName);
    expect(stored.description).toBe('');
  });

  test('TC-019: A 1000-character Description is saved and Program Name stays the same', async ({ trackProgram }) => {
    const programName = `Web Development 2026 ${uniqueSuffix()}`;
    const description = description1000('Full-stack web development program');
    trackProgram(await programs.createProgram(programName, 'Short description'));

    await programs.openEditProgram(programName);
    await programs.editDescriptionField.fill(description);
    await programs.submitSaveProgram();

    await expectProgramInList(programs, programName);
    await expect(programs.programRow(programName).first()).toContainText(description.slice(0, 80));
    const stored = await programs.readProgramFields(programName);
    expect(stored.name).toBe(programName);
    expect(stored.description).toBe(description);
  });

  test('TC-020: Edit form shows the AI generation fields with their current values', async ({ trackProgram }) => {
    const programName = `Web Development 2026 ${uniqueSuffix()}`;
    trackProgram(await programs.createProgram(programName, 'Full-stack web development program'));

    await programs.openEditProgram(programName);

    await expect(programs.editDialog.getByRole('heading', { name: 'Edit Program' })).toBeVisible();
    await expect(programs.editDialog.getByRole('button', { name: /Show AI Generation Config/ })).toBeVisible();
    await expect(programs.editLabeledField('Total Program Hours')).toHaveValue('');
    await expect(programs.editLabeledField('Total Program Hours')).toHaveAttribute('placeholder', 'e.g. 900');
    await expect(programs.editDialog.getByText('Required for AI curriculum generation')).toBeVisible();
    await expect(programs.editLabeledField('Default Session Hours')).toHaveValue('4');
    await expect(programs.editLabeledField('Default Exam Hours')).toHaveValue('3');
    await expect(programs.editLabeledField('Target Audience')).toHaveValue('');
    await expect(programs.editLabeledField('Target Audience')).toHaveAttribute('placeholder', 'e.g. Career changers, no CS background');
    await expect(programs.editLabeledField('Focus Areas')).toHaveValue('');
    await expect(programs.editLabeledField('Focus Areas')).toHaveAttribute('placeholder', 'e.g. Python, SQL, Machine Learning, Data Visualization');
    await expect(programs.editDialog.getByText('Sync/Async Ratio: 70% sync / 30% async')).toBeVisible();
  });

  test('TC-021: Changing only Description leaves session and exam hours unchanged', async ({ trackProgram }) => {
    const programName = `Web Development 2026 ${uniqueSuffix()}`;
    const updatedDescription = 'Evening cohort for full-stack web development';
    trackProgram(await programs.createProgram(programName, 'Full-stack web development program'));

    await programs.openEditProgram(programName);
    await programs.editDescriptionField.fill(updatedDescription);
    await programs.submitSaveProgram();

    await programs.openEditProgram(programName);
    await expect(programs.editProgramNameField).toHaveValue(programName);
    await expect(programs.editDescriptionField).toHaveValue(updatedDescription);
    await expect(programs.editLabeledField('Default Session Hours')).toHaveValue('4');
    await expect(programs.editLabeledField('Default Exam Hours')).toHaveValue('3');
    await expect(programs.editLabeledField('Total Program Hours')).toHaveValue('');
  });
});
