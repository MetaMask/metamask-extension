import React from 'react';
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import { screen, act, waitFor } from '@testing-library/react';
import mockState from '../../../../../test/data/mock-state.json';
import { renderWithProvider } from '../../../../../test/jest';
import DeFiList from './defi-list';

const render = (
  allDeFiPositions: {
    [x: string]:
      | {
          '0x5': {
            aggregatedMarketValue: number;
            protocols: {
              lido: {
                protocolDetails: { name: string; iconUrl: string };
                aggregatedMarketValue: number;
                positionTypes: {
                  stake: {
                    aggregatedMarketValue: number;
                    positions: {
                      address: string;
                      name: string;
                      symbol: string;
                      decimals: number;
                      balanceRaw: string;
                      balance: number;
                      marketValue: number;
                      type: string;
                      tokens: {
                        address: string;
                        name: string;
                        symbol: string;
                        decimals: number;
                        type: string;
                        balanceRaw: string;
                        balance: number;
                        price: number;
                        marketValue: number;
                        iconUrl: string;
                      }[];
                    }[][];
                  };
                };
              };
            };
          };
        }
      | undefined;
  } | null,
) => {
  const mockStore = {
    ...mockState,
    metamask: {
      ...mockState.metamask,
      allDeFiPositions,
      enabledNetworkMap: {
        '0x5': true,
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
    const lidoPosition = {
      [mockState.metamask.selectedAddress]: {
        '0x5': {
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
                            address:
                              '0xae7ab96520DE3A18E5e111B5EaAb095312D7fE84',
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

    await act(async () => {
      render(lidoPosition);
    });

    await waitFor(() => {
      expect(screen.getByText('Lido')).toBeInTheDocument();
    });
  });
});
