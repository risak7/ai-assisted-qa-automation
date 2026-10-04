import { expect, test } from '@playwright/test';
import {
  createButton,
  createProgram,
  descriptionField,
  expectProgramCount,
  expectProgramInList,
  expectProgramNotInList,
  gotoPrograms,
  programRowCount,
  loginAsAdmin,
  openNewProgramModal,
  programNameField,
  programRowByName,
  readProgramFields,
  skipWithoutAdminCredentials,
  submitCreateProgram,
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

  test('TC-001: Program Name "Informatique & IA - Niveau 2" is created', async ({ page }) => {
    const programName = `Informatique & IA - Niveau 2 ${uniqueSuffix()}`;
    const description = "Programme d'informatique et d'intelligence artificielle, niveau 2";

    await createProgram(page, programName, description);

    await expect(programRowByName(page, programName).first()).toContainText(description);
    const stored = await readProgramFields(page, programName);
    expect(stored.name).toBe(programName);
  });

  test('TC-002: A name with surrounding spaces is saved in trimmed form', async ({ page }) => {
    const trimmedName = `Informatique & IA - Niveau 2 ${uniqueSuffix()}`;
    const paddedName = `  ${trimmedName}  `;
    const description = "Programme d'informatique et d'intelligence artificielle, niveau 2";

    await openNewProgramModal(page);
    await programNameField(page).fill(paddedName);
    await descriptionField(page).fill(description);
    await submitCreateProgram(page);

    await expectProgramInList(page, trimmedName);
    const stored = await readProgramFields(page, trimmedName);
    expect(stored.name).toBe(trimmedName);
  });

  test('TC-003: A different Program Name is created when Description matches an existing program', async ({ page }) => {
    const suffix = uniqueSuffix();
    const existingName = `Web Development 2026 ${suffix}`;
    const newName = `Data Analytics 2026 ${suffix}`;
    const description = 'Full-stack web development program';
    await createProgram(page, existingName, description);

    await createProgram(page, newName, description);

    await expectProgramInList(page, existingName);
    await expectProgramInList(page, newName);
  });
});

test.describe('Negative flows', () => {
  test.beforeEach(async ({ page }) => {
    skipWithoutAdminCredentials();
    await loginAsAdmin(page);
    await gotoPrograms(page);
  });

  test('TC-004: A Program Name of three spaces is not submitted', async ({ page }) => {
    await openNewProgramModal(page);
    await programNameField(page).fill('   ');
    await descriptionField(page).fill('Full-stack web development program');

    await expect(createButton(page)).toBeDisabled();
  });

  test('TC-005: An empty Program Name is not submitted', async ({ page }) => {
    const before = await programRowCount(page);

    await openNewProgramModal(page);
    await descriptionField(page).fill('Full-stack web development program');

    await expect(programNameField(page)).toHaveValue('');
    await expect(createButton(page)).toBeDisabled();
    expect(await programRowCount(page)).toBe(before);
  });

  test('TC-006: Creating an existing Program Name adds another row', async ({ page }) => {
    const programName = `Web Development 2026 ${uniqueSuffix()}`;
    const originalDescription = 'Full-stack web development program';
    await createProgram(page, programName, originalDescription);

    await openNewProgramModal(page);
    await programNameField(page).fill(programName);
    await descriptionField(page).fill('Another full-stack cohort');
    await submitCreateProgram(page);

    await expectProgramCount(page, programName, 2);
    const original = await readProgramFields(page, programName, originalDescription);
    expect(original.description).toBe(originalDescription);
  });

  test('TC-007: A trimmed name that matches an existing name is stored again', async ({ page }) => {
    const programName = `Web Development 2026 ${uniqueSuffix()}`;
    await createProgram(page, programName, 'Full-stack web development program');

    await openNewProgramModal(page);
    await programNameField(page).fill(`  ${programName}  `);
    await descriptionField(page).fill('Another full-stack cohort');
    await submitCreateProgram(page);

    await expectProgramCount(page, programName, 2);
    const stored = await readProgramFields(page, programName, 'Another full-stack cohort');
    expect(stored.name).toBe(programName);
  });

  test('TC-008: A name that differs only by letter case is stored as entered', async ({ page }) => {
    const programName = `Web Development 2026 ${uniqueSuffix()}`;
    const caseVariant = programName.toLowerCase();
    await createProgram(page, programName, 'Full-stack web development program');

    await openNewProgramModal(page);
    await programNameField(page).fill(caseVariant);
    await descriptionField(page).fill('Case-variant duplicate');
    await submitCreateProgram(page);

    await expectProgramInList(page, programName);
    await expectProgramInList(page, caseVariant);
  });

  test('TC-009: A tab-only Program Name is not submitted', async ({ page }) => {
    await openNewProgramModal(page);
    await programNameField(page).fill('\t');
    await descriptionField(page).fill('Full-stack web development program');

    await expect(programNameField(page)).toHaveValue('\t');
    await expect(createButton(page)).toBeDisabled();
  });

  test('TC-010: A second program with the same name leaves the original Description unchanged', async ({ page }) => {
    const programName = `Web Development 2026 ${uniqueSuffix()}`;
    const originalDescription = 'Full-stack web development program';
    const replacement = 'This description must not replace the original';
    await createProgram(page, programName, originalDescription);

    await openNewProgramModal(page);
    await programNameField(page).fill(programName);
    await descriptionField(page).fill(replacement);
    await submitCreateProgram(page);

    await expectProgramCount(page, programName, 2);
    const original = await readProgramFields(page, programName, originalDescription);
    expect(original.description).toBe(originalDescription);
    const added = await readProgramFields(page, programName, replacement);
    expect(added.description).toBe(replacement);
  });
});

