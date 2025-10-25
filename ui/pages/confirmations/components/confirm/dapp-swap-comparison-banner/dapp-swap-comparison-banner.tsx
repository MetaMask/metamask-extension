import 'react';

import { useDappSwapComparisonInfo } from '../../../hooks/transactions/useDappSwapComparisonInfo';

// The component is conditionally included for dapp swap origin
// The only purpose of the component currently is to capture dapp swap comparison related metrics.

export const DappSwapComparisonBanner = () => {
  useDappSwapComparisonInfo();

  return null;
};
