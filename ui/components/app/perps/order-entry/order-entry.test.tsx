import { screen, fireEvent } from '@testing-library/react';
import React from 'react';

import mockState from '../../../../../test/data/mock-state.json';
import { enLocale as messages } from '../../../../../test/lib/i18n-helpers';
import { renderWithProvider } from '../../../../../test/lib/render-helpers-navigate';
import configureStore from '../../../../store/store';
import { submitRequestToBackground } from '../../../../store/background-connection';
import { OrderEntry } from './order-entry';

jest.mock('../../../../hooks/perps/useUserHistory', () => ({
  useUserHistory: () => ({
    userHistory: [],
    isLoading: false,
    error: null,
    refetch: jest.fn(),
  }),
}));

jest.mock('../../../../hooks/perps/usePerpsTransactionHistory', () => ({
  usePerpsTransactionHistory: () => ({
    transactions: [],
    isLoading: false,
    error: null,
    refetch: jest.fn(),
  }),
}));

jest.mock('../../../../hooks/perps/usePerpsMarketInfo', () => ({
  usePerpsMarketInfo: () => undefined,
}));

jest.mock('../../../../hooks/perps/usePerpsOrderFees', () => ({
  usePerpsOrderFees: () => ({ feeRate: 0.00145, isLoading: false }),
}));

jest.mock('../../../../store/background-connection', () => ({
  submitRequestToBackground: jest.fn(),
}));

const mockStore = configureStore({
  metamask: {
    ...mockState.metamask,
  },
});

