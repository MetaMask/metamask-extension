import React from 'react';
import { screen, act, waitFor } from '@testing-library/react';
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import { renderWithProvider } from '../../../../../test/lib/render-helpers-navigate';
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
const loadingDefiPositions = {
  [mockState.metamask.selectedAddress]: undefined,
};
const noOpenPositions = {
  [mockState.metamask.selectedAddress]: [],
};
const defiApiError = null;

const render = (
  state: 'with-positions' | 'loading-positions' | 'error' | 'no-open-positions',
) => {
  let selectedDeFiPositions;

  if (state === 'with-positions') {
    selectedDeFiPositions = allDeFiPositions;
  } else if (state === 'loading-positions') {
    selectedDeFiPositions = loadingDefiPositions;
  } else if (state === 'no-open-positions') {
    selectedDeFiPositions = noOpenPositions;
  } else {
    selectedDeFiPositions = defiApiError;
  }

  const mockStore = {
    ...mockState,

    metamask: {
      ...mockState.metamask,
      ...mockNetworkState({ chainId: CHAIN_IDS.MAINNET }),
      enabledNetworkMap: {
        eip155: {
          '0x1': true,
        },
      },
      allDeFiPositions: selectedDeFiPositions,
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
      render('with-positions');
    });

    await waitFor(() => {
      const image = screen.getByAltText('stETH logo');

      expect(screen.getByTestId('defi-list-market-value')).toHaveTextContent(
        '$20,000.00',
      );

      expect(image).toBeInTheDocument();
      expect(image).toHaveAttribute(
        'src',
        'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0xae7ab96520DE3A18E5e111B5EaAb095312D7fE84/logo.png',
      );

      expect(screen.getByTestId('avatar-group')).toBeInTheDocument();
      expect(screen.getByTestId('sort-by-popover-toggle')).toBeInTheDocument();
      expect(screen.getByTestId('sort-by-networks')).toBeInTheDocument();

      expect(
        screen.queryByTestId('import-token-button'),
      ).not.toBeInTheDocument();
    });
  });
  it('renders loading spinner', async () => {
    await act(async () => {
      render('loading-positions');
    });

    await waitFor(() => {
      expect(screen.getByTestId('pulse-loader')).toBeInTheDocument();

      expect(screen.getByTestId('sort-by-popover-toggle')).toBeInTheDocument();
      expect(screen.getByTestId('sort-by-networks')).toBeInTheDocument();

      expect(
        screen.queryByTestId('import-token-button'),
      ).not.toBeInTheDocument();
    });
  });
  it('renders error message', async () => {
    await act(async () => {
      render('error');
    });

    await waitFor(() => {
      expect(screen.getByTestId('defi-tab-error-message')).toHaveTextContent(
        'We could not load this page.',
      );
      expect(screen.getByTestId('defi-tab-error-message')).toHaveTextContent(
        'Try visiting again later.',
      );
      expect(screen.getByTestId('sort-by-popover-toggle')).toBeInTheDocument();
      expect(screen.getByTestId('sort-by-networks')).toBeInTheDocument();

      expect(
        screen.queryByTestId('import-token-button'),
      ).not.toBeInTheDocument();
    });
  });
  it('renders no positions message', async () => {
    await act(async () => {
      render('no-open-positions');
    });

    await waitFor(() => {
      expect(screen.queryByText('No positions yet')).toBeInTheDocument();
      expect(screen.queryByText('Start earning')).toBeInTheDocument();
      expect(screen.getByTestId('sort-by-popover-toggle')).toBeInTheDocument();
      expect(screen.getByTestId('sort-by-networks')).toBeInTheDocument();

      expect(
        screen.queryByTestId('import-token-button'),
      ).not.toBeInTheDocument();
    });
  });
});
