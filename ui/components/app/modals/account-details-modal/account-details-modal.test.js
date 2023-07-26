import React from 'react';
import configureMockState from 'redux-mock-store';
import { fireEvent } from '@testing-library/react';
import thunk from 'redux-thunk';
import { renderWithProvider } from '../../../../../test/lib/render-helpers';
import mockState from '../../../../../test/data/mock-state.json';
import {
  etherscanViewOn,
  exportPrivateKey,
} from '../../../../../app/_locales/en/messages.json';
import AccountDetailsModal from '.';

const mockShowModal = jest.fn();

jest.mock('../../../../store/actions.ts', () => {
  return {
    showModal: () => mockShowModal,
  };
});

describe('Account Details Modal', () => {
  const mockStore = configureMockState([thunk])(mockState);

  global.platform = { openTab: jest.fn() };

  it('should set account label when changing default account label', () => {
    const { queryByTestId, getByPlaceholderText } = renderWithProvider(
      <AccountDetailsModal />,
      mockStore,
    );

    const editButton = queryByTestId('editable-label-button');

    expect(queryByTestId('editable-input')).not.toBeInTheDocument();
    fireEvent.click(editButton);
    expect(queryByTestId('editable-input')).toBeInTheDocument();

    const editableInput = getByPlaceholderText('Account name');
    const newAccountLabel = 'New Label';

    fireEvent.change(editableInput, {
      target: { value: newAccountLabel },
    });

    expect(editableInput).toHaveAttribute('value', newAccountLabel);
  });

  it('opens new tab when view block explorer is clicked', () => {
    const { queryByText } = renderWithProvider(
      <AccountDetailsModal />,
      mockStore,
    );

    const viewOnEtherscan = queryByText(etherscanViewOn.message);

    fireEvent.click(viewOnEtherscan);

    expect(global.platform.openTab).toHaveBeenCalled();
  });

  it('shows export private key modal when clicked', () => {
    const { queryByText } = renderWithProvider(
      <AccountDetailsModal />,
      mockStore,
    );

    const exportPrivButton = queryByText(exportPrivateKey.message);

    fireEvent.click(exportPrivButton);

    expect(mockShowModal).toHaveBeenCalled();
  });

  it('sets blockexplorerview text when block explorer url in rpcPrefs exists', () => {
    const blockExplorerUrl = 'https://block.explorer';

    const customProviderMockState = {
      ...mockState,
      metamask: {
        ...mockState.metamask,
        networkConfigurations: {
          networkConfigurationId: {
            chainId: '0x99',
            rpcPrefs: {
              blockExplorerUrl,
            },
          },
        },
        providerConfig: {
          chainId: '0x99',
        },
      },
    };

    const customProviderMockStore = configureMockState([thunk])(
      customProviderMockState,
    );

    const { queryByText } = renderWithProvider(
      <AccountDetailsModal />,
      customProviderMockStore,
    );

    expect(queryByText(/block.explorer/u)).toBeInTheDocument();
  });

  it('does not display export private key if the keyring is snaps', () => {
    const mockStateWithSnapKeyring = {
      appState: {
        networkDropdownOpen: false,
        gasIsLoading: false,
        isLoading: false,
        modal: {
          open: false,
          modalState: {
            name: null,
            props: {},
          },
          previousModalState: {
            name: null,
          },
        },
        warning: null,
        customTokenAmount: '10',
      },
      history: {
        mostRecentOverviewPage: '/mostRecentOverviewPage',
      },
      metamask: {
        providerConfig: {
          type: 'rpc',
          chainId: '0x5',
          ticker: 'ETH',
          id: 'testNetworkConfigurationId',
        },
        keyrings: [
          {
            type: 'Snap Keyring',
            accounts: [
              '0x0dcd5d886577d5081b0c52e242ef29e70be3e7bc',
              '0xec1adf982415d2ef5ec55899b9bfb8bc0f29251b',
            ],
          },
          {
            type: 'Ledger Hardware',
            accounts: ['0xc42edfcc21ed14dda456aa0756c153f7985d8813'],
          },
          {
            type: 'Simple Key Pair',
            accounts: ['0xeb9e64b93097bc15f01f13eae97015c57ab64823'],
          },
        ],
        identities: {
          '0x0dcd5d886577d5081b0c52e242ef29e70be3e7bc': {
            address: '0x0dcd5d886577d5081b0c52e242ef29e70be3e7bc',
            name: 'Test Account',
          },
          '0xec1adf982415d2ef5ec55899b9bfb8bc0f29251b': {
            address: '0xec1adf982415d2ef5ec55899b9bfb8bc0f29251b',
            name: 'Test Account 2',
          },
          '0xc42edfcc21ed14dda456aa0756c153f7985d8813': {
            address: '0xc42edfcc21ed14dda456aa0756c153f7985d8813',
            name: 'Test Ledger 1',
          },
          '0xeb9e64b93097bc15f01f13eae97015c57ab64823': {
            name: 'Test Account 3',
            address: '0xeb9e64b93097bc15f01f13eae97015c57ab64823',
          },
        },
        networkDetails: {
          EIPS: {
            1559: true,
          },
        },
        frequentRpcListDetail: [],
        subjectMetadata: {
          'npm:@metamask/test-snap-bip44': {
            name: '@metamask/test-snap-bip44',
            version: '1.2.3',
            subjectType: 'snap',
          },
        },
        notifications: {
          test: {
            id: 'test',
            origin: 'local:http://localhost:8086/',
            createdDate: 1652967897732,
            readDate: null,
            message: 'Hello, http://localhost:8086!',
          },
          test2: {
            id: 'test2',
            origin: 'local:http://localhost:8086/',
            createdDate: 1652967897732,
            readDate: 1652967897732,
            message: 'Hello, http://localhost:8086!',
          },
        },
        cachedBalances: {},
        incomingTransactions: {},
        selectedAddress: '0x0dcd5d886577d5081b0c52e242ef29e70be3e7bc',
        accounts: {
          '0x0dcd5d886577d5081b0c52e242ef29e70be3e7bc': {
            balance: '0x346ba7725f412cbfdb',
            address: '0x0dcd5d886577d5081b0c52e242ef29e70be3e7bc',
          },
          '0xec1adf982415d2ef5ec55899b9bfb8bc0f29251b': {
            address: '0xec1adf982415d2ef5ec55899b9bfb8bc0f29251b',
            balance: '0x0',
          },
          '0xc42edfcc21ed14dda456aa0756c153f7985d8813': {
            address: '0xc42edfcc21ed14dda456aa0756c153f7985d8813',
            balance: '0x0',
          },
          '0xeb9e64b93097bc15f01f13eae97015c57ab64823': {
            address: '0xeb9e64b93097bc15f01f13eae97015c57ab64823',
            balance: '0x0',
          },
        },
      },
    };
    const mockStoreWithSnapKeyring = configureMockState([thunk])(
      mockStateWithSnapKeyring,
    );
    const { queryByText } = renderWithProvider(
      <AccountDetailsModal />,
      mockStoreWithSnapKeyring,
    );

    const exportPrivateKeyButton = queryByText(exportPrivateKey.message);

    expect(exportPrivateKeyButton).not.toBeInTheDocument();
  });
});
