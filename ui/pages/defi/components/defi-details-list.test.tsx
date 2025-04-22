import React from 'react';
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import { CHAIN_IDS } from '../../../../shared/constants/network';
import { renderWithProvider } from '../../../../test/jest/rendering';
import mockState from '../../../../test/data/mock-state.json';
import DefiDetailsList from './defi-details-list';

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
  const store = configureMockStore([thunk])(mockState);

  beforeAll(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    store.clearActions();
    jest.restoreAllMocks();
  });

  it('renders defi details list', () => {
    const { container } = renderWithProvider(
      <DefiDetailsList
        tokens={[
          [
            {
              symbol: 'ETH',
              type: 'underlying',
              address: '0x0',
              name: 'Ethereum',
              decimals: 18,
              balance: 500,
              balanceRaw: '500000000000000000000',
              marketValue: 2000,
              iconUrl: 'https://example.com/eth-icon.png',
            },
            {
              symbol: 'ETH',
              type: 'underlying-claimable',
              address: '0x0',
              name: 'Ethereum',
              decimals: 18,
              balance: 500,
              balanceRaw: '500000000000000000000',
              marketValue: 2000,
              iconUrl: 'https://example.com/eth-icon.png',
            },
          ],
        ]}
        positionType={'supply'}
        chainId={'0x1'}
      />,
      store,
    );

    expect(container).toMatchSnapshot();
  });
});
