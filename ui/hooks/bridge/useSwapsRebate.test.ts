import { it } from '@jest/globals';
import { act, renderHook, waitFor } from '@testing-library/react';
import type { QuoteResponse } from '@metamask/bridge-controller';
import { useSwapsRebate } from './useSwapsRebate';

const mockCall = jest.fn();
const mockMessenger = { call: mockCall };
jest.mock('../useMessenger', () => ({
  useMessenger: () => mockMessenger,
}));

let mockIsEnabled = true;
jest.mock('react-redux', () => ({
  ...jest.requireActual('react-redux'),
  useSelector: () => mockIsEnabled,
}));

const buildQuote = (assetId = 'eip155:1/slip44:60', usd = '10') =>
  ({
    feeData: {
      metabridge: [
        {
          amount: '1000',
          usd,
          asset: { assetId, decimals: 6, symbol: 'USDC' },
        },
      ],
    },
  }) as unknown as QuoteResponse['quote'];

const flushPromises = () => new Promise((resolve) => setImmediate(resolve));

describe('useSwapsRebate', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockIsEnabled = true;
  });

  it('does not call the controller when the feature flag is off', async () => {
    mockIsEnabled = false;

    const { result } = renderHook(() => useSwapsRebate(buildQuote()));
    await act(flushPromises);

    expect(mockCall).not.toHaveBeenCalled();
    expect(result.current).toBeNull();
  });

  it('returns the rebate percentage for an eligible rebate', async () => {
    mockCall.mockResolvedValue({
      product: 'swaps',
      eligible: true,
      rebateBips: 1000,
      reason: null,
    });

    const { result } = renderHook(() => useSwapsRebate(buildQuote()));

    await waitFor(() => expect(result.current).toBe(10));
    expect(mockCall).toHaveBeenCalledWith(
      'RewardsMoneyController:getSwapsRebateQuote',
      expect.objectContaining({ feeData: expect.any(Object) }),
    );
  });

  it.each([
    { eligible: false, rebateBips: 0, reason: null },
    { eligible: true, rebateBips: 2000, reason: 'FEE_TOKEN_NOT_ELIGIBLE' },
  ])('returns null for an ineligible response %o', async (response) => {
    mockCall.mockResolvedValue({ product: 'swaps', ...response });

    const { result } = renderHook(() => useSwapsRebate(buildQuote()));
    await act(flushPromises);

    expect(result.current).toBeNull();
  });

  it('returns null when the controller rejects', async () => {
    mockCall.mockRejectedValue(new Error('404'));

    const { result } = renderHook(() => useSwapsRebate(buildQuote()));
    await act(flushPromises);

    expect(result.current).toBeNull();
  });

  it('does not call the controller without a quote', () => {
    renderHook(() => useSwapsRebate(undefined));

    expect(mockCall).not.toHaveBeenCalled();
  });

  it('refetches with the new quote only when the fee token changes', async () => {
    mockCall.mockResolvedValueOnce({
      product: 'swaps',
      eligible: true,
      rebateBips: 1000,
      reason: null,
    });
    mockCall.mockRejectedValueOnce(new Error('503'));

    const { result, rerender } = renderHook(
      ({ quote }) => useSwapsRebate(quote),
      { initialProps: { quote: buildQuote() } },
    );
    await waitFor(() => expect(result.current).toBe(10));

    rerender({ quote: buildQuote('eip155:1/slip44:60', '20') });
    expect(mockCall).toHaveBeenCalledTimes(1);

    const newQuote = buildQuote('eip155:1/erc20:0xabc');
    rerender({ quote: newQuote });
    await act(flushPromises);

    expect(mockCall).toHaveBeenCalledTimes(2);
    expect(mockCall).toHaveBeenLastCalledWith(
      'RewardsMoneyController:getSwapsRebateQuote',
      newQuote,
    );
    expect(result.current).toBeNull();
  });

  it('ignores a late response for the previous fee token', async () => {
    let resolveFirst: (value: unknown) => void = () => undefined;
    mockCall.mockReturnValueOnce(
      new Promise((resolve) => {
        resolveFirst = resolve;
      }),
    );
    mockCall.mockResolvedValueOnce({
      product: 'swaps',
      eligible: false,
      rebateBips: 0,
      reason: null,
    });

    const { result, rerender } = renderHook(
      ({ quote }) => useSwapsRebate(quote),
      { initialProps: { quote: buildQuote() } },
    );
    rerender({ quote: buildQuote('eip155:1/erc20:0xabc') });
    await act(async () => {
      resolveFirst({
        product: 'swaps',
        eligible: true,
        rebateBips: 1000,
        reason: null,
      });
    });

    expect(result.current).toBeNull();
  });
});