describe('OrderEntry', () => {
  const defaultProps = {
    asset: 'BTC',
    currentPrice: 45250.0,
    maxLeverage: 20,
    availableBalance: 10000.0,
    onSubmit: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    jest.mocked(submitRequestToBackground).mockImplementation((method) => {
      function immediate<ResolvedValue>(
        value: ResolvedValue,
      ): Promise<ResolvedValue> {
        return {
          then(onFulfilled: (resolved: ResolvedValue) => unknown) {
            const result = onFulfilled(value);
            return immediate(result as ResolvedValue);
          },
          catch() {
            return immediate(value);
          },
          finally(onFinally: () => void) {
            onFinally();
            return immediate(value);
          },
        } as Promise<ResolvedValue>;
      }

      if (method === 'perpsCalculateLiquidationPrice') {
        return immediate('40000') as Promise<never>;
      }

      return immediate(undefined) as Promise<never>;
    });
  });

  describe('rendering', () => {
    it('renders the component with all sections', () => {
      renderWithProvider(<OrderEntry {...defaultProps} />, mockStore);

      expect(screen.getByTestId('order-entry')).toBeInTheDocument();
      expect(screen.getByText(messages.perpsSize.message)).toBeInTheDocument();
      expect(screen.getByTestId('amount-input-field')).toBeInTheDocument();
      expect(screen.getByTestId('leverage-slider')).toBeInTheDocument();
      expect(
        screen.getByText(messages.perpsMargin.message),
      ).toBeInTheDocument();
      expect(screen.getByText(messages.perpsFees.message)).toBeInTheDocument();
      expect(
        screen.getByText(messages.perpsLiquidationPrice.message),
      ).toBeInTheDocument();
      expect(screen.getByTestId('auto-close-toggle')).toBeInTheDocument();
      expect(
        screen.getByTestId('order-entry-submit-button'),
      ).toBeInTheDocument();
    });

    it('displays available balance', () => {
      renderWithProvider(<OrderEntry {...defaultProps} />, mockStore);

      expect(screen.getByText(/10,000\.00.*USDC/u)).toBeInTheDocument();
    });

    it('displays correct submit button text for long direction', () => {
      renderWithProvider(<OrderEntry {...defaultProps} />, mockStore);

      expect(screen.getByTestId('order-entry-submit-button')).toHaveTextContent(
        'Open long BTC',
      );
    });

    it('respects initialDirection prop for short', () => {
      renderWithProvider(
        <OrderEntry {...defaultProps} initialDirection="short" />,
        mockStore,
      );

      expect(screen.getByTestId('order-entry-submit-button')).toHaveTextContent(
        'Open short BTC',
      );
    });

    it('strips the dex prefix from HIP-3 symbols in the submit button label', () => {
      renderWithProvider(
        <OrderEntry {...defaultProps} asset="xyz:BRENTOIL" />,
        mockStore,
      );

      expect(screen.getByTestId('order-entry-submit-button')).toHaveTextContent(
        'Open long BRENTOIL',
      );
      expect(
        screen.getByTestId('order-entry-submit-button'),
      ).not.toHaveTextContent('xyz:BRENTOIL');
    });
  });

  describe('amount input', () => {
    it('allows entering amount', () => {
      renderWithProvider(<OrderEntry {...defaultProps} />, mockStore);

      const container = screen.getByTestId('amount-input-field');
      const input = container.querySelector('input');
      expect(input).not.toBeNull();
      fireEvent.change(input as HTMLInputElement, {
        target: { value: '1000' },
      });

      expect(input).toHaveValue('1000');
    });

    it('normalizes amount on blur', () => {
      renderWithProvider(<OrderEntry {...defaultProps} />, mockStore);

      const container = screen.getByTestId('amount-input-field');
      const input = container.querySelector('input');
      expect(input).not.toBeNull();
      fireEvent.change(input as HTMLInputElement, {
        target: { value: '1000' },
      });
      fireEvent.blur(input as HTMLInputElement);

      expect(input).toHaveValue('1000.00');
    });

    it('shows token conversion when amount is entered', () => {
      renderWithProvider(<OrderEntry {...defaultProps} />, mockStore);

      const container = screen.getByTestId('amount-input-field');
      const input = container.querySelector('input');
      expect(input).not.toBeNull();
      fireEvent.change(input as HTMLInputElement, {
        target: { value: '45250' },
      });

      const tokenContainer = screen.getByTestId('amount-input-token-field');
      const tokenInput = tokenContainer.querySelector('input');
      // Amount is treated as position size (TAT-2684 fix), so token = size / price = $45250 / $45250 = 1 BTC
      expect(tokenInput).toHaveValue('1');
    });
  });

  describe('leverage slider', () => {
    it('defaults to 3x leverage', () => {
      renderWithProvider(<OrderEntry {...defaultProps} />, mockStore);

      const container = screen.getByTestId('leverage-input');
      const input = container.querySelector('input');
      expect(input).toHaveValue('3');
    });
  });

  describe('order summary', () => {
    it('shows dash when no amount entered', () => {
      renderWithProvider(<OrderEntry {...defaultProps} />, mockStore);

      const dashElements = screen.getAllByText('-');
      expect(dashElements.length).toBeGreaterThanOrEqual(3);
    });

    it('calculates values when amount is entered', () => {
      renderWithProvider(<OrderEntry {...defaultProps} />, mockStore);

      const container = screen.getByTestId('amount-input-field');
      const input = container.querySelector('input');
      expect(input).not.toBeNull();
      fireEvent.change(input as HTMLInputElement, {
        target: { value: '1000' },
      });

      // Margin = notional / leverage = $1,000 / 3 = $333.33 (fees are a separate line item)
      expect(screen.getByText('$333.33')).toBeInTheDocument();
      // Fees = HyperLiquid taker (0.045%) + MetaMask builder (0.1%) = 0.145% of $1,000 = $1.45
      expect(screen.getByText('$1.45')).toBeInTheDocument();
    });
  });

  describe('auto close section', () => {
    it('is collapsed by default', () => {
      renderWithProvider(<OrderEntry {...defaultProps} />, mockStore);

      expect(screen.queryByTestId('tp-price-input')).not.toBeInTheDocument();
      expect(screen.queryByTestId('sl-price-input')).not.toBeInTheDocument();
    });

    it('renders the toggle button', () => {
      renderWithProvider(<OrderEntry {...defaultProps} />, mockStore);

      expect(screen.getByTestId('auto-close-toggle')).toBeInTheDocument();
    });
  });

  describe('form submission', () => {
    it('calls onSubmit with form state when submit button is clicked', () => {
      const onSubmit = jest.fn();
      renderWithProvider(
        <OrderEntry {...defaultProps} onSubmit={onSubmit} />,
        mockStore,
      );

      const submitButton = screen.getByTestId('order-entry-submit-button');
      fireEvent.click(submitButton);

      expect(onSubmit).toHaveBeenCalledTimes(1);
      expect(onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          asset: 'BTC',
          direction: 'long',
          type: 'market',
        }),
      );
    });
  });

  describe('modify mode', () => {
    const existingPosition = {
      size: '2.5',
      leverage: 3,
      entryPrice: '2850.00',
      takeProfitPrice: '3200.00',
      stopLossPrice: '2600.00',
    };

    it('displays modify button text', () => {
      renderWithProvider(
        <OrderEntry
          {...defaultProps}
          mode="modify"
          existingPosition={existingPosition}
        />,
        mockStore,
      );

      expect(screen.getByTestId('order-entry-submit-button')).toHaveTextContent(
        'Modify Position',
      );
    });

    it('pre-populates leverage from existing position', () => {
      renderWithProvider(
        <OrderEntry
          {...defaultProps}
          mode="modify"
          existingPosition={existingPosition}
        />,
        mockStore,
      );

      const container = screen.getByTestId('leverage-input');
      const input = container.querySelector('input');
      expect(input).toHaveValue('3');
    });

    it('shows amount input in modify mode', () => {
      renderWithProvider(
        <OrderEntry
          {...defaultProps}
          mode="modify"
          existingPosition={existingPosition}
        />,
        mockStore,
      );

      expect(screen.getByTestId('amount-input-field')).toBeInTheDocument();
    });

    it('shows leverage slider in modify mode', () => {
      renderWithProvider(
        <OrderEntry
          {...defaultProps}
          mode="modify"
          existingPosition={existingPosition}
        />,
        mockStore,
      );

      expect(screen.getByTestId('leverage-slider')).toBeInTheDocument();
    });

    it('does not show auto-close section when TP/SL exists in modify mode', () => {
      renderWithProvider(
        <OrderEntry
          {...defaultProps}
          mode="modify"
          existingPosition={existingPosition}
        />,
        mockStore,
      );

      // Auto-close is hidden in modify mode — existing TP/SL carries over untouched
      expect(screen.queryByTestId('auto-close-toggle')).not.toBeInTheDocument();
      expect(screen.queryByTestId('tp-price-input')).not.toBeInTheDocument();
      expect(screen.queryByTestId('sl-price-input')).not.toBeInTheDocument();
    });
  });

  describe('close mode', () => {
    const existingPosition = {
      size: '2.5',
      leverage: 3,
      entryPrice: '2850.00',
    };

    it('displays close button text for long position', () => {
      renderWithProvider(
        <OrderEntry
          {...defaultProps}
          mode="close"
          initialDirection="long"
          existingPosition={existingPosition}
        />,
        mockStore,
      );

      expect(screen.getByTestId('order-entry-submit-button')).toHaveTextContent(
        'Close long',
      );
    });

    it('displays close button text for short position', () => {
      renderWithProvider(
        <OrderEntry
          {...defaultProps}
          mode="close"
          initialDirection="short"
          existingPosition={{ ...existingPosition, size: '-2.5' }}
        />,
        mockStore,
      );

      expect(screen.getByTestId('order-entry-submit-button')).toHaveTextContent(
        'Close short',
      );
    });

    it('shows CloseAmountSection in close mode', () => {
      renderWithProvider(
        <OrderEntry
          {...defaultProps}
          mode="close"
          existingPosition={existingPosition}
        />,
        mockStore,
      );

      expect(
        screen.getByText(messages.perpsAvailableToClose.message),
      ).toBeInTheDocument();
      expect(screen.getByTestId('close-amount-slider')).toBeInTheDocument();
    });

    it('hides amount input in close mode', () => {
      renderWithProvider(
        <OrderEntry
          {...defaultProps}
          mode="close"
          existingPosition={existingPosition}
        />,
        mockStore,
      );

      expect(
        screen.queryByTestId('amount-input-field'),
      ).not.toBeInTheDocument();
    });

    it('hides leverage slider in close mode', () => {
      renderWithProvider(
        <OrderEntry
          {...defaultProps}
          mode="close"
          existingPosition={existingPosition}
        />,
        mockStore,
      );

      expect(screen.queryByTestId('leverage-slider')).not.toBeInTheDocument();
    });

    it('hides auto-close section in close mode', () => {
      renderWithProvider(
        <OrderEntry
          {...defaultProps}
          mode="close"
          existingPosition={existingPosition}
        />,
        mockStore,
      );

      expect(screen.queryByTestId('auto-close-toggle')).not.toBeInTheDocument();
    });

    it('hides auto-close section in modify mode', () => {
      renderWithProvider(
        <OrderEntry
          {...defaultProps}
          mode="modify"
          existingPosition={existingPosition}
        />,
        mockStore,
      );

      expect(screen.queryByTestId('auto-close-toggle')).not.toBeInTheDocument();
    });

    it('defaults to 100% close', () => {
      renderWithProvider(
        <OrderEntry
          {...defaultProps}
          mode="close"
          existingPosition={existingPosition}
        />,
        mockStore,
      );

      // Close amount chip reflects default 100% close
      const percentElements = screen.getAllByText(/100.*%/u);
      expect(percentElements.length).toBeGreaterThanOrEqual(1);
    });

    it('does not render close percentage preset buttons', () => {
      renderWithProvider(
        <OrderEntry
          {...defaultProps}
          mode="close"
          existingPosition={existingPosition}
        />,
        mockStore,
      );

      expect(
        screen.queryByTestId('close-percent-preset-25'),
      ).not.toBeInTheDocument();
      expect(
        screen.queryByTestId('close-percent-preset-50'),
      ).not.toBeInTheDocument();
      expect(
        screen.queryByTestId('close-percent-preset-75'),
      ).not.toBeInTheDocument();
      expect(
        screen.queryByTestId('close-percent-preset-100'),
      ).not.toBeInTheDocument();
    });
  });

  describe('limit order mode', () => {
    it('shows limit price input when orderType is limit', () => {
      renderWithProvider(
        <OrderEntry {...defaultProps} orderType="limit" />,
        mockStore,
      );

      expect(screen.getByTestId('limit-price-input')).toBeInTheDocument();
      expect(
        screen.getByText(messages.perpsLimitPrice.message),
      ).toBeInTheDocument();
    });

    it('hides limit price input when orderType is market', () => {
      renderWithProvider(
        <OrderEntry {...defaultProps} orderType="market" />,
        mockStore,
      );

      expect(screen.queryByTestId('limit-price-input')).not.toBeInTheDocument();
    });

    it('hides limit price input in close mode even when orderType is limit', () => {
      const existingPosition = {
        size: '2.5',
        leverage: 3,
        entryPrice: '2850.00',
      };
      renderWithProvider(
        <OrderEntry
          {...defaultProps}
          mode="close"
          orderType="limit"
          existingPosition={existingPosition}
        />,
        mockStore,
      );

      expect(screen.queryByTestId('limit-price-input')).not.toBeInTheDocument();
    });

    it('shows Mid button for long limit orders', () => {
      renderWithProvider(
        <OrderEntry
          {...defaultProps}
          orderType="limit"
          initialDirection="long"
        />,
        mockStore,
      );

      expect(screen.getByText(messages.perpsMid.message)).toBeInTheDocument();
      expect(screen.getByTestId('limit-price-mid-button')).toBeInTheDocument();
    });

    it('shows Mid button for short limit orders', () => {
      renderWithProvider(
        <OrderEntry
          {...defaultProps}
          orderType="limit"
          initialDirection="short"
        />,
        mockStore,
      );

      expect(screen.getByText(messages.perpsMid.message)).toBeInTheDocument();
      expect(screen.getByTestId('limit-price-mid-button')).toBeInTheDocument();
    });

    it('submits form with limit type when orderType is limit', () => {
      const onSubmit = jest.fn();
      renderWithProvider(
        <OrderEntry {...defaultProps} orderType="limit" onSubmit={onSubmit} />,
        mockStore,
      );

      const submitButton = screen.getByTestId('order-entry-submit-button');
      fireEvent.click(submitButton);

      expect(onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'limit',
        }),
      );
    });
  });
});
