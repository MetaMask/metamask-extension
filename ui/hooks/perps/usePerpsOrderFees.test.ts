import { renderHook, act } from '@testing-library/react-hooks';
import type { FeeCalculationResult } from '@metamask/perps-controller';
import { usePerpsOrderFees } from './usePerpsOrderFees';

const mockSubmitRequestToBackground = jest.fn();
jest.mock('../../store/background-connection', () => ({
  submitRequestToBackground: (...args: unknown[]) =>
    mockSubmitRequestToBackground(...args),
}));

function makeFeeResult(
  overrides: Partial<FeeCalculationResult> = {},
): FeeCalculationResult {
  return {
    feeRate: 0.00125,
    protocolFeeRate: 0.00025,
    metamaskFeeRate: 0.001,
    feeAmount: 0.5,
    protocolFeeAmount: 0.1,
    metamaskFeeAmount: 0.4,
    ...overrides,
  };
}

describe('usePerpsOrderFees', () => {
  beforeEach(() => {
    mockSubmitRequestToBackground.mockReset();
  });

  it('returns undefined feeRate while loading', () => {
    mockSubmitRequestToBackground.mockReturnValue(new Promise(() => undefined));
    const { result } = renderHook(() =>
      usePerpsOrderFees({ symbol: 'BTC', orderType: 'market' }),
    );
    expect(result.current.feeRate).toBeUndefined();
    expect(result.current.isLoading).toBe(true);
    expect(result.current.hasError).toBe(false);
    expect(result.current.feeResult).toBeUndefined();
  });

  it('returns the dynamic fee rate after the fetch resolves', async () => {
    const feeResult = makeFeeResult({ feeRate: 0.001 });
    mockSubmitRequestToBackground.mockResolvedValue(feeResult);

    const { result, waitForNextUpdate } = renderHook(() =>
      usePerpsOrderFees({ symbol: 'BTC', orderType: 'market' }),
    );

    await waitForNextUpdate();

    expect(result.current.feeRate).toBe(0.001);
    expect(result.current.protocolFeeRate).toBe(0.00025);
    expect(result.current.metamaskFeeRate).toBe(0.001);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.hasError).toBe(false);
    expect(result.current.feeResult).toEqual(feeResult);
  });

  it('calls perpsCalculateFees with the correct params', async () => {
    mockSubmitRequestToBackground.mockResolvedValue(makeFeeResult());

    const { waitForNextUpdate } = renderHook(() =>
      usePerpsOrderFees({
        symbol: 'HYPE',
        orderType: 'limit',
        amount: '100',
        isMaker: true,
      }),
    );

    await waitForNextUpdate();

    expect(mockSubmitRequestToBackground).toHaveBeenCalledWith(
      'perpsCalculateFees',
      [{ orderType: 'limit', isMaker: true, amount: '100', symbol: 'HYPE' }],
    );
  });

  it('enters error state on failure — no fallback to hardcoded constant', async () => {
    mockSubmitRequestToBackground.mockRejectedValue(new Error('network error'));

    const { result } = renderHook(() =>
      usePerpsOrderFees({ symbol: 'BTC', orderType: 'market' }),
    );

    await act(async () => {
      await Promise.resolve();
    });

    expect(result.current.feeRate).toBeUndefined();
    expect(result.current.hasError).toBe(true);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.feeResult).toBeUndefined();
  });

  it('does not update state after unmount', async () => {
    let resolvePromise!: (v: FeeCalculationResult) => void;
    mockSubmitRequestToBackground.mockReturnValue(
      new Promise<FeeCalculationResult>((res) => {
        resolvePromise = res;
      }),
    );

    const { result, unmount } = renderHook(() =>
      usePerpsOrderFees({ symbol: 'BTC', orderType: 'market' }),
    );

    unmount();

    await act(async () => {
      resolvePromise(makeFeeResult({ feeRate: 0.0005 }));
      await Promise.resolve();
    });

    expect(result.current.feeRate).toBeUndefined();
    expect(result.current.feeResult).toBeUndefined();
  });

  it('refetches when symbol changes', async () => {
    const btcResult = makeFeeResult({ feeRate: 0.001 });
    const ethResult = makeFeeResult({ feeRate: 0.0008 });
    mockSubmitRequestToBackground
      .mockResolvedValueOnce(btcResult)
      .mockResolvedValueOnce(ethResult);

    const { result, waitForNextUpdate, rerender } = renderHook(
      ({ symbol }: { symbol: string }) =>
        usePerpsOrderFees({ symbol, orderType: 'market' }),
      { initialProps: { symbol: 'BTC' } },
    );

    await waitForNextUpdate();
    expect(result.current.feeRate).toBe(0.001);

    rerender({ symbol: 'ETH' });
    // Previous result is cleared immediately on refetch
    expect(result.current.feeRate).toBeUndefined();
    expect(result.current.isLoading).toBe(true);

    await waitForNextUpdate();
    expect(result.current.feeRate).toBe(0.0008);
  });

  it('clears error state on successful refetch', async () => {
    mockSubmitRequestToBackground.mockRejectedValueOnce(
      new Error('network error'),
    );

    const { result, waitForNextUpdate, rerender } = renderHook(
      ({ symbol }: { symbol: string }) =>
        usePerpsOrderFees({ symbol, orderType: 'market' }),
      { initialProps: { symbol: 'BTC' } },
    );

    await act(async () => {
      await Promise.resolve();
    });

    expect(result.current.hasError).toBe(true);
    expect(result.current.feeRate).toBeUndefined();

    mockSubmitRequestToBackground.mockResolvedValueOnce(
      makeFeeResult({ feeRate: 0.001 }),
    );
    rerender({ symbol: 'ETH' });
    await waitForNextUpdate();

    expect(result.current.hasError).toBe(false);
    expect(result.current.feeRate).toBe(0.001);
  });
});
