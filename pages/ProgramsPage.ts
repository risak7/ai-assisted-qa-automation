import type { Locator, Page, Response } from '@playwright/test';
import { NewProgramModal } from './NewProgramModal';

const baseUrl = process.env.DIDAXIS_URL ?? 'https://test.didaxis.studio';

export const emptyProgramsMessage = 'No programs yet. Create your first program to get started.';

function programsCollectionPath(response: Response): string {
  return new URL(response.url()).pathname.replace(/\/$/, '');
}

function isProgramsListGet(response: Response): boolean {
  return response.request().method() === 'GET' && response.ok() && programsCollectionPath(response).endsWith('/programs');
}

function isUpdateProgramPatch(response: Response): boolean {
  return response.request().method() === 'PATCH' && /\/programs\/[^/]+$/.test(programsCollectionPath(response));
}

function isCreateProgramPost(response: Response): boolean {
  return response.request().method() === 'POST' && programsCollectionPath(response).endsWith('/programs');
}

function isProgramWrite(response: Response): boolean {
  return isUpdateProgramPatch(response) || isCreateProgramPost(response);
}

function isDeleteProgram(response: Response): boolean {
  return response.request().method() === 'DELETE' && /\/programs\/[^/]+$/.test(programsCollectionPath(response));
}

export class ProgramsPage {
  readonly page: Page;
  readonly heading: Locator;
  readonly newProgramButton: Locator;
  readonly createProgramButton: Locator;
  readonly openNewProgramTrigger: Locator;
  readonly emptyProgramsText: Locator;
  readonly programTable: Locator;
  readonly newProgramModal: NewProgramModal;
  readonly newProgramNameField: Locator;
  readonly newProgramDescriptionField: Locator;
  readonly newProgramCreateButton: Locator;
  readonly newProgramDialog: Locator;
  readonly editDialog: Locator;
  readonly editProgramNameField: Locator;
  readonly editDescriptionField: Locator;
  readonly editSaveButton: Locator;
  readonly editCancelButton: Locator;
  readonly editSyncAsyncRatio: Locator;
  readonly editNameTakenMessage: Locator;
  readonly editMaxLengthMessage: Locator;
  readonly duplicateNameMessage: Locator;
  readonly maxLengthValidationMessage: Locator;
  readonly searchBox: Locator;

  /** Edit Program dialog only. The programs table behind it is out of scope. */
  static editDialogAxeIncludeSelector(): string {
    return '[role="dialog"]';
  }

  constructor(page: Page) {
    this.page = page;
    this.heading = page.getByRole('heading', { name: 'Programs', level: 2 });
    this.newProgramButton = page.getByRole('button', { name: '+ New Program' });
    this.createProgramButton = page.getByRole('button', { name: 'Create Program' });
    this.openNewProgramTrigger = this.newProgramButton.or(this.createProgramButton);
    this.emptyProgramsText = page.getByText(emptyProgramsMessage, { exact: true });
    this.programTable = page.getByRole('table');
    this.newProgramModal = new NewProgramModal(page);
    this.newProgramDialog = this.newProgramModal.dialog;
    this.newProgramNameField = this.newProgramModal.programNameField;
    this.newProgramDescriptionField = this.newProgramModal.descriptionField;
    this.newProgramCreateButton = this.newProgramModal.createButton;
    this.editDialog = page.getByRole('dialog', { name: 'Edit Program' });
    this.editProgramNameField = this.editDialog.getByLabel('Program Name');
    this.editDescriptionField = this.editDialog.getByLabel('Description');
    this.editSaveButton = this.editDialog.getByRole('button', { name: 'Save' });
    this.editCancelButton = this.editDialog.getByRole('button', { name: 'Cancel' });
    this.editSyncAsyncRatio = this.editDialog.getByText(/Sync\/Async Ratio:/);
    this.editNameTakenMessage = this.editDialog
      .getByText(/already exists/i)
      .or(page.getByRole('alert').filter({ hasText: /already exists/i }))
      .or(page.getByRole('status').filter({ hasText: /already exists/i }));
    this.editMaxLengthMessage = this.editDialog
      .getByText(/maximum length|too long|exceeds|255 character/i)
      .or(page.getByRole('alert').filter({ hasText: /maximum length|too long|exceeds|255/i }))
      .or(page.getByRole('status').filter({ hasText: /maximum length|too long|exceeds|255/i }));
    this.duplicateNameMessage = page.getByText(/already exists/i);
    this.maxLengthValidationMessage = page.getByText(/maximum length|too long|255/i);
    this.searchBox = page.getByRole('searchbox');
  }

