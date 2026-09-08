import { useEffect, useRef } from 'react';
import type { PerpsMarketData } from '@metamask/perps-controller';
import {
  startPerpsEntry,
  endPerpsEntry,
  type PerpsEntrySurface,
  type PerpsEntryVariant,
} from '../../helpers/perps/entry-trace';

/**
 * End entry timing after React commits real market rows with fresh data.
 * Loading flags and persisted cache seeds alone cannot complete this span.
 *
 * @param surface - View rendering the rows.
 * @param markets - Actual rows rendered by that view.
 * @param isLoading - Whether the view still renders its loading state.
 * @param isLive - The snapshots consumed during render belong to the live session.
 * @param variant - Loaded Home content for Mobile dashboard segmentation.
 */
export function usePerpsEntryTrace(
  surface: PerpsEntrySurface,
  markets: readonly PerpsMarketData[],
  isLoading: boolean,
  isLive: boolean,
  variant?: PerpsEntryVariant,
): void {
  const entryId = useRef<string>();
  useEffect(() => {
    const id = startPerpsEntry(surface);
    entryId.current = id;
    return () => {
      if (entryId.current) {
        endPerpsEntry(entryId.current, false, 'unmounted');
      }
    };
  }, [surface]);

  useEffect(() => {
    const complete = () => {
      if (
        entryId.current &&
        document.visibilityState === 'visible' &&
        !isLoading &&
        isLive &&
        markets.length > 0
      ) {
        endPerpsEntry(entryId.current, true, 'live_rows_committed', variant);
      }
    };
    complete();
    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        entryId.current = startPerpsEntry(surface);
        complete();
      }
    };
    document.addEventListener('visibilitychange', onVisibilityChange);
    return () =>
      document.removeEventListener('visibilitychange', onVisibilityChange);
  }, [surface, markets, isLoading, isLive, variant]);
}
