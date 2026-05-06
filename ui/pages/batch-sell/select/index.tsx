import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import { CaipChainId } from '@metamask/utils';
import { Box, BoxFlexDirection } from '@metamask/design-system-react';
import {
  getAvailableBatchSellAssetsForNetworkSelector,
  getAvailableBatchSellNetworksSelector,
} from '../../../ducks/batch-sell/selectors';
import { AssetList } from './components/AssetList';
import { Footer } from './components/Footer';
import { Header } from './components/Header';
import { NetworkToolbar } from './components/NetworkToolbar';
import { SortingToolbar } from './components/SortingToolbar';

// TODO: min tokens
// TODO: max tokens
// TODO: empty network list
// TODO: filter out stable coins
// TODO: The network pills/badges are ordered based on their available fiat balance
// TODO: save selected assets
// TODO: change networks
// TODO: order by balance

export const BatchSellSelectPage = () => {
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

  return (
    <Box flexDirection={BoxFlexDirection.Column} className='h-full'>
      <Header />
      <NetworkToolbar
        networks={availableBatchSellNetworksList}
        selectedNetworkChainId={availableBatchSellNetworksList[0].chainId}
        onClick={console.log}
      />
      <SortingToolbar balance={{ order: -1, onClick: console.log }} />
      <AssetList
        selectedAssetsId={selectedAssetsId}
        assets={availableBatchSellAssetsForNetworkList}
        onSelect={console.log}
        onDeselect={console.log}
      />
      <Footer onSubmit={console.log} />
    </Box>
  );
};
