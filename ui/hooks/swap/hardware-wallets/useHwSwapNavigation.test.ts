import { act } from '@testing-library/react-hooks';
import { HardwareWalletSignatureStatus } from '../../../pages/bridge/hardware-wallets/hardware-wallet-signatures-state-machine';
import { createSignatureState } from '../../../pages/bridge/hardware-wallets/hardware-wallet-signatures-state-machine.test-helpers';
import { renderHookWithProvider } from '../../../../test/lib/render-helpers-navigate';
import { useHwSwapNavigation } from './useHwSwapNavigation';

jest.mock('../../../app/toast-listener/shared', () => ({
  showSuccessToast: jest.fn(),
}));

jest.mock('../../bridge/useBridgeNavigation', () => ({
  useBridgeNavigation: jest.fn(),
}));

const mockShowSuccessToast = jest.requireMock(
  '../../../app/toast-listener/shared',
).showSuccessToast;
const mockUseBridgeNavigation = jest.requireMock(
  '../../bridge/useBridgeNavigation',
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
