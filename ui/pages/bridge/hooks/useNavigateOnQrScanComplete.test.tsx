import { act, waitFor } from '@testing-library/react';
import { createBridgeMockStore } from '../../../../test/data/bridge/mock-bridge-store';
import { renderHookWithProvider } from '../../../../test/lib/render-helpers-navigate';
import { DEFAULT_ROUTE } from '../../../helpers/constants/routes';
import { useNavigateOnQrScanComplete } from './useNavigateOnQrScanComplete';

const mockUseNavigate = jest.fn();
let mockUseSelectorReturnValue: unknown = null;

jest.mock('react-router-dom', () => {
  return {
    ...jest.requireActual('react-router-dom'),
    useNavigate: () => mockUseNavigate,
  };
});

jest.mock('react-redux', () => {
  const original = jest.requireActual('react-redux');
  return {
    ...original,
    useSelector: (selector: any) => {
      // If mock value is set, return it; otherwise use real selector
      if (mockUseSelectorReturnValue !== undefined) {
        return mockUseSelectorReturnValue;
      }
      const state = (original.useStore as any)?.()?.getState?.() || {};
      return selector(state);
    },
  };
});

describe('useNavigateOnQrScanComplete', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseSelectorReturnValue = undefined; // Reset to use real selector by default
  });

  it('navigates to activity tab when QR scan completes (active → null)', async () => {
    const mockQrScanRequest = {
      requestId: 'test-request-id',
      type: 'sign' as const,
      payload: { cbor: 'test-cbor', type: 'test-type' },
    };

    // Start with active QR scan request
    mockUseSelectorReturnValue = mockQrScanRequest;
    const store = createBridgeMockStore({
      metamaskStateOverrides: {
        activeQrCodeScanRequest: mockQrScanRequest,
      },
    });

    const { rerender } = renderHookWithProvider(
      () => useNavigateOnQrScanComplete(),
      store,
    );

    // Wait for initial render to set the ref
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 10));
    });

    // Update to null - this will trigger navigation
    mockUseSelectorReturnValue = null;

    // Force re-render - useSelector will now return null
    await act(async () => {
      rerender();
      // Wait for useEffect to run
      await new Promise((resolve) => setTimeout(resolve, 100));
    });

    await waitFor(
      () => {
        expect(mockUseNavigate).toHaveBeenCalledWith(
          `${DEFAULT_ROUTE}?tab=activity`,
          {
            replace: true,
            state: { stayOnHomePage: true },
          },
        );
      },
      { timeout: 3000 },
    );
  });

  it('navigates to activity tab when QR scan completes (active → false)', async () => {
    const mockQrScanRequest = {
      requestId: 'test-request-id',
      type: 'sign' as const,
      payload: { cbor: 'test-cbor', type: 'test-type' },
    };

    // Start with active QR scan request
    mockUseSelectorReturnValue = mockQrScanRequest;
    const store = createBridgeMockStore({
      metamaskStateOverrides: {
        activeQrCodeScanRequest: mockQrScanRequest,
      },
    });

    const { rerender } = renderHookWithProvider(
      () => useNavigateOnQrScanComplete(),
      store,
    );

    // Wait for initial render to set the ref
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 10));
    });

    // Update to false - this will trigger navigation
    mockUseSelectorReturnValue = false;

    // Force re-render - useSelector will now return false
    await act(async () => {
      rerender();
      // Wait for useEffect to run
      await new Promise((resolve) => setTimeout(resolve, 100));
    });

    await waitFor(
      () => {
        expect(mockUseNavigate).toHaveBeenCalledWith(
          `${DEFAULT_ROUTE}?tab=activity`,
          {
            replace: true,
            state: { stayOnHomePage: true },
          },
        );
      },
      { timeout: 3000 },
    );
  });

  it('does not navigate when QR scan request is always null', () => {
    mockUseSelectorReturnValue = null;
    const store = createBridgeMockStore();
    renderHookWithProvider(() => useNavigateOnQrScanComplete(), store);

    expect(mockUseNavigate).not.toHaveBeenCalled();
  });

  it('does not navigate when QR scan request is always undefined', () => {
    mockUseSelectorReturnValue = undefined;
    const store = createBridgeMockStore();
    renderHookWithProvider(() => useNavigateOnQrScanComplete(), store);

    expect(mockUseNavigate).not.toHaveBeenCalled();
  });

  it('does not navigate when QR scan request transitions from undefined to null', () => {
    // Start with undefined
    mockUseSelectorReturnValue = undefined;
    const store = createBridgeMockStore();
    const { rerender } = renderHookWithProvider(
      () => useNavigateOnQrScanComplete(),
      store,
    );

    // Transition to null (initialization, not a scan)
    mockUseSelectorReturnValue = null;
    act(() => {
      rerender();
    });

    expect(mockUseNavigate).not.toHaveBeenCalled();
  });

  it('does not navigate when QR scan request remains active', () => {
    const mockQrScanRequest = {
      requestId: 'test-request-id',
      type: 'sign' as const,
      payload: { cbor: 'test-cbor', type: 'test-type' },
    };

    mockUseSelectorReturnValue = mockQrScanRequest;
    const store = createBridgeMockStore();
    renderHookWithProvider(() => useNavigateOnQrScanComplete(), store);

    expect(mockUseNavigate).not.toHaveBeenCalled();
  });
});
