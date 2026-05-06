import React, { useCallback, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import { CaipChainId } from '@metamask/utils';
import { Box, BoxFlexDirection } from '@metamask/design-system-react';
import {
  getAvailableBatchSellAssetsForNetworkSelector,
  getAvailableBatchSellNetworksSelector,
} from '../../../ducks/batch-sell/selectors';
import { BatchSellAsset } from '../../../ducks/batch-sell/types';
import { useSortBatchSellAssetsByBalance } from '../../../hooks/batch-sell/useSortBatchSellAssetsByBalance';
import { AssetList } from './components/AssetList';
import { Footer } from './components/Footer';
import { Header } from './components/Header';
import { NetworkToolbar } from './components/NetworkToolbar';
import { SortingToolbar } from './components/SortingToolbar';

// TODO: min tokens
// TODO: max tokens
// TODO: empty network list
// TODO: filter out stable coins
// TODO: stable coins images are not rendered

export const BatchSellSelectPage = () => {
  const [assetsOrderByBalance, setAssetsOrderByBalance] = useState<
    'asc' | 'desc'
  >('desc');

  const availableBatchSellNetworksList = useSelector(
    getAvailableBatchSellNetworksSelector,
  );

  const [selectedNetworkChainId, setSelectedNetworkChainId] =
    useState<CaipChainId | null>(
      availableBatchSellNetworksList[0]?.chainId ?? null,
    );

  const [selectedAssetsId, setSelectedAssetsId] = useState<string[]>([]);

  const availableBatchSellAssetsForNetworkList = useSelector((state) =>
    getAvailableBatchSellAssetsForNetworkSelector(
      state,
      selectedNetworkChainId,
    ),
  );

  const orderedAvailableBatchSellAssetsForNetworkList =
    useSortBatchSellAssetsByBalance(
      availableBatchSellAssetsForNetworkList,
      assetsOrderByBalance,
    );

  const onNetworkSelect = useCallback((chainId: CaipChainId) => {
    setSelectedAssetsId([]);
    setSelectedNetworkChainId(chainId);
  }, []);

  const onSelectAsset = useCallback(
    (asset: BatchSellAsset) =>
      setSelectedAssetsId((assets) =>
        assets.includes(asset.assetId) ? assets : [...assets, asset.assetId],
      ),
    [],
  );

  const onDeselectAsset = useCallback((asset: BatchSellAsset) => {
    setSelectedAssetsId((assets) =>
      assets.filter((_assetId) => _assetId !== asset.assetId),
    );
  }, []);

  if (!selectedNetworkChainId) {
    return <div>empty</div>;
  }

  return (
    <Box flexDirection={BoxFlexDirection.Column} className="h-full">
      <Header />
      <NetworkToolbar
        networks={availableBatchSellNetworksList}
        selectedNetworkChainId={selectedNetworkChainId}
        onClick={onNetworkSelect}
      />
      <SortingToolbar
        balance={{
          order: assetsOrderByBalance,
          onClick: setAssetsOrderByBalance,
        }}
      />
      <AssetList
        selectedAssetsId={selectedAssetsId}
        assets={orderedAvailableBatchSellAssetsForNetworkList}
        onSelect={onSelectAsset}
        onDeselect={onDeselectAsset}
      />
      <Footer onSubmit={console.log} />
    </Box>
  );
};
