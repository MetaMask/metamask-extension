import React from 'react';
import { screen } from '@testing-library/react';
import { renderWithProvider } from '../../../../test/jest';
import configureStore from '../../../store/store';
import mockState from '../../../../test/data/mock-state.json';
import TransactionList from './transaction-list.component';

const render = () => {
  const store = configureStore({
    metamask: {
      ...mockState.metamask,
      transactions: [],
    },
  });
  return renderWithProvider(<TransactionList />, store);
};

describe('TransactionList', () => {
  it('renders TransactionList component and shows You have no transactions text', () => {
    render();
    expect(screen.getByText('You have no transactions')).toBeInTheDocument();
  });
});
