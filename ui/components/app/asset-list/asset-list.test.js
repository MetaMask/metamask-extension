import React from 'react';
import { screen, act, waitFor } from '@testing-library/react';
import { renderWithProvider } from '../../../../test/jest';
import configureStore from '../../../store/store';
import mockState from '../../../../test/data/mock-state.json';
import { CHAIN_IDS } from '../../../../shared/constants/network';
import { useIsOriginalNativeTokenSymbol } from '../../../hooks/useIsOriginalNativeTokenSymbol';
import { getTokenSymbol } from '../../../store/actions';
import AssetList from './asset-list';

// Specific to just the ETH FIAT conversion
const CONVERSION_RATE = 1597.32;
const ETH_BALANCE = '0x041173b2c0e57d'; // 0.0011 ETH ($1.83)

const USDC_BALANCE = '199.4875'; // @ $1
const LINK_BALANCE = '122.0005'; // @ $6.75
const WBTC_BALANCE = '2.38'; // @ $26,601.51

const USDC_CONTRACT = '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48';
const LINK_CONTRACT = '0x514910771AF9Ca656af840dff83E8264EcF986CA';
const WBTC_CONTRACT = '0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599';

jest.mock('../../../hooks/useTokenTracker', () => {
  return {
    useTokenTracker: () => ({
      loading: false,
      tokensWithBalances: [
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
      ],
      error: null,
    }),
  };
});

jest.mock('../../../hooks/useIsOriginalNativeTokenSymbol', () => {
  return {
    useIsOriginalNativeTokenSymbol: jest.fn(),
  };
});

jest.mock('../../../store/actions', () => {
  return {
    getTokenSymbol: jest.fn(),
  };
});

const render = (
  selectedAddress = mockState.metamask.selectedAddress,
  balance = ETH_BALANCE,
  chainId = CHAIN_IDS.MAINNET,
) => {
  const state = {
    ...mockState,
    metamask: {
      ...mockState.metamask,
      providerConfig: { chainId, ticker: 'ETH' },
      currencyRates: {
        ETH: {
          conversionRate: CONVERSION_RATE,
        },
      },
      cachedBalances: {
        [CHAIN_IDS.MAINNET]: {
          [selectedAddress]: balance,
        },
      },
      contractExchangeRates: {
        [USDC_CONTRACT]: 0.00062566,
        [LINK_CONTRACT]: 0.00423239,
        [WBTC_CONTRACT]: 16.66575,
      },
      selectedAddress,
    },
  };
  const store = configureStore(state);
  return renderWithProvider(
    <AssetList onClickAsset={() => undefined} />,
    store,
  );
};

describe('AssetList', () => {
  useIsOriginalNativeTokenSymbol.mockReturnValue(true);

  getTokenSymbol.mockImplementation(async (address) => {
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

  it('renders AssetList component and shows Refresh List text', async () => {
    await act(async () => {
      render();
    });

    await waitFor(() => {
      expect(screen.getByText('Refresh list')).toBeInTheDocument();
    });
  });

  describe('token fiat value calculations', () => {
    it('calculates the correct fiat account total', async () => {
      process.env.MULTICHAIN = 1;
      await act(async () => {
        render();
      });

      await waitFor(() => {
        expect(screen.getByText('$63,356.88 USD')).toBeInTheDocument();
        jest.resetModules();
      });
    });
  });
});