test.describe('Edge cases', () => {
  test.beforeEach(async ({ page }) => {
    skipWithoutAdminCredentials();
    await loginAsAdmin(page);
    await gotoPrograms(page);
  });

  test('TC-011: A short Program Name is accepted', async ({ page }) => {
    const programName = `A${uniqueSuffix()}`;
    const description = 'Single-letter program name';

    await createProgram(page, programName, description);

    await expect(programRowByName(page, programName).first()).toContainText(description);
  });

  test('TC-012: A name of spaces around one character is saved as that character', async ({ page }) => {
    const trimmedName = `A${uniqueSuffix()}`;
    const description = 'Trimmed single character';

    await openNewProgramModal(page);
    await programNameField(page).fill(`   ${trimmedName}   `);
    await descriptionField(page).fill(description);
    await submitCreateProgram(page);

    await expectProgramInList(page, trimmedName);
    const stored = await readProgramFields(page, trimmedName);
    expect(stored.name).toBe(trimmedName);
  });

  test('TC-013: A 255-character Program Name is accepted', async ({ page }) => {
    const programName = textOfLength(255, `Informatique & IA - Niveau 2 ${uniqueSuffix()} `);
    const description = 'Boundary length name';

    await openNewProgramModal(page);
    await programNameField(page).fill(programName);
    await descriptionField(page).fill(description);
    expect(await programNameField(page).inputValue()).toHaveLength(255);
    await expect(createButton(page)).toBeEnabled();
    await submitCreateProgram(page);

    await expectProgramInList(page, programName);
  });

  test('TC-014: A 256-character Program Name is saved', async ({ page }) => {
    const programName = textOfLength(256, `Informatique & IA - Niveau 2 ${uniqueSuffix()} `);

    await openNewProgramModal(page);
    await programNameField(page).fill(programName);
    await descriptionField(page).fill('Over max length name');
    expect(await programNameField(page).inputValue()).toHaveLength(256);
    await expect(createButton(page)).toBeEnabled();
    await submitCreateProgram(page);

    await expectProgramInList(page, programName);
  });

  test('TC-015: Additional punctuation in Program Name is preserved', async ({ page }) => {
    const programName = `C++ / .NET (Cohort #1) ${uniqueSuffix()}`;

    await createProgram(page, programName, 'Systems programming with C++ and .NET');

    const stored = await readProgramFields(page, programName);
    expect(stored.name).toBe(programName);
  });

  test('TC-016: A name that differs by punctuation from an existing name is accepted', async ({ page }) => {
    const programName = `Web Development 2026 ${uniqueSuffix()}`;
    const punctuatedName = `${programName}!`;
    await createProgram(page, programName, 'Full-stack web development program');

    await createProgram(page, punctuatedName, 'Name differs by punctuation');

    await expectProgramInList(page, programName);
    await expectProgramInList(page, punctuatedName);
  });

  test('TC-017: Markup in Program Name is stored as text and is not executed', async ({ page }) => {
    const programName = `<script>alert("xss")</script> ${uniqueSuffix()}`;
    let alertSeen = false;
    page.on('dialog', async (dialog) => {
      if (dialog.type() === 'alert') {
        alertSeen = true;
        await dialog.dismiss();
      }
    });

    await createProgram(page, programName, 'Markup should be plain text');

    await expectProgramInList(page, programName);
    expect(alertSeen).toBe(false);
  });

  test('TC-018: Accented characters in Program Name are preserved', async ({ page }) => {
    const programName = `Développement & IA - Niveau 2 ${uniqueSuffix()}`;

    await createProgram(page, programName, 'Programme avec caractères accentués');

    const stored = await readProgramFields(page, programName);
    expect(stored.name).toBe(programName);
    await expectProgramNotInList(page, programName.replace('é', 'e'));
  });
});
