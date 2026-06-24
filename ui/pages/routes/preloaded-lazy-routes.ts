/* eslint-disable import-x/extensions, import-x/no-useless-path-segments */
import { mmLazy } from '../../helpers/utils/mm-lazy';

/**
 * Keep always-prefetched route chunks under roughly 500 KB per session.
 * Only preload routes with consistently high post-unlock traffic and known
 * first-navigation fallback flashes.
 *
 * Current always-prefetched routes are Send and Swap for common wallet actions,
 * Asset detail for high-frequency chart-backed navigation, and Settings because
 * the settings shell is small enough to fit the same idle budget.
 *
 * Use `*.preload()` from `mmLazy` for lower-frequency intent-based warming.
 */
export const Settings = mmLazy(
  () => import(/* webpackPrefetch: true */ '../settings/index.ts'),
);

export const SendPage = mmLazy(
  () => import(/* webpackPrefetch: true */ '../confirmations/send/index.ts'),
);

export const CrossChainSwap = mmLazy(
  () => import(/* webpackPrefetch: true */ '../bridge/index.tsx'),
);

export const Asset = mmLazy(
  () => import(/* webpackPrefetch: true */ '../asset/index.js'),
);
