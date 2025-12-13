import React from 'react';
import { Provider, useSelector } from 'react-redux';
import { NetworkPicker } from './network-picker';
import { getFromChains } from '../../../../../ducks/bridge/selectors';
import { MultichainNetworks } from '../../../../../../shared/constants/multichain/networks';
import { CHAIN_IDS } from '../../../../../../shared/constants/network';
import { formatChainIdToCaip } from '@metamask/bridge-controller';
import configureStore from '../../../../../store/store';
import { createBridgeMockStore } from '../../../../../../test/data/bridge/mock-bridge-store';

const storybook = {
  title: 'Pages/Bridge/AssetPicker',
  component: NetworkPicker,
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

export const NetworkPickerStory = () => {
  const networks = useSelector(getFromChains);

  return (
    networks && (
      <NetworkPicker
        chainIds={networks.map((network) =>
          formatChainIdToCaip(network.chainId),
        )}
        selectedChainId={'eip155:1'}
        onNetworkChange={() => {}}
        buttonElement={null}
        isOpen={true}
        onClose={() => {}}
      />
    )
  );
};

NetworkPickerStory.storyName = 'NetworkPicker';
NetworkPickerStory.decorators = [
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
