import React from 'react';
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import { CHAIN_IDS } from '../../../../shared/constants/network';
import { renderWithProvider } from '../../../../test/jest/rendering';
import mockState from '../../../../test/data/mock-state.json';
import DeFiPage from './defi-details-page';

const mockHistoryPush = jest.fn();

const mockUseParams = jest
  .fn()
  .mockReturnValue({ chainId: CHAIN_IDS.MAINNET, protocolId: 'aave' });

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useLocation: jest.fn(() => ({ search: '' })),
  useHistory: () => ({
    push: mockHistoryPush,
  }),
  useParams: () => mockUseParams(),
}));

describe('DeFiDetailsPage', () => {
  const mockStore = {
    ...mockState,
    metamask: {
      allDeFiPositions: {
        [mockState.metamask.selectedAddress]: {
          '0x1': {
            aggregatedMarketValue: 20540,
            protocols: {
              aave: {
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
      },
      ...mockState.metamask,
    },
  };

  const store = configureMockStore([thunk])(mockStore);

  beforeAll(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    store.clearActions();
    jest.restoreAllMocks();
  });

  it('renders defi asset page', () => {
    const { container } = renderWithProvider(<DeFiPage />, store);

    expect(container).toMatchSnapshot();
  });
});
