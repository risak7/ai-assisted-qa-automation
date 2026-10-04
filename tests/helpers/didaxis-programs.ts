import { expect, test, type Locator, type Page, type Response } from '@playwright/test';

const baseUrl = process.env.DIDAXIS_URL ?? 'https://test.didaxis.studio';

let sequence = 0;

export function uniqueSuffix(): string {
  sequence += 1;
  return `${Date.now()}-${sequence}`;
}

export function textOfLength(length: number, prefix: string): string {
  if (prefix.length >= length) {
    return prefix.slice(0, length);
  }
  return `${prefix}${'x'.repeat(length - prefix.length)}`;
}

export function description1000(prefix: string): string {
  return textOfLength(1000, prefix);
}

export function deleteConfirmMessage(name: string): string {
  return `Delete program "${name}"? All its semesters and courses will be removed. This cannot be undone.`;
}

export const emptyProgramsMessage = 'No programs yet. Create your first program to get started.';

export function skipWithoutAdminCredentials(): void {
  const missing = !process.env.DIDAXIS_EMAIL || !process.env.DIDAXIS_PASSWORD;
  test.skip(missing, 'Set DIDAXIS_EMAIL and DIDAXIS_PASSWORD in .env at the project root (see .env.example).');
}

function requireAdminCredentials(): { email: string; password: string } {
  const email = process.env.DIDAXIS_EMAIL;
  const password = process.env.DIDAXIS_PASSWORD;
  if (!email || !password) {
    throw new Error('Set DIDAXIS_EMAIL and DIDAXIS_PASSWORD in .env at the project root');
  }
  return { email, password };
}

export async function login(page: Page, email: string, password: string): Promise<void> {
  await page.goto(`${baseUrl}/login`);
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Password').fill(password);
  await page.getByRole('button', { name: 'Sign In' }).click();
  await expect(page).toHaveURL((url) => !url.pathname.endsWith('/login'));
}

export async function loginAsAdmin(page: Page): Promise<void> {
  const { email, password } = requireAdminCredentials();
  await login(page, email, password);
}

export async function gotoPrograms(page: Page): Promise<void> {
  await page.goto(`${baseUrl}/programs`);
  await expect(page).toHaveURL(/\/programs\/?$/);
  await expect(page.getByRole('heading', { name: 'Programs', level: 2 })).toBeVisible();
  // Firefox often exposes the header action before the Mantine table is in the accessibility tree.
  await expect(
    page.getByRole('button', { name: '+ New Program' })
      .or(page.getByRole('button', { name: 'Create Program' }))
      .or(page.getByText(emptyProgramsMessage)),
  ).toBeVisible({ timeout: 30_000 });
}

export function newProgramButton(page: Page): Locator {
  return page.getByRole('button', { name: '+ New Program' });
}

export function openNewProgramTrigger(page: Page): Locator {
  return newProgramButton(page).or(page.getByRole('button', { name: 'Create Program' }));
}

export function createProgramModal(page: Page): Locator {
  return page.getByRole('dialog', { name: 'New Program' });
}

export function editProgramModal(page: Page): Locator {
  return page.getByRole('dialog', { name: 'Edit Program' });
}

export async function openNewProgramModal(page: Page): Promise<void> {
  await expect(openNewProgramTrigger(page)).toBeVisible({ timeout: 15_000 });
  await openNewProgramTrigger(page).click();
  await expect(createProgramModal(page)).toBeVisible({ timeout: 15_000 });
}

export function programNameField(page: Page): Locator {
  return createProgramModal(page).getByLabel('Program Name');
}

export function descriptionField(page: Page): Locator {
  return createProgramModal(page).getByLabel('Description');
}

export function createButton(page: Page): Locator {
  return createProgramModal(page).getByRole('button', { name: 'Create' });
}

export function editNameField(page: Page): Locator {
  return editProgramModal(page).getByLabel('Program Name');
}

export function editDescriptionField(page: Page): Locator {
  return editProgramModal(page).getByLabel('Description');
}

export function editLabeledField(page: Page, label: string): Locator {
  return editProgramModal(page).getByLabel(label, { exact: true });
}

export function saveButton(page: Page): Locator {
  return editProgramModal(page).getByRole('button', { name: 'Save' });
}

export function programListTable(page: Page): Locator {
  return page.getByRole('table');
}

export function programRowByName(page: Page, name: string): Locator {
  return programListTable(page).locator('tbody tr', {
    has: page.locator('td').getByText(name, { exact: true }),
  });
}

export function programRowByNameAndDescription(page: Page, name: string, description: string): Locator {
  return programRowByName(page, name).filter({
    has: page.locator('td').getByText(description, { exact: true }),
  });
}

export async function countProgramRowsNamed(page: Page, name: string): Promise<number> {
  return programRowByName(page, name).count();
}

export async function waitForProgramCatalog(page: Page): Promise<void> {
  await expect(
    programListTable(page).or(page.getByText(emptyProgramsMessage, { exact: true })),
  ).toBeVisible({ timeout: 30_000 });
}

export async function programRowCount(page: Page): Promise<number> {
  await waitForProgramCatalog(page);
  if ((await programListTable(page).count()) === 0) {
    return 0;
  }
  return programListTable(page).locator('tbody tr').count();
}

function programsCollectionPath(response: Response): string {
  return new URL(response.url()).pathname.replace(/\/$/, '');
}

function isCreateProgramPost(response: Response): boolean {
  return response.request().method() === 'POST' && programsCollectionPath(response).endsWith('/programs');
}

function isProgramsListGet(response: Response): boolean {
  return response.request().method() === 'GET' && response.ok() && programsCollectionPath(response).endsWith('/programs');
}

