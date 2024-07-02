import React from 'react';
import { screen } from '@testing-library/react';
import { renderWithProvider } from '../../../../test/jest';
import configureStore from '../../../store/store';
import mockState from '../../../../test/data/mock-state.json';
import { MOCK_ACCOUNT_BIP122_P2WPKH } from '../../../../test/data/mock-accounts';
import TransactionList from './transaction-list.component';

const defaultState = {
  metamask: {
    ...mockState.metamask,
    transactions: [],
  },
};

const btcState = {
  metamask: {
    ...mockState.metamask,
    internalAccounts: {
      ...mockState.metamask.internalAccounts,
      accounts: {
        ...mockState.metamask.internalAccounts.accounts,
        [MOCK_ACCOUNT_BIP122_P2WPKH.id]: MOCK_ACCOUNT_BIP122_P2WPKH,
      },
      selectedAccount: MOCK_ACCOUNT_BIP122_P2WPKH.id,
    },
    transactions: [],
  },
};

const render = (state = defaultState) => {
  const store = configureStore(state);
  return renderWithProvider(<TransactionList />, store);
};

describe('TransactionList', () => {
  it('renders TransactionList component and shows You have no transactions text', () => {
    render();
    expect(screen.getByText('You have no transactions')).toBeInTheDocument();
  });

  it('renders TransactionList component and shows Bitcoin activity is not supported text', () => {
    render(btcState);
    expect(
      screen.getByText('Bitcoin activity is not supported'),
    ).toBeInTheDocument();
  });
});
