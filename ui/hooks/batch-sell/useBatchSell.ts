import { useCallback } from 'react';
import { useBatchSellNavigation } from './useBatchSellNavigation';

export const useBatchSell = () => {
  const { navigateToBatchSellSelectPage } = useBatchSellNavigation();
  const openBatchSellExperience = useCallback(() => {
    navigateToBatchSellSelectPage();
  }, [navigateToBatchSellSelectPage]);

  return {
    openBatchSellExperience,
  };
};
