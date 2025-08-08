import React from 'react';
import { screen, act, waitFor } from '@testing-library/react';
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import { renderWithProvider } from '../../../../../test/lib/render-helpers-navigate';
import { MetaMaskReduxState } from '../../../../store/store';
import mockState from '../../../../../test/data/mock-state.json';
import { CHAIN_IDS } from '../../../../../shared/constants/network';
import { useIsOriginalNativeTokenSymbol } from '../../../../hooks/useIsOriginalNativeTokenSymbol';
import useMultiPolling from '../../../../hooks/useMultiPolling';
import { getTokenSymbol } from '../../../../store/actions';
import { getSelectedInternalAccountFromMockState } from '../../../../../test/jest/mocks';
import { mockNetworkState } from '../../../../../test/stub/networks';
import AssetList from '.';

// Specific to just the ETH FIAT conversion
const CONVERSION_RATE = 1597.32;
const ETH_BALANCE = '0x041173b2c0e57d'; // 0.0011 ETH ($1.83)

const USDC_BALANCE = '199.4875'; // @ $1
const LINK_BALANCE = '122.0005'; // @ $6.75
const WBTC_BALANCE = '2.38'; // @ $26,601.51

const USDC_CONTRACT = '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48';
const LINK_CONTRACT = '0x514910771AF9Ca656af840dff83E8264EcF986CA';
const WBTC_CONTRACT = '0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599';

const mockTokens = [
  {
    address: USDC_CONTRACT,
    decimals: 6,
    symbol: 'USDC',
    string: USDC_BALANCE, // $199.36
  },
  {
    address: LINK_CONTRACT,
    aggregators: [],
    decimals: 18,
    symbol: 'LINK',
    string: LINK_BALANCE, // $824.78
  },
  {
    address: WBTC_CONTRACT,
    aggregators: [],
    decimals: 8,
    symbol: 'WBTC',
    string: WBTC_BALANCE, // $63,381.02
  },
];

jest.mock('../../../../hooks/useTokenBalances', () => {
  return {
    useTokenTracker: () => ({
      loading: false,
      tokensWithBalances: mockTokens,
      error: null,
    }),
  };
});

jest.mock('../../../../hooks/useIsOriginalNativeTokenSymbol', () => {
  return {
    useIsOriginalNativeTokenSymbol: jest.fn(),
  };
});

jest.mock('../../../../store/actions', () => {
  return {
    getTokenSymbol: jest.fn(),
    setTokenNetworkFilter: jest.fn(() => ({
      type: 'TOKEN_NETWORK_FILTER',
    })),
    tokenBalancesStartPolling: jest.fn().mockResolvedValue('pollingToken'),
    tokenBalancesStopPollingByPollingToken: jest.fn(),
    addImportedTokens: jest.fn(),
  };
});

// Mock the dispatch function
const mockDispatch = jest.fn();

jest.mock('react-redux', () => {
  const actual = jest.requireActual('react-redux');
  return {
    ...actual,
    useDispatch: () => mockDispatch,
  };
});

jest.mock('../../../../hooks/useMultiPolling', () => ({
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  __esModule: true,
  default: jest.fn(),
}));

const mockSelectedInternalAccount = getSelectedInternalAccountFromMockState(
  mockState as unknown as MetaMaskReduxState,
);

const render = (balance = ETH_BALANCE, chainId = CHAIN_IDS.MAINNET) => {
  const state = {
    ...mockState,
    metamask: {
      ...mockState.metamask,
      ...mockNetworkState({ chainId }),
      currencyRates: {
        ETH: {
          conversionRate: CONVERSION_RATE,
        },
      },
      accountsByChainId: {
        [CHAIN_IDS.MAINNET]: {
          [mockSelectedInternalAccount.address]: { balance },
        },
      },
      marketData: {
        [CHAIN_IDS.MAINNET]: {
          [USDC_CONTRACT]: { price: 0.00062566 },
          [LINK_CONTRACT]: { price: 0.00423239 },
          [WBTC_CONTRACT]: { price: 16.66575 },
        },
        '0x0': {
          [USDC_CONTRACT]: { price: 0.00062566 },
          [LINK_CONTRACT]: { price: 0.00423239 },
          [WBTC_CONTRACT]: { price: 16.66575 },
        },
      },
    },
  };
  const store = configureMockStore([thunk])(state);
  return renderWithProvider(
    <AssetList onClickAsset={() => undefined} showTokensLinks />,
    store,
  );
};

describe('AssetList', () => {
  (useMultiPolling as jest.Mock).mockClear();

  // Mock implementation for useMultiPolling
  (useMultiPolling as jest.Mock).mockImplementation(({ input }) => {
    // Mock startPolling and stopPollingByPollingToken for each input
    const startPolling = jest.fn().mockResolvedValue('mockPollingToken');
    const stopPollingByPollingToken = jest.fn();

    input.forEach((inputItem: string) => {
      const key = JSON.stringify(inputItem);
      // Simulate returning a unique token for each input
      startPolling.mockResolvedValueOnce(`mockToken-${key}`);
    });

    return { startPolling, stopPollingByPollingToken };
  });
  (useIsOriginalNativeTokenSymbol as jest.Mock).mockReturnValue(true);

  (getTokenSymbol as jest.Mock).mockImplementation(async (address) => {
    if (address === USDC_CONTRACT) {
      return 'USDC';
    }
    if (address === LINK_CONTRACT) {
      return 'LINK';
    }
    if (address === WBTC_CONTRACT) {
      return 'WBTC';
    }
    return null;
  });

  it('renders AssetList component and shows AssetList control bar', async () => {
    await act(async () => {
      render();
    });

    await waitFor(() => {
      expect(screen.getByTestId('sort-by-popover-toggle')).toBeInTheDocument();
      expect(
        screen.getByTestId('asset-list-control-bar-action-button'),
      ).toBeInTheDocument();
    });
  });
});
