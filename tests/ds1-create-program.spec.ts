import { expect, test } from '../fixtures/cleanup.fixture';
import {
  description1000,
  expectProgramInList,
  expectProgramNotInList,
  textOfLength,
  uniqueSuffix,
} from './helpers/didaxis-programs';

test.describe('DS-1: Create new academic program', () => {
  test.describe.configure({ mode: 'serial', timeout: 120_000 });

  test.describe('Positive flows', () => {
    test('TC-001: Program creation form shows Program Name and Description', async ({ programs }) => {
      await programs.openNewProgramForm();

      await expect(programs.newProgramNameField).toBeVisible();
      await expect(programs.newProgramDescriptionField).toBeVisible();
      await expect(programs.newProgramCreateButton).toBeVisible();
    });

    test('TC-002: A completed program is added to the list and the modal closes', async ({ programs, trackProgram }) => {
      const programName = `Web Development 2026 ${uniqueSuffix()}`;
      const description = 'Full-stack web development program';

      trackProgram(await programs.createProgram(programName, description));
      await expectProgramInList(programs, programName);
    });

    test('TC-003: Program is created when Program Name is filled and Description is left empty', async ({
      programs,
      trackProgram,
    }) => {
      const programName = `Data Analytics 2026 ${uniqueSuffix()}`;

      await programs.openAndFillNewProgram(programName);
      await expect(programs.newProgramCreateButton).toBeEnabled();
      trackProgram(await programs.submitCreateProgram());
      await expectProgramInList(programs, programName);
    });
  });

  test.describe('Negative flows', () => {
    test('TC-004: Create stays disabled when Program Name is empty', async ({ programs }) => {
      await programs.openNewProgramForm();

      await expect(programs.newProgramNameField).toHaveValue('');
      await expect(programs.newProgramDescriptionField).toHaveValue('');
      await expect(programs.newProgramCreateButton).toBeDisabled();
    });

    test('TC-005: Filling only Description does not enable Create', async ({ programs }) => {
      await programs.openNewProgramForm();
      await programs.fillNewProgramDescription('Full-stack web development program');
      await expect(programs.newProgramCreateButton).toBeDisabled();
    });

    test('TC-006: A whitespace-only Program Name does not create a program', async ({ programs }) => {
      await programs.openAndFillNewProgram('   ', 'Full-stack web development program');
      await expect(programs.newProgramCreateButton).toBeDisabled();
    });

    test('TC-007: A duplicate Program Name is not added a second time', async ({ programs, trackProgram }) => {
      const programName = `Web Development 2026 ${uniqueSuffix()}`;

      trackProgram(await programs.createProgram(programName, 'Full-stack web development program'));
      await expectProgramInList(programs, programName);

      await programs.openAndFillNewProgram(programName, 'Another full-stack cohort');
      const duplicateResponse = await programs.clickCreateOnNewProgram();
      if (duplicateResponse.ok()) {
        trackProgram(await programs.createdProgramId(duplicateResponse));
      }

      await expect.poll(async () => programs.countProgramRowsNamed(programName), { timeout: 15_000 }).toBeLessThanOrEqual(1);

      const rowCount = await programs.countProgramRowsNamed(programName);
      if (rowCount === 1) {
        const modalStillOpen = await programs.isNewProgramModalVisible();
        const duplicateFeedback = await programs.duplicateNameMessage.isVisible();
        expect(modalStillOpen || duplicateFeedback).toBeTruthy();
      }
    });
  });

  test.describe('Edge cases', () => {
    test('TC-009: A one-character Program Name is accepted', async ({ programs, trackProgram }) => {
      const programName = `A${uniqueSuffix()}`;

      trackProgram(await programs.createProgram(programName, 'Single-letter program name'));
      await expectProgramInList(programs, programName);
    });

    test('TC-010: Program Name with special characters is stored and shown as entered', async ({ programs, trackProgram }) => {
      const programName = `C++ & .NET (Cohort #1) ${uniqueSuffix()}`;

      trackProgram(await programs.createProgram(programName, 'Systems programming with C++ and .NET'));
      await expectProgramInList(programs, programName);
    });

    test('TC-011: Leading and trailing spaces in Program Name are trimmed before save', async ({ programs, trackProgram }) => {
      const suffix = uniqueSuffix();
      const trimmedName = `Cybersecurity 2026 ${suffix}`;
      const paddedName = `  ${trimmedName}  `;

      trackProgram(await programs.createProgram(paddedName, 'Defensive security program'));
      await expectProgramInList(programs, trimmedName);
    });

    test('TC-012: A 255-character Program Name is accepted', async ({ programs, trackProgram }) => {
      const programName = textOfLength(255, `Web Development 2026 ${uniqueSuffix()} `);

      await programs.openAndFillNewProgram(programName, 'Boundary length name');
      await expect(programs.newProgramCreateButton).toBeEnabled();
      trackProgram(await programs.submitCreateProgram());
      await expectProgramInList(programs, programName);
    });

    test('TC-013: A 256-character Program Name is rejected', async ({ programs, trackProgram }) => {
      const programName = textOfLength(256, `Web Development 2026 ${uniqueSuffix()} `);

      await programs.openAndFillNewProgram(programName, 'Over max length name');

      const createDisabled = await programs.isCreateProgramDisabled();
      const hasMaxLengthMessage = await programs.maxLengthValidationMessage.isVisible().catch(() => false);

      if (createDisabled || hasMaxLengthMessage) {
        await expect(programs.newProgramCreateButton).toBeDisabled();
        return;
      }

      const rejected = await programs.clickCreateOnNewProgram();
      if (rejected.ok()) {
        trackProgram(await programs.createdProgramId(rejected));
      }
      await expectProgramNotInList(programs, programName);
    });

    test('TC-014: A Program Name that differs only by letter case is treated as a duplicate', async ({
      programs,
      trackProgram,
    }) => {
      const suffix = uniqueSuffix();
      const canonicalName = `Web Development 2026 ${suffix}`;
      const variantName = canonicalName.toLowerCase();

      trackProgram(await programs.createProgram(canonicalName, 'Original cohort'));
      await expectProgramInList(programs, canonicalName);

      await programs.openAndFillNewProgram(variantName, 'Case-variant duplicate');
      const duplicateResponse = await programs.clickCreateOnNewProgram();
      if (duplicateResponse.ok()) {
        trackProgram(await programs.createdProgramId(duplicateResponse));
      }

      await expect.poll(async () => programs.totalRowsForNames(canonicalName, variantName), {
        timeout: 15_000,
      }).toBeLessThanOrEqual(1);
    });

    test('TC-015: Markup entered in Program Name is shown as text', async ({ page, programs, trackProgram }) => {
      const programName = `<script>alert("xss")</script> ${uniqueSuffix()}`;
      let dialogSeen = false;
      page.on('dialog', async (dialog) => {
        dialogSeen = true;
        await dialog.dismiss();
      });

      trackProgram(await programs.createProgram(programName, 'Markup should be plain text'));
      await expectProgramInList(programs, programName);
      expect(dialogSeen).toBe(false);
    });

    test('TC-016: A long Description is saved with the program', async ({ programs, trackProgram }) => {
      const programName = `Cloud Engineering 2026 ${uniqueSuffix()}`;
      const description = description1000('Full-stack web development program');

      trackProgram(await programs.createProgram(programName, description));
      await expectProgramInList(programs, programName);
      await programs.scrollProgramRowIntoView(programName);
      await expect(programs.descriptionSnippetInRow(programName, description.slice(0, 80))).toBeVisible();
    });
  });
});
