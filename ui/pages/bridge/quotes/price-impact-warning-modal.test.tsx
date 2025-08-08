import React from 'react';
import { renderWithProvider } from '../../../../test/lib/render-helpers';
import { PriceImpactWarningModal } from './price-impact-warning-modal';

describe('PriceImpactWarningModal', () => {
  const mockOnClose = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render with normal warning when gas is not included', () => {
    const { getByText } = renderWithProvider(
      <PriceImpactWarningModal
        isOpen={true}
        onClose={mockOnClose}
        isGasIncluded={false}
      />,
    );

    expect(getByText('bridgePriceImpactWarningTitle')).toBeInTheDocument();
    expect(getByText('bridgePriceImpactNormalWarning')).toBeInTheDocument();
  });

  it('should render with gasless warning when gas is included', () => {
    const { getByText } = renderWithProvider(
      <PriceImpactWarningModal
        isOpen={true}
        onClose={mockOnClose}
        isGasIncluded={true}
      />,
    );

    expect(getByText('bridgePriceImpactWarningTitle')).toBeInTheDocument();
    expect(getByText('bridgePriceImpactGaslessWarning')).toBeInTheDocument();
  });

  it('should not render when isOpen is false', () => {
    const { queryByText } = renderWithProvider(
      <PriceImpactWarningModal
        isOpen={false}
        onClose={mockOnClose}
        isGasIncluded={false}
      />,
    );

    expect(
      queryByText('bridgePriceImpactWarningTitle'),
    ).not.toBeInTheDocument();
  });

  it('should call onClose when modal is closed', () => {
    const { getByLabelText } = renderWithProvider(
      <PriceImpactWarningModal
        isOpen={true}
        onClose={mockOnClose}
        isGasIncluded={false}
      />,
    );

    const closeButton = getByLabelText('Close');
    closeButton.click();

    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });
});
