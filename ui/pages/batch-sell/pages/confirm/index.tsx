import React from 'react';
import { useLocation } from 'react-router-dom';
import { BatchSellNavigationState } from '../../../../hooks/batch-sell/useBatchSellNavigation';

export const BatchSellConfirmPage = () => {
  const { state } = useLocation();
  const { selectedNetworkChainId, selectedAssetsId } =
    (state ?? {}) as BatchSellNavigationState;

  return (
    <div>
      <div>Confirm</div>
      <div>Network: {selectedNetworkChainId}</div>
      <div>Assets: {selectedAssetsId?.join(', ')}</div>
    </div>
  );
};
