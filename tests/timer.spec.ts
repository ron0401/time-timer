import { expect, test } from '@playwright/test';

test('setup and timer are separate screens throughout a complete timer', async ({ page }) => {
  await page.clock.install({ time: new Date('2026-09-21T08:00:00Z') });
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('./');
  await expect(page.getByRole('heading', { name: '時間を設定' })).toBeVisible();
  await expect(page.locator('#timer-screen')).toBeHidden();
  await expect(page.locator('.garden')).toBeHidden();
  await page.getByRole('spinbutton').fill('2');
  await page.getByRole('button', { name: '開始', exact: true }).click();
  await expect(page).toHaveURL(/#timer$/);
  await expect(page.locator('#setup-screen')).toBeHidden();
  await expect(page.locator('#timer-screen')).toBeVisible();
  await expect(page.getByRole('spinbutton')).toHaveCount(0);
  await expect(page.locator('#timer-heading')).toBeFocused();
  await expect(page.getByRole('timer')).toHaveText('02:00');
  await expect(page.locator('.apple-slot')).toHaveCount(2);
  await page.clock.fastForward(59_000);
  await expect(page.locator('.is-eaten')).toHaveCount(0);
  await expect(page.locator('#apple-0 circle')).toHaveCount(9);
  await page.clock.fastForward(1_000);
  await expect(page.locator('.is-eaten')).toHaveCount(1);
  await expect(page.getByRole('timer')).toHaveText('01:00');
  await page.getByRole('button', { name: '一時停止', exact: true }).click();
  await page.clock.fastForward(90_000);
  await expect(page.getByRole('timer')).toHaveText('01:00');
  await expect(page.locator('#setup-screen')).toBeHidden();
  await page.getByRole('button', { name: '再開', exact: true }).click();
  await page.clock.fastForward(60_000);
  await expect(page.getByRole('timer')).toHaveText('00:00');
  await expect(page.locator('.is-eaten')).toHaveCount(2);
  await expect(page.locator('#status')).toHaveText('終了');
  await page.getByRole('button', { name: 'もう一度', exact: true }).click();
  await expect(page.getByRole('timer')).toHaveText('02:00');
  await page.getByRole('button', { name: '時間を変更', exact: true }).click();
  await expect(page.locator('#timer-screen')).toBeHidden();
  await expect(page.getByRole('spinbutton')).toHaveValue('2');
  await expect(page.locator('#setup-heading')).toBeFocused();
  expect(errors).toEqual([]);
});

test('iPhone navigation, ten-minute limit, and stationary apples', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.clock.install({ time: new Date('2026-09-21T08:00:00Z') });
  await page.goto('./');
  await page.getByRole('spinbutton').fill('99');
  await page.getByRole('spinbutton').press('Tab');
  await expect(page.getByRole('spinbutton')).toHaveValue('10');
  await expect(page.getByRole('button', { name: '1分増やす' })).toBeDisabled();
  await expect(page.getByRole('button', { name: '15分', exact: true })).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'お知らせの音' })).toHaveCount(0);
  await page.getByRole('button', { name: '開始', exact: true }).click();
  await expect(page.locator('.apple-slot')).toHaveCount(10);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  const before = await page.locator('.apple-slot').evaluateAll((nodes) => nodes.map((node) => node.getBoundingClientRect().top));
  await page.clock.fastForward(7 * 60_000);
  await expect(page.locator('.is-eaten')).toHaveCount(7);
  const after = await page.locator('.apple-slot').evaluateAll((nodes) => nodes.map((node) => node.getBoundingClientRect().top));
  after.forEach((top, index) => expect(Math.abs(top - before[index])).toBeLessThanOrEqual(1));
  expect(await page.locator('#apple-field').evaluate((element) => element.scrollHeight <= element.clientHeight + 1)).toBe(true);
  expect(await page.evaluate(() => window.scrollY)).toBe(0);
  await page.goBack();
  await expect(page.locator('#timer-screen')).toBeHidden();
  await expect(page.getByRole('spinbutton')).toHaveValue('10');
  await page.goForward();
  await expect(page.locator('#timer-screen')).toBeHidden();
  await expect(page).not.toHaveURL(/#timer$/);
  await page.clock.fastForward(60_000);
  await page.getByRole('spinbutton').fill('0');
  await page.getByRole('spinbutton').press('Tab');
  await expect(page.getByRole('spinbutton')).toHaveValue('1');
  await page.getByRole('button', { name: '5分', exact: true }).click();
  await page.getByRole('button', { name: '開始', exact: true }).click();
  await expect(page.getByRole('timer')).toHaveText('05:00');
  await expect(page.locator('.is-eaten')).toHaveCount(0);
  await page.reload();
  await expect(page.locator('#timer-screen')).toBeHidden();
  await expect(page.getByRole('heading', { name: '時間を設定' })).toBeVisible();
});

test('all ten apples fit on one screen across iPhone sizes and rotation', async ({ page }) => {
  await page.goto('./');
  await page.evaluate(() => document.fonts.ready);
  for (const [name, width, height] of [['desktop', 1440, 1000], ['iphone', 390, 844], ['small-iphone', 320, 568], ['small-iphone-browser', 320, 460], ['landscape', 844, 390]] as const) {
    await page.setViewportSize({ width, height });
    await page.getByRole('button', { name: '10分', exact: true }).click();
    await page.getByRole('button', { name: '開始', exact: true }).click();
    await expect(page.locator('.apple-slot')).toHaveCount(10);
    await expect(page.getByRole('button', { name: '一時停止', exact: true })).toBeInViewport({ ratio: 1 });
    await expect.poll(() => page.evaluate(() => {
      const field = document.querySelector('#apple-field')!;
      const fieldBounds = field.getBoundingClientRect();
      const errors: string[] = [];
      for (const [index, item] of [...document.querySelectorAll('.apple-art, .apple-number, #caterpillar')].entries()) {
        const rect = item.getBoundingClientRect();
        if (rect.width <= 0 || rect.height <= 0 || rect.top < fieldBounds.top - 1 || rect.bottom > fieldBounds.bottom + 1 || rect.left < fieldBounds.left - 1 || rect.right > fieldBounds.right + 1 || rect.top < 0 || rect.bottom > innerHeight) errors.push(`clipped item ${index}`);
      }
      if (field.scrollHeight > field.clientHeight + 1 || field.scrollWidth > field.clientWidth + 1) errors.push('scrolling field');
      if (document.documentElement.scrollHeight > innerHeight + 1 || document.documentElement.scrollWidth > innerWidth + 1) errors.push('scrolling page');
      return errors;
    })).toEqual([]);
    const sizes = await page.locator('.apple-art').evaluateAll((nodes) => nodes.map((node) => node.getBoundingClientRect().width));
    expect(Math.min(...sizes)).toBeGreaterThan(24);
    await page.screenshot({ path: `test-results/${name}-ten-apples.png`, fullPage: true, animations: 'disabled' });
    const rows = await page.locator('.apple-slot').evaluateAll((nodes) => new Set(nodes.map((node) => node.getBoundingClientRect().top)).size);
    expect(rows).toBeGreaterThanOrEqual(2);
    await page.getByRole('button', { name: '時間を変更', exact: true }).click();
    await expect(page.getByRole('button', { name: '開始', exact: true })).toBeVisible();
  }
});
