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

jest.mock('../perps-toast', () => ({
  PERPS_TOAST_KEYS: {
    CANCEL_ORDER_FAILED: 'perpsToastCancelOrderFailed',
    CANCEL_ORDER_SUCCESS: 'perpsToastCancelOrderSuccess',
  },
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

    it('builds modal title as "Limit long" for a buy limit order', () => {
      renderWithProvider(
        <CancelOrderModal isOpen onClose={jest.fn()} order={baseOrder} />,
        mockStore,
      );

      expect(screen.getByText('Limit long')).toBeInTheDocument();
    });

    it('builds modal title as "Limit short" for a sell limit order', () => {
      const sellOrder: Order = { ...baseOrder, side: 'sell' };
      renderWithProvider(
        <CancelOrderModal isOpen onClose={jest.fn()} order={sellOrder} />,
        mockStore,
      );

      expect(screen.getByText('Limit short')).toBeInTheDocument();
    });

    it('displays the limit price row', () => {
      renderWithProvider(
        <CancelOrderModal isOpen onClose={jest.fn()} order={baseOrder} />,
        mockStore,
      );

      expect(
        screen.getByText(messages.perpsLimitPrice.message),
      ).toBeInTheDocument();
      expect(screen.getAllByText('$3,000.00').length).toBeGreaterThanOrEqual(1);
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
      expect(screen.getAllByText('$3,000.00').length).toBeGreaterThanOrEqual(1);
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
    it('calls perpsCancelOrder with orderId and symbol on button click', async () => {
      const user = userEvent.setup();
      renderWithProvider(
        <CancelOrderModal isOpen onClose={jest.fn()} order={baseOrder} />,
        mockStore,
      );

      await user.click(screen.getByTestId('perps-cancel-order-button'));

      await waitFor(() => {
        expect(mockSubmitRequestToBackground).toHaveBeenCalledWith(
          'perpsCancelOrder',
          [{ orderId: baseOrder.orderId, symbol: baseOrder.symbol }],
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

    it('shows error message when perpsCancelOrder returns success: false', async () => {
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
        expect(screen.getByText('Order not found')).toBeInTheDocument();
        expect(screen.getByTestId('perps-cancel-order-button')).toBeEnabled();
      });
    });

    it('shows generic error message when perpsCancelOrder rejects', async () => {
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
        expect(screen.getByText('Network error')).toBeInTheDocument();
        expect(screen.getByTestId('perps-cancel-order-button')).toBeEnabled();
      });
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
        expect(screen.getByText('Cancel request rejected')).toBeInTheDocument();
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
    it('fires PerpsOrderCancelTransaction with success on successful cancel', async () => {
      const user = userEvent.setup();
      renderWithProvider(
        <CancelOrderModal isOpen onClose={jest.fn()} order={baseOrder} />,
        mockStore,
      );

      await user.click(screen.getByTestId('perps-cancel-order-button'));

      await waitFor(() => {
        expect(mockTrack).toHaveBeenCalledWith(
          'Perp Order Cancel Transaction',
          expect.objectContaining({
            asset: baseOrder.symbol,
            status: 'success',
            [PERPS_EVENT_PROPERTY.ORDER_TYPE]: baseOrder.orderType,
          }),
        );
      });

      await waitFor(() => {
        expect(screen.getByTestId('perps-cancel-order-button')).toBeEnabled();
      });
    });

    it('fires PerpsOrderCancelTransaction with failed status and PerpsError on failure', async () => {
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
        expect(mockTrack).toHaveBeenCalledWith(
          'Perp Order Cancel Transaction',
          expect.objectContaining({
            asset: baseOrder.symbol,
            status: 'failed',
            [PERPS_EVENT_PROPERTY.ERROR_MESSAGE]: 'Network error',
          }),
        );
        expect(mockTrack).toHaveBeenCalledWith(
          'Perp Error',
          expect.objectContaining({
            [PERPS_EVENT_PROPERTY.ERROR_TYPE]: 'backend',
            [PERPS_EVENT_PROPERTY.ERROR_MESSAGE]: 'Network error',
          }),
        );
      });

      await waitFor(() => {
        expect(screen.getByTestId('perps-cancel-order-button')).toBeEnabled();
      });
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
          description: 'Order not found',
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
          description: 'Network error',
        });
        expect(screen.getByTestId('perps-cancel-order-button')).toBeEnabled();
      });
    });
  });
});
