import '../load-env';
import { expect, test } from '@playwright/test';
import {
  clickCreateProgram,
  countProgramRowsNamed,
  createButton,
  createProgramModal,
  description1000,
  descriptionField,
  gotoPrograms,
  login,
  loginAsAdmin,
  newProgramButton,
  openNewProgramModal,
  programNameField,
  programRowByName,
  skipWithoutAdminCredentials,
  submitCreateProgram,
  expectProgramInList,
  expectProgramNotInList,
  textOfLength,
  uniqueSuffix,
} from './helpers/didaxis-programs';

test.describe.configure({ mode: 'serial', timeout: 120_000 });

test.describe('Positive flows', () => {
  test.beforeEach(async ({ page }) => {
    skipWithoutAdminCredentials();
    await loginAsAdmin(page);
  });

  test('TC-001: Program creation form shows Program Name and Description', async ({ page }) => {
    await gotoPrograms(page);
    await openNewProgramModal(page);

    await expect(programNameField(page)).toBeVisible();
    await expect(descriptionField(page)).toBeVisible();
    await expect(createButton(page)).toBeVisible();
  });

  test('TC-002: A completed program is added to the list and the modal closes', async ({ page }) => {
    const programName = `Web Development 2026 ${uniqueSuffix()}`;
    const description = 'Full-stack web development program';

    await gotoPrograms(page);
    await openNewProgramModal(page);
    await programNameField(page).fill(programName);
    await descriptionField(page).fill(description);
    await submitCreateProgram(page);
    await expectProgramInList(page, programName);
  });

  test('TC-003: Program is created when Program Name is filled and Description is left empty', async ({ page }) => {
    const programName = `Data Analytics 2026 ${uniqueSuffix()}`;

    await gotoPrograms(page);
    await openNewProgramModal(page);
    await programNameField(page).fill(programName);
    await expect(createButton(page)).toBeEnabled();
    await submitCreateProgram(page);
    await expectProgramInList(page, programName);
  });
});

test.describe('Negative flows', () => {
  test.beforeEach(async ({ page }) => {
    skipWithoutAdminCredentials();
    await loginAsAdmin(page);
  });

  test('TC-004: Create stays disabled when Program Name is empty', async ({ page }) => {
    await gotoPrograms(page);
    await openNewProgramModal(page);

    await expect(programNameField(page)).toHaveValue('');
    await expect(descriptionField(page)).toHaveValue('');
    await expect(createButton(page)).toBeDisabled();
  });

  test('TC-005: Filling only Description does not enable Create', async ({ page }) => {
    await gotoPrograms(page);
    await openNewProgramModal(page);

    await descriptionField(page).fill('Full-stack web development program');
    await expect(createButton(page)).toBeDisabled();
  });

  test('TC-006: A whitespace-only Program Name does not create a program', async ({ page }) => {
    await gotoPrograms(page);
    await openNewProgramModal(page);

    await programNameField(page).fill('   ');
    await descriptionField(page).fill('Full-stack web development program');
    await expect(createButton(page)).toBeDisabled();
  });

  test('TC-007: A duplicate Program Name is not added a second time', async ({ page }) => {
    const programName = `Web Development 2026 ${uniqueSuffix()}`;

    await gotoPrograms(page);
    await openNewProgramModal(page);
    await programNameField(page).fill(programName);
    await descriptionField(page).fill('Full-stack web development program');
    await submitCreateProgram(page);
    await expectProgramInList(page, programName);

    await openNewProgramModal(page);
    await programNameField(page).fill(programName);
    await descriptionField(page).fill('Another full-stack cohort');
    await clickCreateProgram(page);

    await expect.poll(async () => countProgramRowsNamed(page, programName), { timeout: 15_000 }).toBeLessThanOrEqual(1);

    const rowCount = await countProgramRowsNamed(page, programName);
    const modalStillOpen = await createProgramModal(page).isVisible();
    const duplicateMessage = page.getByText(/already exists/i);
    if (rowCount === 1) {
      expect(modalStillOpen || (await duplicateMessage.isVisible())).toBeTruthy();
    }
  });
});

test.describe('Non-admin access', () => {
  test('TC-008: A user who is not an admin cannot open the creation form', async ({ page }) => {
    const email = process.env.DIDAXIS_NON_ADMIN_EMAIL;
    const password = process.env.DIDAXIS_NON_ADMIN_PASSWORD;
    test.skip(!email || !password, 'Set DIDAXIS_NON_ADMIN_EMAIL and DIDAXIS_NON_ADMIN_PASSWORD for TC-008');

    await login(page, email!, password!);
    await gotoPrograms(page);

    await expect(newProgramButton(page)).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'Create Program' })).toHaveCount(0);
    await expect(createProgramModal(page)).toBeHidden();
  });
});

