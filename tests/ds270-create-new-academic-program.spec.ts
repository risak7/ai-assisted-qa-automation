import { expect, test } from '../fixtures/cleanup.fixture';
import { ProgramsPage } from '../pages/ProgramsPage';
import { expectProgramInList, uniqueSuffix } from './helpers/didaxis-programs';

test.describe('DS-270: Create new academic program', () => {
  test.describe.configure({ mode: 'serial', timeout: 120_000 });

  test.describe('Positive flows', () => {
    test('TC-001: Navigate to program creation form', { tag: '@e2e' }, async ({ programs }) => {
      await programs.openNewProgramForm();

      await expect(programs.newProgramDialog).toBeVisible();
      await expect(programs.newProgramNameField).toBeVisible();
      await expect(programs.newProgramDescriptionField).toBeVisible();
      await expect(programs.newProgramCreateButton).toBeVisible();
    });

    test('TC-002: Successfully create a program', { tag: '@e2e' }, async ({ programs, trackProgram }) => {
      const programName = `Web Development 2026 ${uniqueSuffix()}`;
      const description = 'Full-stack web development program';

      trackProgram(await programs.createProgram(programName, description));
      await expect(programs.newProgramDialog).toBeHidden();
      await expectProgramInList(programs, programName);
    });

    test('TC-003: Create a program without a description', { tag: '@e2e' }, async ({ programs, trackProgram }) => {
      const programName = `Data Analytics 2026 ${uniqueSuffix()}`;

      await programs.openAndFillNewProgram(programName);
      await expect(programs.newProgramCreateButton).toBeEnabled();
      trackProgram(await programs.submitCreateProgram());
      await expect(programs.newProgramDialog).toBeHidden();
      await expectProgramInList(programs, programName);
    });
  });

  test.describe('Negative flows', () => {
    test('TC-004: Validation prevents empty program name', { tag: '@e2e' }, async ({ programs }) => {
      await programs.openNewProgramForm();

      await expect(programs.newProgramNameField).toHaveValue('');
      await expect(programs.newProgramCreateButton).toBeDisabled();
    });

    test('TC-005: Description alone does not allow program creation', { tag: '@e2e' }, async ({ programs }) => {
      await programs.openNewProgramForm();
      await programs.fillNewProgramDescription('Full-stack web development program');
      await expect(programs.newProgramCreateButton).toBeDisabled();
    });

    test('TC-006: Whitespace-only program name keeps Create disabled', { tag: '@e2e' }, async ({ programs }) => {
      await programs.openAndFillNewProgram('   ', 'Full-stack web development program');
      await expect(programs.newProgramCreateButton).toBeDisabled();
    });
  });

  test.describe('Edge cases', () => {
    test('TC-007: Special characters in Program Name are preserved', { tag: '@e2e' }, async ({
      programs,
      trackProgram,
    }) => {
      const programName = `C++ & .NET (Cohort #1) ${uniqueSuffix()}`;

      trackProgram(
        await programs.createProgram(programName, 'Systems programming with C++ and .NET'),
      );
      await expect(programs.newProgramDialog).toBeHidden();
      await expectProgramInList(programs, programName);
    });

    test('TC-008: Leading and trailing spaces are trimmed from Program Name', { tag: '@e2e' }, async ({
      programs,
      trackProgram,
    }) => {
      const suffix = uniqueSuffix();
      const trimmedName = `Cybersecurity 2026 ${suffix}`;
      const paddedName = `  ${trimmedName}  `;

      trackProgram(await programs.createProgram(paddedName, 'Defensive security program'));
      await expect(programs.newProgramDialog).toBeHidden();
      await expectProgramInList(programs, trimmedName);
    });
  });

  test.describe('Network edge cases', () => {
    test('TC-009: Empty programs list shows the empty state', { tag: '@regression' }, async ({ page }) => {
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

    // Product defect: app emits pageerror (TypeError: t.map is not a function) on malformed GET list; skipped until fixed.
    test.fixme(
      'TC-010: Malformed programs list payload does not crash the page',
      { tag: '@regression' },
      async ({ page }) => {
        const pageErrors: Error[] = [];
        page.on('pageerror', (error) => {
          pageErrors.push(error);
        });

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
        expect(pageErrors).toEqual([]);
      },
    );

    // Product defect: app emits pageerror (AxiosError: Request failed with status code 503) on PATCH save; skipped until fixed.
    test.fixme(
      'TC-011: Save failure with 503 leaves the edit dialog usable',
      { tag: '@regression' },
      async ({ page, programs, trackProgram }) => {
        const programName = `DS-270 503 edge ${uniqueSuffix()}`;
        const pageErrors: Error[] = [];
        page.on('pageerror', (error) => {
          pageErrors.push(error);
        });

        trackProgram(await programs.createProgram(programName, 'Program for save 503 edge case'));
        await programs.openEditProgram(programName);

        await page.route('**/api/programs/*', async (route) => {
          const path = new URL(route.request().url()).pathname.replace(/\/$/, '');
          if (route.request().method() !== 'PATCH' || !/\/programs\/[^/]+$/.test(path)) {
            await route.continue();
            return;
          }
          await route.fulfill({ status: 503, body: '' });
        });

        await programs.attemptSaveProgram();

        await expect(programs.heading).toBeVisible();
        expect(pageErrors).toEqual([]);
        await expect(programs.editDialog).toBeVisible();
        await expect(programs.editSaveButton).toBeVisible();
      },
    );
  });
});
