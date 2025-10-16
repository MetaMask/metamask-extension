import React from 'react';
import { fireEvent, screen } from '@testing-library/react';
import { renderWithProvider } from '../../../../test/lib/render-helpers';
import useRamps from '../../../hooks/ramps/useRamps/useRamps';
import { BalanceEmptyState } from './balance-empty-state';

const renderComponent = (props = {}) => {
  return renderWithProvider(<BalanceEmptyState {...props} />);
};

jest.mock('../../../hooks/ramps/useRamps/useRamps', () => ({
  useRamps: jest.fn(() => ({
    openBuyCryptoInPdapp: jest.fn(),
  })),
}));

describe('BalanceEmptyState', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render the component with correct test id', () => {
    renderComponent();
    expect(screen.getByTestId('balance-empty-state')).toBeInTheDocument();
  });

  it('should call the openBuyCryptoInPdapp function when the button is clicked', () => {
    renderComponent();
    fireEvent.click(screen.getByRole('button', { name: 'Add funds' }));
    expect(useRamps().openBuyCryptoInPdapp).toHaveBeenCalled();
  });
});
