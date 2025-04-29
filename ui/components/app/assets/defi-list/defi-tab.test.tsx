import React from 'react';
import { screen, act, waitFor } from '@testing-library/react';
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import { renderWithProvider } from '../../../../../test/jest';
import mockState from '../../../../../test/data/mock-state.json';
import { mockNetworkState } from '../../../../../test/stub/networks';
import { CHAIN_IDS } from '../../../../../shared/constants/network';
import DeFiTab from './defi-tab';

const allDeFiPositions = {
  [mockState.metamask.selectedAddress]: {
    [CHAIN_IDS.MAINNET]: {
      aggregatedMarketValue: 20540,
      protocols: {
        lido: {
          protocolDetails: {
            name: 'Lido',
            iconUrl:
              'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0xae7ab96520DE3A18E5e111B5EaAb095312D7fE84/logo.png',
          },
          aggregatedMarketValue: 20000,
          positionTypes: {
            stake: {
              aggregatedMarketValue: 20000,
              positions: [
                [
                  {
                    address: '0x7f39C581F595B53c5cb19bD0b3f8dA6c935E2Ca0',
                    name: 'Wrapped liquid staked Ether 2.0',
                    symbol: 'wstETH',
                    decimals: 18,
                    balanceRaw: '800000000000000000000',
                    balance: 800,
                    marketValue: 20000,
                    type: 'protocol',
                    tokens: [
                      {
                        address: '0xae7ab96520DE3A18E5e111B5EaAb095312D7fE84',
                        name: 'Liquid staked Ether 2.0',
                        symbol: 'stETH',
                        decimals: 18,
                        type: 'underlying',
                        balanceRaw: '1000000000000000000',
                        balance: 10,
                        price: 2000,
                        marketValue: 20000,
                        iconUrl:
                          'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0xae7ab96520DE3A18E5e111B5EaAb095312D7fE84/logo.png',
                      },
                    ],
                  },
                ],
              ],
            },
          },
        },
      },
    },
  },
};

const render = () => {
  const mockStore = {
    ...mockState,

    metamask: {
      ...mockState.metamask,
      ...mockNetworkState({ chainId: CHAIN_IDS.MAINNET }),
      allDeFiPositions,
      currencyRates: {
        ETH: {
          conversionRate: 1597.32,
        },
      },
    },
  };
  const store = configureMockStore([thunk])(mockStore);
  return renderWithProvider(<DeFiTab onClickAsset={() => undefined} />, store);
};

describe('DefiList', () => {
  it('renders DeFiList component and shows control bar', async () => {
    await act(async () => {
      render();
    });

    await waitFor(() => {
      expect(
        screen.getByTestId('multichain-token-list-item-secondary-value'),
      ).toHaveTextContent('$20,000.00');
      expect(screen.getByTestId('sort-by-popover-toggle')).toBeInTheDocument();
      expect(screen.getByTestId('sort-by-networks')).toBeInTheDocument();
      expect(screen.getByTestId('avatar-group')).toBeInTheDocument();
      expect(
        screen.queryByTestId('import-token-button'),
      ).not.toBeInTheDocument();
    });
  });
});
