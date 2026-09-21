import { expect, test } from '@playwright/test';

test('configure, eat every minute, pause, resume, finish, and restart', async ({ page }) => {
  await page.clock.install({ time: new Date('2026-09-21T08:00:00Z') });
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('./');
  await page.getByRole('spinbutton', { name: 'タイマーの分数' }).fill('2');
  await page.getByRole('spinbutton').press('Tab');
  await expect(page.locator('.apple-slot')).toHaveCount(2);
  await expect(page.getByRole('timer')).toHaveText('02:00');
  await page.getByRole('button', { name: 'はじめる', exact: true }).click();
  await expect(page.getByRole('spinbutton')).toBeDisabled();
  await page.clock.fastForward(59_000);
  await expect(page.locator('.is-eaten')).toHaveCount(0);
  await expect(page.locator('#apple-0 circle')).toHaveCount(9);
  await page.clock.fastForward(1_000);
  await expect(page.locator('.is-eaten')).toHaveCount(1);
  await expect(page.getByRole('timer')).toHaveText('01:00');
  await page.getByRole('button', { name: 'ひとやすみ', exact: true }).click();
  await page.clock.fastForward(90_000);
  await expect(page.getByRole('timer')).toHaveText('01:00');
  await page.getByRole('button', { name: 'つづける', exact: true }).click();
  await page.clock.fastForward(60_000);
  await expect(page.getByRole('timer')).toHaveText('00:00');
  await expect(page.locator('.is-eaten')).toHaveCount(2);
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('ぜんぶ食べたよ。おつかれさま！');
  await page.getByRole('button', { name: 'もういちど', exact: true }).click();
  await expect(page.getByRole('timer')).toHaveText('02:00');
  await page.getByRole('button', { name: 'はじめにもどす', exact: true }).click();
  await expect(page.getByRole('spinbutton')).toBeEnabled();
  await expect(page.locator('.is-eaten')).toHaveCount(0);
  expect(errors).toEqual([]);
});

test('mobile handles max duration without overflow, follows the worm, and supports mute', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.clock.install({ time: new Date('2026-09-21T08:00:00Z') });
  await page.goto('./');
  await page.getByRole('spinbutton').fill('99');
  await page.getByRole('spinbutton').press('Tab');
  await expect(page.getByRole('spinbutton')).toHaveValue('60');
  await expect(page.locator('.apple-slot')).toHaveCount(60);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.getByRole('button', { name: 'お知らせの音' }).click();
  await expect(page.getByRole('button', { name: 'お知らせの音' })).toHaveAttribute('aria-pressed', 'false');
  await page.getByRole('button', { name: 'はじめる', exact: true }).click();
  await page.clock.fastForward(10 * 60_000);
  await expect(page.locator('.is-eaten')).toHaveCount(10);
  await page.clock.runFor(1_000);
  expect(await page.locator('#apple-scroll').evaluate((element) => element.scrollTop)).toBeGreaterThan(0);
  await page.getByRole('button', { name: 'はじめにもどす', exact: true }).click();
  await page.getByRole('spinbutton').fill('0');
  await page.getByRole('spinbutton').press('Tab');
  await expect(page.getByRole('spinbutton')).toHaveValue('1');
  await page.getByRole('button', { name: '5分', exact: true }).click();
  await expect(page.getByRole('timer')).toHaveText('05:00');
});

test('desktop and mobile visuals', async ({ page }) => {
  await page.goto('./');
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({ path: 'test-results/timer-desktop.png', fullPage: true, animations: 'disabled' });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({ path: 'test-results/timer-mobile.png', fullPage: true, animations: 'disabled' });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});
