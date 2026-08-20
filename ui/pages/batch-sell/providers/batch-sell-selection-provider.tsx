import React, { createContext, useContext, useMemo, useState } from 'react';
import type { CaipAssetType, CaipChainId } from '@metamask/utils';

type BatchSellSelectionContextValue = {
  selectedNetworkChainId: CaipChainId | null;
  selectedAssetsId: CaipAssetType[];
  assetsOrderByBalance: 'asc' | 'desc';
  // Tracks whether the user has explicitly interacted with the network/asset
  // selection. Until then, the default network stays synced to the
  // highest-balance network as the async network list settles.
  hasUserInteracted: boolean;
  setSelectedNetworkChainId: (chainId: CaipChainId | null) => void;
  setSelectedAssetsId: React.Dispatch<React.SetStateAction<CaipAssetType[]>>;
  setAssetsOrderByBalance: React.Dispatch<React.SetStateAction<'asc' | 'desc'>>;
  setHasUserInteracted: React.Dispatch<React.SetStateAction<boolean>>;
};

const BatchSellSelectionContext = createContext<BatchSellSelectionContextValue>(
  {
    selectedNetworkChainId: null,
    selectedAssetsId: [],
    assetsOrderByBalance: 'desc',
    hasUserInteracted: false,
    setSelectedNetworkChainId: () => undefined,
    setSelectedAssetsId: () => undefined,
    setAssetsOrderByBalance: () => undefined,
    setHasUserInteracted: () => undefined,
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
  const [hasUserInteracted, setHasUserInteracted] = useState(false);

  const contextValue = useMemo(
    () => ({
      selectedNetworkChainId,
      selectedAssetsId,
      assetsOrderByBalance,
      hasUserInteracted,
      setSelectedNetworkChainId,
      setSelectedAssetsId,
      setAssetsOrderByBalance,
      setHasUserInteracted,
    }),
    [
      selectedNetworkChainId,
      selectedAssetsId,
      assetsOrderByBalance,
      hasUserInteracted,
    ],
  );

  return (
    <BatchSellSelectionContext.Provider value={contextValue}>
      {children}
    </BatchSellSelectionContext.Provider>
  );
};
