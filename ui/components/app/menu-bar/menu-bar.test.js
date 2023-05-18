import React from 'react';
import configureStore from 'redux-mock-store';
import { fireEvent, screen, waitFor } from '@testing-library/react';
import { renderWithProvider } from '../../../../test/lib/render-helpers';
import { CHAIN_IDS } from '../../../../shared/constants/network';
import { KeyringType } from '../../../../shared/constants/keyring';
import mockState from '../../../../test/data/mock-state.json';
import MenuBar from './menu-bar';

const initState = {
  ...mockState,
  activeTab: {},
  metamask: {
    ...mockState.metamask,
    providerConfig: {
      chainId: CHAIN_IDS.GOERLI,
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
        type: KeyringType.hdKeyTree,
        accounts: ['0x0dcd5d886577d5081b0c52e242ef29e70be3e7bc'],
      },
    ],
    networkConfigurations: {},
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

  it('shows a custodial account detail', async () => {
    const customState = {
      ...mockState,
      activeTab: {},
      metamask: {
        ...mockState.metamask,
        networkConfigurations: {},

        providerConfig: {
          type: 'test',
          chainId: '1',
        },
        identities: {
          '0x5Ab19e7091dD208F352F8E727B6DCC6F8aBB6275': {
            name: 'Custody Account A',
            address: '0x5Ab19e7091dD208F352F8E727B6DCC6F8aBB6275',
          },
        },
        selectedAddress: '0x5Ab19e7091dD208F352F8E727B6DCC6F8aBB6275',
        waitForConfirmDeepLinkDialog: '123',
        keyrings: [
          {
            type: 'Custody',
            accounts: ['0x5Ab19e7091dD208F352F8E727B6DCC6F8aBB6275'],
          },
        ],
        custodyStatusMaps: '123',
        custodyAccountDetails: {
          '0x5Ab19e7091dD208F352F8E727B6DCC6F8aBB6275': {
            custodianName: 'saturn',
          },
        },
        custodianSupportedChains: {
          '0x5Ab19e7091dD208F352F8E727B6DCC6F8aBB6275': {
            supportedChains: ['1', '2'],
            custodianName: 'saturn',
          },
        },
        mmiConfiguration: {
          portfolio: {
            enabled: true,
            url: 'https://dashboard.metamask-institutional.io',
          },
          custodians: [
            {
              type: 'saturn',
              name: 'saturn',
              apiUrl: 'https://saturn-custody.dev.metamask-institutional.io',
              iconUrl: 'images/saturn.svg',
              displayName: 'Saturn Custody',
              production: true,
              refreshTokenUrl: null,
              isNoteToTraderSupported: false,
              version: 1,
            },
          ],
        },
      },
    };

    const store = mockStore(customState);
    renderWithProvider(<MenuBar />, store);

    const accountOptions = screen.queryByTestId('account-options-menu-button');
    fireEvent.click(accountOptions);

    await waitFor(() => {
      const custodyLogosss = screen.queryByTestId('custody-logo');
      expect(custodyLogosss).toBeInTheDocument();
    });
  });
});
