import React from 'react';
import { screen } from '@testing-library/react';
import { renderWithProvider } from '../../../../../../test/jest';
import configureStore from '../../../../../store/store';
import { TotalBalance } from './total-balance';

describe('TotalBalance Component', () => {
  const renderComponent = (props = {}) => {
    const store = configureStore({});
    return renderWithProvider(<TotalBalance {...props} />, store);
  };

  it('renders with default props', () => {
    renderComponent();

    expect(screen.getByText('Total $12.00')).toBeInTheDocument();
    // We don't test the popover content directly as it's only visible on hover
  });

  it('renders with custom props', () => {
    renderComponent({
      totalAmount: '$25.50',
      networksLoaded: 5,
      totalNetworks: 10,
    });

    expect(screen.getByText('Total $25.50')).toBeInTheDocument();
    // We don't test the popover content directly as it's only visible on hover
  });
});
