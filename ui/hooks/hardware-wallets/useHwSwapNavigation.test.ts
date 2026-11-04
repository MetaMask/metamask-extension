import { act } from '@testing-library/react';
import { HardwareWalletSignatureStatus } from '../../pages/hardware-wallets/swap/hardware-wallet-signatures-state-machine';
import { createSignatureState } from '../../pages/hardware-wallets/swap/hardware-wallet-signatures-state-machine/test-helpers';
import { renderHookWithProvider } from '../../../test/lib/render-helpers-navigate';
import { useHwSwapNavigation } from './useHwSwapNavigation';

jest.mock('../bridge/useBridgeNavigation', () => ({
  useBridgeNavigation: jest.fn(),
}));

const mockNavigate = jest.fn();
let mockLocationKey = 'default';
let mockLocationSearch = '';
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
  useLocation: () => ({ key: mockLocationKey, search: mockLocationSearch }),
}));

const mockResetBridgeController = jest.fn(() => Promise.resolve());
jest.mock('../../ducks/bridge/actions', () => ({
  ...jest.requireActual('../../ducks/bridge/actions'),
  resetBridgeController: () => () => mockResetBridgeController(),
}));

const mockUseBridgeNavigation = jest.requireMock(
  '../bridge/useBridgeNavigation',
).useBridgeNavigation;

const mockNavigateToDefaultRoute = jest.fn();

