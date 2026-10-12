import { expect, test } from '@playwright/test';

const preview = (page) => page.locator('#preview-paper');

test.beforeEach(async ({ page }) => {
  await page.goto('editor.html');
});

test('typing updates the live preview and autosaves', async ({ page }) => {
  await page.getByLabel('Full name').fill('Ada Lovelace');
  await page.getByLabel('Email').fill('ada@example.com');
  await page.getByLabel('Job title').fill('Analyst');
  await expect(preview(page)).toContainText('Ada Lovelace');
  await expect(preview(page)).toContainText('Analyst');
  await expect(page.locator('#save-status')).toHaveText(/Saved/, { timeout: 5000 });

  await page.reload();
  await expect(page.getByLabel('Full name')).toHaveValue('Ada Lovelace');
  await expect(preview(page)).toContainText('ada@example.com');
});

test('descriptions render bullet lines as a real list', async ({ page }) => {
  await page.getByLabel('Achievements').fill('- Shipped v2\n- Cut costs 30%');
  await expect(preview(page).locator('.rt-list li')).toHaveCount(2);
});

test('user input is rendered as text, never as HTML', async ({ page }) => {
  let dialogFired = false;
  page.on('dialog', async (d) => {
    dialogFired = true;
    await d.dismiss();
  });
  await page.getByLabel('Full name').fill('<img src=x onerror=alert(1)>');
  await expect(preview(page)).toContainText('<img src=x onerror=alert(1)>');
  await expect(preview(page).locator('img')).toHaveCount(0);
  expect(dialogFired).toBe(false);
});

test('entries can be added, reordered and removed with undo', async ({ page }) => {
  await page.getByLabel('Job title').fill('First job');
  await page.getByRole('button', { name: 'Add position' }).click();
  await expect(page.locator('[data-bind="experience.1.position"]')).toBeFocused();
  await page.locator('[data-bind="experience.1.position"]').fill('Second job');

  await page
    .locator('[data-list="experience"] [data-index="1"]')
    .getByRole('button', { name: 'Move up' })
    .click();
  const titles = preview(page).locator('.r-section--experience .r-item__title');
  await expect(titles).toHaveText(['Second job', 'First job']);

  await page
    .locator('[data-list="experience"] [data-index="0"]')
    .getByRole('button', { name: 'Remove' })
    .click();
  await expect(titles).toHaveText(['First job']);
  await page.getByRole('button', { name: 'Undo' }).click();
  await expect(titles).toHaveText(['Second job', 'First job']);
});

test('Alt+Arrow moves the focused entry', async ({ page }) => {
  await page.getByLabel('Job title').fill('A');
  await page.getByRole('button', { name: 'Add position' }).click();
  const second = page.locator('[data-bind="experience.1.position"]');
  await second.fill('B');
  await second.press('Alt+ArrowUp');
  await expect(page.locator('[data-bind="experience.0.position"]')).toBeFocused();
  await expect(page.locator('[data-bind="experience.0.position"]')).toHaveValue('B');
});

test('autocomplete suggests and fills with the keyboard', async ({ page }) => {
  const input = page.locator('[data-bind="skills.0.name"]');
  await input.pressSequentially('typesc');
  const option = page.getByRole('option', { name: 'TypeScript' });
  await expect(option).toBeVisible();
  await input.press('ArrowDown');
  await input.press('Enter');
  await expect(input).toHaveValue('TypeScript');
  await expect(preview(page)).toContainText('TypeScript');
});

test('validation explains bad input without blocking', async ({ page }) => {
  const email = page.getByLabel('Email');
  await email.fill('not-an-email');
  await email.blur();
  await expect(email).toHaveAttribute('aria-invalid', 'true');
  await expect(page.getByText('That email address doesn’t look right.')).toBeVisible();
  await email.fill('ok@example.com');
  await expect(email).toHaveAttribute('aria-invalid', 'false');
});

test('design tab: switch template, paper size, hide and reorder sections', async ({ page }) => {
  await page.getByRole('button', { name: 'Load example' }).click();
  await page.getByRole('tab', { name: 'Design' }).click();

  await page.getByText('Executive', { exact: true }).click();
  await expect(preview(page).locator('.tpl-executive')).toBeVisible();

  await page.getByText('US Letter').click();
  await expect(preview(page)).toHaveCSS('width', '816px');

  await page.getByRole('button', { name: 'Hide Summary' }).click();
  await expect(preview(page).locator('.r-section--summary')).toHaveCount(0);

  await page.getByRole('button', { name: 'Move Education up' }).click();
  const html = await preview(page).innerHTML();
  expect(html.indexOf('r-section--education')).toBeLessThan(html.indexOf('r-section--experience'));
});

