import { expect, test, type Locator, type Page } from '@playwright/test';

const appUrl = 'https://demo.playwright.dev/todomvc/#/';

test.beforeEach(async ({ page }) => {
  await page.goto(appUrl);
});

function newTodoInput(page: Page): Locator {
  return page.getByRole('textbox', { name: 'What needs to be done?' });
}

function todoItems(page: Page): Locator {
  return page.getByTestId('todo-item');
}

function todoByTitle(page: Page, title: string): Locator {
  return todoItems(page).filter({ hasText: title });
}

function markAll(page: Page): Locator {
  return page.getByRole('checkbox', { name: /Mark all as complete/ });
}

function clearCompleted(page: Page): Locator {
  return page.getByRole('button', { name: 'Clear completed' });
}

function count(page: Page): Locator {
  return page.getByTestId('todo-count');
}

async function addTodo(page: Page, title: string): Promise<void> {
  const input = newTodoInput(page);
  await input.click();
  await input.fill(title);
  await input.press('Enter');
}

async function deleteTodo(page: Page, title: string): Promise<void> {
  const row = todoByTitle(page, title);
  await row.hover();
  await row.getByRole('button', { name: 'Delete' }).click();
}

async function openEdit(page: Page, title: string): Promise<Locator> {
  await todoByTitle(page, title).getByTestId('todo-title').dblclick();
  const edit = page.getByRole('textbox', { name: 'Edit' });
  await expect(edit).toBeVisible();
  return edit;
}

async function expectActive(row: Locator): Promise<void> {
  await expect(row).not.toHaveClass(/completed/);
  await expect(row.getByRole('checkbox', { name: 'Toggle Todo' })).not.toBeChecked();
  await expect(row.getByTestId('todo-title')).not.toHaveCSS('text-decoration-line', 'line-through');
}

async function expectCompleted(row: Locator): Promise<void> {
  await expect(row).toHaveClass(/completed/);
  await expect(row.getByRole('checkbox', { name: 'Toggle Todo' })).toBeChecked();
  await expect(row.getByTestId('todo-title')).toHaveCSS('text-decoration-line', 'line-through');
}

async function expectEmptyApp(page: Page): Promise<void> {
  await expect(todoItems(page)).toHaveCount(0);
  await expect(count(page)).toHaveCount(0);
  await expect(page.getByRole('link', { name: 'All', exact: true })).toHaveCount(0);
  await expect(page.getByRole('link', { name: 'Active', exact: true })).toHaveCount(0);
  await expect(page.getByRole('link', { name: 'Completed', exact: true })).toHaveCount(0);
  await expect(markAll(page)).toHaveCount(0);
  await expect(newTodoInput(page)).toBeVisible();
  await expect(newTodoInput(page)).toHaveValue('');
  await expect(page.getByText('Double-click to edit a todo')).toBeVisible();
}

