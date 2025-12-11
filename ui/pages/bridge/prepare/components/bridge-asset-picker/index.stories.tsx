import React, { useState } from 'react';
import { Provider, useDispatch, useSelector } from 'react-redux';
import { SelectedAssetButton } from './selected-asset-button';
import {
  getFromAccount,
  getFromChains,
  getFromToken,
} from '../../../../../ducks/bridge/selectors';
import { setFromToken } from '../../../../../ducks/bridge/actions';
import { MultichainNetworks } from '../../../../../../shared/constants/multichain/networks';
import { CHAIN_IDS } from '../../../../../../shared/constants/network';
import { formatChainIdToCaip } from '@metamask/bridge-controller';
import configureStore from '../../../../../store/store';
import { createBridgeMockStore } from '../../../../../../test/data/bridge/mock-bridge-store';
import { BridgeAssetPicker } from '.';

const storybook = {
  title: 'Pages/Bridge/AssetPicker',
  component: BridgeAssetPicker,
};

const mockFeatureFlags = {
  bridgeConfig: {
    refreshRate: 30000,
    priceImpactThreshold: {
      normal: 1,
      gasless: 2,
    },
    maxRefreshCount: 5,
    chainRanking: [
      { chainId: formatChainIdToCaip(CHAIN_IDS.MAINNET) },
      { chainId: formatChainIdToCaip(CHAIN_IDS.OPTIMISM) },
      { chainId: formatChainIdToCaip(CHAIN_IDS.POLYGON) },
      { chainId: MultichainNetworks.SOLANA },
      { chainId: MultichainNetworks.BITCOIN },
      { chainId: MultichainNetworks.TRON },
    ],
  },
};
const mockBridgeSlice = {
  toChainId: CHAIN_IDS.LINEA_MAINNET,
  fromTokenInputValue: '1',
};

export const BridgeAssetPickerStory = () => {
  const [isAssetPickerOpen, setIsAssetPickerOpen] = useState(false);
  const networks = useSelector(getFromChains);
  const account = useSelector(getFromAccount);
  const token = useSelector(getFromToken);
  const dispatch = useDispatch();

  if (!token || !account?.address) {
    return null;
  }

  return (
    <>
      <BridgeAssetPicker
        selectedAsset={token}
        header={'Swap'}
        isOpen={isAssetPickerOpen}
        onClose={() => setIsAssetPickerOpen(false)}
        onAssetChange={(asset) => {
          dispatch(setFromToken(asset));
        }}
        chainIds={networks.map((network) =>
          formatChainIdToCaip(network.chainId),
        )}
        accountAddress={account?.address}
      />
      <SelectedAssetButton
        onClick={() => setIsAssetPickerOpen(true)}
        asset={token}
        data-testid={'test-id'}
      />
    </>
  );
};

BridgeAssetPickerStory.storyName = 'BridgeAssetPicker';
BridgeAssetPickerStory.decorators = [
  (Story) => (
    <Provider
      store={configureStore(
        createBridgeMockStore({
          featureFlagOverrides: mockFeatureFlags,
          bridgeSliceOverrides: mockBridgeSlice,
          bridgeStateOverrides: {
            quotes: [],
            quotesLastFetched: Date.now(),
          },
        }),
      )}
    >
      <Story />
    </Provider>
  ),
];

export default storybook;
