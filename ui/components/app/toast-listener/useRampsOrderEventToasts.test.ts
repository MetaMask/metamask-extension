/**
 * @jest-environment jsdom
 */
import { renderHook, act } from '@testing-library/react-hooks';
import { RampsOrderStatus } from '@metamask/ramps-controller';
import { useRampsOrderEventToasts } from './useRampsOrderEventToasts';
import {
  dismissToast,
  showFailedToast,
  showPendingToast,
  showSuccessToast,
} from './shared';
import { clearToastPhase } from './toast-lifecycle';

const mockNavigate = jest.fn();
let mockOrders: {
  providerOrderId: string;
  status: RampsOrderStatus;
  [key: string]: unknown;
}[] = [];

const buyOrder = {
  id: 'moonpay/orders/order-1',
  providerOrderId: 'order-1',
  orderType: 'buy',
  createdAt: 1700000000000,
  walletAddress: '0xabc',
  txHash: '',
  excludeFromPurchases: false,
  cryptoAmount: '0.05',
  cryptoCurrency: { symbol: 'ETH', assetId: 'eip155:1/slip44:60' },
  fiatAmount: 100,
  fiatCurrency: { symbol: 'USD' },
  totalFeesFiat: 2,
  network: { name: 'Ethereum', chainId: 'eip155:1' },
};

function clickToastAction(toast: jest.Mock) {
  const [, options] = toast.mock.calls[0];
  options.onActionClick();
}

jest.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
}));

jest.mock('react-redux', () => ({
  useSelector: () => mockOrders,
}));

jest.mock('../../../hooks/useI18nContext', () => ({
  useI18nContext: () => (key: string) => key,
}));

jest.mock('./shared', () => ({
  showPendingToast: jest.fn(),
  showSuccessToast: jest.fn(),
  showFailedToast: jest.fn(),
  dismissToast: jest.fn(),
}));

