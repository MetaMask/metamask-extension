import React from 'react';
import configureMockStore from 'redux-mock-store';
import { fireEvent } from '@testing-library/react';
import { EthAccountType, EthMethod } from '@metamask/keyring-api';
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
              name: 'Account 1',
              keyring: {
                type: 'HD Key Tree',
              },
            },
            options: {},
            methods: [...Object.values(EthMethod)],
            type: EthAccountType.Eoa,
          },
        },
        selectedAccount: 'cf8dace4-9439-4bd4-b3a8-88c821c8fcb3',
      },
    },
  };

  const props = {
    hideModal: jest.fn(),
    removeAccount: jest.fn().mockResolvedValue(),
    identity: {
      address: '0x0',
      id: 'cf8dace4-9439-4bd4-b3a8-88c821c8fcb3',
      metadata: {
        name: 'Account 1',
        keyring: {
          type: 'HD Key Tree',
        },
      },
      options: {},
      mmethods: [...Object.values(EthMethod)],
      type: EthAccountType.Eoa,
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

  it('should call method removeAccount with account address', async () => {
    const { queryByText } = renderWithProvider(
      <ConfirmRemoveAccount.WrappedComponent {...props} />,
      mockStore,
    );

    fireEvent.click(queryByText('Remove'));

    expect(props.removeAccount).toHaveBeenCalledWith(props.identity.address);
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
