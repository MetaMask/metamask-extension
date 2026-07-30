/**
 * @jest-environment jsdom
 */
import { renderHook, act } from '@testing-library/react-hooks';
import { RampsOrderStatus } from '@metamask/ramps-controller';
import { useRampsOrderEventToasts } from './useRampsOrderEventToasts';
import { showFailedToast, showPendingToast, showSuccessToast } from './shared';
import { clearToastPhase } from './toast-lifecycle';

const mockNavigate = jest.fn();
let mockOrders: {
  providerOrderId: string;
  status: RampsOrderStatus;
}[] = [];

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

    // Seed previous map on first pass after mount with the precreated order.
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
});
