import React from 'react';
import thunk from 'redux-thunk';
import { waitFor, fireEvent } from '@testing-library/react';
import configureStore from 'redux-mock-store';
import { renderWithProvider } from '../../../../../test/lib/render-helpers-navigate';
import mockState from '../../../../../test/data/mock-state.json';
// TODO: Remove restricted import
// eslint-disable-next-line import/no-restricted-paths
import messages from '../../../../../app/_locales/en/messages.json';
import { createMockInternalAccount } from '../../../../../test/jest/mocks';
import NewAccountModal from './new-account-modal.container';

const mockAddress = '0x1234567890';
const mockNewAccount = createMockInternalAccount({
  name: 'New Account',
  address: mockAddress,
});

const mockOnCreateNewAccount = jest.fn();
const mockNewAccountNumber = 2;
const mockNewMetamaskState = {
  ...mockState.metamask,
  currentLocale: 'en',
};

jest.mock('../../../../selectors/accounts', () => ({
  ...jest.requireActual('../../../../selectors/accounts'),
  getInternalAccountByAddress: () => mockNewAccount,
}));

const mockSubmitRequestToBackground = jest.fn().mockImplementation((method) => {
  switch (method) {
    case 'addNewAccount':
      return mockAddress;
    case 'setAccountLabel':
      return {};
    case 'getState':
      return mockNewMetamaskState;
    default:
      return {};
  }
});

jest.mock('../../../../store/background-connection', () => ({
  ...jest.requireActual('../../../../store/background-connection'),
  submitRequestToBackground: (method: string, args: unknown) =>
    mockSubmitRequestToBackground(method, args),
}));

jest.mock('../../../../store/store-instance', () => ({
  getStoreInstance: () => ({
    subscribe: (listener: () => void) => {
      Promise.resolve().then(listener);
      return () => {};
    },
  }),
}));

const renderModal = (
  props = {
    onCreateNewAccount: mockOnCreateNewAccount,
    newAccountNumber: mockNewAccountNumber,
  },
) => {
  const state = {
    ...mockState,
    metamask: {
      ...mockState.metamask,
      currentLocale: 'en',
    },
    appState: {
      ...mockState.appState,
      modal: {
        ...mockState.appState.modal,
        modalState: {
          name: 'NEW_ACCOUNT',
          props,
        },
      },
    },
  };
  const middlewares = [thunk];
  const mockStore = configureStore(middlewares);
  const store = mockStore(state);

  return {
    // @ts-expect-error TODO: Remove once `NewAccountModal` is converted to TypeScript.
    render: renderWithProvider(<NewAccountModal />, store),
    store,
  };
};

describe('NewAccountModal', () => {
  it('calls addNewAccount via background when adding account', async () => {
    const { render } = renderModal();
    const { getByText } = render;
    const addAccountButton = getByText(messages.save.message);
    expect(addAccountButton).toBeInTheDocument();

    fireEvent.click(addAccountButton);

    await waitFor(() => {
      expect(mockSubmitRequestToBackground).toHaveBeenCalledWith(
        'addNewAccount',
        expect.anything(),
      );
    });
  });
});
