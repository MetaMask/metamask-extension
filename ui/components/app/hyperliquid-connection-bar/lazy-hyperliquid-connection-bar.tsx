import React, { Suspense } from 'react';
import { mmLazy } from '../../../helpers/utils/mm-lazy';

// Lazy so the Perps balance, deposit and withdraw code stays out of the home
// bundle until the bar is actually shown.
const HyperliquidConnectionBar = mmLazy(
  () => import('./hyperliquid-connection-bar'),
);

export const LazyHyperliquidConnectionBar = () => (
  <Suspense fallback={null}>
    <HyperliquidConnectionBar />
  </Suspense>
);
