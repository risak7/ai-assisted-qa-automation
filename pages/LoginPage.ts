import type { Locator, Page, Response } from '@playwright/test';

const baseUrl = process.env.DIDAXIS_URL ?? 'https://test.didaxis.studio';

function isLoginPost(response: Response): boolean {
  return response.request().method() === 'POST' && new URL(response.url()).pathname.endsWith('/api/auth/login');
}

export class LoginPage {
  readonly page: Page;
  readonly emailField: Locator;
  readonly passwordField: Locator;
  readonly signInButton: Locator;
  readonly navigation: Locator;
  readonly programsNavButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.emailField = page.getByLabel('Email');
    this.passwordField = page.getByLabel('Password');
    this.signInButton = page.getByRole('button', { name: 'Sign In' });
    this.navigation = page.getByRole('navigation');
    this.programsNavButton = this.navigation.getByRole('button', { name: 'Programs' });
  }

  async goto(): Promise<void> {
    await this.page.goto(`${baseUrl}/login`, { waitUntil: 'domcontentloaded' });
  }

  async fillCredentials(email: string, password: string): Promise<void> {
    await this.emailField.fill(email);
    await this.passwordField.fill(password);
  }

  async clickSignIn(): Promise<void> {
    await this.signInButton.click();
  }

  async signIn(email: string, password: string): Promise<void> {
    await this.goto();
    await this.fillCredentials(email, password);
    await this.clickSignIn();
  }

  async signInAndWaitForApi(email: string, password: string): Promise<Response> {
    const loginResponse = this.page.waitForResponse(isLoginPost, { timeout: 30_000 });
    await this.fillCredentials(email, password);
    await this.clickSignIn();
    return loginResponse;
  }

  async openProgramsFromNavigation(): Promise<void> {
    await this.programsNavButton.click();
    await this.page.waitForURL('**/programs');
  }
}
