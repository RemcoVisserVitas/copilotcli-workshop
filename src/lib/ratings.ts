/**
 * Pure formatting helpers for game star ratings.
 *
 * Kept framework-free and side-effect-free so the logic is unit-testable
 * without the Astro runtime (see `ratings.test.ts`). Consumed by the
 * `Stars.astro` and `StarRating.astro` components.
 */

/**
 * Clamps a rating into the displayable 0–5 range.
 */
export function clampRating(rating: number): number {
    return Math.min(5, Math.max(0, rating));
}

/**
 * Builds a star glyph string for a rating between 0 and 5.
 *
 * Renders full (★), an optional half (½) and empty (☆) stars. Returns
 * `'Not yet rated'` when the rating is `null`. Ratings are clamped to the
 * 0–5 range so the output always contains exactly five star positions.
 */
export function formatStarRating(rating: number | null): string {
    if (rating === null) return 'Not yet rated';

    const clamped = clampRating(rating);
    const fullStars = Math.floor(clamped);
    const halfStar = clamped % 1 >= 0.5;
    const emptyStars = 5 - fullStars - (halfStar ? 1 : 0);

    return '★'.repeat(fullStars) + (halfStar ? '½' : '') + '☆'.repeat(emptyStars);
}

/**
 * Returns the fill percentage (0–100) of each of the five stars for a rating.
 *
 * Fractions fill a star proportionally (e.g. 3.5 → `[100, 100, 100, 50, 0]`).
 * Ratings are clamped to 0–5 so the result always has five entries.
 */
export function getStarFills(rating: number): number[] {
    const clamped = clampRating(rating);

    return Array.from({ length: 5 }, (_, index) =>
        Math.round(Math.min(1, Math.max(0, clamped - index)) * 100),
    );
}
