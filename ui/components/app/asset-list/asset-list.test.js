import React from 'react';
import { screen } from '@testing-library/react';
import { renderWithProvider } from '../../../../test/jest';
import configureStore from '../../../store/store';
import mockState from '../../../../test/data/mock-state.json';
import { CHAIN_IDS } from '../../../../shared/constants/network';
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

const render = (
  selectedAddress = mockState.metamask.selectedAddress,
  balance = ETH_BALANCE,
  chainId = CHAIN_IDS.MAINNET,
) => {
  const state = {
    ...mockState,
    metamask: {
      ...mockState.metamask,
      providerConfig: { chainId },
      conversionRate: CONVERSION_RATE,
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
  it('renders AssetList component and shows Refresh List text', () => {
    render();
    expect(screen.getByText('Refresh list')).toBeInTheDocument();
  });

  describe('token fiat value calculations', () => {
    it('calculates the correct fiat account total', () => {
      process.env.MULTICHAIN = 1;

      const _USDC_CONTRACT = USDC_CONTRACT;
      const _USDC_BALANCE = USDC_BALANCE;
      const _LINK_CONTRACT = LINK_CONTRACT;
      const _LINK_BALANCE = LINK_BALANCE;
      const _WBTC_CONTRACT = WBTC_CONTRACT;
      const _WBTC_BALANCE = WBTC_BALANCE;

      jest.mock('../../../hooks/useTokenTracker', () => {
        return {
          useTokenTracker: () => ({
            loading: false,
            tokensWithBalances: [
              {
                address: _USDC_CONTRACT,
                decimals: 6,
                symbol: 'USDC',
                string: _USDC_BALANCE, // $199.36
              },
              {
                address: _LINK_CONTRACT,
                aggregators: [],
                decimals: 18,
                symbol: 'LINK',
                string: _LINK_BALANCE, // $824.78
              },
              {
                address: _WBTC_CONTRACT,
                aggregators: [],
                decimals: 8,
                symbol: 'WBTC',
                string: _WBTC_BALANCE, // $63,381.02
              },
            ],
            error: null,
          }),
        };
      });

      const { container } = render();
      expect(container).toMatchSnapshot();
      expect(screen.getByText('$63,356.88 USD')).toBeInTheDocument();
    });
  });

  describe('buy and receive buttons', () => {
    it('shows Buy and Receive when the account is empty', () => {
      process.env.MULTICHAIN = 1;
      jest.mock('../../../hooks/useTokenTracker', () => ({
        useTokenTracker: () => ({
          loading: false,
          tokensWithBalances: [],
          error: null,
        }),
      }));

      const { queryByText } = render(
        '0xc42edfcc21ed14dda456aa0756c153f7985d8813',
        '0x0',
      );
      expect(queryByText('Buy')).toBeInTheDocument();
      expect(queryByText('Receive')).toBeInTheDocument();
    });

    it('shows only Receive when chainId is not buyable', () => {
      process.env.MULTICHAIN = 1;
      const { queryByText } = render(
        '0xc42edfcc21ed14dda456aa0756c153f7985d8813',
        '0x0',
        '0x8675309', // Custom chain ID that isn't buyable
      );
      expect(queryByText('Buy')).not.toBeInTheDocument();
      expect(queryByText('Receive')).toBeInTheDocument();
    });
  });
});
