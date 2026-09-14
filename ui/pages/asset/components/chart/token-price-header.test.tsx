import React from 'react';
import { render, screen } from '@testing-library/react';
import TokenPriceHeader from './token-price-header';

// Mock useFormatters hook
jest.mock('../../../../hooks/useFormatters', () => ({
  useFormatters: () => ({
    formatCurrencyTokenPrice: (price: number | undefined, currency: string) =>
      price !== undefined ? `${currency} ${price.toFixed(2)}` : '-',
    formatNumber: (value: number, options: Intl.NumberFormatOptions) => {
      if (options.style === 'percent') {
        const sign = value >= 0 ? '+' : '';
        return `${sign}${(value * 100).toFixed(2)}%`;
      }
      return String(value);
    },
  }),
}));

// Mock getDynamicShortDate
jest.mock('../../util', () => ({
  loadingOpacity: 0.5,
  getDynamicShortDate: (timestamp: number) => {
    const date = new Date(timestamp);
    return `${date.getMonth() + 1}/${date.getDate()}`;
  },
}));

describe('TokenPriceHeader', () => {
  const defaultProps = {
    currency: 'USD',
  };

  describe('Loading state', () => {
    it('shows price skeleton when loading with no price', () => {
      const { container } = render(
        <TokenPriceHeader {...defaultProps} loading={true} />,
      );

      // Skeleton should be present
      expect(container.querySelector('.mb-1.rounded-lg')).toBeInTheDocument();
      // Price should not be visible
      expect(
        screen.queryByTestId('asset-hovered-price'),
      ).not.toBeInTheDocument();
    });

    it('shows muted price when loading with existing price', () => {
      render(<TokenPriceHeader {...defaultProps} loading={true} price={100} />);

      const priceElement = screen.getByTestId('asset-hovered-price');
      expect(priceElement).toBeInTheDocument();
      // Opacity is applied to the wrapping Box, not the Text element
      expect(priceElement.parentElement).toHaveStyle({ opacity: '0.5' });
    });

    it('shows percent skeleton when loading with no percentChange', () => {
      const { container } = render(
        <TokenPriceHeader {...defaultProps} loading={true} />,
      );

      // Should have skeleton elements
      expect(container.querySelectorAll('.rounded-lg').length).toBeGreaterThan(
        0,
      );
    });
  });

  describe('Price display', () => {
    it('displays formatted price when available', () => {
      render(<TokenPriceHeader {...defaultProps} price={100.5} />);

      const priceElement = screen.getByTestId('asset-hovered-price');
      expect(priceElement).toHaveTextContent('USD 100.50');
    });

    it('shows empty state when price is undefined and not loading', () => {
      const { container } = render(
        <TokenPriceHeader {...defaultProps} loading={false} />,
      );

      // Should show empty state (non-breaking space)
      expect(container.textContent).toContain('\u00A0');
    });
  });

  describe('Percent change display', () => {
    it('displays positive percent change in green', () => {
      render(
        <TokenPriceHeader {...defaultProps} price={100} percentChange={5.25} />,
      );

      const percentElement = screen.getByTestId('asset-price-percent-change');
      expect(percentElement).toHaveTextContent('+5.25%');
      // Check for success color class
      expect(percentElement).toHaveClass('text-success-default');
    });

    it('displays negative percent change in red', () => {
      render(
        <TokenPriceHeader
          {...defaultProps}
          price={100}
          percentChange={-3.75}
        />,
      );

      const percentElement = screen.getByTestId('asset-price-percent-change');
      expect(percentElement).toHaveTextContent('-3.75%');
      // Check for error color class
      expect(percentElement).toHaveClass('text-error-default');
    });

    it('displays zero percent change in default color', () => {
      render(
        <TokenPriceHeader {...defaultProps} price={100} percentChange={0} />,
      );

      const percentElement = screen.getByTestId('asset-price-percent-change');
      expect(percentElement).toHaveTextContent('+0.00%');
      // Check for default color class
      expect(percentElement).toHaveClass('text-default');
    });

    it('displays dash when percentChange is undefined', () => {
      render(<TokenPriceHeader {...defaultProps} price={100} />);

      // When percentChange is undefined and not loading, empty state shows
      expect(
        screen.queryByTestId('asset-price-percent-change'),
      ).not.toBeInTheDocument();
    });
  });

  describe('Timestamp display', () => {
    it('displays formatted timestamp when provided', () => {
      const timestamp = new Date(2025, 5, 15).getTime(); // June 15, 2025

      render(
        <TokenPriceHeader
          {...defaultProps}
          price={100}
          percentChange={5}
          timestamp={timestamp}
        />,
      );

      expect(screen.getByText('6/15')).toBeInTheDocument();
    });

    it('does not display timestamp when not provided', () => {
      render(
        <TokenPriceHeader {...defaultProps} price={100} percentChange={5} />,
      );

      // Should only have percent change, no date
      const percentElement = screen.getByTestId('asset-price-percent-change');
      expect(percentElement.parentElement?.childElementCount).toBe(1);
    });
  });

  describe('Edge cases', () => {
    it('handles NaN percentChange gracefully', () => {
      render(
        <TokenPriceHeader
          {...defaultProps}
          price={100}
          percentChange={Number.NaN}
        />,
      );

      // Should show dash for NaN
      const percentElement = screen.getByTestId('asset-price-percent-change');
      expect(percentElement).toHaveTextContent('-');
    });

    it('handles very large percent changes', () => {
      render(
        <TokenPriceHeader
          {...defaultProps}
          price={100}
          percentChange={1000.5}
        />,
      );

      const percentElement = screen.getByTestId('asset-price-percent-change');
      expect(percentElement).toHaveTextContent('+1000.50%');
    });

    it('handles very small prices', () => {
      render(<TokenPriceHeader {...defaultProps} price={0.00001} />);

      const priceElement = screen.getByTestId('asset-hovered-price');
      expect(priceElement).toHaveTextContent('USD 0.00');
    });
  });
});
