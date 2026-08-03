/**
 * @jest-environment jsdom
 */
import { renderHook, act } from '@testing-library/react-hooks';
import { RampsOrderStatus } from '@metamask/ramps-controller';
import {
  dismissToast,
  showFailedToast,
  showPendingToast,
  showSuccessToast,
} from '../../components/app/toast-listener/shared';
import { clearToastPhase } from '../../components/app/toast-listener/toast-lifecycle';
import { useRampsOrderEventToasts } from './useRampsOrderEventToasts';

const mockNavigate = jest.fn();
const mockSelectRampsOrdersForSelectedAccount = jest.fn();
const mockGetSelectedInternalAccount = jest.fn();

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

function clickToast(toast: jest.Mock) {
  const [, options] = toast.mock.calls[0];
  options.onClick();
}

jest.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
}));

jest.mock('react-redux', () => ({
  useSelector: (selector: () => unknown) => selector(),
}));

jest.mock('../../selectors/rampsController', () => ({
  selectRampsOrdersForSelectedAccount: () =>
    mockSelectRampsOrdersForSelectedAccount(),
}));

jest.mock('../../../shared/lib/selectors/accounts', () => ({
  getSelectedInternalAccount: () => mockGetSelectedInternalAccount(),
}));

jest.mock('../useI18nContext', () => ({
  useI18nContext: () => (key: string) => key,
}));

jest.mock('../../components/app/toast-listener/shared', () => ({
  showPendingToast: jest.fn(),
  showSuccessToast: jest.fn(),
  showFailedToast: jest.fn(),
  dismissToast: jest.fn(),
}));

