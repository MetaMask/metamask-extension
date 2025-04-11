// TODO: Fix in follow-up ticket https://github.com/MetaMask/metamask-extension/issues/31860
// eslint-disable-next-line @typescript-eslint/naming-convention
import React from 'react';
import configureMockStore from 'redux-mock-store';

// TODO: Fix in follow-up ticket https://github.com/MetaMask/metamask-extension/issues/31860
// eslint-disable-next-line @typescript-eslint/naming-convention
import TransactionAlreadyConfirmed from '.';
import mockStore from '../../../../../test/data/mock-state.json';
import { renderWithProvider } from '../../../../../test/jest';

const getStoreWithModalData = () => {
  return configureMockStore()({
    ...mockStore,
    appState: {
      ...mockStore.appState,
      modal: {
        modalState: {
          props: {
            originalTransactionId: 'test',
          },
        },
      },
    },
  });
};

describe('Transaction Already Confirmed modal', () => {
  it('should match snapshot', async () => {
    const { baseElement } = renderWithProvider(
      <TransactionAlreadyConfirmed />,
      getStoreWithModalData(),
    );
    expect(baseElement).toMatchSnapshot();
  });
});
