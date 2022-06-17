import React from 'react';
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';

import {
  renderWithProvider,
  createSwapsMockStore,
  setBackgroundConnection,
} from '../../../../test/jest';
import SmartTransactionStatus from '.';

const middleware = [thunk];
setBackgroundConnection({
  stopPollingForQuotes: jest.fn(),
  setBackgroundSwapRouteState: jest.fn(),
});

describe('SmartTransactionStatus', () => {
  it('renders the component with initial props', () => {
    const store = configureMockStore(middleware)(createSwapsMockStore());
    const { getByText } = renderWithProvider(<SmartTransactionStatus />, store);
    expect(getByText('Publicly submitting your Swap...')).toBeInTheDocument();
    expect(getByText('Close')).toBeInTheDocument();
  });
});
