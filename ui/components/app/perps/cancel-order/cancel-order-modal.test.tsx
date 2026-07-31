import React from 'react';
import { act, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProvider } from '../../../../../test/lib/render-helpers-navigate';
import { enLocale as messages } from '../../../../../test/lib/i18n-helpers';
import { PERPS_EVENT_PROPERTY } from '../../../../../shared/constants/perps-events';
import configureStore from '../../../../store/store';
import mockState from '../../../../../test/data/mock-state.json';
import { mockOrders } from '../mocks';
import type { Order } from '../types';
import { CancelOrderModal } from './cancel-order-modal';

const mockSubmitRequestToBackground = jest.fn();
const mockReplacePerpsToastByKey = jest.fn();
const mockTrack = jest.fn();
const mockUsePerpsEligibility = jest.fn(() => ({ isEligible: true }));

jest.mock('../../../../store/background-connection', () => ({
  submitRequestToBackground: (...args: unknown[]) =>
    mockSubmitRequestToBackground(...args),
}));

jest.mock('../../../../hooks/perps', () => ({
  usePerpsEventTracking: () => ({ track: mockTrack }),
  usePerpsEligibility: () => mockUsePerpsEligibility(),
}));

jest.mock('../../../../hooks/perps/usePerpsAttribution', () => ({
  usePerpsAttribution: () => ({
    buildTrackingData: (input: Record<string, unknown>) => ({
      ...input,
      entryPoint: 'homescreen_tab',
      discoverySource: 'market_list',
    }),
  }),
}));

jest.mock('../perps-toast', () => ({
  // Real keys: a hand-maintained subset silently emits `key: undefined` for any
  // toast the mock has not been updated for.
  PERPS_TOAST_KEYS: jest.requireActual('../perps-toast/perps-toast.constants')
    .PERPS_TOAST_KEYS,
  usePerpsToast: () => ({
    replacePerpsToastByKey: mockReplacePerpsToastByKey,
  }),
}));

const mockStore = configureStore({
  metamask: {
    ...mockState.metamask,
  },
});

const baseOrder: Order = mockOrders[0]; // ETH limit long, open