  exactText(text: string): Locator {
    return this.page.getByText(text, { exact: true });
  }

  async goto(): Promise<void> {
    await this.page.goto(`${baseUrl}/programs`, { waitUntil: 'domcontentloaded' });
  }

  async openNewProgramForm(): Promise<void> {
    const trigger = this.openNewProgramTrigger.first();
    await trigger.evaluate((button) => (button as HTMLButtonElement).click());
    await this.newProgramDialog.waitFor({ state: 'visible', timeout: 15_000 });
    await this.newProgramNameField.waitFor({ state: 'visible', timeout: 15_000 });
  }

  async fillNewProgram(name: string, description?: string): Promise<void> {
    await this.newProgramModal.fillProgramName(name);
    if (description !== undefined && description.length > 0) {
      await this.newProgramModal.fillDescription(description);
    }
  }

  async fillNewProgramDescription(description: string): Promise<void> {
    await this.newProgramModal.fillDescription(description);
  }

  async openAndFillNewProgram(name: string, description?: string): Promise<void> {
    await this.openNewProgramForm();
    await this.fillNewProgram(name, description);
  }

  async isNewProgramModalVisible(): Promise<boolean> {
    return this.newProgramDialog.isVisible();
  }

  async isCreateProgramDisabled(): Promise<boolean> {
    return this.newProgramCreateButton.isDisabled();
  }

  async scrollProgramRowIntoView(name: string): Promise<void> {
    await this.programRow(name).first().scrollIntoViewIfNeeded();
  }

  async totalRowsForNames(...names: string[]): Promise<number> {
    let total = 0;
    for (const name of names) {
      total += await this.countProgramRowsNamed(name);
    }
    return total;
  }

  async clickCreateOnNewProgram(): Promise<Response> {
    return this.newProgramModal.clickCreate();
  }

  editLabeledField(label: string): Locator {
    return this.editDialog.getByLabel(label, { exact: true });
  }

  programRow(name: string): Locator {
    return this.programTable.locator('tbody tr').filter({
      has: this.page.locator('td').getByText(name, { exact: true }),
    });
  }

  programRowWithDescription(name: string, description: string): Locator {
    return this.programRow(name).filter({
      has: this.programTable.getByText(description, { exact: true }),
    });
  }

  descriptionSnippetInRow(name: string, snippet: string): Locator {
    return this.programRow(name).first().getByText(snippet);
  }

  deleteButtonForProgram(name: string): Locator {
    return this.programRow(name).first().getByRole('button', { name: `Delete ${name}`, exact: true });
  }

  editButtonForProgram(name: string): Locator {
    return this.programRow(name).getByRole('button', { name: `Edit ${name}`, exact: true });
  }

  async countProgramRowsNamed(name: string): Promise<number> {
    return this.programRow(name).count();
  }

  async programRowCount(): Promise<number> {
    if ((await this.programTable.count()) === 0) {
      return 0;
    }
    const rows = this.programTable.getByRole('row');
    const total = await rows.count();
    return Math.max(0, total - 1);
  }

  async scrollToLastTableRow(): Promise<number> {
    const rows = this.programTable.getByRole('row');
    const count = await rows.count();
    await rows.nth(count - 1).scrollIntoViewIfNeeded();
    return count;
  }

