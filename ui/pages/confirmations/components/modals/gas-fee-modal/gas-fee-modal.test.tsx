import React from 'react';
import { renderWithProvider } from '../../../../../../test/lib/render-helpers-navigate';
import { GasFeeModal } from './gas-fee-modal';

jest.mock('../estimates-modal/estimates-modal', () => ({
  EstimatesModal: ({
    handleCloseModals,
  }: {
    handleCloseModals: () => void;
  }) => (
    <div data-testid="estimates-modal">
      <button onClick={handleCloseModals} data-testid="close-button">
        Close
      </button>
    </div>
  ),
}));

jest.mock('../advanced-eip1559-modal/advanced-eip1559-modal', () => ({
  AdvancedEIP1559Modal: () => (
    <div data-testid="advanced-eip1559-modal">Advanced EIP1559</div>
  ),
}));

jest.mock('../advanced-gas-price-modal/advanced-gas-price-modal', () => ({
  AdvancedGasPriceModal: () => (
    <div data-testid="advanced-gas-price-modal">Advanced Gas Price</div>
  ),
}));

describe('GasFeeModal', () => {
  const mockSetGasModalVisible = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders EstimatesModal by default', () => {
    const { getByTestId } = renderWithProvider(
      <GasFeeModal setGasModalVisible={mockSetGasModalVisible} />,
    );

    expect(getByTestId('estimates-modal')).toBeInTheDocument();
  });

  it('calls setGasModalVisible with false when closing modal', () => {
    const { getByTestId } = renderWithProvider(
      <GasFeeModal setGasModalVisible={mockSetGasModalVisible} />,
    );

    getByTestId('close-button').click();

    expect(mockSetGasModalVisible).toHaveBeenCalledWith(false);
  });
});
