import React from 'react';
import configureMockStore from 'redux-mock-store';

import {
  renderWithProvider,
  createSwapsMockStore,
} from '../../../../test/jest';
import SmartTransactionStatus from '.';

describe('SmartTransactionStatus', () => {
  it('renders the component with initial props', () => {
    const store = configureMockStore()(createSwapsMockStore());
    const { getByText } = renderWithProvider(<SmartTransactionStatus />, store);
    expect(getByText('Transaction is pending')).toBeInTheDocument();
    expect(
      getByText('Your transaction is being processed.'),
    ).toBeInTheDocument();
    expect(getByText('Cancel')).toBeInTheDocument();
  });
});