test.describe('Positive flows', () => {
  test('TC-001: "Buy milk" is added to the list and the input is cleared', async ({ page }) => {
    await expectEmptyApp(page);

    await addTodo(page, 'Buy milk');

    const row = todoByTitle(page, 'Buy milk');
    await expect(page.getByTestId('todo-title')).toHaveText(['Buy milk']);
    await expect(newTodoInput(page)).toHaveValue('');
    await expect(newTodoInput(page)).toBeFocused();
    await expect(count(page)).toHaveText('1 item left');
    await expect(page.getByRole('link', { name: 'All', exact: true })).toHaveClass(/selected/);
    await expect(markAll(page)).not.toBeChecked();
    await expectActive(row);
  });

  test('TC-002: Todos stay in the order they were entered', async ({ page }) => {
    await addTodo(page, 'Buy milk');
    await addTodo(page, 'Walk the dog');
    await addTodo(page, 'Read a book');

    await expect(page.getByTestId('todo-title')).toHaveText([
      'Buy milk',
      'Walk the dog',
      'Read a book',
    ]);
    await expect(count(page)).toHaveText('3 items left');
    await expect(newTodoInput(page)).toHaveValue('');
  });

  test('TC-003: Completing "Buy milk" marks it complete and the active count drops', async ({ page }) => {
    await addTodo(page, 'Buy milk');
    await expect(count(page)).toHaveText('1 item left');

    await todoByTitle(page, 'Buy milk').getByRole('checkbox', { name: 'Toggle Todo' }).check();

    const row = todoByTitle(page, 'Buy milk');
    await expect(row).toBeVisible();
    await expectCompleted(row);
    await expect(count(page)).toHaveText('0 items left');
    await expect(clearCompleted(page)).toBeVisible();
    await expect(markAll(page)).toBeChecked();
  });

  test('TC-004: A completed todo becomes active again', async ({ page }) => {
    await addTodo(page, 'Buy milk');
    await todoByTitle(page, 'Buy milk').getByRole('checkbox', { name: 'Toggle Todo' }).check();
    await expect(count(page)).toHaveText('0 items left');

    await todoByTitle(page, 'Buy milk').getByRole('checkbox', { name: 'Toggle Todo' }).uncheck();

    const row = todoByTitle(page, 'Buy milk');
    await expectActive(row);
    await expect(count(page)).toHaveText('1 item left');
    await expect(clearCompleted(page)).toBeHidden();
    await expect(markAll(page)).not.toBeChecked();
  });

  test('TC-005: "Walk the dog" is removed and "Buy milk" remains', async ({ page }) => {
    await addTodo(page, 'Buy milk');
    await addTodo(page, 'Walk the dog');
    await expect(count(page)).toHaveText('2 items left');

    await deleteTodo(page, 'Walk the dog');

    await expect(page.getByTestId('todo-title')).toHaveText(['Buy milk']);
    await expect(count(page)).toHaveText('1 item left');
    await expect(page.getByText('Walk the dog')).toHaveCount(0);
  });

  test('TC-006: The list, footer, and complete-all control disappear after the last todo is deleted', async ({ page }) => {
    await addTodo(page, 'Buy milk');
    await expect(count(page)).toHaveText('1 item left');

    await deleteTodo(page, 'Buy milk');

    await expectEmptyApp(page);
  });

  test('TC-007: "Mark all as complete" completes every active todo', async ({ page }) => {
    await addTodo(page, 'Buy milk');
    await addTodo(page, 'Walk the dog');
    await expect(count(page)).toHaveText('2 items left');
    await expect(markAll(page)).not.toBeChecked();

    // The checkbox is visually hidden; the arrow label is the on-screen control.
    await markAll(page).check({ force: true });

    await expectCompleted(todoByTitle(page, 'Buy milk'));
    await expectCompleted(todoByTitle(page, 'Walk the dog'));
    await expect(count(page)).toHaveText('0 items left');
    await expect(clearCompleted(page)).toBeVisible();
    await expect(markAll(page)).toBeChecked();
  });

  test('TC-008: Active and Completed filters show only the matching todos', async ({ page }) => {
    await addTodo(page, 'Buy milk');
    await addTodo(page, 'Walk the dog');
    await todoByTitle(page, 'Walk the dog').getByRole('checkbox', { name: 'Toggle Todo' }).check();
    await expect(page).toHaveURL(appUrl);
    await expect(count(page)).toHaveText('1 item left');

    await page.getByRole('link', { name: 'Active', exact: true }).click();
    await expect(page).toHaveURL('https://demo.playwright.dev/todomvc/#/active');
    await expect(page.getByRole('link', { name: 'Active', exact: true })).toHaveClass(/selected/);
    await expect(page.getByTestId('todo-title')).toHaveText(['Buy milk']);
    await expect(count(page)).toHaveText('1 item left');

    await page.getByRole('link', { name: 'Completed', exact: true }).click();
    await expect(page).toHaveURL('https://demo.playwright.dev/todomvc/#/completed');
    await expect(page.getByRole('link', { name: 'Completed', exact: true })).toHaveClass(/selected/);
    await expect(page.getByTestId('todo-title')).toHaveText(['Walk the dog']);

    await page.getByRole('link', { name: 'All', exact: true }).click();
    await expect(page).toHaveURL(appUrl);
    await expect(page.getByRole('link', { name: 'All', exact: true })).toHaveClass(/selected/);
    await expect(page.getByTestId('todo-title')).toHaveText(['Buy milk', 'Walk the dog']);
  });

  test('TC-009: "Clear completed" removes completed todos and keeps active ones', async ({ page }) => {
    await addTodo(page, 'Buy milk');
    await addTodo(page, 'Walk the dog');
    await todoByTitle(page, 'Walk the dog').getByRole('checkbox', { name: 'Toggle Todo' }).check();
    await expect(page.getByRole('link', { name: 'All', exact: true })).toHaveClass(/selected/);
    await expect(clearCompleted(page)).toBeVisible();
    await expect(count(page)).toHaveText('1 item left');

    await clearCompleted(page).click();

    await expect(page.getByTestId('todo-title')).toHaveText(['Buy milk']);
    await expect(page.getByText('Walk the dog')).toHaveCount(0);
    await expect(count(page)).toHaveText('1 item left');
    await expect(clearCompleted(page)).toBeHidden();
    await expect(markAll(page)).not.toBeChecked();
  });

  test('TC-010: A double-clicked todo saves the new title "Buy oat milk"', async ({ page }) => {
    await addTodo(page, 'Buy milk');
    await expect(count(page)).toHaveText('1 item left');

    const edit = await openEdit(page, 'Buy milk');
    await edit.fill('Buy oat milk');
    await edit.press('Enter');

    const row = todoByTitle(page, 'Buy oat milk');
    await expect(page.getByTestId('todo-title')).toHaveText(['Buy oat milk']);
    await expect(row.getByRole('textbox', { name: 'Edit' })).toBeHidden();
    await expectActive(row);
    await expect(count(page)).toHaveText('1 item left');
  });

  test('TC-011: Todos are still present after the page is reloaded', async ({ page }) => {
    await addTodo(page, 'Buy milk');
    await addTodo(page, 'Walk the dog');
    await todoByTitle(page, 'Walk the dog').getByRole('checkbox', { name: 'Toggle Todo' }).check();

    await page.reload();

    await expectActive(todoByTitle(page, 'Buy milk'));
    await expectCompleted(todoByTitle(page, 'Walk the dog'));
    await expect(count(page)).toHaveText('1 item left');
    await expect(clearCompleted(page)).toBeVisible();
  });
});

