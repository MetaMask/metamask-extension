import type { Hex } from '@metamask/utils';
import { act, screen, within } from '@testing-library/react';
import nock from 'nock';
import * as backgroundConnection from '../../../ui/store/background-connection';
import { integrationTestRender } from '../../lib/render-helpers';
import mockMetaMaskState from '../data/integration-init-state.json';
import {
  clickElementById,
  createMockImplementation,
  getSelectedAccountGroupAccounts,
  getSelectedAccountGroupName,
} from '../helpers';

jest.setTimeout(20_000);

jest.mock('../../../ui/store/background-connection', () => ({
  ...jest.requireActual('../../../ui/store/background-connection'),
  submitRequestToBackground: jest.fn(),
}));

type NonZeroNativeNetwork = {
  chainId: Hex;
  clientId: string;
  name: string;
  nativeAssetId: string;
  symbol: string;
};

const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';
const DEAD_NATIVE_ADDRESS = '0xdeaddeaddeaddeaddeaddeaddeaddeaddead0000';

const NON_ZERO_NATIVE_NETWORKS: NonZeroNativeNetwork[] = [
  {
    chainId: '0x1e',
    clientId: 'rootstock-local',
    name: 'Rootstock Mainnet',
    nativeAssetId: 'eip155:30/slip44:137',
    symbol: 'RBTC',
  },
  {
    chainId: '0x3dc',
    clientId: 'stable-local',
    name: 'Stable',
    nativeAssetId: `eip155:988/erc20:${ZERO_ADDRESS}`,
    symbol: 'USDT0',
  },
  {
    chainId: '0x1388',
    clientId: 'mantle-local',
    name: 'Mantle',
    nativeAssetId: `eip155:5000/erc20:${DEAD_NATIVE_ADDRESS}`,
    symbol: 'MNT',
  },
  {
    chainId: '0x440',
    clientId: 'metis-local',
    name: 'Metis Andromeda',
    nativeAssetId: `eip155:1088/erc20:${DEAD_NATIVE_ADDRESS}`,
    symbol: 'METIS',
  },
  {
    chainId: '0x64',
    clientId: 'gnosis-local',
    name: 'Gnosis',
    nativeAssetId: `eip155:100/erc20:${ZERO_ADDRESS}`,
    symbol: 'XDAI',
  },
];

const mockedBackgroundConnection = jest.mocked(backgroundConnection);
const backgroundConnectionMocked = {
  onNotification: jest.fn(),
};
const [selectedAccount] = getSelectedAccountGroupAccounts(mockMetaMaskState);
const accountName = getSelectedAccountGroupName(mockMetaMaskState);

function buildState(network: NonZeroNativeNetwork) {
  return {
    ...mockMetaMaskState,
    consentDecisionMade: true,
    selectedNetworkClientId: network.clientId,
    enabledNetworkMap: {
      eip155: {
        [network.chainId]: true,
      },
    },
    preferences: {
      ...mockMetaMaskState.preferences,
      tokenNetworkFilter: {
        [network.chainId]: true,
      },
    },
    networkConfigurationsByChainId: {
      [network.chainId]: {
        chainId: network.chainId,
        rpcEndpoints: [
          {
            networkClientId: network.clientId,
            url: 'http://localhost:8545',
            type: 'custom',
            name: network.name,
          },
        ],
        defaultRpcEndpointIndex: 0,
        blockExplorerUrls: [],
        defaultBlockExplorerUrlIndex: 0,
        name: network.name,
        nativeCurrency: network.symbol,
      },
    },
    networksMetadata: {
      [network.clientId]: {
        EIPS: {
          1559: true,
        },
        status: 'available',
      },
    },
    assetsBalance: {
      [selectedAccount.id]: {
        [network.nativeAssetId]: {
          amount: '25',
        },
      },
    },
    assetsInfo: {
      [network.nativeAssetId]: {
        type: 'native',
        decimals: 18,
        symbol: network.symbol,
        name: network.name,
      },
    },
    assetsPrice: {
      [network.nativeAssetId]: {
        assetPriceType: 'fungible',
        price: 1,
        usdPrice: 1,
        lastUpdated: Date.now(),
      },
    },
    currencyRates: {
      [network.symbol]: {
        conversionRate: 1,
      },
    },
  };
}

describe.each(NON_ZERO_NATIVE_NETWORKS)(
  '$name non-zero native address',
  (network) => {
    beforeEach(() => {
      process.env.PORTFOLIO_VIEW = 'true';
      window.location.hash = '';
      jest.resetAllMocks();
      mockedBackgroundConnection.submitRequestToBackground.mockImplementation(
        createMockImplementation({}),
      );
    });

    afterEach(() => {
      nock.cleanAll();
    });

    it('displays one native token row with the expected balance', async () => {
      await act(async () => {
        await integrationTestRender({
          preloadedState: buildState(network),
          backgroundConnection: backgroundConnectionMocked,
        });
      });

      await screen.findByText(accountName);
      await clickElementById('account-overview__asset-tab');

      const rows = await screen.findAllByTestId(
        'multichain-token-list-button',
      );
      expect(rows).toHaveLength(1);

      expect(
        within(rows[0]).getByTestId('multichain-token-list-item-token-name'),
      ).toHaveTextContent(network.symbol);
      expect(
        within(rows[0]).getByTestId('multichain-token-list-item-value'),
      ).toHaveTextContent(`25 ${network.symbol}`);
    });
  },
);
