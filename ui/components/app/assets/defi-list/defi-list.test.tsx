import React from 'react';
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import { screen, act, waitFor } from '@testing-library/react';
import { DeFiPositionsControllerState } from '@metamask/assets-controllers';
import mockState from '../../../../../test/data/mock-state.json';
import { renderWithProvider } from '../../../../../test/jest';
import DeFiList from './defi-list';

const lidoPosition: DeFiPositionsControllerState['allDeFiPositions'] = {
  [mockState.metamask.selectedAddress]: {
    '0x5': {
      aggregatedMarketValue: 20540,
      protocols: {
        lido: {
          protocolDetails: {
            name: 'Lido',
            iconUrl: 'logo.png',
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
                        iconUrl: 'logo.png',
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
const mountainPositionLowValue: DeFiPositionsControllerState['allDeFiPositions'] =
  {
    [mockState.metamask.selectedAddress]: {
      '0x5': {
        aggregatedMarketValue: 0.0000000001,
        protocols: {
          'mountain-protocol': {
            protocolDetails: {
              name: 'mountain-protocol',
              iconUrl: 'logo.png',
            },
            aggregatedMarketValue: 0.0000000001,
            positionTypes: {
              stake: {
                aggregatedMarketValue: 0.0000000001,
                positions: [
                  [
                    {
                      address: '0x59D9356E565Ab3A36dD77763Fc0d87fEaf85508C',
                      name: 'Mountain Protocol USD',
                      symbol: 'USDM',
                      decimals: 18,
                      balanceRaw: '1',
                      type: 'protocol',
                      tokens: [
                        {
                          address: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
                          name: 'USD Coin',
                          symbol: 'USDC',
                          decimals: 6,
                          type: 'underlying',
                          balanceRaw: '0',
                          balance: 0,
                          price: 0.999964,
                          iconUrl: 'logo.png',
                        },
                      ],
                      balance: 1e-18,
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

const render = (
  allDeFiPositions:
    | DeFiPositionsControllerState['allDeFiPositions']
    | null
    | Record<string, undefined>
    | Record<string, []>,
) => {
  const mockStore = {
    ...mockState,
    metamask: {
      ...mockState.metamask,
      allDeFiPositions,
      enabledNetworkMap: {
        eip155: {
          '0x5': true,
        },
      },
    },
  };
  const store = configureMockStore([thunk])(mockStore);
  return renderWithProvider(<DeFiList onClick={() => undefined} />, store);
};

describe('DeFiDetailsPage', () => {
  it('renders error message', async () => {
    await act(async () => {
      render(null);
    });

    await waitFor(() => {
      expect(
        screen.getByText('We could not load this page.'),
      ).toBeInTheDocument();
      expect(screen.getByText('Try visiting again later.')).toBeInTheDocument();
    });
  });
  it('readers loading spinner', async () => {
    const loadingState = {
      [mockState.metamask.selectedAddress]: undefined,
    };

    await act(async () => {
      render(loadingState);
    });

    await waitFor(() => {
      expect(screen.getByTestId('pulse-loader')).toBeInTheDocument();
    });
  });
  it('renders positions', async () => {
    await act(async () => {
      render(lidoPosition);
    });

    await waitFor(() => {
      expect(screen.getByAltText('stETH logo')).toHaveAttribute(
        'src',
        'logo.png',
      );
      expect(screen.getByText('Lido')).toBeInTheDocument();
      expect(screen.getByText('$20,000.00')).toBeInTheDocument();
      expect(screen.getByText('stETH only')).toBeInTheDocument();
    });
  });
  it('renders low value position', async () => {
    await act(async () => {
      render(mountainPositionLowValue);
    });

    await waitFor(() => {
      expect(screen.getByAltText('USDC logo')).toHaveAttribute(
        'src',
        'logo.png',
      );
      expect(screen.getByText('mountain-protocol')).toBeInTheDocument();
      const marketValueElement = screen.getByTestId('defi-list-market-value');
      expect(marketValueElement).toBeInTheDocument();
      expect(marketValueElement).toHaveTextContent('<$0.01');
      expect(screen.getByText('USDC only')).toBeInTheDocument();
    });
  });
  it('renders no positions message', async () => {
    await act(async () => {
      render({
        [mockState.metamask.selectedAddress]: [],
      });
    });

    await waitFor(() => {
      expect(
        screen.getByText('We may not support your protocol yet.'),
      ).toBeInTheDocument();
      expect(
        screen.getByText("Can't find what you're looking for?"),
      ).toBeInTheDocument();
    });
  });
});