test.describe('Negative flows', () => {
  test('TC-012: Pressing Enter in an empty field does not add a todo', async ({ page }) => {
    const input = newTodoInput(page);
    await expect(input).toHaveValue('');

    await input.click();
    await input.press('Enter');

    await expect(todoItems(page)).toHaveCount(0);
    await expect(count(page)).toHaveCount(0);
    await expect(input).toHaveValue('');
  });

  test('TC-013: A whitespace-only entry is not added', async ({ page }) => {
    const input = newTodoInput(page);
    await input.click();
    await input.fill('   ');
    await input.press('Enter');

    await expect(todoItems(page)).toHaveCount(0);
    await expect(count(page)).toHaveCount(0);
    await expect(input).toHaveValue('   ');
  });

  test('TC-014: Completing a todo does not remove it from All', async ({ page }) => {
    await addTodo(page, 'Buy milk');
    await expect(page.getByRole('link', { name: 'All', exact: true })).toHaveClass(/selected/);

    await todoByTitle(page, 'Buy milk').getByRole('checkbox', { name: 'Toggle Todo' }).check();

    await expect(page.getByRole('link', { name: 'All', exact: true })).toHaveClass(/selected/);
    await expect(todoItems(page)).toHaveCount(1);
    await expectCompleted(todoByTitle(page, 'Buy milk'));
    await expect(count(page)).toHaveText('0 items left');
  });

  test('TC-015: Deleting one todo does not delete the other', async ({ page }) => {
    await addTodo(page, 'Buy milk');
    await addTodo(page, 'Walk the dog');

    await deleteTodo(page, 'Buy milk');

    const remaining = todoByTitle(page, 'Walk the dog');
    await expect(remaining).toBeVisible();
    await expectActive(remaining);
    await expect(count(page)).toHaveText('1 item left');
    await expect(page.getByText('Buy milk', { exact: true })).toHaveCount(0);
  });

  test('TC-016: "Clear completed" does not remove active todos', async ({ page }) => {
    await addTodo(page, 'Buy milk');
    await addTodo(page, 'Walk the dog');
    await addTodo(page, 'Read a book');
    await todoByTitle(page, 'Walk the dog').getByRole('checkbox', { name: 'Toggle Todo' }).check();
    await todoByTitle(page, 'Read a book').getByRole('checkbox', { name: 'Toggle Todo' }).check();
    await expect(page.getByRole('link', { name: 'All', exact: true })).toHaveClass(/selected/);
    await expect(count(page)).toHaveText('1 item left');

    await clearCompleted(page).click();

    const remaining = todoByTitle(page, 'Buy milk');
    await expect(page.getByTestId('todo-title')).toHaveText(['Buy milk']);
    await expectActive(remaining);
    await expect(page.getByText('Walk the dog')).toHaveCount(0);
    await expect(page.getByText('Read a book')).toHaveCount(0);
    await expect(count(page)).toHaveText('1 item left');
    await expect(clearCompleted(page)).toBeHidden();
  });

  test('TC-017: Markup typed as a title is shown as text', async ({ page }) => {
    const dialogs: string[] = [];
    page.on('dialog', async (dialog) => {
      dialogs.push(dialog.message());
      await dialog.dismiss();
    });

    const title = '<script>alert(1)</script>';
    await addTodo(page, title);

    await expect(page.getByTestId('todo-title')).toHaveText([title]);
    expect(dialogs).toEqual([]);
    await expect(page).toHaveTitle('React • TodoMVC');
    await expect(count(page)).toHaveText('1 item left');
  });

  test('TC-018: Escape during edit leaves the original title unchanged', async ({ page }) => {
    await addTodo(page, 'Buy milk');

    const edit = await openEdit(page, 'Buy milk');
    await edit.fill('Buy oat milk');
    await edit.press('Escape');

    const row = todoByTitle(page, 'Buy milk');
    await expect(row.getByRole('textbox', { name: 'Edit' })).toBeHidden();
    await expect(page.getByTestId('todo-title')).toHaveText(['Buy milk']);
    await expectActive(row);
    await expect(count(page)).toHaveText('1 item left');
  });
});

