import { test, expect } from '@playwright/test';

test.describe('Game Filtering', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await expect(page.getByTestId('game-filters')).toBeVisible();
  });

  test('should show all games and a result count initially', async ({ page }) => {
    const total = await page.getByTestId('game-card').count();
    await expect(page.getByTestId('filter-result-count')).toHaveText(`Showing ${total} of ${total} games`);
  });

  test('should filter by a single category', async ({ page }) => {
    const checkbox = page.locator('[data-testid^="filter-category-"]').first();
    await checkbox.check();
    const categoryId = (await checkbox.getAttribute('value')) as string;

    const visible = page.locator('[data-testid="game-card"]:visible');
    expect(await visible.count()).toBeGreaterThan(0);
    for (const card of await visible.all()) {
      await expect(card).toHaveAttribute('data-category-id', categoryId);
    }
  });

  test('should filter by multiple categories', async ({ page }) => {
    const checkboxes = page.locator('[data-testid^="filter-category-"]');
    await checkboxes.nth(0).check();
    const single = await page.locator('[data-testid="game-card"]:visible').count();
    await checkboxes.nth(1).check();
    const both = await page.locator('[data-testid="game-card"]:visible').count();
    expect(both).toBeGreaterThan(single);
  });

  test('should filter by publisher', async ({ page }) => {
    const select = page.getByTestId('filter-publisher');
    await select.selectOption({ index: 1 });
    const publisherId = await select.inputValue();

    const visible = page.locator('[data-testid="game-card"]:visible');
    expect(await visible.count()).toBeGreaterThan(0);
    for (const card of await visible.all()) {
      await expect(card).toHaveAttribute('data-publisher-id', publisherId);
    }
  });

  test('should combine category and publisher filters', async ({ page }) => {
    const cards = await page.getByTestId('game-card').all();
    const target = cards[0];
    const categoryId = await target.getAttribute('data-category-id');
    const publisherId = await target.getAttribute('data-publisher-id');

    await page.getByTestId(`filter-category-${categoryId}`).check();
    await page.getByTestId('filter-publisher').selectOption(publisherId as string);

    const visible = page.locator('[data-testid="game-card"]:visible');
    expect(await visible.count()).toBeGreaterThan(0);
    for (const card of await visible.all()) {
      await expect(card).toHaveAttribute('data-category-id', categoryId as string);
      await expect(card).toHaveAttribute('data-publisher-id', publisherId as string);
    }
  });

  test('should clear filters', async ({ page }) => {
    const total = await page.getByTestId('game-card').count();
    await page.locator('[data-testid^="filter-category-"]').first().check();
    await page.getByTestId('filter-clear').click();
    await expect(page.locator('[data-testid="game-card"]:visible')).toHaveCount(total);
    await expect(page.getByTestId('filter-publisher')).toHaveValue('');
  });

  test('should announce the filtered result count in the status region', async ({ page }) => {
    const total = await page.getByTestId('game-card').count();
    await page.locator('[data-testid^="filter-category-"]').first().check();
    const visible = await page.locator('[data-testid="game-card"]:visible').count();

    const count = page.getByTestId('filter-result-count');
    await expect(count).toHaveText(`Showing ${visible} of ${total} games`);
    await expect(count).toHaveAttribute('role', 'status');
    await expect(count).toHaveAttribute('aria-live', 'polite');
  });

  test('should show an empty state when no games match', async ({ page }) => {
    await test.step('Make every card mismatch the next publisher filter', async () => {
      // No category/publisher pair in the seed data is empty, so force a non-matching publisher id.
      await page.getByTestId('game-card').evaluateAll((cards) => {
        for (const card of cards) (card as HTMLElement).dataset.publisherId = '0';
      });
      await page.getByTestId('filter-publisher').selectOption({ index: 1 });
    });

    await test.step('Verify the empty state replaces the grid', async () => {
      await expect(page.getByTestId('no-matching-games')).toBeVisible();
      await expect(page.getByTestId('no-matching-games')).toContainText('No games match the selected filters.');
      await expect(page.getByTestId('games-grid')).toBeHidden();
      await expect(page.getByTestId('filter-result-count')).toContainText('Showing 0 of');
    });

    await test.step('Clearing filters brings the games back', async () => {
      await page.getByTestId('filter-clear').click();
      await expect(page.getByTestId('no-matching-games')).toBeHidden();
      await expect(page.getByTestId('games-grid')).toBeVisible();
    });
  });

  test('should ignore invalid filter values in the URL', async ({ page }) => {
    const total = await page.getByTestId('game-card').count();
    await page.goto('/?category=999&publisher=abc');
    await expect(page.getByTestId('filter-publisher')).toHaveValue('');
    await expect(page.locator('input[name="category"]:checked')).toHaveCount(0);
    await expect(page.getByTestId('filter-result-count')).toHaveText(`Showing ${total} of ${total} games`);
  });

  test('should be operable with the keyboard and restore state from the URL', async ({ page }) => {
    const checkbox = page.locator('[data-testid^="filter-category-"]').first();
    await checkbox.focus();
    await expect(checkbox).toBeFocused();
    await page.keyboard.press('Space');
    await expect(checkbox).toBeChecked();

    await page.reload();
    await expect(checkbox).toBeChecked();
  });
});
