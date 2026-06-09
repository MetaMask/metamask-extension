import React, { createContext, useContext, useMemo, useState } from 'react';
import type { CaipAssetType, CaipChainId } from '@metamask/utils';

type BatchSellSelectionContextValue = {
  selectedNetworkChainId: CaipChainId | null;
  selectedAssetsId: CaipAssetType[];
  assetsOrderByBalance: 'asc' | 'desc';
  setSelectedNetworkChainId: (chainId: CaipChainId | null) => void;
  setSelectedAssetsId: React.Dispatch<React.SetStateAction<CaipAssetType[]>>;
  setAssetsOrderByBalance: React.Dispatch<React.SetStateAction<'asc' | 'desc'>>;
};

const BatchSellSelectionContext = createContext<BatchSellSelectionContextValue>(
  {
    selectedNetworkChainId: null,
    selectedAssetsId: [],
    assetsOrderByBalance: 'desc',
    setSelectedNetworkChainId: () => undefined,
    setSelectedAssetsId: () => undefined,
    setAssetsOrderByBalance: () => undefined,
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
  const [assetsOrderByBalance, setAssetsOrderByBalance] = useState<
    'asc' | 'desc'
  >('desc');

  const contextValue = useMemo(
    () => ({
      selectedNetworkChainId,
      selectedAssetsId,
      assetsOrderByBalance,
      setSelectedNetworkChainId,
      setSelectedAssetsId,
      setAssetsOrderByBalance,
    }),
    [selectedNetworkChainId, selectedAssetsId, assetsOrderByBalance],
  );

  return (
    <BatchSellSelectionContext.Provider value={contextValue}>
      {children}
    </BatchSellSelectionContext.Provider>
  );
};
