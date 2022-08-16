import React from 'react';
import configureStore from 'redux-mock-store';
import { fireEvent, screen, waitFor } from '@testing-library/react';
import { renderWithProvider } from '../../../../test/lib/render-helpers';
import { CHAIN_IDS } from '../../../../shared/constants/network';
import MenuBar from './menu-bar';

const initState = {
  activeTab: {},
  metamask: {
    provider: {
      chainId: CHAIN_IDS.ROPSTEN,
    },
    selectedAddress: '0x0dcd5d886577d5081b0c52e242ef29e70be3e7bc',
    identities: {
      '0x0dcd5d886577d5081b0c52e242ef29e70be3e7bc': {
        address: '0x0dcd5d886577d5081b0c52e242ef29e70be3e7bc',
        name: 'Account 1',
      },
    },
    keyrings: [
      {
        type: 'HD Key Tree',
        accounts: ['0x0dcd5d886577d5081b0c52e242ef29e70be3e7bc'],
      },
    ],
    frequentRpcListDetail: [],
  },
};
const mockStore = configureStore();

describe('MenuBar', () => {
  it('opens account detail menu when account options is clicked', async () => {
    let accountOptionsMenu;

    const store = mockStore(initState);
    renderWithProvider(<MenuBar />, store);

    accountOptionsMenu = screen.queryByTestId('account-options-menu');
    expect(accountOptionsMenu).not.toBeInTheDocument();

    const accountOptions = screen.queryByTestId('account-options-menu-button');
    fireEvent.click(accountOptions);

    await waitFor(() => {
      accountOptionsMenu = screen.queryByTestId('account-options-menu');
      expect(accountOptionsMenu).toBeInTheDocument();
    });
  });

  it('shouldnt open the account options menu when clicked twice', async () => {
    const store = mockStore(initState);
    renderWithProvider(<MenuBar />, store);

    const accountOptionsMenu = screen.queryByTestId('account-options-menu');
    expect(accountOptionsMenu).not.toBeInTheDocument();

    const accountOptionsButton = screen.queryByTestId(
      'account-options-menu-button',
    );
    // Couldnt fireEvent multiple/seperate times, this is the workaround.
    fireEvent.doubleClick(accountOptionsButton);

    expect(accountOptionsMenu).not.toBeInTheDocument();
  });
});
