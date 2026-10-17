import type { Locator, Page, Response } from '@playwright/test';

function isCreateProgramPost(response: Response): boolean {
  const path = new URL(response.url()).pathname.replace(/\/$/, '');
  return response.request().method() === 'POST' && path.endsWith('/programs');
}

export class NewProgramModal {
  readonly dialog: Locator;
  readonly programNameField: Locator;
  readonly descriptionField: Locator;
  readonly createButton: Locator;

  static axeIncludeSelector(): string {
    return '[role="dialog"]';
  }

  constructor(private readonly page: Page) {
    this.dialog = page.getByRole('dialog', { name: 'New Program' });
    this.programNameField = this.dialog.getByLabel('Program Name');
    this.descriptionField = this.dialog.getByLabel('Description');
    this.createButton = this.dialog.getByRole('button', { name: 'Create' });
  }

  async fillProgramName(value: string): Promise<void> {
    await this.fillField(this.programNameField, value);
  }

  async fillDescription(value: string): Promise<void> {
    await this.fillField(this.descriptionField, value);
  }

  async clickCreate(): Promise<Response> {
    const [response] = await Promise.all([
      this.page.waitForResponse(isCreateProgramPost, { timeout: 30_000 }),
      this.createButton.click(),
    ]);
    return response;
  }

  private async fillField(field: Locator, value: string): Promise<void> {
    await field.scrollIntoViewIfNeeded();
    await field.click({ timeout: 15_000 });
    await field.fill(value, { timeout: 15_000 });
  }
}
