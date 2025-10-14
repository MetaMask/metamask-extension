import React from 'react';
import configureMockStore from 'redux-mock-store';
import { renderWithProvider } from '../../../../../test/lib/render-helpers';
import mockState from '../../../../../test/data/mock-state.json';
import { CHAIN_IDS } from '../../../../../shared/constants/network';
import { mockNetworkState } from '../../../../../test/stub/networks';
import AddFundsModal from './add-funds-modal';

describe('Add funds modal Component', () => {
  const defaultState = {
    metamask: {
      ...mockNetworkState({ chainId: CHAIN_IDS.MAINNET }),
      accountTree: {
        wallets: {},
        selectedAccountGroup: null,
      },
      enabledNetworkMap: {
        eip155: {
          [CHAIN_IDS.MAINNET]: true,
        },
      },
      internalAccounts: mockState.metamask.internalAccounts,
    },
  };

  const mockStore = configureMockStore()(defaultState);

  it('should match snapshot', () => {
    const { container } = renderWithProvider(
      <AddFundsModal
        onClose={jest.fn()}
        token={{
          address: '0x0',
          decimals: 18,
          symbol: 'USDC',
          conversionRate: {
            usd: '1',
          },
        }}
        chainId="0x1"
        payerAddress="0x0"
      />,
      mockStore,
    );

    expect(container).toMatchSnapshot();
  });
});
