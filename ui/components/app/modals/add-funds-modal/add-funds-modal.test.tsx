import React from 'react';
import configureMockStore from 'redux-mock-store';
import { renderWithProvider } from '../../../../../test/lib/render-helpers-navigate';
import mockState from '../../../../../test/data/mock-state.json';
import { CHAIN_IDS } from '../../../../../shared/constants/network';
import { mockNetworkState } from '../../../../../test/stub/networks';
import AddFundsModal from './add-funds-modal';

describe('Add funds modal Component', () => {
  const defaultState = {
    metamask: {
      ...mockNetworkState({ chainId: CHAIN_IDS.MAINNET }),
      selectedAccountGroup: null,
      accountTree: {
        wallets: {},
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

  it('enables the buy crypto button when the chain is not in buyable chains', () => {
    const storeWithUnsupportedChain = configureMockStore()({
      ...defaultState,
      ramps: {
        buyableChains: [{ chainId: 1, active: true }],
      },
    });

    const { getByTestId } = renderWithProvider(
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
        chainId={CHAIN_IDS.SEPOLIA}
        payerAddress="0x0"
      />,
      storeWithUnsupportedChain,
    );

    expect(getByTestId('add-funds-modal-buy-crypto-button')).toBeEnabled();
  });
});
