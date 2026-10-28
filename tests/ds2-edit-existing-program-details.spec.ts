import { expect, test } from '../fixtures/cleanup.fixture';
import type { ProgramsPage } from '../pages/ProgramsPage';
import {
  description1000,
  expectProgramCount,
  expectProgramInList,
  expectProgramNotInList,
  gotoPrograms,
  login,
  loginAsAdmin,
  textOfLength,
  uniqueSuffix,
} from './helpers/didaxis-programs';

const originalDescription = 'Full-stack web development program';
const updatedDescription = 'Updated full-stack curriculum';

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

async function trackIfNewProgram(
  programs: ProgramsPage,
  trackProgram: (uuid: string) => void,
  response: Awaited<ReturnType<ProgramsPage['attemptSaveProgram']>>,
  knownIds: string[],
): Promise<void> {
  if (!response?.ok()) return;
  const id = await programs.programIdFromResponse(response);
  if (id && !knownIds.includes(id)) trackProgram(id);
}

test.describe('DS-2: Edit existing program details', () => {
  test.describe.configure({ mode: 'serial', timeout: 120_000 });

  test.describe('Happy paths', () => {
    test('TC-001: Open a program for editing', async ({ programs, trackProgram }) => {
      const programName = `Web Development 2026 ${uniqueSuffix()}`;

      await expect(programs.heading).toBeVisible();
      await expect(programs.newProgramButton).toBeVisible();
      await createTrackedProgram(programs, trackProgram, programName, originalDescription);

      await programs.openEditProgram(programName);

      await expect(programs.editDialog).toBeVisible();
      await expect(programs.editProgramNameField).toHaveValue(programName);
      await expect(programs.editDescriptionField).toHaveValue(originalDescription);
      await expect(programs.editCancelButton).toBeVisible();
      await expect(programs.editSaveButton).toBeVisible();
    });

    test('TC-002: Successfully edit a program name', async ({ programs, trackProgram }) => {
      const suffix = uniqueSuffix();
      const programName = `Web Development 2026 ${suffix}`;
      const updatedName = `Web Development 2026 - Updated ${suffix}`;
      const id = await createTrackedProgram(programs, trackProgram, programName, originalDescription);

      await programs.openEditProgram(programName);
      await programs.fillEditProgramName(updatedName);
      await trackIfNewProgram(programs, trackProgram, await programs.submitSaveProgram(), [id]);

      await expect(programs.editDialog).toBeHidden();
      await expectProgramInList(programs, updatedName);
      await expect(programs.programRow(updatedName)).toContainText(originalDescription);
      await expectProgramNotInList(programs, programName);
    });

    test('TC-003: Changing only Description leaves Program Name unchanged', async ({ programs, trackProgram }) => {
      const programName = `Web Development 2026 ${uniqueSuffix()}`;
      const id = await createTrackedProgram(programs, trackProgram, programName, originalDescription);

      await programs.openEditProgram(programName);
      await programs.fillEditDescription(updatedDescription);
      await expect(programs.editProgramNameField).toHaveValue(programName);
      await trackIfNewProgram(programs, trackProgram, await programs.submitSaveProgram(), [id]);

      await expect(programs.editDialog).toBeHidden();
      await expectProgramInList(programs, programName);
      await expect(programs.programRow(programName)).toContainText(updatedDescription);
      await expect(programs.programRow(programName)).not.toContainText(originalDescription);
    });

    test('TC-004: Update Program Name and Description together', async ({ programs, trackProgram }) => {
      const suffix = uniqueSuffix();
      const programName = `Web Development 2026 ${suffix}`;
      const updatedName = `Web Development 2026 - Updated ${suffix}`;
      const id = await createTrackedProgram(programs, trackProgram, programName, originalDescription);

      await programs.openEditProgram(programName);
      await programs.fillEditProgramName(updatedName);
      await programs.fillEditDescription(updatedDescription);
      await trackIfNewProgram(programs, trackProgram, await programs.submitSaveProgram(), [id]);

      await expect(programs.editDialog).toBeHidden();
      await expectProgramInList(programs, updatedName);
      await expect(programs.programRow(updatedName)).toContainText(updatedDescription);
      await expectProgramNotInList(programs, programName);
    });

    test('TC-005: Clearing Description keeps the Program Name', async ({ programs, trackProgram }) => {
      const programName = `Web Development 2026 ${uniqueSuffix()}`;
      const id = await createTrackedProgram(programs, trackProgram, programName, originalDescription);

      await programs.openEditProgram(programName);
      await programs.clearEditDescription();
      await expect(programs.editProgramNameField).toHaveValue(programName);
      await expect(programs.editSaveButton).toBeEnabled();
      await trackIfNewProgram(programs, trackProgram, await programs.submitSaveProgram(), [id]);

      await expect(programs.editDialog).toBeHidden();
      await expectProgramInList(programs, programName);
      await expect(programs.programRow(programName)).not.toContainText(originalDescription);
    });

    test('TC-006: Cancel discards unsaved edits', async ({ programs, trackProgram }) => {
      const suffix = uniqueSuffix();
      const programName = `Web Development 2026 ${suffix}`;
      const updatedName = `Web Development 2026 - Updated ${suffix}`;
      await createTrackedProgram(programs, trackProgram, programName, originalDescription);

      await programs.openEditProgram(programName);
      await programs.fillEditProgramName(updatedName);
      await programs.fillEditDescription(updatedDescription);
      await programs.closeEditWithoutSaving();

      await expect(programs.editDialog).toBeHidden();
      await expectProgramInList(programs, programName);
      await expect(programs.programRow(programName)).toContainText(originalDescription);
      await expectProgramNotInList(programs, updatedName);
    });
  });

  test.describe('Negative flows', () => {
    test('TC-007: Empty Program Name cannot be saved', async ({ programs, trackProgram }) => {
      const programName = `Web Development 2026 ${uniqueSuffix()}`;
      await createTrackedProgram(programs, trackProgram, programName, originalDescription);

      await programs.openEditProgram(programName);
      await programs.clearEditProgramName();

      await expect(programs.editProgramNameField).toHaveValue('');
      await expect(programs.editSaveButton).toBeDisabled();
      await expect(programs.editDialog).toBeVisible();
      await expectProgramInList(programs, programName);
    });

    test('TC-008: Whitespace-only Program Name cannot be saved', async ({ programs, trackProgram }) => {
      const programName = `Web Development 2026 ${uniqueSuffix()}`;
      await createTrackedProgram(programs, trackProgram, programName, originalDescription);

      await programs.openEditProgram(programName);
      await programs.fillEditProgramName('   ');

      await expect(programs.editProgramNameField).toHaveValue('   ');
      await expect(programs.editSaveButton).toBeDisabled();
      await expect(programs.editDialog).toBeVisible();
      await expectProgramInList(programs, programName);
      await expect(programs.programRow(programName)).toContainText(programName);
    });

    test('TC-009: Duplicate Program Name is rejected', async ({ programs, trackProgram }) => {
      const suffix = uniqueSuffix();
      const sourceName = `Web Development 2026 ${suffix}`;
      const takenName = `Data Science 2026 ${suffix}`;
      const sourceId = await createTrackedProgram(programs, trackProgram, sourceName, originalDescription);
      const takenId = await createTrackedProgram(programs, trackProgram, takenName, 'Analytics program');
      await expectProgramInList(programs, takenName);

      await programs.openEditProgram(sourceName);
      await programs.fillEditProgramName(takenName);
      if (await programs.editSaveButton.isEnabled()) {
        const response = await programs.attemptSaveProgram();
        await trackIfNewProgram(programs, trackProgram, response, [sourceId, takenId]);
      }

      await expect(programs.editDialog).toBeVisible();
      await expect(programs.editNameTakenMessage.filter({ hasText: takenName })).toBeVisible();
      await expectProgramInList(programs, sourceName);
      await expectProgramCount(programs, takenName, 1);
    });

    test('TC-010: A non-admin cannot edit a program', async ({ page, programs, trackProgram }) => {
      const email = process.env.DIDAXIS_NON_ADMIN_EMAIL;
      const password = process.env.DIDAXIS_NON_ADMIN_PASSWORD;
      if (!email || !password) {
        test.skip(true, 'Set DIDAXIS_NON_ADMIN_EMAIL and DIDAXIS_NON_ADMIN_PASSWORD for TC-010');
        return;
      }

      const programName = `Web Development 2026 ${uniqueSuffix()}`;
      await createTrackedProgram(programs, trackProgram, programName, originalDescription);
      await expectProgramInList(programs, programName);

      try {
        await login(page, email, password);
        const asNonAdmin = await gotoPrograms(page);
        const row = asNonAdmin.programRow(programName);
        await row.scrollIntoViewIfNeeded();
        await expect(asNonAdmin.editButtonForProgram(programName)).toHaveCount(0);
        await expect(asNonAdmin.editDialog).toBeHidden();
        await expectProgramInList(asNonAdmin, programName);
      } finally {
        await loginAsAdmin(page);
      }
    });
  });

  test.describe('Edge cases', () => {
    test('TC-011: A one-character Program Name is accepted', async ({ programs, trackProgram }) => {
      const programName = `Web Development 2026 ${uniqueSuffix()}`;
      const shortName = `A${uniqueSuffix()}`;
      const id = await createTrackedProgram(programs, trackProgram, programName, originalDescription);

      await programs.openEditProgram(programName);
      await programs.fillEditProgramName(shortName);
      await expect(programs.editSaveButton).toBeEnabled();
      await trackIfNewProgram(programs, trackProgram, await programs.submitSaveProgram(), [id]);

      await expect(programs.editDialog).toBeHidden();
      await expectProgramInList(programs, shortName);
      await expectProgramNotInList(programs, programName);
    });

    test('TC-012: Special characters in Program Name are preserved', async ({ programs, trackProgram }) => {
      const programName = `Web Development 2026 ${uniqueSuffix()}`;
      const specialName = `C++ & .NET (Cohort #1) ${uniqueSuffix()}`;
      const id = await createTrackedProgram(programs, trackProgram, programName, originalDescription);

      await programs.openEditProgram(programName);
      await programs.fillEditProgramName(specialName);
      await trackIfNewProgram(programs, trackProgram, await programs.submitSaveProgram(), [id]);

      await expect(programs.editDialog).toBeHidden();
      await expectProgramInList(programs, specialName);
      const stored = await programs.readProgramFields(specialName);
      expect(stored.name).toBe(specialName);
    });

    test('TC-013: Surrounding spaces are trimmed from Program Name', async ({ programs, trackProgram }) => {
      const suffix = uniqueSuffix();
      const programName = `Web Development 2026 ${suffix}`;
      const trimmedName = `Cybersecurity 2026 ${suffix}`;
      const paddedName = `  ${trimmedName}  `;
      const id = await createTrackedProgram(programs, trackProgram, programName, originalDescription);

      await programs.openEditProgram(programName);
      await programs.fillEditProgramName(paddedName);
      await trackIfNewProgram(programs, trackProgram, await programs.submitSaveProgram(), [id]);

      await expect(programs.editDialog).toBeHidden();
      await expectProgramInList(programs, trimmedName);
      await expectProgramNotInList(programs, programName);
      const stored = await programs.readProgramFields(trimmedName);
      expect(stored.name).toBe(trimmedName);
    });

    test('TC-014: Program Name at 255 characters is accepted', async ({ programs, trackProgram }) => {
      const programName = `Web Development 2026 ${uniqueSuffix()}`;
      const longName = textOfLength(255, `Web Development 2026 ${uniqueSuffix()} `);
      const id = await createTrackedProgram(programs, trackProgram, programName, originalDescription);

      await programs.openEditProgram(programName);
      await programs.fillEditProgramName(longName);
      await expect(programs.editSaveButton).toBeEnabled();
      await trackIfNewProgram(programs, trackProgram, await programs.submitSaveProgram(), [id]);

      await expect(programs.editDialog).toBeHidden();
      await expectProgramInList(programs, longName);
      await programs.openEditProgram(longName);
      await expect(programs.editProgramNameField).toHaveValue(longName);
    });

    test('TC-015: Program Name over 255 characters is rejected', async ({ programs, trackProgram }) => {
      const programName = `Web Development 2026 ${uniqueSuffix()}`;
      const tooLongName = textOfLength(256, `Web Development 2026 ${uniqueSuffix()} `);
      const id = await createTrackedProgram(programs, trackProgram, programName, originalDescription);

      await programs.openEditProgram(programName);
      await programs.fillEditProgramName(tooLongName);

      const blockedBeforeSave =
        (await programs.editSaveButton.isDisabled()) || (await programs.editMaxLengthMessage.isVisible());
      if (!blockedBeforeSave) {
        const response = await programs.attemptSaveProgram();
        await trackIfNewProgram(programs, trackProgram, response, [id]);
      }

      await expectProgramNotInList(programs, tooLongName);
      await expectProgramInList(programs, programName);
      await expect.poll(async () => {
        if (await programs.editMaxLengthMessage.isVisible()) return true;
        if (!(await programs.editDialog.isVisible())) return false;
        return programs.editSaveButton.isDisabled();
      }).toBe(true);
    });

    test('TC-016: Program names stay unique regardless of letter case', async ({ programs, trackProgram }) => {
      const suffix = uniqueSuffix();
      const canonicalName = `Web Development 2026 ${suffix}`;
      const variantName = canonicalName.toLowerCase();
      const sourceName = `Data Science 2026 ${suffix}`;
      const canonicalId = await createTrackedProgram(programs, trackProgram, canonicalName, originalDescription);
      const sourceId = await createTrackedProgram(programs, trackProgram, sourceName, 'Analytics program');
      await expectProgramInList(programs, canonicalName);

      await programs.openEditProgram(sourceName);
      await programs.fillEditProgramName(variantName);
      if (await programs.editSaveButton.isEnabled()) {
        const response = await programs.attemptSaveProgram();
        await trackIfNewProgram(programs, trackProgram, response, [canonicalId, sourceId]);
      }

      await expect(programs.editDialog).toBeVisible();
      await expectProgramInList(programs, sourceName);
      await expectProgramCount(programs, canonicalName, 1);
      await expectProgramCount(programs, variantName, 0);
    });

    test('TC-017: Markup in Program Name is stored as text', async ({ page, programs, trackProgram }) => {
      const suffix = uniqueSuffix();
      const programName = `Web Development 2026 ${suffix}`;
      const markupName = `<script>alert("xss")</script> ${suffix}`;
      let dialogSeen = false;
      page.on('dialog', async (dialog) => {
        dialogSeen = true;
        await dialog.dismiss();
      });

      const id = await createTrackedProgram(programs, trackProgram, programName, originalDescription);
      await programs.openEditProgram(programName);
      await programs.fillEditProgramName(markupName);
      await trackIfNewProgram(programs, trackProgram, await programs.submitSaveProgram(), [id]);

      await expect(programs.editDialog).toBeHidden();
      await expectProgramInList(programs, markupName);
      await expect(programs.programRow(markupName)).toContainText('<script>alert("xss")</script>');
      expect(dialogSeen).toBe(false);
    });

    test('TC-018: A long Description is preserved', async ({ programs, trackProgram }) => {
      const programName = `Web Development 2026 ${uniqueSuffix()}`;
      const description = description1000(originalDescription);
      const id = await createTrackedProgram(programs, trackProgram, programName, originalDescription);

      await programs.openEditProgram(programName);
      await programs.fillEditDescription(description);
      await trackIfNewProgram(programs, trackProgram, await programs.submitSaveProgram(), [id]);

      await expect(programs.editDialog).toBeHidden();
      await expectProgramInList(programs, programName);
      await programs.openEditProgram(programName);
      await expect(programs.editDescriptionField).toHaveValue(description);
    });

    test('TC-019: Saving with no changes does not add a second row', async ({ programs, trackProgram }) => {
      const programName = `Web Development 2026 ${uniqueSuffix()}`;
      const id = await createTrackedProgram(programs, trackProgram, programName, originalDescription);
      await expectProgramCount(programs, programName, 1);

      await programs.openEditProgram(programName);
      await expect(programs.editProgramNameField).toHaveValue(programName);
      await expect(programs.editDescriptionField).toHaveValue(originalDescription);
      const response = await programs.attemptSaveProgram();
      await trackIfNewProgram(programs, trackProgram, response, [id]);

      await expect(programs.editDialog).toBeHidden();
      await expectProgramCount(programs, programName, 1);
      await expect(programs.programRow(programName)).toContainText(originalDescription);
    });

    test('TC-020: Description-only edit leaves the other dialog fields unchanged', async ({ programs, trackProgram }) => {
      const programName = `Web Development 2026 ${uniqueSuffix()}`;
      const id = await createTrackedProgram(programs, trackProgram, programName, originalDescription);

      await programs.openEditProgram(programName);
      await expect.poll(() => programs.editFieldValueByVisibleLabel('Default Session Hours')).toBe('4');
      await expect.poll(() => programs.editFieldValueByVisibleLabel('Default Exam Hours')).toBe('3');
      await expect(programs.editSyncAsyncRatio).toContainText('70% sync / 30% async');

      await programs.fillEditDescription(updatedDescription);
      await expect(programs.editProgramNameField).toHaveValue(programName);
      await trackIfNewProgram(programs, trackProgram, await programs.submitSaveProgram(), [id]);

      await programs.openEditProgram(programName);
      await expect(programs.editDescriptionField).toHaveValue(updatedDescription);
      await expect(programs.editProgramNameField).toHaveValue(programName);
      await expect.poll(() => programs.editFieldValueByVisibleLabel('Default Session Hours')).toBe('4');
      await expect.poll(() => programs.editFieldValueByVisibleLabel('Default Exam Hours')).toBe('3');
      await expect(programs.editSyncAsyncRatio).toContainText('70% sync / 30% async');
    });
  });
});
