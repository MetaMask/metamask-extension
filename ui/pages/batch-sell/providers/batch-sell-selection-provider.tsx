import React, { createContext, useContext, useMemo, useState } from 'react';
import type { CaipAssetType, CaipChainId } from '@metamask/utils';

type BatchSellSelectionContextValue = {
  selectedNetworkChainId: CaipChainId | null;
  selectedAssetsId: CaipAssetType[];
  setSelectedNetworkChainId: (chainId: CaipChainId | null) => void;
  setSelectedAssetsId: React.Dispatch<React.SetStateAction<CaipAssetType[]>>;
};

const BatchSellSelectionContext = createContext<BatchSellSelectionContextValue>(
  {
    selectedNetworkChainId: null,
    selectedAssetsId: [],
    setSelectedNetworkChainId: () => undefined,
    setSelectedAssetsId: () => undefined,
  },
);

export const useBatchSellSelection = () =>
  useContext(BatchSellSelectionContext);

export const BatchSellSelectionProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [selectedNetworkChainId, setSelectedNetworkChainId] =
    useState<CaipChainId | null>(null);
  const [selectedAssetsId, setSelectedAssetsId] = useState<CaipAssetType[]>([]);

  const contextValue = useMemo(
    () => ({
      selectedNetworkChainId,
      selectedAssetsId,
      setSelectedNetworkChainId,
      setSelectedAssetsId,
    }),
    [selectedNetworkChainId, selectedAssetsId],
  );

  return (
    <BatchSellSelectionContext.Provider value={contextValue}>
      {children}
    </BatchSellSelectionContext.Provider>
  );
};
