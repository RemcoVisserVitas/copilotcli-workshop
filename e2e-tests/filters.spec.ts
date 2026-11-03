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
