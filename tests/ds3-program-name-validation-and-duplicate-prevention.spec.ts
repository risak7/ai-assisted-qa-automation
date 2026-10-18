import { expect, test } from '../fixtures/cleanup.fixture';
import type { ProgramsPage } from '../pages/ProgramsPage';
import {
  expectProgramCount,
  expectProgramInList,
  expectProgramNotInList,
  textOfLength,
  uniqueSuffix,
} from './helpers/didaxis-programs';

async function expectDuplicateNameNotAdded(
  programs: ProgramsPage,
  trackProgram: (uuid: string) => void,
  attemptName: string,
  attemptDescription: string,
  listedName: string = attemptName.trim(),
): Promise<void> {
  await programs.openAndFillNewProgram(attemptName, attemptDescription);
  const response = await programs.clickCreateOnNewProgram();
  if (response.ok()) {
    trackProgram(await programs.createdProgramId(response));
  }

  await expect.poll(async () => programs.countProgramRowsNamed(listedName), { timeout: 15_000 }).toBeLessThanOrEqual(1);

  const rowCount = await programs.countProgramRowsNamed(listedName);
  if (rowCount === 1) {
    await expect(programs.duplicateNameMessage.or(programs.newProgramDialog)).toBeVisible();
  }
}

test.describe('DS-3: Program name validation and duplicate prevention', () => {
  test.describe.configure({ mode: 'serial', timeout: 120_000 });

  test.describe('Positive flows', () => {
    test('TC-001: Accept program name with special characters', async ({ programs, trackProgram }) => {
      const programName = `Informatique & IA - Niveau 2 ${uniqueSuffix()}`;
      const description = "Programme d'informatique et d'intelligence artificielle, niveau 2";

      trackProgram(await programs.createProgram(programName, description));
      await expect(programs.programRow(programName)).toContainText(description);
      const stored = await programs.readProgramFields(programName);
      expect(stored.name).toBe(programName);
    });

    test('TC-002: Leading and trailing spaces are trimmed from a valid program name', async ({ programs, trackProgram }) => {
      const trimmedName = `Informatique & IA - Niveau 2 ${uniqueSuffix()}`;
      const paddedName = `  ${trimmedName}  `;
      const description = "Programme d'informatique et d'intelligence artificielle, niveau 2";

      trackProgram(await programs.createProgram(paddedName, description));
      await expectProgramInList(programs, trimmedName);
      await expectProgramNotInList(programs, paddedName);
      const stored = await programs.readProgramFields(trimmedName);
      expect(stored.name).toBe(trimmedName);
    });

    test('TC-003: Duplicate Description does not block a unique Program Name', async ({ programs, trackProgram }) => {
      const suffix = uniqueSuffix();
      const existingName = `Web Development 2026 ${suffix}`;
      const newName = `Data Analytics 2026 ${suffix}`;
      const description = 'Full-stack web development program';

      trackProgram(await programs.createProgram(existingName, description));
      trackProgram(await programs.createProgram(newName, description));

      await expectProgramInList(programs, existingName);
      await expectProgramInList(programs, newName);
    });
  });

  test.describe('Negative flows', () => {
    test('TC-004: Reject program name with only whitespace', async ({ programs }) => {
      await programs.openAndFillNewProgram('   ', 'Full-stack web development program');
      await expect(programs.newProgramCreateButton).toBeDisabled();
    });

    test('TC-005: Empty program name is not submitted', async ({ programs }) => {
      const before = await programs.programRowCount();

      await programs.openNewProgramForm();
      await programs.fillNewProgramDescription('Full-stack web development program');

      await expect(programs.newProgramNameField).toHaveValue('');
      await expect(programs.newProgramCreateButton).toBeDisabled();
      await expect.poll(async () => programs.programRowCount()).toBe(before);
    });

    test('TC-006: Reject duplicate program name', async ({ programs, trackProgram }) => {
      const programName = `Web Development 2026 ${uniqueSuffix()}`;
      trackProgram(await programs.createProgram(programName, 'Full-stack web development program'));

      await expectDuplicateNameNotAdded(programs, trackProgram, programName, 'Another full-stack cohort');
      await expectProgramCount(programs, programName, 1);
    });

    test('TC-007: Trimmed program name is checked for duplicates', async ({ programs, trackProgram }) => {
      const programName = `Web Development 2026 ${uniqueSuffix()}`;
      trackProgram(await programs.createProgram(programName, 'Full-stack web development program'));

      await expectDuplicateNameNotAdded(
        programs,
        trackProgram,
        `  ${programName}  `,
        'Another full-stack cohort',
        programName,
      );
      await expectProgramCount(programs, programName, 1);
    });

    test('TC-008: Program names are unique regardless of letter case', async ({ programs, trackProgram }) => {
      const programName = `Web Development 2026 ${uniqueSuffix()}`;
      const caseVariant = programName.toLowerCase();
      trackProgram(await programs.createProgram(programName, 'Full-stack web development program'));

      await expectDuplicateNameNotAdded(programs, trackProgram, caseVariant, 'Case-variant duplicate');
      await expect.poll(async () => programs.totalRowsForNames(programName, caseVariant), {
        timeout: 15_000,
      }).toBeLessThanOrEqual(1);
    });

    test('TC-009: A tab-only program name is treated as empty', async ({ programs }) => {
      await programs.openNewProgramForm();
      await programs.fillNewProgram('\t', 'Full-stack web development program');

      await expect(programs.newProgramNameField).toHaveValue('\t');
      await expect(programs.newProgramCreateButton).toBeDisabled();
    });

    test('TC-010: A rejected duplicate leaves the existing program unchanged', async ({ programs, trackProgram }) => {
      const programName = `Web Development 2026 ${uniqueSuffix()}`;
      const originalDescription = 'Full-stack web development program';
      trackProgram(await programs.createProgram(programName, originalDescription));

      await expectDuplicateNameNotAdded(
        programs,
        trackProgram,
        programName,
        'This description must not replace the original',
      );

      await expectProgramCount(programs, programName, 1);
      const stored = await programs.readProgramFields(programName, originalDescription);
      expect(stored.description).toBe(originalDescription);
    });
  });

  test.describe('Edge cases', () => {
    test('TC-011: Minimum-length program name is accepted', async ({ programs, trackProgram }) => {
      const programName = `A${uniqueSuffix()}`;
      const description = 'Single-letter program name';

      trackProgram(await programs.createProgram(programName, description));
      await expect(programs.programRow(programName)).toContainText(description);
    });

    test('TC-012: Spaces around a real character are trimmed', async ({ programs, trackProgram }) => {
      const trimmedName = `A${uniqueSuffix()}`;
      const description = 'Trimmed single character';

      trackProgram(await programs.createProgram(`   ${trimmedName}   `, description));
      await expectProgramInList(programs, trimmedName);
      const stored = await programs.readProgramFields(trimmedName);
      expect(stored.name).toBe(trimmedName);
    });

    test('TC-013: Program Name at 255 characters is accepted', async ({ programs, trackProgram }) => {
      const programName = textOfLength(255, `Informatique & IA - Niveau 2 ${uniqueSuffix()} `);
      const description = 'Boundary length name';

      await programs.openAndFillNewProgram(programName, description);
      await expect(programs.newProgramNameField).toHaveValue(programName);
      await expect(programs.newProgramCreateButton).toBeEnabled();
      trackProgram(await programs.submitCreateProgram());
      await expectProgramInList(programs, programName);
    });

    test('TC-014: Program Name over 255 characters is rejected', async ({ programs }) => {
      const programName = textOfLength(256, `Informatique & IA - Niveau 2 ${uniqueSuffix()} `);

      await programs.openAndFillNewProgram(programName, 'Over max length name');

      const createDisabled = await programs.isCreateProgramDisabled();
      const hasMaxLengthMessage = await programs.maxLengthValidationMessage.isVisible().catch(() => false);

      if (createDisabled || hasMaxLengthMessage) {
        await expect(programs.newProgramCreateButton).toBeDisabled();
        await expect(programs.maxLengthValidationMessage.or(programs.newProgramCreateButton)).toBeVisible();
        return;
      }

      await programs.clickCreateOnNewProgram();
      await expectProgramNotInList(programs, programName);
    });

    test('TC-015: Punctuation beyond ampersand and hyphen is accepted', async ({ programs, trackProgram }) => {
      const programName = `C++ / .NET (Cohort #1) ${uniqueSuffix()}`;

      trackProgram(await programs.createProgram(programName, 'Systems programming with C++ and .NET'));
      const stored = await programs.readProgramFields(programName);
      expect(stored.name).toBe(programName);
    });

    test('TC-016: A punctuation difference is not a duplicate', async ({ programs, trackProgram }) => {
      const programName = `Web Development 2026 ${uniqueSuffix()}`;
      const punctuatedName = `${programName}!`;

      trackProgram(await programs.createProgram(programName, 'Full-stack web development program'));
      trackProgram(await programs.createProgram(punctuatedName, 'Name differs by punctuation'));

      await expectProgramInList(programs, programName);
      await expectProgramInList(programs, punctuatedName);
    });

    test('TC-017: Markup in Program Name is not executed', async ({ page, programs, trackProgram }) => {
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

    test('TC-018: Accented characters are preserved in Program Name', async ({ programs, trackProgram }) => {
      const programName = `Développement & IA - Niveau 2 ${uniqueSuffix()}`;

      trackProgram(await programs.createProgram(programName, 'Programme avec caractères accentués'));
      const stored = await programs.readProgramFields(programName);
      expect(stored.name).toBe(programName);
      await expectProgramNotInList(programs, programName.replace('é', 'e'));
    });
  });
});
