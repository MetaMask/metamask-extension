import React from 'react';
import { fireEvent, screen } from '@testing-library/react';
import { renderWithProvider } from '../../../../test/lib/render-helpers';
import mockState from '../../../../test/data/mock-state.json';
import configureStore from '../../../store/store';
import {
  BalanceEmptyState,
  BalanceEmptyStateProps,
} from './balance-empty-state';

const store = configureStore({
  metamask: {
    ...mockState.metamask,
  },
});

const renderComponent = (props: Partial<BalanceEmptyStateProps> = {}) => {
  return renderWithProvider(<BalanceEmptyState {...props} />, store);
};

describe('BalanceEmptyState', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render the component', () => {
    renderComponent();
    expect(screen.getByRole('button')).toBeInTheDocument();
  });

  it('should open the funding method modal when button is clicked', () => {
    renderComponent();

    const button = screen.getByRole('button');
    fireEvent.click(button);

    expect(
      screen.getByTestId('balance-empty-state-funding-modal'),
    ).toBeInTheDocument();
  });
});
