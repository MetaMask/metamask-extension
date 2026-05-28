import { renderHook, act } from '@testing-library/react-hooks';
import type { FeeCalculationResult } from '@metamask/perps-controller';
import { toChecksumHexAddress } from '@metamask/controller-utils';
import { getSelectedInternalAccount } from '../../../shared/lib/selectors/accounts';
import { getCurrentChainId } from '../../../shared/lib/selectors/networks';
import { getIsVipProgramEnabled } from '../../selectors/perps/feature-flags';
import { clearPerpsFeeDiscountCacheForTests } from './usePerpsMetamaskFeeDiscountBips';
import { usePerpsOrderFees } from './usePerpsOrderFees';

const mockSubmitRequestToBackground = jest.fn();
jest.mock('../../store/background-connection', () => ({
  submitRequestToBackground: (...args: unknown[]) =>
    mockSubmitRequestToBackground(...args),
}));

const mockUseSelector = jest.fn();
jest.mock('react-redux', () => ({
  useSelector: (selector: unknown) => mockUseSelector(selector),
}));

const TEST_ADDRESS = '0xabc0000000000000000000000000000000000def';
const TEST_CHAIN_ID = '0xa4b1'; // Arbitrum One (42161)
const TEST_CAIP_ACCOUNT_ID = `eip155:42161:${toChecksumHexAddress(
  TEST_ADDRESS,
)}`;

function setSelectors(
  overrides: { address?: string | null; chainId?: string } = {},
) {
  const address = 'address' in overrides ? overrides.address : TEST_ADDRESS;
  const chainId = overrides.chainId ?? TEST_CHAIN_ID;
  mockUseSelector.mockImplementation((selector) => {
    if (selector === getSelectedInternalAccount) {
      return address ? { address } : undefined;
    }
    if (selector === getCurrentChainId) {
      return chainId;
    }
    if (selector === getIsVipProgramEnabled) {
      return true;
    }
    return undefined;
  });
}

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

/**
 * Default background wiring: route `perpsCalculateFees` to a configurable fee
 * result and `rewardsGetPerpsDiscountForAccount` to a configurable discount.
 * Tests that need finer control (per-call sequencing, rejection) can override
 * via `mockSubmitRequestToBackground.mockImplementation` directly.
 *
 * @param options0 - Configurable test wiring.
 * @param options0.feeResponse - Fee result returned from `perpsCalculateFees`.
 * @param options0.feeError - Error used to reject `perpsCalculateFees` instead of resolving.
 * @param options0.discountBips - Discount in bips returned from `rewardsGetPerpsDiscountForAccount`.
 */
function setBackgroundResponses({
  feeResponse,
  feeError,
  discountBips,
}: {
  feeResponse?: FeeCalculationResult;
  feeError?: Error;
  discountBips?: number | null;
} = {}) {
  mockSubmitRequestToBackground.mockImplementation((method: string) => {
    if (method === 'perpsCalculateFees') {
      if (feeError) {
        return Promise.reject(feeError);
      }
      return Promise.resolve(feeResponse ?? makeFeeResult());
    }
    if (method === 'rewardsGetPerpsDiscountForAccount') {
      return Promise.resolve(discountBips ?? null);
    }
    return Promise.resolve(undefined);
  });
}

