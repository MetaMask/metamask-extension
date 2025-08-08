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

    expect(getByText(/\[bridgePriceImpactWarningTitle\]/u)).toBeInTheDocument();
    expect(
      getByText(/\[bridgePriceImpactNormalWarning\]/u),
    ).toBeInTheDocument();
  });

  it('should render with gasless warning when gas is included', () => {
    const { getByText } = renderWithProvider(
      <PriceImpactWarningModal
        isOpen={true}
        onClose={mockOnClose}
        isGasIncluded={true}
      />,
    );

    expect(getByText(/\[bridgePriceImpactWarningTitle\]/u)).toBeInTheDocument();
    expect(
      getByText(/\[bridgePriceImpactGaslessWarning\]/u),
    ).toBeInTheDocument();
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
    const { getByRole } = renderWithProvider(
      <PriceImpactWarningModal
        isOpen={true}
        onClose={mockOnClose}
        isGasIncluded={false}
      />,
    );

    const closeButton = getByRole('button', { name: /\[close\]/iu });
    closeButton.click();

    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });
});
