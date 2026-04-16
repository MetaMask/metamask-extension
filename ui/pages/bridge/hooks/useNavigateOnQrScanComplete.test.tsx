import { act, waitFor } from '@testing-library/react';
import { createBridgeMockStore } from '../../../../test/data/bridge/mock-bridge-store';
import { renderHookWithProvider } from '../../../../test/lib/render-helpers-navigate';
import { DEFAULT_ROUTE } from '../../../helpers/constants/routes';
import {
  CROSS_CHAIN_SWAP_ROUTE,
  PREPARE_SWAP_ROUTE,
} from '../../../helpers/constants/routes';
import { useNavigateOnQrScanComplete } from './useNavigateOnQrScanComplete';

const mockUseNavigate = jest.fn();
/** Per-selector overrides: selector name -> value. Undefined means use real selector. */
let mockUseSelectorOverrides: Record<string, unknown> = {};

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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    useSelector: (selector: any) => {
      const key = selector?.name;
      if (
        mockUseSelectorOverrides &&
        key !== undefined &&
        key in mockUseSelectorOverrides
      ) {
        return mockUseSelectorOverrides[key];
      }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const state = (original.useStore as any)?.()?.getState?.() || {};
      return selector(state);
    },
  };
});

describe('useNavigateOnQrScanComplete', () => {
  const mockQrScanRequest = {
    requestId: 'test-request-id',
    type: 'sign' as const,
    payload: { cbor: 'test-cbor', type: 'test-type' },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseSelectorOverrides = {};
  });

  it('navigates to activity tab when QR scan completes successfully (active → null, lastQrScanCompletedSuccessfully true)', async () => {
    const store = createBridgeMockStore({
      metamaskStateOverrides: {
        activeQrCodeScanRequest: mockQrScanRequest,
        lastQrScanCompletedSuccessfully: null,
      },
    });

    // First render: active request, no completion flag yet
    mockUseSelectorOverrides = {
      getActiveQrCodeScanRequest: mockQrScanRequest,
      getLastQrScanCompletedSuccessfully: null,
    };
    const { rerender } = renderHookWithProvider(
      () => useNavigateOnQrScanComplete(),
      store,
    );

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 10));
    });

    // Second render: request cleared, completed successfully
    mockUseSelectorOverrides = {
      getActiveQrCodeScanRequest: null,
      getLastQrScanCompletedSuccessfully: true,
    };
    await act(async () => {
      rerender();
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

  it('navigates back to prepare when QR scan is rejected/cancelled (lastQrScanCompletedSuccessfully false)', async () => {
    const store = createBridgeMockStore();

    mockUseSelectorOverrides = {
      getActiveQrCodeScanRequest: mockQrScanRequest,
      getLastQrScanCompletedSuccessfully: null,
    };
    const { rerender } = renderHookWithProvider(
      () => useNavigateOnQrScanComplete(),
      store,
    );

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 10));
    });

    // Transition to null but with rejection (useSubmitBridgeTransaction will navigate to prepare)
    mockUseSelectorOverrides = {
      getActiveQrCodeScanRequest: null,
      getLastQrScanCompletedSuccessfully: false,
    };
    await act(async () => {
      rerender();
      await new Promise((resolve) => setTimeout(resolve, 100));
    });

    expect(mockUseNavigate).toHaveBeenCalledWith(
      `${CROSS_CHAIN_SWAP_ROUTE}${PREPARE_SWAP_ROUTE}`,
      {
        replace: true,
      },
    );
  });

  it('does not navigate when QR scan request is always null', () => {
    mockUseSelectorOverrides = {
      getActiveQrCodeScanRequest: null,
      getLastQrScanCompletedSuccessfully: null,
    };
    const store = createBridgeMockStore();
    renderHookWithProvider(() => useNavigateOnQrScanComplete(), store);

    expect(mockUseNavigate).not.toHaveBeenCalled();
  });

  it('does not navigate when QR scan request is always undefined', () => {
    mockUseSelectorOverrides = {
      getActiveQrCodeScanRequest: undefined,
      getLastQrScanCompletedSuccessfully: null,
    };
    const store = createBridgeMockStore();
    renderHookWithProvider(() => useNavigateOnQrScanComplete(), store);

    expect(mockUseNavigate).not.toHaveBeenCalled();
  });

  it('does not navigate when QR scan request transitions from undefined to null', () => {
    mockUseSelectorOverrides = {
      getActiveQrCodeScanRequest: undefined,
      getLastQrScanCompletedSuccessfully: null,
    };
    const store = createBridgeMockStore();
    const { rerender } = renderHookWithProvider(
      () => useNavigateOnQrScanComplete(),
      store,
    );

    mockUseSelectorOverrides = {
      getActiveQrCodeScanRequest: null,
      getLastQrScanCompletedSuccessfully: null,
    };
    act(() => {
      rerender();
    });

    expect(mockUseNavigate).not.toHaveBeenCalled();
  });

  it('does not navigate when QR scan request remains active', () => {
    mockUseSelectorOverrides = {
      getActiveQrCodeScanRequest: mockQrScanRequest,
      getLastQrScanCompletedSuccessfully: null,
    };
    const store = createBridgeMockStore();
    renderHookWithProvider(() => useNavigateOnQrScanComplete(), store);

    expect(mockUseNavigate).not.toHaveBeenCalled();
  });
});
