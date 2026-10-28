import { expect, test } from '../fixtures/cleanup.fixture';
import { ProgramsPage } from '../pages/ProgramsPage';
import { expectNoAxeViolations, runCiSoftA11y } from './helpers/accessibility';
import { expectProgramInList, uniqueSuffix } from './helpers/didaxis-programs';

test.describe('Edit Program dialog accessibility', () => {
  test.describe.configure({ timeout: 120_000 });

  test('Edit Program dialog has no WCAG 2 A or AA violations', { tag: '@a11y' }, async ({ page, programs, trackProgram }) => {
    const programName = `Web Development 2026 ${uniqueSuffix()}`;
    const description = 'Full-stack web development program';
    const id = await programs.createProgram(programName, description);
    trackProgram(id);
    await expectProgramInList(programs, programName);

    await programs.openEditProgram(programName);
    await expect(programs.editDialog).toBeVisible();
    await expect(programs.editProgramNameField).toBeVisible();
    await expect(programs.editCancelButton).toBeVisible();
    await expect(programs.editSaveButton).toBeVisible();

    await expectNoAxeViolations(page, {
      include: ProgramsPage.editDialogAxeIncludeSelector(),
      tags: ['wcag2a', 'wcag2aa'],
    });
  });

  test('Enter on Edit opens the Edit Program dialog', { tag: '@a11y' }, async ({ page, programs, trackProgram }) => {
    await runCiSoftA11y('edit-program-keyboard', async () => {
      const programName = `Web Development 2026 ${uniqueSuffix()}`;
      const id = await programs.createProgram(programName, 'Full-stack web development program');
      trackProgram(id);
      await expectProgramInList(programs, programName);

      const editButton = programs.editButtonForProgram(programName);
      await editButton.scrollIntoViewIfNeeded();
      await editButton.focus();
      await page.keyboard.press('Shift+Tab');
      await page.keyboard.press('Tab');

      await expect(editButton).toBeFocused();
      await page.keyboard.press('Enter');
      await expect(programs.editDialog).toBeVisible();
    });
  });
});
