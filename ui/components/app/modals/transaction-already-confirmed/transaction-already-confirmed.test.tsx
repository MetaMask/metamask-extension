import React from 'react';
import configureMockStore from 'redux-mock-store';
import mockStore from '../../../../../test/data/mock-state.json';

import { renderWithProvider } from '../../../../../test/jest';
import TransactionAlreadyConfirmed from '.';

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
