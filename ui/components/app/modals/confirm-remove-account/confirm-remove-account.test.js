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
    },
  };

  const props = {
    hideModal: jest.fn(),
    removeAccount: jest.fn().mockResolvedValue(),
    identity: {
      address: '0x0',
      name: 'Account 1',
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