describe('usePerpsOrderFees', () => {
  beforeEach(() => {
    mockSubmitRequestToBackground.mockReset();
    mockUseSelector.mockReset();
    clearPerpsFeeDiscountCacheForTests();
    setSelectors();
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
    setBackgroundResponses({ feeResponse: feeResult, discountBips: null });

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
    setBackgroundResponses({ feeResponse: makeFeeResult() });

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

  it('falls back to base rates when the RPC call fails', async () => {
    setBackgroundResponses({ feeError: new Error('network error') });

    const { result } = renderHook(() =>
      usePerpsOrderFees({
        symbol: 'BTC',
        orderType: 'market',
        amount: '100',
      }),
    );

    await act(async () => {
      await Promise.resolve();
    });

    expect(result.current.feeRate).toBe(0.00145);
    expect(result.current.protocolFeeRate).toBe(0.00045);
    expect(result.current.metamaskFeeRate).toBe(0.001);
    expect(result.current.hasError).toBe(true);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.feeResult).toEqual({
      feeRate: 0.00145,
      protocolFeeRate: 0.00045,
      metamaskFeeRate: 0.001,
      feeAmount: 0.145,
      protocolFeeAmount: 0.045,
      metamaskFeeAmount: 0.1,
    });
  });

  it('uses zero fee amounts in fallback mode when amount is missing', async () => {
    setBackgroundResponses({ feeError: new Error('network error') });

    const { result } = renderHook(() =>
      usePerpsOrderFees({ symbol: 'BTC', orderType: 'market' }),
    );

    await act(async () => {
      await Promise.resolve();
    });

    expect(result.current.feeResult).toEqual({
      feeRate: 0.00145,
      protocolFeeRate: 0.00045,
      metamaskFeeRate: 0.001,
      feeAmount: 0,
      protocolFeeAmount: 0,
      metamaskFeeAmount: 0,
    });
  });

  it('does not update state after unmount', async () => {
    let resolvePromise!: (v: FeeCalculationResult) => void;
    mockSubmitRequestToBackground.mockImplementation((method: string) => {
      if (method === 'perpsCalculateFees') {
        return new Promise<FeeCalculationResult>((res) => {
          resolvePromise = res;
        });
      }
      return Promise.resolve(null);
    });

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
    let feeCall = 0;
    mockSubmitRequestToBackground.mockImplementation((method: string) => {
      if (method === 'perpsCalculateFees') {
        feeCall += 1;
        return Promise.resolve(feeCall === 1 ? btcResult : ethResult);
      }
      return Promise.resolve(null);
    });

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
    let feeCall = 0;
    mockSubmitRequestToBackground.mockImplementation((method: string) => {
      if (method === 'perpsCalculateFees') {
        feeCall += 1;
        if (feeCall === 1) {
          return Promise.reject(new Error('network error'));
        }
        return Promise.resolve(makeFeeResult({ feeRate: 0.001 }));
      }
      return Promise.resolve(null);
    });

    const { result, waitForNextUpdate, rerender } = renderHook(
      ({ symbol }: { symbol: string }) =>
        usePerpsOrderFees({ symbol, orderType: 'market' }),
      { initialProps: { symbol: 'BTC' } },
    );

    await act(async () => {
      await Promise.resolve();
    });

    expect(result.current.hasError).toBe(true);
    expect(result.current.feeRate).toBe(0.00145);

    rerender({ symbol: 'ETH' });
    await waitForNextUpdate();

    expect(result.current.hasError).toBe(false);
    expect(result.current.feeRate).toBe(0.001);
  });

  describe('discount surface', () => {
    it('exposes metamaskFeeRateDiscountPercentage when bips > 0', async () => {
      setBackgroundResponses({
        feeResponse: makeFeeResult(),
        discountBips: 5000,
      });

      const { result, waitForNextUpdate } = renderHook(() =>
        usePerpsOrderFees({ symbol: 'BTC', orderType: 'market' }),
      );
      await waitForNextUpdate();

      expect(result.current.metamaskFeeRateDiscountPercentage).toBe(50);
    });

    it('caps the discount at 100% (10000 bips)', async () => {
      setBackgroundResponses({
        feeResponse: makeFeeResult(),
        discountBips: 12000,
      });

      const { result, waitForNextUpdate } = renderHook(() =>
        usePerpsOrderFees({ symbol: 'BTC', orderType: 'market' }),
      );
      await waitForNextUpdate();

      expect(result.current.metamaskFeeRateDiscountPercentage).toBe(100);
    });

    it('is undefined when discountBips is 0', async () => {
      setBackgroundResponses({
        feeResponse: makeFeeResult(),
        discountBips: 0,
      });

      const { result, waitForNextUpdate } = renderHook(() =>
        usePerpsOrderFees({ symbol: 'BTC', orderType: 'market' }),
      );
      await waitForNextUpdate();

      expect(result.current.metamaskFeeRateDiscountPercentage).toBeUndefined();
    });

    it('is undefined when the rewards controller returns null', async () => {
      setBackgroundResponses({
        feeResponse: makeFeeResult(),
        discountBips: null,
      });

      const { result, waitForNextUpdate } = renderHook(() =>
        usePerpsOrderFees({ symbol: 'BTC', orderType: 'market' }),
      );
      await waitForNextUpdate();

      expect(result.current.metamaskFeeRateDiscountPercentage).toBeUndefined();
    });

    it('is undefined and skips the lookup when no account is selected', async () => {
      setSelectors({ address: null });
      setBackgroundResponses({
        feeResponse: makeFeeResult(),
        discountBips: 5000,
      });

      const { result, waitForNextUpdate } = renderHook(() =>
        usePerpsOrderFees({ symbol: 'BTC', orderType: 'market' }),
      );
      await waitForNextUpdate();

      expect(result.current.metamaskFeeRateDiscountPercentage).toBeUndefined();
      const calledMethods = mockSubmitRequestToBackground.mock.calls.map(
        (call) => call[0],
      );
      expect(calledMethods).not.toContain('rewardsGetPerpsDiscountForAccount');
    });

    it('calls rewardsGetPerpsDiscountForAccount with the CAIP-10 id and original MM bips', async () => {
      setBackgroundResponses({
        feeResponse: makeFeeResult(),
        discountBips: 0,
      });

      const { waitForNextUpdate } = renderHook(() =>
        usePerpsOrderFees({ symbol: 'BTC', orderType: 'market' }),
      );
      await waitForNextUpdate();

      expect(mockSubmitRequestToBackground).toHaveBeenCalledWith(
        'rewardsGetPerpsDiscountForAccount',
        [TEST_CAIP_ACCOUNT_ID, 10],
      );
    });

    it('caches a non-null discount across rerenders for the same address', async () => {
      setBackgroundResponses({
        feeResponse: makeFeeResult(),
        discountBips: 2000,
      });

      const { waitForNextUpdate, rerender } = renderHook(
        ({ symbol }: { symbol: string }) =>
          usePerpsOrderFees({ symbol, orderType: 'market' }),
        { initialProps: { symbol: 'BTC' } },
      );

      await waitForNextUpdate();

      rerender({ symbol: 'ETH' });
      await waitForNextUpdate();

      const discountCalls = mockSubmitRequestToBackground.mock.calls.filter(
        (call) => call[0] === 'rewardsGetPerpsDiscountForAccount',
      );
      expect(discountCalls).toHaveLength(1);
    });

    it('applies the discount to metamaskFeeRate / feeRate / amounts when active', async () => {
      setBackgroundResponses({
        feeResponse: makeFeeResult({
          feeRate: 0.00145,
          protocolFeeRate: 0.00045,
          metamaskFeeRate: 0.001,
          feeAmount: 0.145,
          protocolFeeAmount: 0.045,
          metamaskFeeAmount: 0.1,
        }),
        discountBips: 5000,
      });

      const { result, waitForNextUpdate } = renderHook(() =>
        usePerpsOrderFees({
          symbol: 'BTC',
          orderType: 'market',
          amount: '100',
        }),
      );
      await waitForNextUpdate();

      expect(result.current.metamaskFeeRateDiscountPercentage).toBe(50);
      expect(result.current.metamaskFeeRate).toBeCloseTo(0.0005, 10);
      expect(result.current.feeRate).toBeCloseTo(0.00095, 10);
      expect(result.current.undiscountedFeeRate).toBe(0.00145);
      expect(result.current.protocolFeeRate).toBe(0.00045);
      expect(result.current.feeResult).toEqual({
        feeRate: 0.00095,
        protocolFeeRate: 0.00045,
        metamaskFeeRate: 0.0005,
        feeAmount: 0.095,
        protocolFeeAmount: 0.045,
        metamaskFeeAmount: 0.05,
      });
    });

    it('does not modify rates when no discount is active', async () => {
      setBackgroundResponses({
        feeResponse: makeFeeResult({
          feeRate: 0.00145,
          protocolFeeRate: 0.00045,
          metamaskFeeRate: 0.001,
        }),
        discountBips: 0,
      });

      const { result, waitForNextUpdate } = renderHook(() =>
        usePerpsOrderFees({ symbol: 'BTC', orderType: 'market' }),
      );
      await waitForNextUpdate();

      expect(result.current.metamaskFeeRateDiscountPercentage).toBeUndefined();
      expect(result.current.metamaskFeeRate).toBe(0.001);
      expect(result.current.feeRate).toBe(0.00145);
      expect(result.current.undiscountedFeeRate).toBe(0.00145);
    });

    it('swallows a thrown discount lookup (no error state surfaced)', async () => {
      mockSubmitRequestToBackground.mockImplementation((method: string) => {
        if (method === 'perpsCalculateFees') {
          return Promise.resolve(makeFeeResult());
        }
        if (method === 'rewardsGetPerpsDiscountForAccount') {
          return Promise.reject(new Error('network down'));
        }
        return Promise.resolve(null);
      });

      const { result, waitForNextUpdate } = renderHook(() =>
        usePerpsOrderFees({ symbol: 'BTC', orderType: 'market' }),
      );
      await waitForNextUpdate();

      expect(result.current.metamaskFeeRateDiscountPercentage).toBeUndefined();
      expect(result.current.hasError).toBe(false);
    });
  });
});
