import type { Selector } from './types';

/**
 * True when the locator is already a `data-testid` (or CSS that targets one).
 * Other kinds need a migration and are treated as not-good in the overlay.
 *
 * @param selector - The page-object selector to classify.
 * @returns Whether the locator is the preferred `data-testid` form.
 */
export function isGoodLocator(selector: Selector): boolean {
  if (selector.kind === 'testId') {
    return true;
  }
  if (selector.kind === 'css') {
    const raw = selector.chunks
      ? selector.chunks.join('')
      : (selector.value ?? '');
    return raw.includes('data-testid');
  }
  return false;
}
