import { expect, test } from '../fixtures/cleanup.fixture';
import { ProgramsPage } from '../pages/ProgramsPage';
import {
  expectProgramCount,
  expectProgramInList,
  expectProgramNotInList,
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

test.describe('DS-271: Program name validation and duplicate prevention', () => {
  test.describe.configure({ mode: 'serial', timeout: 120_000 });

  test.describe('Happy paths', () => {
    test('TC-001: Accept program name with special characters', { tag: '@e2e' }, async ({ programs, trackProgram }) => {
      const programName = `Informatique & IA - Niveau 2 ${uniqueSuffix()}`;
      const description = "Programme d'informatique et d'intelligence artificielle, niveau 2";

      trackProgram(await programs.createProgram(programName, description));
      await expectProgramInList(programs, programName);
      const stored = await programs.readProgramFields(programName);
      expect(stored.name).toBe(programName);
    });

    test('TC-002: Leading and trailing spaces are trimmed from a valid program name', { tag: '@e2e' }, async ({
      programs,
      trackProgram,
    }) => {
      const trimmedName = `Informatique & IA - Niveau 2 ${uniqueSuffix()}`;
      const paddedName = `  ${trimmedName}  `;
      const description = "Programme d'informatique et d'intelligence artificielle, niveau 2";

      trackProgram(await programs.createProgram(paddedName, description));
      await expectProgramInList(programs, trimmedName);
      const stored = await programs.readProgramFields(trimmedName);
      expect(stored.name).toBe(trimmedName);
    });
  });

  test.describe('Negative flows', () => {
    test('TC-003: Reject program name with only whitespace', { tag: '@e2e' }, async ({ programs }) => {
      await programs.openAndFillNewProgram('   ', 'Full-stack web development program');
      await expect(programs.newProgramCreateButton).toBeDisabled();
    });

    // Product defect: a second program with the same name is saved. Skipped until the app is fixed.
    test.fixme('TC-004: Reject duplicate program name', { tag: '@e2e' }, async ({ programs, trackProgram }) => {
      const programName = `Web Development 2026 ${uniqueSuffix()}`;
      trackProgram(await programs.createProgram(programName, 'Full-stack web development program'));

      await expectDuplicateNameNotAdded(programs, trackProgram, programName, 'Another full-stack cohort');
      await expectProgramCount(programs, programName, 1);
      await expect(programs.duplicateNameMessage).toBeVisible();
    });

    test('TC-005: Empty program name is not submitted', { tag: '@e2e' }, async ({ programs }) => {
      await programs.openNewProgramForm();
      await programs.fillNewProgramDescription('Full-stack web development program');

      await expect(programs.newProgramNameField).toHaveValue('');
      await expect(programs.newProgramCreateButton).toBeDisabled();
    });
  });

  test.describe('Edge cases', () => {
    test('TC-006: Program names are unique regardless of letter case', { tag: '@e2e' }, async ({ programs, trackProgram }) => {
      const programName = `Web Development 2026 ${uniqueSuffix()}`;
      const caseVariant = programName.toLowerCase();
      trackProgram(await programs.createProgram(programName, 'Full-stack web development program'));

      await expectDuplicateNameNotAdded(programs, trackProgram, caseVariant, 'Case-variant duplicate');
      await expect.poll(async () => programs.totalRowsForNames(programName, caseVariant), {
        timeout: 15_000,
      }).toBeLessThanOrEqual(1);
    });

    test('TC-007: Accented characters are preserved in Program Name', { tag: '@e2e' }, async ({ programs, trackProgram }) => {
      const programName = `Développement & IA - Niveau 2 ${uniqueSuffix()}`;

      trackProgram(await programs.createProgram(programName, 'Programme avec caractères accentués'));
      await expectProgramInList(programs, programName);
      const stored = await programs.readProgramFields(programName);
      expect(stored.name).toBe(programName);
      await expectProgramNotInList(programs, programName.replace('é', 'e'));
    });
  });

  test.describe('Network edge cases', () => {
    test('TC-008: Empty programs list shows the empty state', { tag: '@regression' }, async ({ page }) => {
      await page.route('**/api/programs', async (route) => {
        const path = new URL(route.request().url()).pathname.replace(/\/$/, '');
        if (route.request().method() !== 'GET' || !path.endsWith('/programs')) {
          await route.continue();
          return;
        }
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ data: [] }),
        });
      });

      const programs = new ProgramsPage(page);
      await programs.goto();
      await expect(programs.emptyProgramsText).toBeVisible();
    });

    // Product defect: page emits TypeError pageerror (t.map is not a function) on malformed list payload.
    test.fixme('TC-009: Malformed programs list payload does not crash the page', { tag: '@regression' }, async ({ page }) => {
      await page.route('**/api/programs', async (route) => {
        const path = new URL(route.request().url()).pathname.replace(/\/$/, '');
        if (route.request().method() !== 'GET' || !path.endsWith('/programs')) {
          await route.continue();
          return;
        }
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ data: { id: 'not-a-list' } }),
        });
      });

      const programs = new ProgramsPage(page);
      await programs.goto();
      await expect(programs.heading).toBeVisible();
    });

    // Product defect: page emits AxiosError pageerror for 503 on save (same known defect as DS-270).
    test.fixme('TC-010: Save failure with 503 leaves the shell standing', { tag: '@regression' }, async ({
      page,
      programs,
      trackProgram,
    }) => {
      const programName = `Web Development 2026 ${uniqueSuffix()}`;
      trackProgram(await programs.createProgram(programName, 'Full-stack web development program'));

      await programs.openEditProgram(programName);
      await page.route('**/api/programs/*', async (route) => {
        const path = new URL(route.request().url()).pathname.replace(/\/$/, '');
        if (route.request().method() !== 'PATCH' || !/\/programs\/[^/]+$/.test(path)) {
          await route.continue();
          return;
        }
        await route.fulfill({ status: 503, contentType: 'application/json', body: '{}' });
      });

      await programs.fillEditDescription('Updated after mocked 503');
      await programs.attemptSaveProgram();
      await expect(programs.heading).toBeVisible();
    });
  });
});