describe('useHwSwapNavigation', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    mockLocationKey = 'default';
    mockLocationSearch = '';
    mockUseBridgeNavigation.mockReturnValue({
      navigateToDefaultRoute: mockNavigateToDefaultRoute,
    });
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('navigates back to swaps for swaps with a previous history entry', async () => {
    mockLocationKey = 'signing';
    renderHookWithProvider(
      () =>
        useHwSwapNavigation({
          signatureState: createSignatureState(
            HardwareWalletSignatureStatus.Submitted,
          ),
        }),
      {},
    );

    await act(async () => {
      jest.advanceTimersByTime(1000);
    });

    expect(mockNavigate).toHaveBeenCalledWith(-1);
    expect(mockNavigateToDefaultRoute).not.toHaveBeenCalled();
    // Swaps restores the amount from the active quote on remount, so the
    // controller must be reset before navigating back.
    expect(mockResetBridgeController.mock.invocationCallOrder[0]).toBeLessThan(
      mockNavigate.mock.invocationCallOrder[0],
    );
  });

  it('navigates to the default route for swaps opened from transaction shield', async () => {
    mockLocationKey = 'signing';
    mockLocationSearch = '?isFromTransactionShield=true';
    renderHookWithProvider(
      () =>
        useHwSwapNavigation({
          signatureState: createSignatureState(
            HardwareWalletSignatureStatus.Submitted,
          ),
        }),
      {},
    );

    await act(async () => {
      jest.advanceTimersByTime(1000);
    });

    expect(mockNavigateToDefaultRoute).toHaveBeenCalledWith({ replace: true });
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it('navigates to the default route for sendBundle flows', async () => {
    mockLocationKey = 'signing';
    renderHookWithProvider(
      () =>
        useHwSwapNavigation({
          signatureState: createSignatureState(
            HardwareWalletSignatureStatus.Submitted,
          ),
          isSendBundleFlow: true,
        }),
      {},
    );

    await act(async () => {
      jest.advanceTimersByTime(1000);
    });

    expect(mockNavigateToDefaultRoute).toHaveBeenCalledTimes(1);
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it('navigates to default route when status is Submitted', async () => {
    renderHookWithProvider(
      () =>
        useHwSwapNavigation({
          signatureState: createSignatureState(
            HardwareWalletSignatureStatus.Submitted,
          ),
        }),
      {},
    );

    await act(async () => {
      jest.advanceTimersByTime(1000);
    });

    expect(mockNavigateToDefaultRoute).toHaveBeenCalledTimes(1);
  });

  it('does not navigate when status is not Submitted', () => {
    renderHookWithProvider(
      () =>
        useHwSwapNavigation({
          signatureState: createSignatureState(
            HardwareWalletSignatureStatus.AwaitingFirstSignature,
          ),
        }),
      {},
    );

    act(() => {
      jest.advanceTimersByTime(1000);
    });

    expect(mockNavigateToDefaultRoute).not.toHaveBeenCalled();
  });

  it('does not navigate twice when status remains Submitted', async () => {
    const { rerender } = renderHookWithProvider(
      () =>
        useHwSwapNavigation({
          signatureState: createSignatureState(
            HardwareWalletSignatureStatus.Submitted,
          ),
        }),
      {},
    );

    await act(async () => {
      jest.advanceTimersByTime(1000);
    });

    expect(mockNavigateToDefaultRoute).toHaveBeenCalledTimes(1);

    rerender();

    await act(async () => {
      jest.advanceTimersByTime(1000);
    });

    expect(mockNavigateToDefaultRoute).toHaveBeenCalledTimes(1);
  });

  it('reschedules navigation when the navigation callback changes before the timeout fires', async () => {
    const updatedNavigateToDefaultRoute = jest.fn();
    mockUseBridgeNavigation
      .mockReturnValueOnce({
        navigateToDefaultRoute: mockNavigateToDefaultRoute,
      })
      .mockReturnValue({
        navigateToDefaultRoute: updatedNavigateToDefaultRoute,
      });

    const { rerender } = renderHookWithProvider(
      () =>
        useHwSwapNavigation({
          signatureState: createSignatureState(
            HardwareWalletSignatureStatus.Submitted,
          ),
        }),
      {},
    );

    rerender();

    await act(async () => {
      jest.advanceTimersByTime(1000);
    });

    expect(mockNavigateToDefaultRoute).not.toHaveBeenCalled();
    expect(updatedNavigateToDefaultRoute).toHaveBeenCalledTimes(1);
  });

  it('does not schedule duplicate navigation when the navigation callback changes while navigation is pending', async () => {
    const updatedNavigateToDefaultRoute = jest.fn();
    mockNavigateToDefaultRoute.mockReturnValue(new Promise(() => undefined));
    mockUseBridgeNavigation
      .mockReturnValueOnce({
        navigateToDefaultRoute: mockNavigateToDefaultRoute,
      })
      .mockReturnValue({
        navigateToDefaultRoute: updatedNavigateToDefaultRoute,
      });

    const { rerender } = renderHookWithProvider(
      () =>
        useHwSwapNavigation({
          signatureState: createSignatureState(
            HardwareWalletSignatureStatus.Submitted,
          ),
        }),
      {},
    );

    act(() => {
      jest.advanceTimersByTime(1000);
    });

    expect(mockNavigateToDefaultRoute).toHaveBeenCalledTimes(1);

    rerender();

    await act(async () => {
      jest.advanceTimersByTime(1000);
    });

    expect(mockNavigateToDefaultRoute).toHaveBeenCalledTimes(1);
    expect(updatedNavigateToDefaultRoute).not.toHaveBeenCalled();
  });

  it('clears timeout on unmount', () => {
    const { unmount } = renderHookWithProvider(
      () =>
        useHwSwapNavigation({
          signatureState: createSignatureState(
            HardwareWalletSignatureStatus.Submitted,
          ),
        }),
      {},
    );

    unmount();

    act(() => {
      jest.advanceTimersByTime(1000);
    });

    expect(mockNavigateToDefaultRoute).not.toHaveBeenCalled();
  });

  it('returns hasNavigatedAfterSubmission ref', () => {
    const { result } = renderHookWithProvider(
      () =>
        useHwSwapNavigation({
          signatureState: createSignatureState(
            HardwareWalletSignatureStatus.AwaitingFirstSignature,
          ),
        }),
      {},
    );

    expect(result.current.hasNavigatedAfterSubmission).toBeDefined();
    expect(result.current.hasNavigatedAfterSubmission.current).toBe(false);
  });
});
