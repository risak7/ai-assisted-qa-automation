import { expect, test } from '@playwright/test';
import {
  confirmDelete,
  createProgram,
  deleteConfirmMessage,
  dismissDeleteDialog,
  emptyProgramsMessage,
  expectProgramInList,
  expectProgramNotInList,
  gotoPrograms,
  login,
  loginAsAdmin,
  openNewProgramModal,
  programNameField,
  programRowByName,
  programRowByNameAndDescription,
  programRowCount,
  readProgramFields,
  skipWithoutAdminCredentials,
  submitCreateProgram,
  textOfLength,
  uniqueSuffix,
  descriptionField,
} from '../tests/helpers/didaxis-programs';

test.describe('DS-4: Delete program with confirmation', () => {
  test.describe.configure({ mode: 'serial', timeout: 120_000 });

test.describe('Positive flows', () => {
  test.beforeEach(async ({ page }) => {
    skipWithoutAdminCredentials();
    await loginAsAdmin(page);
    await gotoPrograms(page);
  });

  test('TC-001: The confirmation names the program and does not remove it yet', async ({ page }) => {
    const suffix = uniqueSuffix();
    const programName = `Test Program ${suffix}`;
    const otherName = `Web Development 2026 ${suffix}`;
    await createProgram(page, programName, 'Temporary program used for deletion checks');
    await createProgram(page, otherName, 'Full-stack web development program');

    const message = await dismissDeleteDialog(page, programName);

    expect(message).toBe(deleteConfirmMessage(programName));
    await expectProgramInList(page, programName);
    await expectProgramInList(page, otherName);
  });

  test('TC-002: Confirming deletion removes the program from the list', async ({ page }) => {
    const programName = `Test Program ${uniqueSuffix()}`;
    await createProgram(page, programName, 'Temporary program used for deletion checks');

    await confirmDelete(page, programName);

    await expectProgramNotInList(page, programName);
  });

  test('TC-003: Cancelling the dialog leaves the program in the list', async ({ page }) => {
    const programName = `Test Program ${uniqueSuffix()}`;
    const description = 'Temporary program used for deletion checks';
    await createProgram(page, programName, description);

    await dismissDeleteDialog(page, programName);

    await expectProgramInList(page, programName);
    const stored = await readProgramFields(page, programName);
    expect(stored.description).toBe(description);
  });

  test('TC-004: Deleting one program leaves the other program in the list', async ({ page }) => {
    const suffix = uniqueSuffix();
    const programName = `Test Program ${suffix}`;
    const otherName = `Web Development 2026 ${suffix}`;
    const otherDescription = 'Full-stack web development program';
    await createProgram(page, programName, 'Temporary program used for deletion checks');
    await createProgram(page, otherName, otherDescription);

    await confirmDelete(page, programName);

    await expectProgramNotInList(page, programName);
    await expectProgramInList(page, otherName);
    const stored = await readProgramFields(page, otherName);
    expect(stored.description).toBe(otherDescription);
  });
});

test.describe('Negative flows', () => {
  test.beforeEach(async ({ page }) => {
    skipWithoutAdminCredentials();
    await loginAsAdmin(page);
    await gotoPrograms(page);
  });

  test('TC-005: The delete icon alone does not remove the program', async ({ page }) => {
    const programName = `Test Program ${uniqueSuffix()}`;
    await createProgram(page, programName, 'Temporary program used for deletion checks');

    await dismissDeleteDialog(page, programName);

    await expectProgramInList(page, programName);
  });

  test('TC-006: Dismissing the confirmation keeps the program', async ({ page }) => {
    const programName = `Test Program ${uniqueSuffix()}`;
    await createProgram(page, programName, 'Temporary program used for deletion checks');

    await dismissDeleteDialog(page, programName);
    await expectProgramInList(page, programName);

    await dismissDeleteDialog(page, programName);
    await expectProgramInList(page, programName);
  });

  test('TC-008: Cancelling one program does not remove another', async ({ page }) => {
    const suffix = uniqueSuffix();
    const programName = `Test Program ${suffix}`;
    const otherName = `Web Development 2026 ${suffix}`;
    await createProgram(page, programName, 'Temporary program used for deletion checks');
    await createProgram(page, otherName, 'Full-stack web development program');

    await dismissDeleteDialog(page, otherName);

    await expectProgramInList(page, otherName);
    await expectProgramInList(page, programName);
  });

  test('TC-009: A confirmed delete is still gone after refresh', async ({ page }) => {
    const suffix = uniqueSuffix();
    const programName = `Test Program ${suffix}`;
    const otherName = `Web Development 2026 ${suffix}`;
    await createProgram(page, programName, 'Temporary program used for deletion checks');
    await createProgram(page, otherName, 'Full-stack web development program');

    await confirmDelete(page, programName);
    await gotoPrograms(page);

    await expectProgramNotInList(page, programName);
    await expectProgramInList(page, otherName);
  });
});

test.describe('Non-admin access', () => {
  test('TC-007: A non-admin cannot delete a program', async ({ page }) => {
    const email = process.env.DIDAXIS_NON_ADMIN_EMAIL;
    const password = process.env.DIDAXIS_NON_ADMIN_PASSWORD;
    if (!email || !password) {
      test.skip(true, 'Set DIDAXIS_NON_ADMIN_EMAIL and DIDAXIS_NON_ADMIN_PASSWORD for TC-007');
      return;
    }

    const programName = `Test Program ${uniqueSuffix()}`;
    await loginAsAdmin(page);
    await gotoPrograms(page);
    await createProgram(page, programName, 'Temporary program used for deletion checks');

    await login(page, email, password);
    await gotoPrograms(page);

    const row = programRowByName(page, programName).first();
    await row.scrollIntoViewIfNeeded();
    await expect(row.getByRole('button', { name: `Delete ${programName}`, exact: true })).toHaveCount(0);
    await expectProgramInList(page, programName);
  });
});

test.describe('Edge cases', () => {
  test.beforeEach(async ({ page }) => {
    skipWithoutAdminCredentials();
    await loginAsAdmin(page);
    await gotoPrograms(page);
  });

  test('TC-010: The dialog names a special-character program and only that program is removed', async ({ page }) => {
    const suffix = uniqueSuffix();
    const programName = `Informatique & IA - Niveau 2 ${suffix}`;
    const otherName = `Test Program ${suffix}`;
    await createProgram(page, programName, "Programme d'informatique et d'intelligence artificielle, niveau 2");
    await createProgram(page, otherName, 'Temporary program used for deletion checks');

    const message = await confirmDelete(page, programName);

    expect(message).toContain('Informatique & IA - Niveau 2');
    await expectProgramNotInList(page, programName);
    await expectProgramInList(page, otherName);
  });

  test('TC-011: Cancelling deletion of a special-character name keeps that exact name', async ({ page }) => {
    const programName = `Informatique & IA - Niveau 2 ${uniqueSuffix()}`;
    await createProgram(page, programName, "Programme d'informatique et d'intelligence artificielle, niveau 2");

    await dismissDeleteDialog(page, programName);

    await expectProgramInList(page, programName);
  });

  test('TC-012: A short program name can be deleted after confirmation', async ({ page }) => {
    const suffix = uniqueSuffix();
    const programName = `A${suffix}`;
    const otherName = `Test Program ${suffix}`;
    await createProgram(page, programName, 'Single-letter program name');
    await createProgram(page, otherName, 'Temporary program used for deletion checks');

    const message = await confirmDelete(page, programName);

    expect(message).toContain(programName);
    await expectProgramNotInList(page, programName);
    await expectProgramInList(page, otherName);
  });

  test('TC-013: A 255-character Program Name is shown in the dialog and removed', async ({ page }) => {
    const suffix = uniqueSuffix();
    const programName = textOfLength(255, `Test Program ${suffix} `);
    const otherName = `Web Development 2026 ${suffix}`;
    await createProgram(page, programName, 'Boundary length program name');
    await createProgram(page, otherName, 'Full-stack web development program');

    const message = await confirmDelete(page, programName);

    expect(message).toContain(programName);
    await expectProgramNotInList(page, programName);
    await expectProgramInList(page, otherName);
  });

  test('TC-014: Deleting the only program leaves the list empty', async ({ page }) => {
    const existing = await programRowCount(page);
    test.skip(
      existing > 0,
      'Skipped: the shared Programs catalog is not empty, and clearing it would delete every program.',
    );

    const programName = `Test Program ${uniqueSuffix()}`;
    await createProgram(page, programName, 'Temporary program used for deletion checks');
    await confirmDelete(page, programName);

    await expect(page.getByText(emptyProgramsMessage)).toBeVisible();
    await expect(programRowByName(page, programName)).toHaveCount(0);
  });

  test('TC-015: Only the chosen row is removed when two programs share a name', async ({ page }) => {
    const programName = `Test Program ${uniqueSuffix()}`;
    const morning = 'Morning cohort';
    const evening = 'Evening cohort';
    await createProgram(page, programName, morning);
    await openNewProgramModal(page);
    await programNameField(page).fill(programName);
    await descriptionField(page).fill(evening);
    await submitCreateProgram(page);
    await expect(programRowByNameAndDescription(page, programName, evening)).toHaveCount(1);

    await confirmDelete(page, programName, evening);

    await expect(programRowByNameAndDescription(page, programName, evening)).toHaveCount(0);
    await expect(programRowByNameAndDescription(page, programName, morning)).toHaveCount(1);
  });

  test('TC-016: Markup in the program name is shown as text in the dialog', async ({ page }) => {
    const suffix = uniqueSuffix();
    const programName = `<script>alert("xss")</script> ${suffix}`;
    const otherName = `Test Program ${suffix}`;
    let alertSeen = false;
    const trackAlerts = async (dialog: { type: () => string; dismiss: () => Promise<void> }) => {
      if (dialog.type() === 'alert') {
        alertSeen = true;
        await dialog.dismiss();
      }
    };
    page.on('dialog', trackAlerts);
    await createProgram(page, programName, 'Markup should be plain text');
    await createProgram(page, otherName, 'Temporary program used for deletion checks');
    page.off('dialog', trackAlerts);

    const message = await confirmDelete(page, programName);

    expect(message).toContain(programName);
    expect(alertSeen).toBe(false);
    await expectProgramNotInList(page, programName);
    await expectProgramInList(page, otherName);
  });

  test('TC-017: Cancel, then a later confirm, removes the program', async ({ page }) => {
    const programName = `Test Program ${uniqueSuffix()}`;
    await createProgram(page, programName, 'Temporary program used for deletion checks');

    await dismissDeleteDialog(page, programName);
    await expectProgramInList(page, programName);

    await confirmDelete(page, programName);
    await expectProgramNotInList(page, programName);
  });

  test('TC-018: A whitespace-padded name is stored trimmed, then that program can be deleted', async ({ page }) => {
    const suffix = uniqueSuffix();
    const trimmedName = `Test Program ${suffix}`;
    const otherName = `Web Development 2026 ${suffix}`;
    await createProgram(page, otherName, 'Full-stack web development program');

    await openNewProgramModal(page);
    await programNameField(page).fill(`  ${trimmedName}  `);
    await descriptionField(page).fill('Padded name');
    await submitCreateProgram(page);

    await expectProgramInList(page, trimmedName);
    const stored = await readProgramFields(page, trimmedName);
    expect(stored.name).toBe(trimmedName);

    await confirmDelete(page, trimmedName);
    await expectProgramNotInList(page, trimmedName);
    await expectProgramInList(page, otherName);
  });
});
});
