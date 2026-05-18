import React from 'react';
import { screen } from '@testing-library/react';
import { renderWithProvider } from '../../../../../../../test/lib/render-helpers-navigate';
import { enLocale as messages } from '../../../../../../../test/lib/i18n-helpers';
import configureStore from '../../../../../../store/store';
import mockState from '../../../../../../../test/data/mock-state.json';
import { OrderSummary } from './order-summary';

const mockStore = configureStore({
  metamask: {
    ...mockState.metamask,
  },
});

describe('OrderSummary', () => {
  describe('rendering', () => {
    it('renders all labels', () => {
      renderWithProvider(
        <OrderSummary
          marginRequired={null}
          estimatedFees={null}
          liquidationPrice={null}
        />,
        mockStore,
      );

      expect(
        screen.getByText(messages.perpsMargin.message),
      ).toBeInTheDocument();
      expect(screen.getByText(messages.perpsFees.message)).toBeInTheDocument();
      expect(
        screen.getByText(messages.perpsLiquidationPrice.message),
      ).toBeInTheDocument();
    });

    it('displays dash when values are null', () => {
      renderWithProvider(
        <OrderSummary
          marginRequired={null}
          estimatedFees={null}
          liquidationPrice={null}
        />,
        mockStore,
      );

      const dashElements = screen.getAllByText('-');
      expect(dashElements).toHaveLength(3);
    });

    it('displays margin required value', () => {
      renderWithProvider(
        <OrderSummary
          marginRequired="$1,000.00"
          estimatedFees={null}
          liquidationPrice={null}
        />,
        mockStore,
      );

      expect(screen.getByText('$1,000.00')).toBeInTheDocument();
    });

    it('displays estimated fees value', () => {
      renderWithProvider(
        <OrderSummary
          marginRequired={null}
          estimatedFees="$0.50"
          liquidationPrice={null}
        />,
        mockStore,
      );

      expect(screen.getByText('$0.50')).toBeInTheDocument();
    });

    it('displays liquidation price value', () => {
      renderWithProvider(
        <OrderSummary
          marginRequired={null}
          estimatedFees={null}
          liquidationPrice="$42,500.00"
        />,
        mockStore,
      );

      expect(screen.getByText('$42,500.00')).toBeInTheDocument();
    });

    it('displays all values when provided', () => {
      renderWithProvider(
        <OrderSummary
          marginRequired="$1,000.00"
          estimatedFees="$0.50"
          liquidationPrice="$42,500.00"
        />,
        mockStore,
      );

      expect(screen.getByText('$1,000.00')).toBeInTheDocument();
      expect(screen.getByText('$0.50')).toBeInTheDocument();
      expect(screen.getByText('$42,500.00')).toBeInTheDocument();
    });
  });

  describe('MetaMask fee discount badge', () => {
    it('does not render the discount badge when metamaskFeeRateDiscountPercentage is undefined', () => {
      renderWithProvider(
        <OrderSummary
          marginRequired="$1,000.00"
          estimatedFees="$0.50"
          liquidationPrice="$42,500.00"
        />,
        mockStore,
      );

      expect(
        screen.queryByTestId('perps-fees-display-discount'),
      ).not.toBeInTheDocument();
    });

    it('renders the discount badge in the fees row when metamaskFeeRateDiscountPercentage > 0', () => {
      renderWithProvider(
        <OrderSummary
          marginRequired="$1,000.00"
          estimatedFees="$0.50"
          liquidationPrice="$42,500.00"
          metamaskFeeRateDiscountPercentage={50}
        />,
        mockStore,
      );

      expect(
        screen.getByTestId('perps-fees-display-discount'),
      ).toBeInTheDocument();
      expect(screen.getByText('-50%')).toBeInTheDocument();
      // Fee text still renders alongside the badge
      expect(screen.getByText('$0.50')).toBeInTheDocument();
    });

    it('does not render the discount badge when metamaskFeeRateDiscountPercentage is 0', () => {
      renderWithProvider(
        <OrderSummary
          marginRequired="$1,000.00"
          estimatedFees="$0.50"
          liquidationPrice="$42,500.00"
          metamaskFeeRateDiscountPercentage={0}
        />,
        mockStore,
      );

      expect(
        screen.queryByTestId('perps-fees-display-discount'),
      ).not.toBeInTheDocument();
    });

    it('does not render the discount badge when estimatedFees is null even if a discount is active', () => {
      renderWithProvider(
        <OrderSummary
          marginRequired="$1,000.00"
          estimatedFees={null}
          liquidationPrice="$42,500.00"
          metamaskFeeRateDiscountPercentage={50}
        />,
        mockStore,
      );

      expect(
        screen.queryByTestId('perps-fees-display-discount'),
      ).not.toBeInTheDocument();
      expect(
        screen.getByTestId('perps-order-summary-estimated-fees'),
      ).toHaveTextContent('-');
    });
  });
});