test('shrink to fit keeps a long resume on one page', async ({ page }) => {
  await page.getByRole('button', { name: 'Load example' }).click();
  // Make it long enough to spill onto a second page.
  await page.getByLabel('Professional summary').fill('Lorem ipsum dolor sit amet. '.repeat(20));
  await page.getByRole('button', { name: 'Add position' }).click();
  await page.locator('[data-bind="experience.3.description"]').fill('- Did a thing\n'.repeat(12));
  await expect(page.locator('#page-count')).toHaveText(/2 pages/);

  await page.getByRole('tab', { name: 'Design' }).click();
  await page.getByText('Shrink to fit one page').click();
  await expect(page.locator('#page-count')).toHaveText(/1 page · scaled to \d+%/);
});

test('my resumes: duplicate, open and delete', async ({ page }) => {
  await page.getByRole('button', { name: 'Load example' }).click();
  await expect(page.locator('#save-status')).toHaveText(/Saved/);
  await page.getByRole('button', { name: 'My resumes' }).click();
  const dialog = page.getByRole('dialog', { name: 'My resumes' });
  await expect(dialog).toBeVisible();

  await dialog.getByRole('button', { name: 'Duplicate Maya Chen' }).click();
  await expect(dialog.locator('[data-id]')).toHaveCount(2);
  await expect(dialog.getByText('Maya Chen (copy)')).toBeVisible();

  await dialog.getByRole('button', { name: 'Delete Maya Chen (copy)' }).click();
  await page
    .getByRole('dialog', { name: /Delete/ })
    .getByRole('button', { name: 'Delete' })
    .click();
  await expect(dialog.locator('[data-id]')).toHaveCount(1);
});

test('exports a JSON backup that can be imported again', async ({ page }) => {
  await page.getByRole('button', { name: 'Load example' }).click();
  await page.getByRole('button', { name: 'Export' }).click();
  const [download] = await Promise.all([
    page.waitForEvent('download'),
    page.getByRole('menuitem', { name: /Backup \(JSON\)/ }).click(),
  ]);
  expect(download.suggestedFilename()).toBe('Maya_Chen.json');
  const path = await download.path();

  await page.getByRole('button', { name: 'My resumes' }).click();
  const chooser = page.waitForEvent('filechooser');
  await page.getByRole('button', { name: 'Import' }).click();
  await (await chooser).setFiles(path);
  await expect(page.getByText('Imported 1 resume')).toBeVisible();
  await expect(page.getByRole('dialog', { name: 'My resumes' }).locator('[data-id]')).toHaveCount(2);
});

test('print shows only the resume', async ({ page }) => {
  await page.getByRole('button', { name: 'Load example' }).click();
  await page.emulateMedia({ media: 'print' });
  await page.evaluate(() => window.dispatchEvent(new Event('beforeprint')));
  await expect(page.locator('#print-root .resume')).toBeVisible();
  await expect(page.locator('header').first()).toBeHidden();
});

test('migrates resumes saved by the previous version of the app', async ({ page }) => {
  await page.evaluate(() => {
    localStorage.setItem(
      'resumes',
      JSON.stringify([
        {
          id: 'resume_legacy',
          title: 'R&amp;D Lead',
          template: 'template3',
          createdAt: '2025-11-05T00:00:00.000Z',
          updatedAt: '2025-11-05T00:00:00.000Z',
          data: { fullName: 'R&amp;D Lead', email: 'a@b.co', skills: ['Go', 'Rust'] },
        },
      ]),
    );
  });
  await page.reload();
  await expect(page.getByLabel('Full name')).toHaveValue('R&D Lead');
  await expect(preview(page).locator('.tpl-bold')).toBeVisible();
  await expect(preview(page).locator('.r-skills li')).toHaveText(['Go', 'Rust']);
});

test('mobile shows an Edit / Preview switch @mobile', async ({ page, isMobile }) => {
  test.skip(!isMobile, 'mobile only');
  await page.getByLabel('Full name').fill('Mobile User');
  await page.getByRole('tab', { name: 'Preview' }).click();
  await expect(preview(page)).toContainText('Mobile User');
  await expect(page.getByLabel('Full name')).toBeHidden();
});
