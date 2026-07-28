import { expect, test } from '@playwright/test';

test('invitation opens and core sections remain usable without overflow', async ({ page }) => {
  const consoleErrors: string[] = [];
  page.on('console', (message) => {
    if (message.type() === 'error' && !message.text().includes('google')) {
      consoleErrors.push(message.text());
    }
  });
  await page.route('https://www.google.com/maps/**', (route) => route.abort());
  await page.route('**/api/notes**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        notes: [
          {
            id: 'e2e-note',
            author: 'Anonymous',
            anonymous: true,
            message: 'May your days together always feel like home.',
            createdAt: '2026-07-27T12:00:00.000Z'
          }
        ],
        pagination: {
          page: 1,
          pageSize: 6,
          total: 1,
          totalPages: 1,
          hasPreviousPage: false,
          hasNextPage: false
        }
      })
    });
  });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');

  const openButton = page.getByRole('button', { name: /tap to open/i });
  await expect(openButton).toBeVisible();
  await openButton.click();

  await expect(page.locator('body')).not.toHaveClass(/scroll-locked/);
  await expect(page.getByRole('heading', { name: 'Dear Friends and Family' })).toBeAttached();
  await expect(page.getByText('﴿ بِسْمِ اللَّهِ الرَّحْمَنِ الرَّحِيمِ ﴾')).toBeAttached();
  await expect(page.locator('audio')).toHaveAttribute('src', '/assets/audio/divenire.mp3');
  const sectionIds = await page.locator('main > section').evaluateAll((sections) =>
    sections.map((section) => section.id)
  );
  expect(sectionIds.slice(0, 3)).toEqual(['invitation', 'welcome', 'venue']);
  expect(sectionIds).not.toContain('dress-code');
  expect(sectionIds).not.toContain('rsvp');
  expect(sectionIds).toContain('guest-notes');
  await expect(page.locator('#guest-notes form')).toHaveCount(1);
  await expect(page.getByText(/meal preference/i)).toHaveCount(0);
  await expect(page.getByRole('heading', { name: /until our garden celebration/i })).toBeVisible();
  await expect(page.getByRole('heading', { name: /fragments of our world/i })).toBeAttached();
  const nextGalleryButton = page.locator('.gallery-next');
  await nextGalleryButton.scrollIntoViewIfNeeded();
  await expect(nextGalleryButton).toBeVisible();
  await nextGalleryButton.evaluate((button) => (button as HTMLButtonElement).click());
  await expect(page.locator('.gallery-controls p span')).toHaveText('02');
  await expect(page.locator('#venue iframe')).toHaveAttribute('title', /map showing/i);
  await page.getByRole('button', { name: /show all notes/i }).click();
  await expect(page.getByText('May your days together always feel like home.')).toBeVisible();
  await expect(page.locator('.guest-note-card strong')).toHaveText('Anonymous');

  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  expect(overflow).toBeLessThanOrEqual(1);
  expect(consoleErrors).toEqual([]);
});