test.describe('Edge cases', () => {
  test.beforeEach(async ({ page }) => {
    skipWithoutAdminCredentials();
    await loginAsAdmin(page);
  });

  test('TC-009: A one-character Program Name is accepted', async ({ page }) => {
    const programName = `A${uniqueSuffix()}`;

    await gotoPrograms(page);
    await openNewProgramModal(page);
    await programNameField(page).fill(programName);
    await descriptionField(page).fill('Single-letter program name');
    await submitCreateProgram(page);
    await expectProgramInList(page, programName);
  });

  test('TC-010: Program Name with special characters is stored and shown as entered', async ({ page }) => {
    const programName = `C++ & .NET (Cohort #1) ${uniqueSuffix()}`;

    await gotoPrograms(page);
    await openNewProgramModal(page);
    await programNameField(page).fill(programName);
    await descriptionField(page).fill('Systems programming with C++ and .NET');
    await submitCreateProgram(page);
    await expectProgramInList(page, programName);
  });

  test('TC-011: Leading and trailing spaces in Program Name are trimmed before save', async ({ page }) => {
    const suffix = uniqueSuffix();
    const trimmedName = `Cybersecurity 2026 ${suffix}`;
    const paddedName = `  ${trimmedName}  `;

    await gotoPrograms(page);
    await openNewProgramModal(page);
    await programNameField(page).fill(paddedName);
    await descriptionField(page).fill('Defensive security program');
    await submitCreateProgram(page);
    await expectProgramInList(page, trimmedName);
  });

  test('TC-012: A 255-character Program Name is accepted', async ({ page }) => {
    const programName = textOfLength(255, `Web Development 2026 ${uniqueSuffix()} `);

    await gotoPrograms(page);
    await openNewProgramModal(page);
    await programNameField(page).fill(programName);
    await descriptionField(page).fill('Boundary length name');
    await expect(createButton(page)).toBeEnabled();
    await submitCreateProgram(page);
    await expectProgramInList(page, programName);
  });

  test('TC-013: A 256-character Program Name is rejected', async ({ page }) => {
    const programName = textOfLength(256, `Web Development 2026 ${uniqueSuffix()} `);

    await gotoPrograms(page);
    await openNewProgramModal(page);
    await programNameField(page).fill(programName);
    await descriptionField(page).fill('Over max length name');

    const createDisabled = await createButton(page).isDisabled();
    const maxLengthMessage = page.getByText(/maximum length|too long|255/i);
    const hasMaxLengthMessage = await maxLengthMessage.isVisible().catch(() => false);

    if (createDisabled || hasMaxLengthMessage) {
      await expect(createButton(page)).toBeDisabled();
      return;
    }

    await clickCreateProgram(page);
    await expectProgramNotInList(page, programName);
  });

  test('TC-014: A Program Name that differs only by letter case is treated as a duplicate', async ({ page }) => {
    const suffix = uniqueSuffix();
    const canonicalName = `Web Development 2026 ${suffix}`;
    const variantName = canonicalName.toLowerCase();

    await gotoPrograms(page);
    await openNewProgramModal(page);
    await programNameField(page).fill(canonicalName);
    await descriptionField(page).fill('Original cohort');
    await submitCreateProgram(page);
    await expectProgramInList(page, canonicalName);

    await openNewProgramModal(page);
    await programNameField(page).fill(variantName);
    await descriptionField(page).fill('Case-variant duplicate');
    await clickCreateProgram(page);

    await expect.poll(async () => {
      const canonical = await countProgramRowsNamed(page, canonicalName);
      const variant = await countProgramRowsNamed(page, variantName);
      return canonical + variant;
    }, { timeout: 15_000 }).toBeLessThanOrEqual(1);
  });

  test('TC-015: Markup entered in Program Name is shown as text', async ({ page }) => {
    const programName = `<script>alert("xss")</script> ${uniqueSuffix()}`;
    let dialogSeen = false;
    page.on('dialog', async (dialog) => {
      dialogSeen = true;
      await dialog.dismiss();
    });

    await gotoPrograms(page);
    await openNewProgramModal(page);
    await programNameField(page).fill(programName);
    await descriptionField(page).fill('Markup should be plain text');
    await submitCreateProgram(page);
    await expectProgramInList(page, programName);
    expect(dialogSeen).toBe(false);
  });

  test('TC-016: A long Description is saved with the program', async ({ page }) => {
    const programName = `Cloud Engineering 2026 ${uniqueSuffix()}`;
    const description = description1000('Full-stack web development program');

    await gotoPrograms(page);
    await openNewProgramModal(page);
    await programNameField(page).fill(programName);
    await descriptionField(page).fill(description);
    await submitCreateProgram(page);
    await expectProgramInList(page, programName);
    const row = programRowByName(page, programName).first();
    await row.scrollIntoViewIfNeeded();
    await expect(row.getByText(description.slice(0, 80))).toBeVisible();
  });
});
