import React from 'react';
import { fireEvent, render } from '@testing-library/react';
import { Provider } from 'react-redux';
import configureStore from 'redux-mock-store';
import thunk from 'redux-thunk';

import { StakeableLink } from './stakeable-link';

// Mock getPortfolioUrl so we can assert on its arguments
jest.mock('../../../helpers/utils/portfolio', () => ({
  getPortfolioUrl: jest.fn(),
}));

import { getPortfolioUrl } from '../../../helpers/utils/portfolio';

const middlewares = [thunk];
const mockStore = configureStore(middlewares);

function renderWithStore(state: any) {
  const store = mockStore(state);
  return {
    store,
    ...render(
      <Provider store={store}>
        <StakeableLink chainId="0x1" symbol="ETH" />
      </Provider>,
    ),
  };
}

describe('StakeableLink', () => {
  it('passes selected account address to getPortfolioUrl', () => {
    const selectedAddress = '0x42ded9618a4152436a4054d52faf18ab6e797a2b';

    const initialState = {
      metamask: {
        internalAccounts: {
          selectedAccount: 'account-id',
          accounts: {
            'account-id': {
              address: selectedAddress,
              id: 'account-id',
              metadata: {},
              options: {},
              methods: [],
              type: 'ethereum',
            },
          },
        },
        // minimal pieces used by selectors
        preferences: {},
      },
    };

    const { getByTestId } = renderWithStore(initialState);

    // Click the staking entrypoint button
    const button = getByTestId('staking-entrypoint-0x1');
    fireEvent.click(button);

    expect(getPortfolioUrl).toHaveBeenCalledTimes(1);
    const args = (getPortfolioUrl as jest.Mock).mock.calls[0];

    // arguments: endpoint, metamaskEntry, metaMetricsId, metricsEnabled, marketingEnabled, accountAddress
    expect(args[0]).toBe('stake');
    expect(args[1]).toBe('ext_stake_button');
    expect(args[5]).toBe(selectedAddress);
  });
});