describe('useRampsOrderEventToasts', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockOrders = [];
    clearToastPhase('order-1');
  });

  it('does not toast when a precreated order is first seeded', () => {
    const { rerender } = renderHook(() => useRampsOrderEventToasts());

    act(() => {
      mockOrders = [
        {
          providerOrderId: 'order-1',
          status: RampsOrderStatus.Precreated,
        },
      ];
      rerender();
    });

    expect(showPendingToast).not.toHaveBeenCalled();
  });

  it('shows a pending toast when an order leaves PRECREATED', () => {
    mockOrders = [
      {
        providerOrderId: 'order-1',
        status: RampsOrderStatus.Precreated,
      },
    ];
    const { rerender } = renderHook(() => useRampsOrderEventToasts());

    act(() => {
      rerender();
    });

    act(() => {
      mockOrders = [
        {
          providerOrderId: 'order-1',
          status: RampsOrderStatus.Pending,
        },
      ];
      rerender();
    });

    expect(showPendingToast).toHaveBeenCalledWith(
      'ramp-order-1',
      expect.objectContaining({
        title: 'rampsOrderToastPendingTitle',
        actionText: 'rampsOrderToastView',
      }),
    );
  });

  it('shows a success toast on COMPLETED after a pending phase', () => {
    mockOrders = [
      {
        providerOrderId: 'order-1',
        status: RampsOrderStatus.Pending,
      },
    ];
    const { rerender } = renderHook(() => useRampsOrderEventToasts());
    act(() => {
      rerender();
    });

    act(() => {
      mockOrders = [
        {
          providerOrderId: 'order-1',
          status: RampsOrderStatus.Completed,
        },
      ];
      rerender();
    });

    expect(showSuccessToast).toHaveBeenCalledWith(
      'ramp-order-1',
      expect.objectContaining({
        title: 'rampsOrderToastSuccessTitle',
      }),
    );
  });

  it('opens the order details page from the toast action', () => {
    mockOrders = [{ ...buyOrder, status: RampsOrderStatus.Precreated }];
    const { rerender } = renderHook(() => useRampsOrderEventToasts());
    act(() => {
      rerender();
    });

    act(() => {
      mockOrders = [{ ...buyOrder, status: RampsOrderStatus.Pending }];
      rerender();
    });

    clickToastAction(showPendingToast as jest.Mock);

    expect(mockNavigate).toHaveBeenCalledWith('/tx/eip155:1/order-1');
  });

  it('opens the order details page using state resolved after the toast is shown', () => {
    mockOrders = [
      { ...buyOrder, network: undefined, status: RampsOrderStatus.Precreated },
    ];
    const { rerender } = renderHook(() => useRampsOrderEventToasts());
    act(() => {
      rerender();
    });

    act(() => {
      mockOrders = [
        { ...buyOrder, network: undefined, status: RampsOrderStatus.Pending },
      ];
      rerender();
    });

    act(() => {
      mockOrders = [{ ...buyOrder, status: RampsOrderStatus.Pending }];
      rerender();
    });

    clickToastAction(showPendingToast as jest.Mock);

    expect(mockNavigate).toHaveBeenCalledWith('/tx/eip155:1/order-1');
  });

  it('falls back to activity when the order has no resolvable chain', () => {
    mockOrders = [
      { ...buyOrder, network: undefined, status: RampsOrderStatus.Precreated },
    ];
    const { rerender } = renderHook(() => useRampsOrderEventToasts());
    act(() => {
      rerender();
    });

    act(() => {
      mockOrders = [
        {
          ...buyOrder,
          network: undefined,
          cryptoCurrency: undefined,
          status: RampsOrderStatus.Pending,
        },
      ];
      rerender();
    });

    clickToastAction(showPendingToast as jest.Mock);

    expect(mockNavigate).toHaveBeenCalledWith('/activity');
  });

  it('shows a failed toast on FAILED', () => {
    mockOrders = [
      {
        providerOrderId: 'order-1',
        status: RampsOrderStatus.Pending,
      },
    ];
    const { rerender } = renderHook(() => useRampsOrderEventToasts());
    act(() => {
      rerender();
    });

    act(() => {
      mockOrders = [
        {
          providerOrderId: 'order-1',
          status: RampsOrderStatus.Failed,
        },
      ];
      rerender();
    });

    expect(showFailedToast).toHaveBeenCalledWith(
      'ramp-order-1',
      expect.objectContaining({
        title: 'rampsOrderToastFailedTitle',
      }),
    );
  });

  it('shows a failed toast on CANCELLED', () => {
    mockOrders = [
      {
        providerOrderId: 'order-1',
        status: RampsOrderStatus.Pending,
      },
    ];
    const { rerender } = renderHook(() => useRampsOrderEventToasts());
    act(() => {
      rerender();
    });

    act(() => {
      mockOrders = [
        {
          providerOrderId: 'order-1',
          status: RampsOrderStatus.Cancelled,
        },
      ];
      rerender();
    });

    expect(showFailedToast).toHaveBeenCalledWith(
      'ramp-order-1',
      expect.objectContaining({
        title: 'rampsOrderToastFailedTitle',
      }),
    );
  });

  it('shows success when an order jumps from PRECREATED to COMPLETED', () => {
    mockOrders = [
      {
        providerOrderId: 'order-1',
        status: RampsOrderStatus.Precreated,
      },
    ];
    const { rerender } = renderHook(() => useRampsOrderEventToasts());
    act(() => {
      rerender();
    });

    act(() => {
      mockOrders = [
        {
          providerOrderId: 'order-1',
          status: RampsOrderStatus.Completed,
        },
      ];
      rerender();
    });

    expect(showSuccessToast).toHaveBeenCalledWith(
      'ramp-order-1',
      expect.objectContaining({
        title: 'rampsOrderToastSuccessTitle',
      }),
    );
  });

  it('dismisses the toast when an order disappears from state', () => {
    mockOrders = [
      {
        providerOrderId: 'order-1',
        status: RampsOrderStatus.Pending,
      },
    ];
    const { rerender } = renderHook(() => useRampsOrderEventToasts());
    act(() => {
      rerender();
    });

    act(() => {
      mockOrders = [];
      rerender();
    });

    expect(dismissToast).toHaveBeenCalledWith('ramp-order-1');
  });

  it('does not toast again when the status is unchanged', () => {
    mockOrders = [
      {
        providerOrderId: 'order-1',
        status: RampsOrderStatus.Pending,
      },
    ];
    const { rerender } = renderHook(() => useRampsOrderEventToasts());
    act(() => {
      rerender();
    });
    jest.clearAllMocks();

    act(() => {
      mockOrders = [
        {
          providerOrderId: 'order-1',
          status: RampsOrderStatus.Pending,
        },
      ];
      rerender();
    });

    expect(showPendingToast).not.toHaveBeenCalled();
    expect(showSuccessToast).not.toHaveBeenCalled();
    expect(showFailedToast).not.toHaveBeenCalled();
  });
});
