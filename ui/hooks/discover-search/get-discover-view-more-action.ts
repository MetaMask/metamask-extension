import { DISCOVER_SEARCH_PREVIEW_COUNT } from './constants';
import type { DiscoverSearchSectionId } from './types';

/** Feeds whose result set is fully loaded client-side; count-based "View X more" is exact. */
export const LOCAL_SEARCH_SECTIONS: ReadonlySet<DiscoverSearchSectionId> =
  new Set(['perps']);

export type DiscoverViewMoreAction =
  | { kind: 'viewAll' }
  | { kind: 'viewMore'; count: number };

/**
 * Label action for the All-tab section "View all / View X more" button.
 * Returns `null` when the button should be hidden (active query and nothing left).
 *
 * Mirrors mobile Explore `getViewMoreLabel`.
 *
 * @param sectionId - Discover section
 * @param visibleCount - items loaded in the section (may exceed preview cap)
 * @param searchQuery - current search input
 * @param serverTotal - server-reported total for crypto/stocks when available
 * @returns Action describing the button label, or null to hide
 */
export const getDiscoverViewMoreAction = (
  sectionId: DiscoverSearchSectionId,
  visibleCount: number,
  searchQuery: string,
  serverTotal?: number,
): DiscoverViewMoreAction | null => {
  if (!searchQuery.trim()) {
    return { kind: 'viewAll' };
  }

  if (serverTotal !== undefined) {
    if (serverTotal <= DISCOVER_SEARCH_PREVIEW_COUNT) {
      return null;
    }
    const hidden =
      serverTotal - Math.min(visibleCount, DISCOVER_SEARCH_PREVIEW_COUNT);
    return { kind: 'viewMore', count: hidden };
  }

  const hidden = visibleCount - DISCOVER_SEARCH_PREVIEW_COUNT;
  if (hidden <= 0) {
    return null;
  }

  if (LOCAL_SEARCH_SECTIONS.has(sectionId)) {
    return { kind: 'viewMore', count: hidden };
  }

  return { kind: 'viewAll' };
};
