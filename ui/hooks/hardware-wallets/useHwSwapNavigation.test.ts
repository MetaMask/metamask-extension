import { act } from '@testing-library/react-hooks';
import { HardwareWalletSignatureStatus } from '../../pages/hardware-wallets/swap/hardware-wallet-signatures-state-machine';
import { createSignatureState } from '../../pages/hardware-wallets/swap/hardware-wallet-signatures-state-machine/test-helpers';
import { renderHookWithProvider } from '../../../test/lib/render-helpers-navigate';
import { useHwSwapNavigation } from './useHwSwapNavigation';

jest.mock('../../components/app/toast-listener/shared', () => ({
  showSuccessToast: jest.fn(),
}));

jest.mock('../bridge/useBridgeNavigation', () => ({
  useBridgeNavigation: jest.fn(),
}));

const mockShowSuccessToast = jest.requireMock(
  '../../components/app/toast-listener/shared',
).showSuccessToast;
const mockUseBridgeNavigation = jest.requireMock(
  '../bridge/useBridgeNavigation',
).useBridgeNavigation;

const mockNavigateToDefaultRoute = jest.fn();

describe('useHwSwapNavigation', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    mockUseBridgeNavigation.mockReturnValue({
      navigateToDefaultRoute: mockNavigateToDefaultRoute,
    });
  });

  afterEach(() => {
    jest.useRealTimers();
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

    expect(mockShowSuccessToast).toHaveBeenCalledTimes(1);
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
    expect(mockShowSuccessToast).not.toHaveBeenCalled();
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

    expect(mockShowSuccessToast).toHaveBeenCalledTimes(1);
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

    expect(mockShowSuccessToast).toHaveBeenCalledTimes(1);
    expect(mockNavigateToDefaultRoute).toHaveBeenCalledTimes(1);

    rerender();

    await act(async () => {
      jest.advanceTimersByTime(1000);
    });

    expect(mockShowSuccessToast).toHaveBeenCalledTimes(1);
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
