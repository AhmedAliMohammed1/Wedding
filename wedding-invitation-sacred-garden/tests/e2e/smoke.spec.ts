import { expect, test } from '@playwright/test';

test('invitation opens and core sections remain usable without overflow', async ({ page }) => {
  const consoleErrors: string[] = [];
  page.on('console', (message) => {
    if (message.type() === 'error' && !message.text().includes('google')) {
      consoleErrors.push(message.text());
    }
  });
  await page.route('https://www.google.com/maps/**', (route) => route.abort());
  await page.goto('/');

  const openButton = page.getByRole('button', { name: /tap to open/i });
  await expect(openButton).toBeVisible();
  await openButton.click();

  await expect(page.locator('body')).not.toHaveClass(/scroll-locked/);
  await expect(page.getByRole('heading', { name: 'Dear Friends and Family' })).toBeAttached();
  await expect(page.getByText('﴿ بِسْمِ اللَّهِ الرَّحْمَنِ الرَّحِيمِ ﴾')).toBeAttached();
  await expect(page.locator('audio')).toHaveAttribute('src', '/assets/audio/divenire.mp3');
  await expect(page.getByRole('heading', { name: /until our garden celebration/i })).toBeVisible();
  await expect(page.getByRole('heading', { name: /fragments of our world/i })).toBeAttached();
  const nextGalleryButton = page.locator('.gallery-next');
  await nextGalleryButton.scrollIntoViewIfNeeded();
  await expect(nextGalleryButton).toBeVisible();
  await nextGalleryButton.click();
  await expect(page.locator('.gallery-controls p span')).toHaveText('02');
  await expect(page.locator('#venue iframe')).toHaveAttribute('title', /map showing/i);

  await page.locator('#rsvp').scrollIntoViewIfNeeded();
  await page.getByRole('button', { name: /send rsvp/i }).click();
  await expect(page.getByText(/please enter your full name/i)).toBeVisible();

  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  expect(overflow).toBeLessThanOrEqual(1);
  expect(consoleErrors).toEqual([]);
});
