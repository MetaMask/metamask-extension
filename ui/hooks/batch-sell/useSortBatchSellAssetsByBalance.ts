import { useMemo } from 'react';
import { BatchSellAsset } from '../../ducks/batch-sell/types';

export const useSortBatchSellAssetsByBalance = (
  assets: BatchSellAsset[],
  order: 'asc' | 'desc',
) => {
  return useMemo(
    () =>
      assets.toSorted((a, b) => {
        const aBalance = a.tokenFiatAmount ?? 0;
        const bBalance = b.tokenFiatAmount ?? 0;
        return order === 'desc' ? bBalance - aBalance : aBalance - bBalance;
      }),
    [assets, order],
  );
};