  async listedDescription(name: string): Promise<string> {
    const row = this.programRow(name).first();
    await row.scrollIntoViewIfNeeded();
    const paragraphs = row.getByRole('paragraph');
    if ((await paragraphs.count()) < 2) {
      return '';
    }
    return paragraphs.nth(1).innerText();
  }

  async createProgram(name: string, description = ''): Promise<string> {
    await this.openNewProgramForm();
    await this.newProgramModal.fillProgramName(name);
    if (description.length > 0) {
      await this.newProgramModal.fillDescription(description);
    }
    const response = await this.newProgramModal.clickCreate();
    const id = await this.createdProgramId(response);
    await this.newProgramModal.dialog.waitFor({ state: 'hidden', timeout: 15_000 });
    await this.page.waitForResponse(isProgramsListGet, { timeout: 15_000 }).catch(() => undefined);
    return id;
  }

  async submitCreateProgram(): Promise<string> {
    const response = await this.newProgramModal.clickCreate();
    const id = await this.createdProgramId(response);
    await this.newProgramModal.dialog.waitFor({ state: 'hidden', timeout: 15_000 });
    await this.page.waitForResponse(isProgramsListGet, { timeout: 15_000 }).catch(() => undefined);
    return id;
  }

  async createdProgramId(response: Response): Promise<string> {
    const id = await this.programIdFromResponse(response);
    if (!id) {
      throw new Error('Create program response did not include a program id');
    }
    return id;
  }

  async programIdFromResponse(response: Response): Promise<string | undefined> {
    const body = await response.json().catch(() => undefined);
    const id = body?.data?.id ?? body?.id;
    return typeof id === 'string' && id.length > 0 ? id : undefined;
  }

  private async fillEditField(field: Locator, value: string): Promise<void> {
    await field.scrollIntoViewIfNeeded();
    await field.click({ timeout: 15_000 });
    await field.fill(value, { timeout: 15_000 });
  }

  async openEditProgram(name: string, description?: string): Promise<void> {
    const row = description === undefined
      ? this.programRow(name)
      : this.programRowWithDescription(name, description);
    await row.scrollIntoViewIfNeeded();
    await row.getByRole('button', { name: `Edit ${name}`, exact: true }).click();
    await this.editDialog.waitFor({ state: 'visible', timeout: 15_000 });
  }

  async fillEditProgramName(value: string): Promise<void> {
    await this.fillEditField(this.editProgramNameField, value);
  }

  async fillEditDescription(value: string): Promise<void> {
    await this.fillEditField(this.editDescriptionField, value);
  }

  async clearEditProgramName(): Promise<void> {
    await this.fillEditField(this.editProgramNameField, '');
  }

  async clearEditDescription(): Promise<void> {
    await this.fillEditField(this.editDescriptionField, '');
  }

  /**
   * Default Session Hours and Default Exam Hours have visible labels and no
   * accessible name, so getByRole({ name }) and getByLabel do not match them.
   * Walk from the visible label to the nearest wrapper that owns one input.
   */
  async editFieldValueByVisibleLabel(label: string): Promise<string> {
    const labelNode = this.editDialog.getByText(label, { exact: true });
    return labelNode.evaluate((node) => {
      const readControl = (root: Element | null): string | undefined => {
        if (!root) return undefined;
        if (root instanceof HTMLInputElement || root instanceof HTMLTextAreaElement) return root.value;
        const fields = [...root.querySelectorAll('input, textarea')].filter(
          (field) => field instanceof HTMLInputElement || field instanceof HTMLTextAreaElement,
        );
        if (fields.length !== 1) return undefined;
        return (fields[0] as HTMLInputElement).value;
      };

      const own = readControl(node);
      if (own !== undefined) return own;

      const fromSiblings = (start: Element | null): string | undefined => {
        let sibling = start;
        while (sibling) {
          const value = readControl(sibling);
          if (value !== undefined) return value;
          sibling = sibling.nextElementSibling;
        }
        return undefined;
      };

      const beside = fromSiblings(node.nextElementSibling);
      if (beside !== undefined) return beside;

      let child: Element = node;
      let parent = node.parentElement;
      while (parent) {
        const after = fromSiblings(child.nextElementSibling);
        if (after !== undefined) return after;
        const wrapped = readControl(parent);
        if (wrapped !== undefined) return wrapped;
        child = parent;
        parent = parent.parentElement;
      }
      return '';
    });
  }

