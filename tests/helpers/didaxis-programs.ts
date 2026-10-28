import { expect, test, type Page } from '@playwright/test';
import { LoginPage } from '../../pages/LoginPage';
import { emptyProgramsMessage, ProgramsPage } from '../../pages/ProgramsPage';

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

export { emptyProgramsMessage };

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

export function loginPage(page: Page): LoginPage {
  return new LoginPage(page);
}

export async function login(page: Page, email: string, password: string): Promise<void> {
  const login = loginPage(page);
  await login.signIn(email, password);
  await expect(page).toHaveURL((url) => !url.pathname.endsWith('/login'));
}

export async function loginAsAdmin(page: Page): Promise<void> {
  const { email, password } = requireAdminCredentials();
  await login(page, email, password);
}

export function programsPage(page: Page): ProgramsPage {
  return new ProgramsPage(page);
}

export async function gotoPrograms(page: Page): Promise<ProgramsPage> {
  const programs = programsPage(page);
  await programs.goto();
  await expect(page).toHaveURL(/\/programs\/?$/);
  await expect(programs.heading).toBeVisible({ timeout: 30_000 });
  await expect(programs.openNewProgramTrigger.or(programs.emptyProgramsText)).toBeVisible({
    timeout: 30_000,
  });
  return programs;
}

export async function expectProgramCount(programs: ProgramsPage, name: string, count: number): Promise<void> {
  await expect.poll(async () => programs.countProgramRowsNamed(name), { timeout: 15_000 }).toBe(count);
}

export async function expectProgramInList(programs: ProgramsPage, name: string): Promise<void> {
  await expectProgramCount(programs, name, 1);
  const row = programs.programRow(name);
  await row.scrollIntoViewIfNeeded();
  await expect(row).toBeVisible();
}

export async function expectProgramNotInList(programs: ProgramsPage, name: string): Promise<void> {
  await expect.poll(async () => programs.countProgramRowsNamed(name), { timeout: 15_000 }).toBe(0);
}

export async function waitForProgramCatalog(programs: ProgramsPage): Promise<void> {
  await expect(programs.programTable.or(programs.emptyProgramsText)).toBeVisible({ timeout: 30_000 });
}
