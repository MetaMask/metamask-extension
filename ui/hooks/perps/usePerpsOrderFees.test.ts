import { it } from '@jest/globals';
import { act, renderHook, waitFor } from '@testing-library/react';
import type { FeeCalculationResult } from '@metamask/perps-controller';
import { toChecksumHexAddress } from '@metamask/controller-utils';
import { getSelectedInternalAccount } from '../../../shared/lib/selectors/accounts';
import { getCurrentChainId } from '../../../shared/lib/selectors/networks';
import { getIsVipProgramEnabled } from '../../selectors/perps/feature-flags';
import { clearPerpsFeeDiscountCacheForTests } from './usePerpsMetamaskFeeDiscountBips';
import { formatPerpsFeeRate, usePerpsOrderFees } from './usePerpsOrderFees';

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
    feeSource: 'default',
    metamaskFeeDiscountBips: 0,
    undiscountedMetamaskFeeRate: 0.001,
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

  describe('formatPerpsFeeRate', () => {
    it('formats decimal fee rates as percentage strings', () => {
      expect(formatPerpsFeeRate(0.00045)).toBe('0.045%');
      expect(formatPerpsFeeRate(0.001)).toBe('0.100%');
      expect(formatPerpsFeeRate(0.015)).toBe('1.500%');
    });

    it('returns N/A for missing or invalid rates', () => {
      expect(formatPerpsFeeRate(undefined)).toBe('N/A');
      expect(formatPerpsFeeRate(null)).toBe('N/A');
      expect(formatPerpsFeeRate(Number.NaN)).toBe('N/A');
    });
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

    const { result } = renderHook(() =>
      usePerpsOrderFees({ symbol: 'BTC', orderType: 'market' }),
    );

    await waitFor(() => {
      expect(result.current.feeRate).toBe(0.001);
      expect(result.current.protocolFeeRate).toBe(0.00025);
      expect(result.current.metamaskFeeRate).toBe(0.001);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.hasError).toBe(false);
      expect(result.current.feeResult).toEqual(feeResult);
    });
  });

  it('calls perpsCalculateFees with the correct params', async () => {
    setBackgroundResponses({ feeResponse: makeFeeResult() });

    renderHook(() =>
      usePerpsOrderFees({
        symbol: 'HYPE',
        orderType: 'limit',
        amount: '100',
        isMaker: true,
      }),
    );

    await waitFor(() => {
      expect(mockSubmitRequestToBackground).toHaveBeenCalledWith(
        'perpsCalculateFees',
        [{ orderType: 'limit', isMaker: true, amount: '100', symbol: 'HYPE' }],
      );
    });
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

    const { result, rerender } = renderHook(
      ({ symbol }: { symbol: string }) =>
        usePerpsOrderFees({ symbol, orderType: 'market' }),
      { initialProps: { symbol: 'BTC' } },
    );

    await waitFor(() => {
      expect(result.current.feeRate).toBe(0.001);
    });

    rerender({ symbol: 'ETH' });
    // Keep the previous result visible while the replacement request loads.
    expect(result.current.feeRate).toBe(0.001);
    expect(result.current.isLoading).toBe(true);

    await waitFor(() => {
      expect(result.current.feeRate).toBe(0.0008);
    });
  });

  it('retains the previous rate while order type fees are refetched', async () => {
    type FeeProps = {
      orderType: 'market' | 'limit';
      isMaker: boolean;
    };
    const marketResult = makeFeeResult({ feeRate: 0.00145 });
    const limitResult = makeFeeResult({ feeRate: 0.00115 });
    let feeCall = 0;
    let resolveLimitRequest!: (result: FeeCalculationResult) => void;
    mockSubmitRequestToBackground.mockImplementation((method: string) => {
      if (method === 'perpsCalculateFees') {
        feeCall += 1;
        if (feeCall === 1) {
          return Promise.resolve(marketResult);
        }
        return new Promise<FeeCalculationResult>((resolve) => {
          resolveLimitRequest = resolve;
        });
      }
      return Promise.resolve(null);
    });

    const { result, rerender } = renderHook(
      ({ orderType, isMaker }: FeeProps) =>
        usePerpsOrderFees({ symbol: 'BTC', orderType, isMaker }),
      {
        initialProps: {
          orderType: 'market',
          isMaker: false,
        } as FeeProps,
      },
    );

    await waitFor(() => {
      expect(result.current.feeRate).toBe(0.00145);
    });

    rerender({ orderType: 'limit', isMaker: true });

    expect(result.current.feeRate).toBe(0.00145);
    expect(result.current.isLoading).toBe(true);

    await act(async () => {
      resolveLimitRequest(limitResult);
      await Promise.resolve();
    });

    expect(result.current.feeRate).toBe(0.00115);
    expect(result.current.isLoading).toBe(false);
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

    const { result, rerender } = renderHook(
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
    await waitFor(() => {
      expect(result.current.hasError).toBe(false);
      expect(result.current.feeRate).toBe(0.001);
    });
  });

  it('refetches the blended subscription quote when USD notional changes', async () => {
    mockSubmitRequestToBackground.mockImplementation(
      (method: string, [params]: [{ amount: string }]) => {
        if (method !== 'perpsCalculateFees') {
          return Promise.resolve(5000);
        }
        const rate = params.amount === '100' ? 0 : 0.00066;
        return Promise.resolve(
          makeFeeResult({
            feeSource: 'subscription',
            metamaskFeeDiscountBips: params.amount === '100' ? 10000 : 3333,
            undiscountedMetamaskFeeRate: 0.001,
            metamaskFeeRate: rate,
            feeRate: 0.00025 + rate,
          }),
        );
      },
    );
    const { result, rerender } = renderHook(
      ({ amount }) =>
        usePerpsOrderFees({ symbol: 'BTC', orderType: 'market', amount }),
      { initialProps: { amount: '100' } },
    );
    await waitFor(() => expect(result.current.metamaskFeeRate).toBe(0));
    expect(result.current.metamaskFeeRateDiscountPercentage).toBe(100);

    rerender({ amount: '1000' });
    await waitFor(() => expect(result.current.metamaskFeeRate).toBe(0.00066));
    expect(result.current.metamaskFeeRateDiscountPercentage).toBe(33.33);
    expect(mockSubmitRequestToBackground).toHaveBeenCalledWith(
      'perpsCalculateFees',
      [{ symbol: 'BTC', orderType: 'market', amount: '1000', isMaker: false }],
    );
  });

  describe('discount surface', () => {
    it.each([
      {
        feeSource: 'rewards' as const,
        discountBips: 5000,
        rate: 0.0005,
        original: 0.001,
      },
      {
        feeSource: 'subscription' as const,
        discountBips: 10000,
        rate: 0,
        original: 0.001,
      },
      {
        feeSource: 'subscription' as const,
        discountBips: 3333,
        rate: 0.00066,
        original: 0.001,
      },
      {
        feeSource: 'rewards' as const,
        discountBips: 5000,
        rate: 0.001,
        original: 0.002,
      },
    ])(
      'uses the resolved $feeSource discount of $discountBips bips',
      async ({ feeSource, discountBips, rate, original }) => {
        const quote = makeFeeResult({
          feeSource,
          metamaskFeeDiscountBips: discountBips,
          undiscountedMetamaskFeeRate: original,
          metamaskFeeRate: rate,
          feeRate: 0.00025 + rate,
        });
        setBackgroundResponses({ feeResponse: quote, discountBips: 1000 });
        const { result } = renderHook(() =>
          usePerpsOrderFees({
            symbol: 'BTC',
            orderType: 'market',
            amount: '1000',
          }),
        );
        await waitFor(() => expect(result.current.isLoading).toBe(false));
        expect(result.current.metamaskFeeRateDiscountPercentage).toBe(
          discountBips / 100,
        );
        expect(result.current.originalMetamaskFeeRate).toBe(original);
        expect(result.current.undiscountedFeeRate).toBe(0.00025 + original);
        expect(result.current.feeResult).toEqual(quote);
      },
    );

    it.each([
      { feeSource: 'default' as const, metamaskFeeDiscountBips: 0 },
      { feeSource: 'rewards' as const, metamaskFeeDiscountBips: 0 },
      { feeSource: 'subscription' as const, metamaskFeeDiscountBips: 0 },
      { feeSource: 'rewards' as const, metamaskFeeDiscountBips: 5000 },
      { feeSource: undefined, metamaskFeeDiscountBips: undefined },
    ])(
      'omits the badge for an unreduced $feeSource quote',
      async (metadata) => {
        const quote = makeFeeResult(metadata);
        setBackgroundResponses({ feeResponse: quote, discountBips: 6500 });
        const { result } = renderHook(() =>
          usePerpsOrderFees({ symbol: 'BTC', orderType: 'market' }),
        );
        await waitFor(() => expect(result.current.isLoading).toBe(false));
        expect(
          result.current.metamaskFeeRateDiscountPercentage,
        ).toBeUndefined();
        expect(result.current.originalMetamaskFeeRate).toBe(0.001);
        expect(result.current.feeResult).toEqual(quote);
      },
    );

    it('caps the rewards discount on a local fallback at 100%', async () => {
      setBackgroundResponses({
        feeError: new Error('RPC unavailable'),
        discountBips: 12000,
      });
      const { result } = renderHook(() =>
        usePerpsOrderFees({ symbol: 'BTC', orderType: 'market' }),
      );
      await waitFor(() =>
        expect(result.current.metamaskFeeRateDiscountPercentage).toBe(100),
      );
      expect(result.current.metamaskFeeRate).toBe(0);
    });

    it('is undefined when discountBips is 0', async () => {
      setBackgroundResponses({
        feeResponse: makeFeeResult(),
        discountBips: 0,
      });

      const { result } = renderHook(() =>
        usePerpsOrderFees({ symbol: 'BTC', orderType: 'market' }),
      );
      await waitFor(() => {
        expect(
          result.current.metamaskFeeRateDiscountPercentage,
        ).toBeUndefined();
      });
    });

    it('is undefined when the rewards controller returns null', async () => {
      setBackgroundResponses({
        feeResponse: makeFeeResult(),
        discountBips: null,
      });

      const { result } = renderHook(() =>
        usePerpsOrderFees({ symbol: 'BTC', orderType: 'market' }),
      );
      await waitFor(() => {
        expect(
          result.current.metamaskFeeRateDiscountPercentage,
        ).toBeUndefined();
      });
    });

    it('is undefined and skips the lookup when no account is selected', async () => {
      setSelectors({ address: null });
      setBackgroundResponses({
        feeResponse: makeFeeResult(),
        discountBips: 5000,
      });

      const { result } = renderHook(() =>
        usePerpsOrderFees({ symbol: 'BTC', orderType: 'market' }),
      );
      await waitFor(() => {
        expect(
          result.current.metamaskFeeRateDiscountPercentage,
        ).toBeUndefined();
      });
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

      renderHook(() =>
        usePerpsOrderFees({ symbol: 'BTC', orderType: 'market' }),
      );
      await waitFor(() => {
        expect(mockSubmitRequestToBackground).toHaveBeenCalledWith(
          'rewardsGetPerpsDiscountForAccount',
          [TEST_CAIP_ACCOUNT_ID, 10],
        );
      });
    });

    it('caches a non-null discount across rerenders for the same address', async () => {
      setBackgroundResponses({
        feeResponse: makeFeeResult(),
        discountBips: 2000,
      });

      const { rerender } = renderHook(
        ({ symbol }: { symbol: string }) =>
          usePerpsOrderFees({ symbol, orderType: 'market' }),
        { initialProps: { symbol: 'BTC' } },
      );

      await act(async () => {
        await Promise.resolve();
      });

      rerender({ symbol: 'ETH' });
      await act(async () => {
        await Promise.resolve();
      });

      const discountCalls = mockSubmitRequestToBackground.mock.calls.filter(
        (call) => call[0] === 'rewardsGetPerpsDiscountForAccount',
      );
      expect(discountCalls).toHaveLength(1);
    });

    it('preserves resolved rates and amounts with the quoted original fee', async () => {
      const feeResponse = makeFeeResult({
        feeRate: 0.00095,
        protocolFeeRate: 0.00045,
        metamaskFeeRate: 0.0005,
        feeAmount: 0.95,
        protocolFeeAmount: 0.45,
        metamaskFeeAmount: 0.5,
        chargesMetamaskBuilderFee: true,
        feeSource: 'subscription',
        metamaskFeeDiscountBips: 5000,
        undiscountedMetamaskFeeRate: 0.001,
      });
      setBackgroundResponses({ feeResponse, discountBips: 5000 });

      const { result } = renderHook(() =>
        usePerpsOrderFees({
          symbol: 'BTC',
          orderType: 'market',
          amount: '1000',
        }),
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
        expect(result.current.metamaskFeeRateDiscountPercentage).toBe(50);
      });
      expect(result.current.metamaskFeeRate).toBe(0.0005);
      expect(result.current.feeRate).toBe(0.00095);
      expect(result.current.undiscountedFeeRate).toBe(0.00145);
      expect(result.current.originalMetamaskFeeRate).toBe(0.001);
      expect(result.current.feeResult).toEqual(feeResponse);
    });

    it('preserves a venue-quantized quote even when the rewards lookup fails', async () => {
      const feeResponse = makeFeeResult({
        feeRate: 0.00111,
        protocolFeeRate: 0.00045,
        metamaskFeeRate: 0.00066,
        feeAmount: 1.11,
        protocolFeeAmount: 0.45,
        metamaskFeeAmount: 0.66,
        chargesMetamaskBuilderFee: true,
        feeSource: 'subscription',
        metamaskFeeDiscountBips: 3333,
        undiscountedMetamaskFeeRate: 0.001,
      });
      mockSubmitRequestToBackground.mockImplementation((method: string) =>
        method === 'perpsCalculateFees'
          ? Promise.resolve(feeResponse)
          : Promise.reject(new Error('Rewards unavailable')),
      );

      const { result } = renderHook(() =>
        usePerpsOrderFees({
          symbol: 'BTC',
          orderType: 'market',
          amount: '1000',
        }),
      );

      await waitFor(() => expect(result.current.isLoading).toBe(false));
      expect(result.current.feeResult).toEqual(feeResponse);
      expect(result.current.undiscountedFeeRate).toBe(0.00145);
      expect(result.current.metamaskFeeRateDiscountPercentage).toBe(33.33);
    });

    it.each([true, false])(
      'preserves zero builder fees with chargeable=%s',
      async (chargesMetamaskBuilderFee) => {
        const feeResponse = makeFeeResult({
          feeRate: 0.00045,
          protocolFeeRate: 0.00045,
          metamaskFeeRate: 0,
          feeAmount: 0.45,
          protocolFeeAmount: 0.45,
          metamaskFeeAmount: 0,
          chargesMetamaskBuilderFee,
          feeSource: chargesMetamaskBuilderFee ? 'subscription' : undefined,
          metamaskFeeDiscountBips: chargesMetamaskBuilderFee
            ? 10000
            : undefined,
          undiscountedMetamaskFeeRate: chargesMetamaskBuilderFee
            ? 0.001
            : undefined,
        });
        setBackgroundResponses({ feeResponse, discountBips: 5000 });

        const { result } = renderHook(() =>
          usePerpsOrderFees({
            symbol: 'BTC',
            orderType: 'market',
            amount: '1000',
          }),
        );

        await waitFor(() => expect(result.current.isLoading).toBe(false));
        expect(result.current.feeResult).toEqual(feeResponse);
        expect(result.current.originalMetamaskFeeRate).toBe(
          chargesMetamaskBuilderFee ? 0.001 : 0,
        );
        expect(result.current.undiscountedFeeRate).toBe(
          chargesMetamaskBuilderFee ? 0.00145 : 0.00045,
        );
      },
    );

    it('discounts a local RPC fallback once', async () => {
      setBackgroundResponses({
        feeError: new Error('network error'),
        discountBips: 5000,
      });

      const { result } = renderHook(() =>
        usePerpsOrderFees({
          symbol: 'BTC',
          orderType: 'market',
          amount: '1000',
        }),
      );

      await waitFor(() =>
        expect(result.current.metamaskFeeRateDiscountPercentage).toBe(50),
      );
      expect(result.current.hasError).toBe(true);
      expect(result.current.feeRate).toBe(0.00095);
      expect(result.current.undiscountedFeeRate).toBe(0.00145);
      expect(result.current.feeResult?.metamaskFeeAmount).toBe(0.5);
      expect(result.current.feeResult?.feeAmount).toBe(0.95);
    });

    it('replaces a discounted timeout fallback with the resolved quote unchanged', async () => {
      jest.useFakeTimers();
      try {
        let resolveFees!: (value: FeeCalculationResult) => void;
        mockSubmitRequestToBackground.mockImplementation((method: string) =>
          method === 'perpsCalculateFees'
            ? new Promise<FeeCalculationResult>((resolve) => {
                resolveFees = resolve;
              })
            : Promise.resolve(5000),
        );
        const { result } = renderHook(() =>
          usePerpsOrderFees({
            symbol: 'BTC',
            orderType: 'market',
            amount: '1000',
          }),
        );

        await act(async () => {
          await Promise.resolve();
        });
        act(() => {
          jest.advanceTimersByTime(1500);
        });
        expect(result.current.feeRate).toBe(0.00095);
        expect(result.current.feeResult?.metamaskFeeAmount).toBe(0.5);

        const feeResponse = makeFeeResult({
          feeRate: 0.00085,
          protocolFeeRate: 0.00045,
          metamaskFeeRate: 0.0004,
          feeAmount: 0.85,
          protocolFeeAmount: 0.45,
          metamaskFeeAmount: 0.4,
          feeSource: 'rewards',
          metamaskFeeDiscountBips: 6000,
          undiscountedMetamaskFeeRate: 0.001,
        });
        await act(async () => {
          resolveFees(feeResponse);
        });
        expect(result.current.feeResult).toEqual(feeResponse);
        expect(result.current.undiscountedFeeRate).toBe(0.00145);
      } finally {
        jest.useRealTimers();
      }
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

      const { result } = renderHook(() =>
        usePerpsOrderFees({ symbol: 'BTC', orderType: 'market' }),
      );
      await waitFor(() => {
        expect(
          result.current.metamaskFeeRateDiscountPercentage,
        ).toBeUndefined();
        expect(result.current.metamaskFeeRate).toBe(0.001);
        expect(result.current.feeRate).toBe(0.00145);
        expect(result.current.undiscountedFeeRate).toBe(0.00145);
      });
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

      const { result } = renderHook(() =>
        usePerpsOrderFees({ symbol: 'BTC', orderType: 'market' }),
      );
      await waitFor(() => {
        expect(
          result.current.metamaskFeeRateDiscountPercentage,
        ).toBeUndefined();
        expect(result.current.hasError).toBe(false);
      });
    });
  });
});
