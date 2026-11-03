import { act } from '@testing-library/react';
import { HardwareWalletSignatureStatus } from '../../pages/hardware-wallets/swap/hardware-wallet-signatures-state-machine';
import { createSignatureState } from '../../pages/hardware-wallets/swap/hardware-wallet-signatures-state-machine/test-helpers';
import { renderHookWithProvider } from '../../../test/lib/render-helpers-navigate';
import { useHwSwapNavigation } from './useHwSwapNavigation';

jest.mock('../bridge/useBridgeNavigation', () => ({
  useBridgeNavigation: jest.fn(),
}));

const mockUseBridgeNavigation = jest.requireMock(
  '../bridge/useBridgeNavigation',
).useBridgeNavigation;

const mockNavigateToSwapsAfterSubmit = jest.fn();
const mockNavigateToDefaultRoute = jest.fn();

describe('useHwSwapNavigation', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    mockUseBridgeNavigation.mockReturnValue({
      navigateToSwapsAfterSubmit: mockNavigateToSwapsAfterSubmit,
      navigateToDefaultRoute: mockNavigateToDefaultRoute,
    });
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('navigates to the default route for sendBundle flows', async () => {
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
    expect(mockNavigateToSwapsAfterSubmit).not.toHaveBeenCalled();
  });

  it('navigates back to swaps when status is Submitted', async () => {
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

    expect(mockNavigateToSwapsAfterSubmit).toHaveBeenCalledTimes(1);
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

    expect(mockNavigateToSwapsAfterSubmit).not.toHaveBeenCalled();
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

    expect(mockNavigateToSwapsAfterSubmit).toHaveBeenCalledTimes(1);

    rerender();

    await act(async () => {
      jest.advanceTimersByTime(1000);
    });

    expect(mockNavigateToSwapsAfterSubmit).toHaveBeenCalledTimes(1);
  });

  it('reschedules navigation when the navigation callback changes before the timeout fires', async () => {
    const updatedNavigateToSwapsAfterSubmit = jest.fn();
    mockUseBridgeNavigation
      .mockReturnValueOnce({
        navigateToSwapsAfterSubmit: mockNavigateToSwapsAfterSubmit,
      })
      .mockReturnValue({
        navigateToSwapsAfterSubmit: updatedNavigateToSwapsAfterSubmit,
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

    expect(mockNavigateToSwapsAfterSubmit).not.toHaveBeenCalled();
    expect(updatedNavigateToSwapsAfterSubmit).toHaveBeenCalledTimes(1);
  });

  it('does not schedule duplicate navigation when the navigation callback changes while navigation is pending', async () => {
    const updatedNavigateToSwapsAfterSubmit = jest.fn();
    mockNavigateToSwapsAfterSubmit.mockReturnValue(
      new Promise(() => undefined),
    );
    mockUseBridgeNavigation
      .mockReturnValueOnce({
        navigateToSwapsAfterSubmit: mockNavigateToSwapsAfterSubmit,
      })
      .mockReturnValue({
        navigateToSwapsAfterSubmit: updatedNavigateToSwapsAfterSubmit,
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

    expect(mockNavigateToSwapsAfterSubmit).toHaveBeenCalledTimes(1);

    rerender();

    await act(async () => {
      jest.advanceTimersByTime(1000);
    });

    expect(mockNavigateToSwapsAfterSubmit).toHaveBeenCalledTimes(1);
    expect(updatedNavigateToSwapsAfterSubmit).not.toHaveBeenCalled();
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

    expect(mockNavigateToSwapsAfterSubmit).not.toHaveBeenCalled();
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