function isUpdateProgramPatch(response: Response): boolean {
  return response.request().method() === 'PATCH' && /\/programs\/[^/]+$/.test(programsCollectionPath(response));
}

function isDeleteProgram(response: Response): boolean {
  return response.request().method() === 'DELETE' && /\/programs\/[^/]+$/.test(programsCollectionPath(response));
}

export async function clickCreateProgram(page: Page): Promise<Response> {
  const [response] = await Promise.all([
    page.waitForResponse(isCreateProgramPost, { timeout: 30_000 }),
    createButton(page).click(),
  ]);
  return response;
}

export async function submitCreateProgram(page: Page): Promise<void> {
  const response = await clickCreateProgram(page);
  expect(response.ok()).toBeTruthy();
  await expect(createProgramModal(page)).toBeHidden({ timeout: 15_000 });
  await page.waitForResponse(isProgramsListGet, { timeout: 15_000 }).catch(() => undefined);
}

export async function expectProgramCount(page: Page, name: string, count: number): Promise<void> {
  await expect.poll(async () => countProgramRowsNamed(page, name), { timeout: 15_000 }).toBe(count);
}

export async function expectProgramInList(page: Page, name: string): Promise<void> {
  await expectProgramCount(page, name, 1);
  const row = programRowByName(page, name).first();
  await row.scrollIntoViewIfNeeded();
  await expect(row).toBeVisible();
}

export async function expectProgramNotInList(page: Page, name: string): Promise<void> {
  await expect.poll(async () => countProgramRowsNamed(page, name), { timeout: 15_000 }).toBe(0);
}

export async function createProgram(page: Page, name: string, description = ''): Promise<void> {
  await openNewProgramModal(page);
  await programNameField(page).fill(name);
  if (description.length > 0) {
    await descriptionField(page).fill(description);
  }
  await submitCreateProgram(page);
  await expectProgramInList(page, name);
}

export async function openEditProgram(page: Page, name: string, description?: string): Promise<void> {
  const row = description === undefined
    ? programRowByName(page, name).first()
    : programRowByNameAndDescription(page, name, description).first();
  await row.scrollIntoViewIfNeeded();
  await row.getByRole('button', { name: `Edit ${name}`, exact: true }).click();
  await expect(editProgramModal(page)).toBeVisible({ timeout: 15_000 });
}

export async function closeEditWithoutSaving(page: Page): Promise<void> {
  await editProgramModal(page).getByRole('button', { name: 'Cancel' }).click();
  await expect(editProgramModal(page)).toBeHidden({ timeout: 15_000 });
}

export async function submitSaveProgram(page: Page): Promise<void> {
  const [response] = await Promise.all([
    page.waitForResponse(isUpdateProgramPatch, { timeout: 30_000 }),
    saveButton(page).click(),
  ]);
  expect(response.ok()).toBeTruthy();
  await expect(editProgramModal(page)).toBeHidden({ timeout: 15_000 });
  await page.waitForResponse(isProgramsListGet, { timeout: 15_000 }).catch(() => undefined);
}

export async function readProgramFields(
  page: Page,
  name: string,
  description?: string,
): Promise<{ name: string; description: string }> {
  await openEditProgram(page, name, description);
  const storedName = await editNameField(page).inputValue();
  const storedDescription = await editDescriptionField(page).inputValue();
  await closeEditWithoutSaving(page);
  return { name: storedName, description: storedDescription };
}

export async function listedDescription(page: Page, name: string): Promise<string> {
  const row = programRowByName(page, name).first();
  await row.scrollIntoViewIfNeeded();
  const description = row.locator('td').first().locator('p').nth(1);
  if ((await description.count()) === 0) {
    return '';
  }
  return description.innerText();
}

function rowFor(page: Page, name: string, description?: string): Locator {
  return description === undefined
    ? programRowByName(page, name).first()
    : programRowByNameAndDescription(page, name, description).first();
}

async function readConfirmDialog(page: Page, accept: boolean): Promise<string> {
  return new Promise<string>((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error('Delete confirmation did not appear')), 15_000);
    page.once('dialog', async (dialog) => {
      clearTimeout(timeout);
      const message = dialog.message();
      if (dialog.type() === 'alert') {
        await dialog.dismiss();
        reject(new Error(`Unexpected alert: ${message}`));
        return;
      }
      if (accept) {
        await dialog.accept();
      } else {
        await dialog.dismiss();
      }
      resolve(message);
    });
  });
}

export async function dismissDeleteDialog(page: Page, name: string, description?: string): Promise<string> {
  const row = rowFor(page, name, description);
  await row.scrollIntoViewIfNeeded();
  const messagePromise = readConfirmDialog(page, false);
  await row.getByRole('button', { name: `Delete ${name}`, exact: true }).click();
  const message = await messagePromise;
  expect(message).toBe(deleteConfirmMessage(name));
  return message;
}

export async function confirmDelete(page: Page, name: string, description?: string): Promise<string> {
  const row = rowFor(page, name, description);
  await row.scrollIntoViewIfNeeded();
  const before = await countProgramRowsNamed(page, name);
  const messagePromise = readConfirmDialog(page, true);
  const [response, message] = await Promise.all([
    page.waitForResponse(isDeleteProgram, { timeout: 30_000 }),
    messagePromise,
    row.getByRole('button', { name: `Delete ${name}`, exact: true }).click(),
  ]);
  expect(response.ok()).toBeTruthy();
  expect(message).toBe(deleteConfirmMessage(name));
  await page.waitForResponse(isProgramsListGet, { timeout: 15_000 }).catch(() => undefined);
  await expectProgramCount(page, name, before - 1);
  return message;
}
