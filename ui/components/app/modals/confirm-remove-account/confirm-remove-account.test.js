import React from 'react';
import configureMockStore from 'redux-mock-store';
import { fireEvent } from '@testing-library/react';
import { renderWithProvider } from '../../../../../test/lib/render-helpers';
import ConfirmRemoveAccount from '.';

describe('Confirm Remove Account', () => {
  const state = {
    metamask: {
      providerConfig: {
        chainId: '0x99',
      },
      internalAccounts: {
        accounts: {
          'cf8dace4-9439-4bd4-b3a8-88c821c8fcb3': {
            address: '0x0dcd5d886577d5081b0c52e242ef29e70be3e7bc',
            id: 'cf8dace4-9439-4bd4-b3a8-88c821c8fcb3',
            metadata: {
              keyring: {
                type: 'HD Key Tree',
              },
            },
            name: 'Account 1',
            options: {},
            supportedMethods: [
              'personal_sign',
              'eth_sendTransaction',
              'eth_sign',
              'eth_signTransaction',
              'eth_signTypedData',
              'eth_signTypedData_v1',
              'eth_signTypedData_v2',
              'eth_signTypedData_v3',
              'eth_signTypedData_v4',
            ],
            type: 'eip155:eoa',
          },
        },
        selectedAccount: 'cf8dace4-9439-4bd4-b3a8-88c821c8fcb3',
      },
    },
  };

  const props = {
    hideModal: jest.fn(),
    removeAccount: jest.fn().mockResolvedValue(),
    account: {
      address: '0x0dcd5d886577d5081b0c52e242ef29e70be3e7bc',
      id: 'cf8dace4-9439-4bd4-b3a8-88c821c8fcb3',
      metadata: {
        keyring: {
          type: 'HD Key Tree',
        },
      },
      name: 'Account 1',
      options: {},
      supportedMethods: [
        'personal_sign',
        'eth_sendTransaction',
        'eth_sign',
        'eth_signTransaction',
        'eth_signTypedData',
        'eth_signTypedData_v1',
        'eth_signTypedData_v2',
        'eth_signTypedData_v3',
        'eth_signTypedData_v4',
      ],
      type: 'eip155:eoa',
    },
    chainId: '0x99',
    rpcPrefs: {},
  };

  const mockStore = configureMockStore()(state);

  it('should match snapshot', () => {
    const { container } = renderWithProvider(
      <ConfirmRemoveAccount.WrappedComponent {...props} />,
      mockStore,
    );

    expect(container).toMatchSnapshot();
  });

  it('should only hide modal when clicking "Nevermind"', () => {
    const { queryByText } = renderWithProvider(
      <ConfirmRemoveAccount.WrappedComponent {...props} />,
      mockStore,
    );

    fireEvent.click(queryByText('Nevermind'));

    expect(props.removeAccount).not.toHaveBeenCalled();
    expect(props.hideModal).toHaveBeenCalled();
  });

  it('should call remove account with identity address', async () => {
    const { queryByText } = renderWithProvider(
      <ConfirmRemoveAccount.WrappedComponent {...props} />,
      mockStore,
    );

    fireEvent.click(queryByText('Remove'));

    expect(props.removeAccount).toHaveBeenCalledWith(props.account.id);
    expect(props.hideModal).toHaveBeenCalled();
  });

  it('should close modal when clicking close from the header', () => {
    const { queryByTestId } = renderWithProvider(
      <ConfirmRemoveAccount.WrappedComponent {...props} />,
      mockStore,
    );

    fireEvent.click(queryByTestId('modal-header-close'));

    expect(props.hideModal).toHaveBeenCalled();
  });
});
