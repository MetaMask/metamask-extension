import { it } from '@jest/globals';
import { act, renderHook, waitFor } from '@testing-library/react';
import { buildPerpsRebateTrade, usePerpsRebate } from './usePerpsRebate';
import type { UsePerpsRebateParams } from './usePerpsRebate';

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

const flushPromises = () => new Promise((resolve) => setImmediate(resolve));

const eligibleQuote = (rebateBips = 1000) => ({
  product: 'perps' as const,
  eligible: true,
  rebateBips,
  reason: null,
});

describe('buildPerpsRebateTrade', () => {
  it('builds a BUY trade for a long', () => {
    expect(
      buildPerpsRebateTrade({
        coin: 'BTC',
        direction: 'long',
        notionalUsd: '10',
      }),
    ).toStrictEqual({
      coin: 'BTC',
      side: 'BUY',
      notionalUsd: '10',
    });
  });

  it('builds a SELL trade for a short', () => {
    expect(
      buildPerpsRebateTrade({
        coin: 'BTC',
        direction: 'short',
        notionalUsd: '10',
      }),
    ).toStrictEqual({
      coin: 'BTC',
      side: 'SELL',
      notionalUsd: '10',
    });
  });

  it.each<UsePerpsRebateParams>([
    { coin: undefined, direction: 'long', notionalUsd: '10' },
    { coin: 'BTC', direction: undefined, notionalUsd: '10' },
    { coin: 'BTC', direction: 'long', notionalUsd: undefined },
    { coin: 'BTC', direction: 'long', notionalUsd: '' },
  ])('omits the trade when a field is missing %o', (params) => {
    expect(buildPerpsRebateTrade(params)).toBeUndefined();
  });
});

describe('usePerpsRebate', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockIsEnabled = true;
  });

  it('does not call the controller when the feature flag is off', async () => {
    mockIsEnabled = false;

    const { result } = renderHook(() =>
      usePerpsRebate({ coin: 'BTC', direction: 'long', notionalUsd: '10' }),
    );
    await act(flushPromises);

    expect(mockCall).not.toHaveBeenCalled();
    expect(result.current).toBeNull();
  });

  it('returns the rebate percentage for an eligible rebate', async () => {
    mockCall.mockResolvedValue(eligibleQuote(1000));

    const { result } = renderHook(() =>
      usePerpsRebate({ coin: 'BTC', direction: 'long', notionalUsd: '10' }),
    );

    await waitFor(() => expect(result.current).toBe(10));
    expect(mockCall).toHaveBeenCalledWith(
      'RewardsMoneyController:getPerpsRebateQuote',
      {
        coin: 'BTC',
        side: 'BUY',
        notionalUsd: '10',
      },
    );
  });

  it('calls the controller without trade metadata when no trade is known', async () => {
    mockCall.mockResolvedValue(eligibleQuote(1000));

    const { result } = renderHook(() => usePerpsRebate());

    await waitFor(() => expect(result.current).toBe(10));
    expect(mockCall).toHaveBeenCalledWith(
      'RewardsMoneyController:getPerpsRebateQuote',
      undefined,
    );
  });

  it.each([
    { product: 'perps', eligible: false, rebateBips: 0, reason: null },
    {
      product: 'perps',
      eligible: true,
      rebateBips: 2000,
      reason: 'REGION_RESTRICTED',
    },
    { product: 'perps', eligible: true, rebateBips: 0, reason: null },
  ])('returns null for an ineligible response %o', async (response) => {
    mockCall.mockResolvedValue(response);

    const { result } = renderHook(() =>
      usePerpsRebate({ coin: 'BTC', direction: 'short', notionalUsd: '10' }),
    );
    await act(flushPromises);

    expect(result.current).toBeNull();
  });

  it('returns null when the controller rejects', async () => {
    mockCall.mockRejectedValue(new Error('404'));

    const { result } = renderHook(() =>
      usePerpsRebate({ coin: 'BTC', direction: 'long', notionalUsd: '10' }),
    );
    await act(flushPromises);

    expect(result.current).toBeNull();
  });

  it('fetches once per mount and does not refetch on trade edits', async () => {
    mockCall.mockResolvedValue(eligibleQuote(1000));

    const { result, rerender } = renderHook(
      ({ coin, direction, notionalUsd }: UsePerpsRebateParams) =>
        usePerpsRebate({ coin, direction, notionalUsd }),
      {
        initialProps: {
          coin: 'BTC',
          direction: 'long',
          notionalUsd: '10',
        },
      },
    );
    await waitFor(() => expect(result.current).toBe(10));

    rerender({ coin: 'BTC', direction: 'long', notionalUsd: '25' });
    rerender({ coin: 'ETH', direction: 'short', notionalUsd: '25' });
    expect(mockCall).toHaveBeenCalledTimes(1);
    expect(result.current).toBe(10);
  });

  it('sends the trade present when the surface mounts', async () => {
    mockCall.mockResolvedValue(eligibleQuote(1000));

    const { rerender } = renderHook(
      ({ coin, direction, notionalUsd }: UsePerpsRebateParams) =>
        usePerpsRebate({ coin, direction, notionalUsd }),
      {
        initialProps: {
          coin: 'BTC',
          direction: 'long',
          notionalUsd: '10',
        },
      },
    );
    await act(flushPromises);
    rerender({ coin: 'BTC', direction: 'long', notionalUsd: '25' });
    await act(flushPromises);

    expect(mockCall).toHaveBeenCalledTimes(1);
    expect(mockCall).toHaveBeenCalledWith(
      'RewardsMoneyController:getPerpsRebateQuote',
      {
        coin: 'BTC',
        side: 'BUY',
        notionalUsd: '10',
      },
    );
  });
});