describe('CancelOrderModal', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUsePerpsEligibility.mockReturnValue({ isEligible: true });
    mockSubmitRequestToBackground.mockResolvedValue({ success: true });
  });

  describe('rendering', () => {
    it('renders with correct data-testid', () => {
      renderWithProvider(
        <CancelOrderModal isOpen onClose={jest.fn()} order={baseOrder} />,
        mockStore,
      );

      expect(
        screen.getByTestId('perps-cancel-order-modal'),
      ).toBeInTheDocument();
    });

    it('shows the token logo for the order symbol', () => {
      renderWithProvider(
        <CancelOrderModal isOpen onClose={jest.fn()} order={baseOrder} />,
        mockStore,
      );

      expect(
        screen.getByTestId(`perps-token-logo-${baseOrder.symbol}`),
      ).toBeInTheDocument();
    });

    it('displays the order symbol name', () => {
      renderWithProvider(
        <CancelOrderModal isOpen onClose={jest.fn()} order={baseOrder} />,
        mockStore,
      );

      expect(screen.getByText(baseOrder.symbol)).toBeInTheDocument();
    });

    it('uses the localized long label for a buy limit order', () => {
      renderWithProvider(
        <CancelOrderModal isOpen onClose={jest.fn()} order={baseOrder} />,
        mockStore,
      );

      expect(
        screen.getByText(
          `Limit ${messages.perpsLong.message.toLocaleLowerCase('en-US')}`,
        ),
      ).toBeInTheDocument();
    });

    it('uses the localized short label for a sell limit order', () => {
      const sellOrder: Order = { ...baseOrder, side: 'sell' };
      renderWithProvider(
        <CancelOrderModal isOpen onClose={jest.fn()} order={sellOrder} />,
        mockStore,
      );

      expect(
        screen.getByText(
          `Limit ${messages.perpsShort.message.toLocaleLowerCase('en-US')}`,
        ),
      ).toBeInTheDocument();
    });

    it('uses the opening direction for a non-reduce-only entry trigger', () => {
      const entryTriggerOrder: Order = {
        ...baseOrder,
        side: 'sell',
        isTrigger: true,
        reduceOnly: false,
        detailedOrderType: 'Stop Market',
      };
      renderWithProvider(
        <CancelOrderModal
          isOpen
          onClose={jest.fn()}
          order={entryTriggerOrder}
        />,
        mockStore,
      );

      expect(
        screen.getByText(
          `Stop Market ${messages.perpsShort.message.toLocaleLowerCase(
            'en-US',
          )}`,
        ),
      ).toBeInTheDocument();
    });

    it('uses the closing direction for a position TP/SL trigger', () => {
      const positionTriggerOrder: Order = {
        ...baseOrder,
        side: 'sell',
        isTrigger: true,
        reduceOnly: false,
        isPositionTpsl: true,
        detailedOrderType: 'Stop Market',
      };
      renderWithProvider(
        <CancelOrderModal
          isOpen
          onClose={jest.fn()}
          order={positionTriggerOrder}
        />,
        mockStore,
      );

      expect(
        screen.getByText(
          `Stop Market ${messages.perpsCloseLong.message.toLocaleLowerCase(
            'en-US',
          )}`,
        ),
      ).toBeInTheDocument();
    });

    it('uses the localized close-long label for a reduce-only sell', () => {
      const closeLongOrder: Order = {
        ...baseOrder,
        side: 'sell',
        reduceOnly: true,
      };
      renderWithProvider(
        <CancelOrderModal isOpen onClose={jest.fn()} order={closeLongOrder} />,
        mockStore,
      );

      expect(
        screen.getByText(
          `Limit ${messages.perpsCloseLong.message.toLocaleLowerCase('en-US')}`,
        ),
      ).toBeInTheDocument();
    });

    it('uses the localized close-short label for a reduce-only buy', () => {
      const closeShortOrder: Order = {
        ...baseOrder,
        side: 'buy',
        reduceOnly: true,
      };
      renderWithProvider(
        <CancelOrderModal isOpen onClose={jest.fn()} order={closeShortOrder} />,
        mockStore,
      );

      expect(
        screen.getByText(
          `Limit ${messages.perpsCloseShort.message.toLocaleLowerCase('en-US')}`,
        ),
      ).toBeInTheDocument();
    });

    it('displays the limit price row', () => {
      renderWithProvider(
        <CancelOrderModal isOpen onClose={jest.fn()} order={baseOrder} />,
        mockStore,
      );

      expect(
        screen.getByText(messages.perpsLimitPrice.message),
      ).toBeInTheDocument();
      // formatPerpsFiatUniversal strips trailing zeros for whole-dollar amounts
      expect(screen.getAllByText('$3,000').length).toBeGreaterThanOrEqual(1);
    });

    it('displays the size row with symbol', () => {
      renderWithProvider(
        <CancelOrderModal isOpen onClose={jest.fn()} order={baseOrder} />,
        mockStore,
      );

      expect(screen.getByText(messages.perpsSize.message)).toBeInTheDocument();
      expect(screen.getByText('1.0 ETH')).toBeInTheDocument();
    });

    it('does not display original size row when size equals originalSize', () => {
      const order: Order = {
        ...baseOrder,
        size: '1.0',
        originalSize: '1.0',
      };
      renderWithProvider(
        <CancelOrderModal isOpen onClose={jest.fn()} order={order} />,
        mockStore,
      );

      expect(
        screen.queryByText(messages.perpsOrderOriginalSize.message),
      ).not.toBeInTheDocument();
    });

    it('displays original size row when size differs from originalSize', () => {
      const partiallyFilledOrder: Order = {
        ...baseOrder,
        size: '0.5',
        originalSize: '1.0',
      };
      renderWithProvider(
        <CancelOrderModal
          isOpen
          onClose={jest.fn()}
          order={partiallyFilledOrder}
        />,
        mockStore,
      );

      expect(
        screen.getByText(messages.perpsOrderOriginalSize.message),
      ).toBeInTheDocument();
      expect(screen.getByText('1.0 ETH')).toBeInTheDocument();
    });

    it('displays order value row when price and size are non-zero', () => {
      renderWithProvider(
        <CancelOrderModal isOpen onClose={jest.fn()} order={baseOrder} />,
        mockStore,
      );

      expect(
        screen.getByText(messages.perpsOrderValue.message),
      ).toBeInTheDocument();
      // formatPerpsFiatMinimal strips .00 for whole-dollar notional
      expect(screen.getAllByText('$3,000').length).toBeGreaterThanOrEqual(1);
    });

    it('keeps meaningful decimals on limit price and notional', () => {
      const order: Order = {
        ...baseOrder,
        price: '3000.10',
        size: '2.0',
      };
      renderWithProvider(
        <CancelOrderModal isOpen onClose={jest.fn()} order={order} />,
        mockStore,
      );

      // Universal keeps ≤1 decimal for $1k–$10k range
      expect(screen.getAllByText('$3,000.1').length).toBeGreaterThanOrEqual(1);
      // Notional 6000.20 → minimal with fiatStyleStripping keeps .20
      expect(screen.getByText('$6,000.20')).toBeInTheDocument();
    });

    it('hides order value row when price is zero', () => {
      const marketOrder: Order = { ...baseOrder, price: '0' };
      renderWithProvider(
        <CancelOrderModal isOpen onClose={jest.fn()} order={marketOrder} />,
        mockStore,
      );

      expect(
        screen.queryByText(messages.perpsOrderValue.message),
      ).not.toBeInTheDocument();
    });

    it('displays Reduce only as "Yes" when reduceOnly is true', () => {
      const roOrder: Order = { ...baseOrder, reduceOnly: true };
      renderWithProvider(
        <CancelOrderModal isOpen onClose={jest.fn()} order={roOrder} />,
        mockStore,
      );

      expect(
        screen.getByText(messages.perpsReduceOnly.message),
      ).toBeInTheDocument();
      expect(screen.getByText(messages.yes.message)).toBeInTheDocument();
    });

    it('displays Reduce only as "No" when reduceOnly is false', () => {
      renderWithProvider(
        <CancelOrderModal isOpen onClose={jest.fn()} order={baseOrder} />,
        mockStore,
      );

      expect(
        screen.getByText(messages.perpsReduceOnly.message),
      ).toBeInTheDocument();
      expect(screen.getByText(messages.no.message)).toBeInTheDocument();
    });

    it('displays the status row with capitalized status', () => {
      renderWithProvider(
        <CancelOrderModal isOpen onClose={jest.fn()} order={baseOrder} />,
        mockStore,
      );

      expect(
        screen.getByText(messages.perpsOrderStatus.message),
      ).toBeInTheDocument();
      expect(
        screen.getByText(messages.perpsStatusOpen.message),
      ).toBeInTheDocument();
    });

    it('renders the cancel order button', () => {
      renderWithProvider(
        <CancelOrderModal isOpen onClose={jest.fn()} order={baseOrder} />,
        mockStore,
      );

      expect(
        screen.getByTestId('perps-cancel-order-button'),
      ).toBeInTheDocument();
    });

    it('displays "Cancel order" text on the button', () => {
      renderWithProvider(
        <CancelOrderModal isOpen onClose={jest.fn()} order={baseOrder} />,
        mockStore,
      );

      expect(
        screen.getByText(messages.perpsCancelOrder.message),
      ).toBeInTheDocument();
    });

    it('does not render when isOpen is false', () => {
      renderWithProvider(
        <CancelOrderModal
          isOpen={false}
          onClose={jest.fn()}
          order={baseOrder}
        />,
        mockStore,
      );

      expect(
        screen.queryByTestId('perps-cancel-order-modal'),
      ).not.toBeInTheDocument();
    });

    it('strips xyz: prefix when displaying HIP-3 symbol name', () => {
      const hip3Order: Order = {
        ...baseOrder,
        symbol: 'xyz:TSLA',
        price: '200.00',
        size: '1.0',
      };
      renderWithProvider(
        <CancelOrderModal isOpen onClose={jest.fn()} order={hip3Order} />,
        mockStore,
      );

      expect(screen.getByText('TSLA')).toBeInTheDocument();
    });
  });

  describe('cancel action', () => {
    it('calls perpsCancelOrder with orderId, symbol, and trackingData on button click', async () => {
      const user = userEvent.setup();
      renderWithProvider(
        <CancelOrderModal isOpen onClose={jest.fn()} order={baseOrder} />,
        mockStore,
      );

      await user.click(screen.getByTestId('perps-cancel-order-button'));

      await waitFor(() => {
        expect(mockSubmitRequestToBackground).toHaveBeenCalledWith(
          'perpsCancelOrder',
          [
            {
              orderId: baseOrder.orderId,
              symbol: baseOrder.symbol,
              trackingData: expect.objectContaining({
                totalFee: 0,
                marketPrice: expect.any(Number),
                entryPoint: 'homescreen_tab',
                discoverySource: 'market_list',
              }),
            },
          ],
        );
      });

      await waitFor(() => {
        expect(screen.getByTestId('perps-cancel-order-button')).toBeEnabled();
      });
    });

    it('calls onClose after a successful cancel', async () => {
      const user = userEvent.setup();
      const onClose = jest.fn();
      renderWithProvider(
        <CancelOrderModal isOpen onClose={onClose} order={baseOrder} />,
        mockStore,
      );

      await user.click(screen.getByTestId('perps-cancel-order-button'));

      await waitFor(() => {
        expect(onClose).toHaveBeenCalledTimes(1);
      });

      await waitFor(() => {
        expect(screen.getByTestId('perps-cancel-order-button')).toBeEnabled();
      });
    });

    it('shows a generic cancel failure when the provider error has no translation', async () => {
      const user = userEvent.setup();
      mockSubmitRequestToBackground.mockResolvedValue({
        success: false,
        error: 'Order not found',
      });

      renderWithProvider(
        <CancelOrderModal isOpen onClose={jest.fn()} order={baseOrder} />,
        mockStore,
      );

      await user.click(screen.getByTestId('perps-cancel-order-button'));

      await waitFor(() => {
        expect(
          screen.getByText(messages.perpsCancelOrderFailed.message),
        ).toBeInTheDocument();
        expect(screen.getByTestId('perps-cancel-order-button')).toBeEnabled();
      });
    });

    it('shows the translated message when the provider error maps to a known code', async () => {
      const user = userEvent.setup();
      mockSubmitRequestToBackground.mockRejectedValue(
        new Error('Network error'),
      );

      renderWithProvider(
        <CancelOrderModal isOpen onClose={jest.fn()} order={baseOrder} />,
        mockStore,
      );

      await user.click(screen.getByTestId('perps-cancel-order-button'));

      await waitFor(() => {
        expect(
          screen.getByText(messages.perpsNetworkError.message),
        ).toBeInTheDocument();
        expect(screen.getByTestId('perps-cancel-order-button')).toBeEnabled();
      });
    });

    it('translates a retried ORDER_UNKNOWN_COIN cancel failure', async () => {
      const user = userEvent.setup();
      mockSubmitRequestToBackground.mockResolvedValue({
        success: false,
        error: 'ORDER_UNKNOWN_COIN',
      });

      renderWithProvider(
        <CancelOrderModal isOpen onClose={jest.fn()} order={baseOrder} />,
        mockStore,
      );

      await act(async () => {
        await user.click(screen.getByTestId('perps-cancel-order-button'));
      });

      await waitFor(() => {
        expect(
          screen.getByText(messages.perpsOrderFailed.message),
        ).toBeInTheDocument();
      });
      expect(screen.queryByText('ORDER_UNKNOWN_COIN')).not.toBeInTheDocument();
    });

    it('does not call onClose when cancel fails', async () => {
      const user = userEvent.setup();
      const onClose = jest.fn();
      mockSubmitRequestToBackground.mockResolvedValue({
        success: false,
        error: 'Cancel request rejected',
      });

      renderWithProvider(
        <CancelOrderModal isOpen onClose={onClose} order={baseOrder} />,
        mockStore,
      );

      await user.click(screen.getByTestId('perps-cancel-order-button'));

      await waitFor(() => {
        expect(
          screen.getByText(messages.perpsCancelOrderFailed.message),
        ).toBeInTheDocument();
        expect(screen.getByTestId('perps-cancel-order-button')).toBeEnabled();
      });
      expect(onClose).not.toHaveBeenCalled();
    });

    it('shows loading state while canceling', async () => {
      let resolveCancel!: (value: { success: boolean }) => void;
      mockSubmitRequestToBackground.mockReturnValue(
        new Promise((resolve) => {
          resolveCancel = resolve;
        }),
      );

      renderWithProvider(
        <CancelOrderModal isOpen onClose={jest.fn()} order={baseOrder} />,
        mockStore,
      );

      fireEvent.click(screen.getByTestId('perps-cancel-order-button'));

      await waitFor(() => {
        expect(screen.getByTestId('perps-cancel-order-button')).toBeDisabled();
      });

      await act(async () => {
        resolveCancel({ success: true });
      });
    });

    it('clears error state when modal reopens', () => {
      mockSubmitRequestToBackground.mockResolvedValue({
        success: false,
        error: 'Some error',
      });

      const { rerender } = renderWithProvider(
        <CancelOrderModal
          isOpen={false}
          onClose={jest.fn()}
          order={baseOrder}
        />,
        mockStore,
      );

      rerender(
        <CancelOrderModal isOpen onClose={jest.fn()} order={baseOrder} />,
      );

      // Error should not be visible since it was never triggered in this open session
      expect(screen.queryByText('Some error')).not.toBeInTheDocument();
    });
  });

  describe('analytics', () => {
    it('does not emit duplicate PerpsOrderCancelTransaction on successful cancel', async () => {
      const user = userEvent.setup();
      renderWithProvider(
        <CancelOrderModal isOpen onClose={jest.fn()} order={baseOrder} />,
        mockStore,
      );

      await user.click(screen.getByTestId('perps-cancel-order-button'));

      await waitFor(() => {
        expect(screen.getByTestId('perps-cancel-order-button')).toBeEnabled();
      });

      expect(
        mockTrack.mock.calls.some(
          ([event]) => event === 'Perp Order Cancel Transaction',
        ),
      ).toBe(false);
    });

    it('emits PerpsError but not cancel transaction analytics on failure', async () => {
      const user = userEvent.setup();
      mockSubmitRequestToBackground.mockRejectedValue(
        new Error('Network error'),
      );

      renderWithProvider(
        <CancelOrderModal isOpen onClose={jest.fn()} order={baseOrder} />,
        mockStore,
      );

      await user.click(screen.getByTestId('perps-cancel-order-button'));

      await waitFor(() => {
        expect(screen.getByTestId('perps-cancel-order-button')).toBeEnabled();
      });

      expect(
        mockTrack.mock.calls.some(
          ([event]) => event === 'Perp Order Cancel Transaction',
        ),
      ).toBe(false);
      expect(
        mockTrack.mock.calls.some(
          ([event, properties]) =>
            event === 'Perp Error' &&
            properties?.[PERPS_EVENT_PROPERTY.ERROR_MESSAGE] ===
              'Network error',
        ),
      ).toBe(true);

      await waitFor(() => {
        expect(screen.getByTestId('perps-cancel-order-button')).toBeEnabled();
      });
    });
  });

  describe('order already closed on the provider', () => {
    const alreadyClosedError =
      'cancel 0: Order was never placed, already canceled, or filled. asset=4';

    it('closes the modal without an error when the order is no longer open', async () => {
      const user = userEvent.setup();
      const onClose = jest.fn();
      mockSubmitRequestToBackground.mockResolvedValue({
        success: false,
        error: alreadyClosedError,
      });

      renderWithProvider(
        <CancelOrderModal isOpen onClose={onClose} order={baseOrder} />,
        mockStore,
      );

      await act(async () => {
        await user.click(screen.getByTestId('perps-cancel-order-button'));
      });

      await waitFor(() => {
        expect(onClose).toHaveBeenCalled();
      });
      expect(screen.queryByText(alreadyClosedError)).not.toBeInTheDocument();
      expect(mockReplacePerpsToastByKey).toHaveBeenCalledWith({
        key: 'perpsToastCancelOrderAlreadyClosed',
        dataTestId: 'perps-toast-cancel-order-already-closed',
      });
      expect(mockTrack).not.toHaveBeenCalledWith(
        'Perp Error',
        expect.anything(),
      );
    });

    it('closes the modal without an error when the background throws the same rejection', async () => {
      const user = userEvent.setup();
      const onClose = jest.fn();
      mockSubmitRequestToBackground.mockRejectedValue(
        new Error(alreadyClosedError),
      );

      renderWithProvider(
        <CancelOrderModal isOpen onClose={onClose} order={baseOrder} />,
        mockStore,
      );

      await act(async () => {
        await user.click(screen.getByTestId('perps-cancel-order-button'));
      });

      await waitFor(() => {
        expect(onClose).toHaveBeenCalled();
      });
      expect(screen.queryByText(alreadyClosedError)).not.toBeInTheDocument();
      expect(mockReplacePerpsToastByKey).toHaveBeenCalledWith({
        key: 'perpsToastCancelOrderAlreadyClosed',
        dataTestId: 'perps-toast-cancel-order-already-closed',
      });
      expect(mockTrack).not.toHaveBeenCalledWith(
        'Perp Error',
        expect.anything(),
      );
    });
  });

  describe('geo-blocking', () => {
    it('shows geo-block modal instead of canceling when user is not eligible', async () => {
      mockUsePerpsEligibility.mockReturnValue({ isEligible: false });

      renderWithProvider(
        <CancelOrderModal isOpen onClose={jest.fn()} order={baseOrder} />,
        mockStore,
      );

      const cancelButton = screen.getByTestId('perps-cancel-order-button');
      expect(cancelButton).toBeEnabled();

      fireEvent.click(cancelButton);

      await waitFor(() => {
        expect(screen.getByTestId('perps-geo-block-modal')).toBeInTheDocument();
      });
      expect(mockSubmitRequestToBackground).not.toHaveBeenCalled();
    });
  });

  describe('toast emission', () => {
    it('emits cancel order success toast after a successful cancel', async () => {
      const user = userEvent.setup();
      renderWithProvider(
        <CancelOrderModal isOpen onClose={jest.fn()} order={baseOrder} />,
        mockStore,
      );

      await user.click(screen.getByTestId('perps-cancel-order-button'));

      await waitFor(() => {
        expect(mockReplacePerpsToastByKey).toHaveBeenCalledWith({
          key: 'perpsToastCancelOrderSuccess',
        });
        expect(screen.getByTestId('perps-cancel-order-button')).toBeEnabled();
      });
    });

    it('emits cancel order failed toast when perpsCancelOrder returns success: false', async () => {
      const user = userEvent.setup();
      mockSubmitRequestToBackground.mockResolvedValue({
        success: false,
        error: 'Order not found',
      });

      renderWithProvider(
        <CancelOrderModal isOpen onClose={jest.fn()} order={baseOrder} />,
        mockStore,
      );

      await user.click(screen.getByTestId('perps-cancel-order-button'));

      await waitFor(() => {
        expect(mockReplacePerpsToastByKey).toHaveBeenCalledWith({
          key: 'perpsToastCancelOrderFailed',
          description: messages.perpsCancelOrderFailed.message,
        });
        expect(screen.getByTestId('perps-cancel-order-button')).toBeEnabled();
      });
    });

    it('emits cancel order failed toast when perpsCancelOrder throws', async () => {
      const user = userEvent.setup();
      mockSubmitRequestToBackground.mockRejectedValue(
        new Error('Network error'),
      );

      renderWithProvider(
        <CancelOrderModal isOpen onClose={jest.fn()} order={baseOrder} />,
        mockStore,
      );

      await user.click(screen.getByTestId('perps-cancel-order-button'));

      await waitFor(() => {
        expect(mockReplacePerpsToastByKey).toHaveBeenCalledWith({
          key: 'perpsToastCancelOrderFailed',
          description: messages.perpsNetworkError.message,
        });
        expect(screen.getByTestId('perps-cancel-order-button')).toBeEnabled();
      });
    });
  });
});