test.describe('Edge cases', () => {
  test('TC-019: Leading and trailing spaces are removed from the saved title', async ({ page }) => {
    await addTodo(page, '  Buy milk  ');

    const title = page.getByTestId('todo-title');
    await expect(title).toBeVisible();
    await expect.poll(() => title.textContent()).toBe('Buy milk');
    await expect(newTodoInput(page)).toHaveValue('');
    await expect(count(page)).toHaveText('1 item left');
  });

  test('TC-020: Two todos may share the title "Buy milk"', async ({ page }) => {
    await addTodo(page, 'Buy milk');
    await addTodo(page, 'Buy milk');

    const rows = todoItems(page);
    await expect(rows).toHaveCount(2);
    await expect(rows.nth(0).getByTestId('todo-title')).toHaveText('Buy milk');
    await expect(rows.nth(1).getByTestId('todo-title')).toHaveText('Buy milk');
    await expect(count(page)).toHaveText('2 items left');

    await rows.nth(0).getByRole('checkbox', { name: 'Toggle Todo' }).check();

    await expectCompleted(rows.nth(0));
    await expectActive(rows.nth(1));
    await expect(count(page)).toHaveText('1 item left');
  });

  test('TC-021: Letters, symbols, and quotes are stored and shown as typed', async ({ page }) => {
    const title = 'Café & "quotes" <tag>';
    await addTodo(page, title);

    await expect(page.getByTestId('todo-title')).toHaveText([title]);
    await expect(count(page)).toHaveText('1 item left');
  });

  test('TC-022: A one-character title is accepted', async ({ page }) => {
    await addTodo(page, 'A');

    await expect(page.getByTestId('todo-title')).toHaveText(['A']);
    await expect(newTodoInput(page)).toHaveValue('');
    await expect(count(page)).toHaveText('1 item left');
  });

  test('TC-023: A 256-character title is stored in full', async ({ page }) => {
    const title = 'A'.repeat(256);
    await expect(newTodoInput(page)).not.toHaveAttribute('maxlength');

    await addTodo(page, title);

    const titleLabel = page.getByTestId('todo-title');
    await expect(titleLabel).toHaveText(title);
    await expect.poll(() => titleLabel.textContent()).toHaveLength(256);
    await expect(newTodoInput(page)).toHaveValue('');
    await expect(count(page)).toHaveText('1 item left');
  });

  test('TC-024: The count uses "item" for one active todo and "items" otherwise', async ({ page }) => {
    await addTodo(page, 'Buy milk');
    await expect(count(page)).toHaveText('1 item left');

    await addTodo(page, 'Walk the dog');
    await expect(count(page)).toHaveText('2 items left');

    await todoByTitle(page, 'Buy milk').getByRole('checkbox', { name: 'Toggle Todo' }).check();
    await expect(count(page)).toHaveText('1 item left');

    await todoByTitle(page, 'Walk the dog').getByRole('checkbox', { name: 'Toggle Todo' }).check();
    await expect(count(page)).toHaveText('0 items left');
    await expect(todoItems(page)).toHaveCount(2);
    await expect(page.getByRole('link', { name: 'All', exact: true })).toHaveClass(/selected/);
    await expect(clearCompleted(page)).toBeVisible();
  });

  test('TC-025: Saving a blank edit removes the todo', async ({ page }) => {
    await addTodo(page, 'Buy milk');
    await addTodo(page, 'Walk the dog');
    await expect(count(page)).toHaveText('2 items left');

    const edit = await openEdit(page, 'Buy milk');
    await edit.fill('');
    await edit.press('Enter');

    await expect(page.getByText('Buy milk', { exact: true })).toHaveCount(0);
    await expectActive(todoByTitle(page, 'Walk the dog'));
    await expect(count(page)).toHaveText('1 item left');
  });

  test('TC-026: Saving an edit that is only spaces removes the todo', async ({ page }) => {
    await addTodo(page, 'Buy milk');
    await expect(count(page)).toHaveText('1 item left');

    const edit = await openEdit(page, 'Buy milk');
    await edit.fill('   ');
    await edit.press('Enter');

    await expectEmptyApp(page);
  });

  test('TC-027: Internal double spaces in a title are kept', async ({ page }) => {
    await addTodo(page, 'Buy  milk');

    const title = page.getByTestId('todo-title');
    await expect(title).toBeVisible();
    await expect.poll(() => title.textContent()).toBe('Buy  milk');
    await expect(count(page)).toHaveText('1 item left');
  });
});
