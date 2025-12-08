import React from 'react';
import { renderWithProvider } from '../../../../../../test/jest';
import { AdvancedGasPriceModal } from './advanced-gas-price-modal';

describe('AdvancedGasPriceModal', () => {
  const mockSetActiveModal = jest.fn();
  const mockHandleCloseModals = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the modal with header', () => {
    const { getByText } = renderWithProvider(
      <AdvancedGasPriceModal
        setActiveModal={mockSetActiveModal}
        handleCloseModals={mockHandleCloseModals}
      />,
    );

    expect(getByText('Advanced Gas Price')).toBeInTheDocument();
  });
});
