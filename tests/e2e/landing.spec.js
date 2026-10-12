import { expect, test } from '@playwright/test';

test('landing page renders every template and links to the editor', async ({ page }) => {
  const failed = [];
  page.on('requestfailed', (r) => failed.push(r.url()));
  await page.goto('./');
  await expect(page.getByRole('heading', { level: 1 })).toContainText('A resume that reads well');
  await expect(page.locator('#template-gallery figure')).toHaveCount(6);
  expect(failed, 'no third-party or broken requests').toEqual([]);

  await page.locator('#template-gallery a').nth(3).click();
  await expect(page).toHaveURL(/editor\.html$/);
  await expect(page.locator('#preview-paper .tpl-executive')).toBeVisible();
});

test('theme toggle switches and remembers dark mode', async ({ page }) => {
  await page.goto('./');
  const html = page.locator('html');
  const before = await html.getAttribute('class');
  await page.getByRole('button', { name: /Switch to (dark|light) theme/ }).click();
  await expect(html).not.toHaveAttribute('class', before ?? '');
  await page.reload();
  await expect(html).not.toHaveAttribute('class', before ?? '');
});

test('old editor URL redirects', async ({ page }) => {
  await page.goto('Resume-Editor.html');
  await expect(page).toHaveURL(/editor\.html$/);
});