  /**
   * Clicks Save and returns the write response when one arrives.
   * Does not require the dialog to close — a rejected edit stays open.
   */
  async attemptSaveProgram(): Promise<Response | undefined> {
    const responsePromise = this.page.waitForResponse(isProgramWrite, { timeout: 30_000 }).catch(() => undefined);

    await this.editSaveButton.click();

    const outcome = await Promise.race([
      responsePromise.then((response) => ({ kind: 'response' as const, response })),
      this.editDialog.waitFor({ state: 'hidden', timeout: 30_000 }).then(() => ({ kind: 'closed' as const, response: undefined })),
      this.editNameTakenMessage.waitFor({ state: 'visible', timeout: 30_000 }).then(() => ({ kind: 'validation' as const, response: undefined })),
      this.editMaxLengthMessage.waitFor({ state: 'visible', timeout: 30_000 }).then(() => ({ kind: 'validation' as const, response: undefined })),
    ]).catch(() => ({ kind: 'timeout' as const, response: undefined }));

    if (outcome.response) return outcome.response;
    if (outcome.kind === 'validation') {
      return Promise.race([responsePromise, Promise.resolve(undefined)]);
    }
    if (outcome.kind === 'closed' || (await this.editDialog.isHidden())) {
      return Promise.race([
        responsePromise,
        this.page.waitForResponse(isProgramsListGet, { timeout: 15_000 }).then(() => undefined).catch(() => undefined),
      ]);
    }
    return undefined;
  }

  async closeEditWithoutSaving(): Promise<void> {
    await this.editCancelButton.click();
    await this.editDialog.waitFor({ state: 'hidden', timeout: 15_000 });
  }

  async submitSaveProgram(): Promise<Response> {
    const [response] = await Promise.all([
      this.page.waitForResponse(isUpdateProgramPatch, { timeout: 30_000 }),
      this.editSaveButton.click(),
    ]);
    await this.editDialog.waitFor({ state: 'hidden', timeout: 15_000 });
    await this.page.waitForResponse(isProgramsListGet, { timeout: 15_000 }).catch(() => undefined);
    return response;
  }

  async readProgramFields(name: string, description?: string): Promise<{ name: string; description: string }> {
    await this.openEditProgram(name, description);
    const storedName = await this.editProgramNameField.inputValue();
    const storedDescription = await this.editDescriptionField.inputValue();
    await this.closeEditWithoutSaving();
    return { name: storedName, description: storedDescription };
  }

  private rowFor(name: string, description?: string): Locator {
    return description === undefined
      ? this.programRow(name).first()
      : this.programRowWithDescription(name, description).first();
  }

  private readConfirmDialog(accept: boolean): Promise<string> {
    return new Promise<string>((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error('Delete confirmation did not appear')), 15_000);
      this.page.once('dialog', async (dialog) => {
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

  async dismissDeleteDialog(name: string, description?: string): Promise<string> {
    const row = this.rowFor(name, description);
    await row.scrollIntoViewIfNeeded();
    const messagePromise = this.readConfirmDialog(false);
    await row.getByRole('button', { name: `Delete ${name}`, exact: true }).click();
    return messagePromise;
  }

  async confirmDelete(name: string, description?: string): Promise<string> {
    const row = this.rowFor(name, description);
    await row.scrollIntoViewIfNeeded();
    const messagePromise = this.readConfirmDialog(true);
    const [, message] = await Promise.all([
      this.page.waitForResponse(isDeleteProgram, { timeout: 30_000 }),
      messagePromise,
      row.getByRole('button', { name: `Delete ${name}`, exact: true }).click(),
    ]);
    await this.page.waitForResponse(isProgramsListGet, { timeout: 15_000 }).catch(() => undefined);
    return message;
  }
}