describe('useRampsOrderEventToasts', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSelectRampsOrdersForSelectedAccount.mockReturnValue([]);
    mockGetSelectedInternalAccount.mockReturnValue({ address: '0xabc' });
    clearToastPhase('order-1');
    clearToastPhase('order-2');
  });

  it('does not toast when a precreated order is first seeded', () => {
    const { rerender } = renderHook(() => useRampsOrderEventToasts());

    act(() => {
      mockSelectRampsOrdersForSelectedAccount.mockReturnValue([
        {
          providerOrderId: 'order-1',
          status: RampsOrderStatus.Precreated,
        },
      ]);
      rerender();
    });

    expect(showPendingToast).not.toHaveBeenCalled();
  });

  it('shows a pending toast when an order leaves PRECREATED', () => {
    mockSelectRampsOrdersForSelectedAccount.mockReturnValue([
      {
        providerOrderId: 'order-1',
        status: RampsOrderStatus.Precreated,
      },
    ]);
    const { rerender } = renderHook(() => useRampsOrderEventToasts());

    act(() => {
      rerender();
    });

    act(() => {
      mockSelectRampsOrdersForSelectedAccount.mockReturnValue([
        {
          providerOrderId: 'order-1',
          status: RampsOrderStatus.Pending,
        },
      ]);
      rerender();
    });

    expect(showPendingToast).toHaveBeenCalledWith(
      'ramp-order-1',
      expect.objectContaining({
        title: 'rampsOrderToastPendingTitle',
        onClick: expect.any(Function),
      }),
    );
  });

  it('shows a success toast on COMPLETED after a pending phase', () => {
    mockSelectRampsOrdersForSelectedAccount.mockReturnValue([
      {
        providerOrderId: 'order-1',
        status: RampsOrderStatus.Pending,
      },
    ]);
    const { rerender } = renderHook(() => useRampsOrderEventToasts());
    act(() => {
      rerender();
    });

    act(() => {
      mockSelectRampsOrdersForSelectedAccount.mockReturnValue([
        {
          providerOrderId: 'order-1',
          status: RampsOrderStatus.Completed,
        },
      ]);
      rerender();
    });

    expect(showSuccessToast).toHaveBeenCalledWith(
      'ramp-order-1',
      expect.objectContaining({
        title: 'rampsOrderToastSuccessTitle',
      }),
    );
  });

  it('opens the order details page when the toast is clicked', () => {
    mockSelectRampsOrdersForSelectedAccount.mockReturnValue([
      { ...buyOrder, status: RampsOrderStatus.Precreated },
    ]);
    const { rerender } = renderHook(() => useRampsOrderEventToasts());
    act(() => {
      rerender();
    });

    act(() => {
      mockSelectRampsOrdersForSelectedAccount.mockReturnValue([
        { ...buyOrder, status: RampsOrderStatus.Pending },
      ]);
      rerender();
    });

    clickToast(showPendingToast as jest.Mock);

    expect(mockNavigate).toHaveBeenCalledWith('/ramps/order/eip155:1/order-1');
  });

  it('opens the order details page using state resolved after the toast is shown', () => {
    mockSelectRampsOrdersForSelectedAccount.mockReturnValue([
      { ...buyOrder, network: undefined, status: RampsOrderStatus.Precreated },
    ]);
    const { rerender } = renderHook(() => useRampsOrderEventToasts());
    act(() => {
      rerender();
    });

    act(() => {
      mockSelectRampsOrdersForSelectedAccount.mockReturnValue([
        { ...buyOrder, network: undefined, status: RampsOrderStatus.Pending },
      ]);
      rerender();
    });

    act(() => {
      mockSelectRampsOrdersForSelectedAccount.mockReturnValue([
        { ...buyOrder, status: RampsOrderStatus.Pending },
      ]);
      rerender();
    });

    clickToast(showPendingToast as jest.Mock);

    expect(mockNavigate).toHaveBeenCalledWith('/ramps/order/eip155:1/order-1');
  });

  it('falls back to activity when the order has no resolvable chain', () => {
    mockSelectRampsOrdersForSelectedAccount.mockReturnValue([
      { ...buyOrder, network: undefined, status: RampsOrderStatus.Precreated },
    ]);
    const { rerender } = renderHook(() => useRampsOrderEventToasts());
    act(() => {
      rerender();
    });

    act(() => {
      mockSelectRampsOrdersForSelectedAccount.mockReturnValue([
        {
          ...buyOrder,
          network: undefined,
          cryptoCurrency: undefined,
          status: RampsOrderStatus.Pending,
        },
      ]);
      rerender();
    });

    clickToast(showPendingToast as jest.Mock);

    expect(mockNavigate).toHaveBeenCalledWith('/activity');
  });

  it('shows a failed toast on FAILED', () => {
    mockSelectRampsOrdersForSelectedAccount.mockReturnValue([
      {
        providerOrderId: 'order-1',
        status: RampsOrderStatus.Pending,
      },
    ]);
    const { rerender } = renderHook(() => useRampsOrderEventToasts());
    act(() => {
      rerender();
    });

    act(() => {
      mockSelectRampsOrdersForSelectedAccount.mockReturnValue([
        {
          providerOrderId: 'order-1',
          status: RampsOrderStatus.Failed,
        },
      ]);
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
    mockSelectRampsOrdersForSelectedAccount.mockReturnValue([
      {
        providerOrderId: 'order-1',
        status: RampsOrderStatus.Pending,
      },
    ]);
    const { rerender } = renderHook(() => useRampsOrderEventToasts());
    act(() => {
      rerender();
    });

    act(() => {
      mockSelectRampsOrdersForSelectedAccount.mockReturnValue([
        {
          providerOrderId: 'order-1',
          status: RampsOrderStatus.Cancelled,
        },
      ]);
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
    mockSelectRampsOrdersForSelectedAccount.mockReturnValue([
      {
        providerOrderId: 'order-1',
        status: RampsOrderStatus.Precreated,
      },
    ]);
    const { rerender } = renderHook(() => useRampsOrderEventToasts());
    act(() => {
      rerender();
    });

    act(() => {
      mockSelectRampsOrdersForSelectedAccount.mockReturnValue([
        {
          providerOrderId: 'order-1',
          status: RampsOrderStatus.Completed,
        },
      ]);
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
    mockSelectRampsOrdersForSelectedAccount.mockReturnValue([
      {
        providerOrderId: 'order-1',
        status: RampsOrderStatus.Pending,
      },
    ]);
    const { rerender } = renderHook(() => useRampsOrderEventToasts());
    act(() => {
      rerender();
    });

    act(() => {
      mockSelectRampsOrdersForSelectedAccount.mockReturnValue([]);
      rerender();
    });

    expect(dismissToast).toHaveBeenCalledWith('ramp-order-1');
  });

  it('does not toast again when the status is unchanged', () => {
    mockSelectRampsOrdersForSelectedAccount.mockReturnValue([
      {
        providerOrderId: 'order-1',
        status: RampsOrderStatus.Pending,
      },
    ]);
    const { rerender } = renderHook(() => useRampsOrderEventToasts());
    act(() => {
      rerender();
    });
    jest.clearAllMocks();

    act(() => {
      mockSelectRampsOrdersForSelectedAccount.mockReturnValue([
        {
          providerOrderId: 'order-1',
          status: RampsOrderStatus.Pending,
        },
      ]);
      rerender();
    });

    expect(showPendingToast).not.toHaveBeenCalled();
    expect(showSuccessToast).not.toHaveBeenCalled();
    expect(showFailedToast).not.toHaveBeenCalled();
  });

  it('does not re-toast historical orders when the selected account changes', () => {
    mockSelectRampsOrdersForSelectedAccount.mockReturnValue([
      {
        providerOrderId: 'order-1',
        status: RampsOrderStatus.Completed,
        orderType: 'buy',
      },
    ]);
    const { rerender } = renderHook(() => useRampsOrderEventToasts());
    act(() => {
      rerender();
    });
    jest.clearAllMocks();

    act(() => {
      mockGetSelectedInternalAccount.mockReturnValue({ address: '0xdef' });
      mockSelectRampsOrdersForSelectedAccount.mockReturnValue([
        {
          providerOrderId: 'order-2',
          status: RampsOrderStatus.Completed,
          orderType: 'buy',
        },
      ]);
      rerender();
    });

    expect(showPendingToast).not.toHaveBeenCalled();
    expect(showSuccessToast).not.toHaveBeenCalled();
    expect(showFailedToast).not.toHaveBeenCalled();
  });

  it('dismisses prior-account toasts when the selected account changes', () => {
    mockSelectRampsOrdersForSelectedAccount.mockReturnValue([
      {
        providerOrderId: 'order-1',
        status: RampsOrderStatus.Pending,
        orderType: 'buy',
      },
    ]);
    const { rerender } = renderHook(() => useRampsOrderEventToasts());
    act(() => {
      rerender();
    });
    jest.clearAllMocks();

    act(() => {
      mockGetSelectedInternalAccount.mockReturnValue({ address: '0xdef' });
      mockSelectRampsOrdersForSelectedAccount.mockReturnValue([
        {
          providerOrderId: 'order-2',
          status: RampsOrderStatus.Pending,
          orderType: 'buy',
        },
      ]);
      rerender();
    });

    expect(dismissToast).toHaveBeenCalledWith('ramp-order-1');
    expect(showPendingToast).not.toHaveBeenCalled();
  });

  it('uses sell toast copy for sell orders', () => {
    mockSelectRampsOrdersForSelectedAccount.mockReturnValue([
      {
        providerOrderId: 'order-1',
        status: RampsOrderStatus.Precreated,
        orderType: 'SELL',
      },
    ]);
    const { rerender } = renderHook(() => useRampsOrderEventToasts());
    act(() => {
      rerender();
    });

    act(() => {
      mockSelectRampsOrdersForSelectedAccount.mockReturnValue([
        {
          providerOrderId: 'order-1',
          status: RampsOrderStatus.Pending,
          orderType: 'SELL',
        },
      ]);
      rerender();
    });

    expect(showPendingToast).toHaveBeenCalledWith(
      'ramp-order-1',
      expect.objectContaining({
        title: 'rampsOrderToastSellPendingTitle',
        description: 'rampsOrderToastSellPendingDescription',
      }),
    );
  });
});
