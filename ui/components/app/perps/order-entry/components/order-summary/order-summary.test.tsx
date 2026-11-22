import React from 'react';
import { fireEvent, screen, waitFor, within } from '@testing-library/react';
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

function showTooltip(
  triggerContainerTestId: string,
  event: 'hover' | 'focus' = 'hover',
) {
  const tooltipTrigger = screen.getByTestId(
    `${triggerContainerTestId}-trigger`,
  );

  if (event === 'focus') {
    fireEvent.focus(tooltipTrigger);
  } else {
    fireEvent.mouseEnter(tooltipTrigger);
  }
}

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

    it('renders info icon tooltip triggers without showing tooltips at rest', () => {
      renderWithProvider(
        <OrderSummary
          marginRequired={null}
          estimatedFees={null}
          liquidationPrice={null}
        />,
        mockStore,
      );

      expect(
        within(
          screen.getByTestId('perps-order-summary-margin-tooltip-label'),
        ).getByRole('button', {
          name: `${messages.perpsMargin.message} info`,
        }),
      ).toBeInTheDocument();
      expect(
        within(
          screen.getByTestId(
            'perps-order-summary-liquidation-price-tooltip-label',
          ),
        ).getByRole('button', {
          name: `${messages.perpsLiquidationPrice.message} info`,
        }),
      ).toBeInTheDocument();
      expect(
        within(
          screen.getByTestId('perps-order-summary-fees-tooltip-label'),
        ).getByRole('button', {
          name: `${messages.perpsFees.message} info`,
        }),
      ).toBeInTheDocument();
      expect(
        screen.queryByTestId('perps-order-summary-margin-tooltip'),
      ).not.toBeInTheDocument();
      expect(
        screen.queryByTestId('perps-order-summary-liquidation-price-tooltip'),
      ).not.toBeInTheDocument();
      expect(
        screen.queryByTestId('perps-order-summary-fees-tooltip'),
      ).not.toBeInTheDocument();
    });

    it('shows the Mobile-parity Margin tooltip on hover', async () => {
      renderWithProvider(
        <OrderSummary
          marginRequired={null}
          estimatedFees={null}
          liquidationPrice={null}
        />,
        mockStore,
      );

      showTooltip('perps-order-summary-margin-tooltip-label');

      await waitFor(() => {
        expect(
          screen.getByTestId('perps-order-summary-margin-tooltip'),
        ).toHaveTextContent(messages.perpsMarginTooltip.message);
      });
    });

    it('shows the Mobile-parity Liquidation price tooltip on focus', async () => {
      renderWithProvider(
        <OrderSummary
          marginRequired={null}
          estimatedFees={null}
          liquidationPrice={null}
        />,
        mockStore,
      );

      showTooltip(
        'perps-order-summary-liquidation-price-tooltip-label',
        'focus',
      );

      await waitFor(() => {
        expect(
          screen.getByTestId('perps-order-summary-liquidation-price-tooltip'),
        ).toHaveTextContent(messages.perpsLiquidationPriceTooltip.message);
      });
    });

    it('shows live fee rates in the Fees tooltip', async () => {
      renderWithProvider(
        <OrderSummary
          marginRequired={null}
          estimatedFees={0.5}
          liquidationPrice={null}
          metamaskFeeRate={0.001}
          protocolFeeRate={0.00045}
          protocolFeeLabel={messages.perpsFeesTooltipHyperliquidFee.message}
        />,
        mockStore,
      );

      showTooltip('perps-order-summary-fees-tooltip-label');

      await waitFor(() => {
        expect(
          screen.getByTestId('perps-order-summary-fees-tooltip'),
        ).toHaveTextContent(
          `${messages.perpsFeesTooltipMetamaskFee.message}0.100%`,
        );
        expect(
          screen.getByTestId('perps-order-summary-fees-tooltip'),
        ).toHaveTextContent(
          `${messages.perpsFeesTooltipHyperliquidFee.message}0.045%`,
        );
      });
    });

    it('falls back to the provider fee label when no protocol fee label is provided', async () => {
      renderWithProvider(
        <OrderSummary
          marginRequired={null}
          estimatedFees={0.5}
          liquidationPrice={null}
          metamaskFeeRate={0.001}
          protocolFeeRate={0.00045}
        />,
        mockStore,
      );

      showTooltip('perps-order-summary-fees-tooltip-label');

      await waitFor(() => {
        expect(
          screen.getByTestId('perps-order-summary-fees-tooltip'),
        ).toHaveTextContent(messages.perpsFeesTooltipProviderFee.message);
      });
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
          originalEstimatedFees={1}
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

    it('announces the exceed state to screen readers when slippage exceeds the cap', () => {
      renderWithProvider(
        <OrderSummary
          marginRequired={null}
          estimatedFees={null}
          liquidationPrice={null}
          showSlippageRow
          slippageDisplay="Est: 0.14% / Max: 0.1%"
          exceedsMaxSlippage
        />,
        mockStore,
      );

      expect(
        screen.getByTestId('perps-order-slippage-exceeds-indicator'),
      ).toHaveTextContent(messages.perpsSlippageExceeded.message);
    });

    it('does not show discounted fee when estimatedFees is null even if a discount is active', () => {
      renderWithProvider(
        <OrderSummary
          marginRequired="$1,000.00"
          estimatedFees={null}
          originalEstimatedFees={1}
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

  describe('privacy mode', () => {
    const privacyStore = configureStore({
      metamask: {
        ...mockState.metamask,
        preferences: {
          ...mockState.metamask.preferences,
          privacyMode: true,
        },
      },
    });

    it('masks liquidation price and margin when privacy mode is enabled', () => {
      renderWithProvider(
        <OrderSummary
          marginRequired="$1,000.00"
          estimatedFees={0.5}
          liquidationPrice="$42,500.00"
        />,
        privacyStore,
      );

      expect(screen.queryByText('$1,000.00')).not.toBeInTheDocument();
      expect(screen.queryByText('$42,500.00')).not.toBeInTheDocument();
      expect(
        screen.getByTestId('perps-order-summary-margin-required'),
      ).toHaveTextContent('••••••');
      expect(
        screen.getByTestId('perps-order-summary-liquidation-price'),
      ).toHaveTextContent('••••••');
    });
  });
});
