import React from 'react';
import { screen } from '@testing-library/react';
import { renderWithProvider } from '../../../../../../../test/lib/render-helpers-navigate';
import { enLocale as messages } from '../../../../../../../test/lib/i18n-helpers';
import configureStore from '../../../../../../store/store';
import mockState from '../../../../../../../test/data/mock-state.json';
import { OrderSummary } from './order-summary';

jest.mock('../../../../../../../shared/lib/perps-formatters', () => ({
  ...jest.requireActual('../../../../../../../shared/lib/perps-formatters'),
  formatPerpsFiat: jest.fn(
    (value: string | number) => `$${Number(value).toFixed(2)}`,
  ),
}));

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
          estimatedFees={0.5}
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
          estimatedFees={0.5}
          liquidationPrice="$42,500.00"
        />,
        mockStore,
      );

      expect(screen.getByText('$1,000.00')).toBeInTheDocument();
      expect(screen.getByText('$0.50')).toBeInTheDocument();
      expect(screen.getByText('$42,500.00')).toBeInTheDocument();
    });
  });

  describe('MetaMask fee discount', () => {
    it('does not show discounted fee when metamaskFeeRateDiscountPercentage is undefined', () => {
      renderWithProvider(
        <OrderSummary
          marginRequired="$1,000.00"
          estimatedFees={0.5}
          liquidationPrice="$42,500.00"
        />,
        mockStore,
      );

      expect(
        screen.queryByTestId('perps-order-summary-estimated-fees-original'),
      ).not.toBeInTheDocument();
    });

    it('shows strikethrough original and discounted fee when metamaskFeeRateDiscountPercentage > 0', () => {
      renderWithProvider(
        <OrderSummary
          marginRequired="$1,000.00"
          estimatedFees={0.5}
          originalEstimatedFees={1.0}
          liquidationPrice="$42,500.00"
          metamaskFeeRateDiscountPercentage={50}
        />,
        mockStore,
      );

      expect(
        screen.getByTestId('perps-order-summary-estimated-fees-original'),
      ).toHaveTextContent('$1.00');
      expect(
        screen.getByTestId('perps-order-summary-estimated-fees'),
      ).toHaveTextContent('$0.50');
    });

    it('does not show discounted fee when metamaskFeeRateDiscountPercentage is 0', () => {
      renderWithProvider(
        <OrderSummary
          marginRequired="$1,000.00"
          estimatedFees={0.5}
          liquidationPrice="$42,500.00"
          metamaskFeeRateDiscountPercentage={0}
        />,
        mockStore,
      );

      expect(
        screen.queryByTestId('perps-order-summary-estimated-fees-original'),
      ).not.toBeInTheDocument();
    });

    it('does not show discounted fee when estimatedFees is null even if a discount is active', () => {
      renderWithProvider(
        <OrderSummary
          marginRequired="$1,000.00"
          estimatedFees={null}
          originalEstimatedFees={1.0}
          liquidationPrice="$42,500.00"
          metamaskFeeRateDiscountPercentage={50}
        />,
        mockStore,
      );

      expect(
        screen.queryByTestId('perps-order-summary-estimated-fees-original'),
      ).not.toBeInTheDocument();
      expect(
        screen.getByTestId('perps-order-summary-estimated-fees'),
      ).toHaveTextContent('-');
    });
  });
});
