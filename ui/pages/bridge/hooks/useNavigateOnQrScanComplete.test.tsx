import { act, waitFor } from '@testing-library/react';
import { QrScanRequestType } from '@metamask/eth-qr-keyring';
import { createBridgeMockStore } from '../../../../test/data/bridge/mock-bridge-store';
import { renderHookWithProvider } from '../../../../test/lib/render-helpers-navigate';
import * as bridgeActions from '../../../ducks/bridge/actions';
import {
  AWAITING_SIGNATURES_ROUTE,
  CROSS_CHAIN_SWAP_ROUTE,
} from '../../../helpers/constants/routes';
import { useNavigateOnQrScanComplete } from './useNavigateOnQrScanComplete';

const BRIDGE_AWAITING_SIGNATURES_PATH = `${CROSS_CHAIN_SWAP_ROUTE}${AWAITING_SIGNATURES_ROUTE}`;

const mockUseNavigate = jest.fn();
const mockNavigateToActivityPage = jest.fn();
const mockNavigateToBridgePage = jest.fn();
const mockNavigateToDefaultRoute = jest.fn().mockResolvedValue(undefined);
/** Per-selector overrides: selector name -> value. Undefined means use real selector. */
let mockUseSelectorOverrides: Record<string, unknown> = {};

jest.mock('react-router-dom', () => {
  return {
    ...jest.requireActual('react-router-dom'),
    useNavigate: () => mockUseNavigate,
  };
});

jest.mock('../../../hooks/bridge/useBridgeNavigation', () => ({
  useBridgeNavigation: () => ({
    navigateToActivityPage: mockNavigateToActivityPage,
    navigateToBridgePage: mockNavigateToBridgePage,
    navigateToDefaultRoute: mockNavigateToDefaultRoute,
  }),
}));

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
    type: QrScanRequestType.SIGN,
    payload: { cbor: 'test-cbor', type: 'test-type' },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseSelectorOverrides = {};
    mockNavigateToDefaultRoute.mockResolvedValue(undefined);
  });

  it('navigates to default route when QR scan completes successfully (active → null, lastQrScanCompletedSuccessfully true)', async () => {
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
      BRIDGE_AWAITING_SIGNATURES_PATH,
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
        expect(mockNavigateToActivityPage).toHaveBeenCalledTimes(1);
      },
      { timeout: 3000 },
    );
    expect(mockUseNavigate).not.toHaveBeenCalled();
  });

  it('navigates to default route when QR scan completes successfully and transaction status page is skipped', async () => {
    const store = createBridgeMockStore({
      metamaskStateOverrides: {
        activeQrCodeScanRequest: mockQrScanRequest,
        lastQrScanCompletedSuccessfully: null,
      },
    });

    mockUseSelectorOverrides = {
      getActiveQrCodeScanRequest: mockQrScanRequest,
      getExtensionSkipTransactionStatusPage: true,
      getLastQrScanCompletedSuccessfully: null,
    };
    const { rerender } = renderHookWithProvider(
      () => useNavigateOnQrScanComplete(),
      store,
      BRIDGE_AWAITING_SIGNATURES_PATH,
    );

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 10));
    });

    mockUseSelectorOverrides = {
      getActiveQrCodeScanRequest: null,
      getExtensionSkipTransactionStatusPage: true,
      getLastQrScanCompletedSuccessfully: true,
    };
    await act(async () => {
      rerender();
      await new Promise((resolve) => setTimeout(resolve, 100));
    });

    await waitFor(
      () => {
        expect(mockNavigateToDefaultRoute).toHaveBeenCalledTimes(1);
      },
      { timeout: 3000 },
    );
    expect(mockNavigateToActivityPage).not.toHaveBeenCalled();
  });

  it('sets wasTxDeclined and navigates to the bridge page when a SIGN request is rejected or cancelled', async () => {
    mockUseSelectorOverrides = {
      getActiveQrCodeScanRequest: mockQrScanRequest,
      getLastQrScanCompletedSuccessfully: null,
    };
    const { rerender } = renderHookWithProvider(
      () => useNavigateOnQrScanComplete(),
      createBridgeMockStore(),
      BRIDGE_AWAITING_SIGNATURES_PATH,
    );

    const setWasTxDeclinedSpy = jest.spyOn(bridgeActions, 'setWasTxDeclined');

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 10));
    });

    mockUseSelectorOverrides = {
      getActiveQrCodeScanRequest: null,
      getLastQrScanCompletedSuccessfully: false,
    };
    await act(async () => {
      rerender();
      await new Promise((resolve) => setTimeout(resolve, 100));
    });

    expect(setWasTxDeclinedSpy).toHaveBeenCalledWith(true);
    expect(mockNavigateToBridgePage).toHaveBeenCalledTimes(1);
    expect(mockUseNavigate).not.toHaveBeenCalled();
    expect(mockNavigateToActivityPage).not.toHaveBeenCalled();
    expect(mockNavigateToDefaultRoute).not.toHaveBeenCalled();
  });

  it('does not navigate to activity when a PAIR request completes successfully', async () => {
    const mockPairRequest = {
      requestId: 'pair-request-id',
      type: QrScanRequestType.PAIR,
    };
    const store = createBridgeMockStore();

    mockUseSelectorOverrides = {
      getActiveQrCodeScanRequest: mockPairRequest,
      getLastQrScanCompletedSuccessfully: null,
    };
    const { rerender } = renderHookWithProvider(
      () => useNavigateOnQrScanComplete(),
      store,
    );

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 10));
    });

    mockUseSelectorOverrides = {
      getActiveQrCodeScanRequest: null,
      getLastQrScanCompletedSuccessfully: true,
    };
    await act(async () => {
      rerender();
      await new Promise((resolve) => setTimeout(resolve, 100));
    });

    expect(mockNavigateToActivityPage).not.toHaveBeenCalled();
    expect(mockNavigateToDefaultRoute).not.toHaveBeenCalled();
  });

  it('does not navigate when a SIGN request completes on a non-bridge route (e.g. send/sign confirmation flow)', async () => {
    const store = createBridgeMockStore({
      metamaskStateOverrides: {
        activeQrCodeScanRequest: mockQrScanRequest,
        lastQrScanCompletedSuccessfully: null,
      },
    });

    mockUseSelectorOverrides = {
      getActiveQrCodeScanRequest: mockQrScanRequest,
      getLastQrScanCompletedSuccessfully: null,
    };
    // Render on a non-bridge route (default pathname '/').
    const { rerender } = renderHookWithProvider(
      () => useNavigateOnQrScanComplete(),
      store,
    );

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 10));
    });

    mockUseSelectorOverrides = {
      getActiveQrCodeScanRequest: null,
      getLastQrScanCompletedSuccessfully: true,
    };
    await act(async () => {
      rerender();
      await new Promise((resolve) => setTimeout(resolve, 100));
    });

    expect(mockNavigateToActivityPage).not.toHaveBeenCalled();
    expect(mockNavigateToDefaultRoute).not.toHaveBeenCalled();
    expect(mockNavigateToBridgePage).not.toHaveBeenCalled();
  });

  it('does not navigate when QR scan request is always null', () => {
    mockUseSelectorOverrides = {
      getActiveQrCodeScanRequest: null,
      getLastQrScanCompletedSuccessfully: null,
    };
    const store = createBridgeMockStore();
    renderHookWithProvider(() => useNavigateOnQrScanComplete(), store);

    expect(mockUseNavigate).not.toHaveBeenCalled();
    expect(mockNavigateToActivityPage).not.toHaveBeenCalled();
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
