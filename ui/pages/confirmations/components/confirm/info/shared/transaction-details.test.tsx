import React from 'react';
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import { genUnapprovedContractInteractionConfirmation } from '../../../../../../../test/data/confirmations/contract-interaction';
import mockState from '../../../../../../../test/data/mock-state.json';
import { renderWithProvider } from '../../../../../../../test/lib/render-helpers';
import { TransactionDetails } from './transaction-details';

describe('<TransactionDetails />', () => {
  const middleware = [thunk];

  it('does not render component for transaction details', () => {
    const state = { ...mockState, confirm: { currentConfirmation: null } };
    const mockStore = configureMockStore(middleware)(state);
    const { container } = renderWithProvider(<TransactionDetails />, mockStore);
    expect(container).toMatchSnapshot();
  });

  it('renders component for transaction details', () => {
    const state = {
      ...mockState,
      confirm: {
        currentConfirmation: genUnapprovedContractInteractionConfirmation(),
      },
    };
    const mockStore = configureMockStore(middleware)(state);
    const { container } = renderWithProvider(<TransactionDetails />, mockStore);
    expect(container).toMatchSnapshot();
  });
});
