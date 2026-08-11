import { waitFor } from '@testing-library/react';
import type { Hex } from '@metamask/utils';
import { renderHookWithProvider } from '../../../test/lib/render-helpers-navigate';
import { MONEY_ENABLE_MONEY_ACCOUNT_FLAG_NAME } from '../../../shared/lib/money/feature-flags';
import { useMoneyAccountInfo } from './useMoneyAccountInfo';

const mockGetMoneyAccountAvailability = jest.fn();

jest.mock('../useMessenger', () => ({
  useMessenger: () => ({
    call: (...args: unknown[]) => mockGetMoneyAccountAvailability(...args),
  }),
}));

const MONEY_ADDRESS: Hex = '0x2D49EA58A4C70b62c8B56DE971310d9e999c8117';

const stateWithFlag = (enabled: boolean) => ({
  metamask: {
    remoteFeatureFlags: {
      [MONEY_ENABLE_MONEY_ACCOUNT_FLAG_NAME]: {
        enabled,
        minimumVersion: '0.0.1',
      },
    },
  },
});

const FLAG_ON = stateWithFlag(true);
const FLAG_OFF = stateWithFlag(false);

describe('useMoneyAccountInfo', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('reports the account with its address when the gate says it is available', async () => {
    mockGetMoneyAccountAvailability.mockResolvedValue({
      isAvailable: true,
      address: MONEY_ADDRESS,
    });

    const { result } = renderHookWithProvider(
      () => useMoneyAccountInfo(),
      FLAG_ON,
    );

    await waitFor(() => {
      expect(result.current.hasMoneyAccount).toBe(true);
    });

    expect(result.current).toStrictEqual({
      isMoneyAccountFeatureEnabled: true,
      hasMoneyAccount: true,
      primaryMoneyAccount: { address: MONEY_ADDRESS },
    });
    expect(mockGetMoneyAccountAvailability).toHaveBeenCalledWith(
      'MoneyAccountAvailabilityService:getAvailability',
    );
  });

  it('reports no account when the gate says it is unavailable, e.g. no delegation', async () => {
    mockGetMoneyAccountAvailability.mockResolvedValue({ isAvailable: false });

    const { result } = renderHookWithProvider(
      () => useMoneyAccountInfo(),
      FLAG_ON,
    );

    await waitFor(() => {
      expect(mockGetMoneyAccountAvailability).toHaveBeenCalledTimes(1);
    });

    expect(result.current).toStrictEqual({
      isMoneyAccountFeatureEnabled: true,
      hasMoneyAccount: false,
      primaryMoneyAccount: undefined,
    });
  });

  it('reports no account and skips the gate entirely when the flag is off', () => {
    const { result } = renderHookWithProvider(
      () => useMoneyAccountInfo(),
      FLAG_OFF,
    );

    expect(result.current).toStrictEqual({
      isMoneyAccountFeatureEnabled: false,
      hasMoneyAccount: false,
      primaryMoneyAccount: undefined,
    });
    expect(mockGetMoneyAccountAvailability).not.toHaveBeenCalled();
  });

  it('reports no account when the flag is unserved', () => {
    const { result } = renderHookWithProvider(() => useMoneyAccountInfo(), {
      metamask: { remoteFeatureFlags: {} },
    });

    expect(result.current).toStrictEqual({
      isMoneyAccountFeatureEnabled: false,
      hasMoneyAccount: false,
      primaryMoneyAccount: undefined,
    });
    expect(mockGetMoneyAccountAvailability).not.toHaveBeenCalled();
  });

  it('does not report an available account while the gate is still pending', async () => {
    let resolveGate: (value: {
      isAvailable: true;
      address: Hex;
    }) => void = () => undefined;
    mockGetMoneyAccountAvailability.mockReturnValue(
      new Promise<{ isAvailable: true; address: Hex }>((resolve) => {
        resolveGate = resolve;
      }),
    );

    const { result } = renderHookWithProvider(
      () => useMoneyAccountInfo(),
      FLAG_ON,
    );

    // The gate is in flight: unknown is reported as absent, so a consumer
    // cannot render the Money surface before the answer arrives.
    expect(result.current).toStrictEqual({
      isMoneyAccountFeatureEnabled: true,
      hasMoneyAccount: false,
      primaryMoneyAccount: undefined,
    });

    resolveGate({ isAvailable: true, address: MONEY_ADDRESS });

    await waitFor(() => {
      expect(result.current.hasMoneyAccount).toBe(true);
    });
  });

  it('reports no account when the gate call fails', async () => {
    mockGetMoneyAccountAvailability.mockRejectedValue(new Error('locked'));

    const { result } = renderHookWithProvider(
      () => useMoneyAccountInfo(),
      FLAG_ON,
    );

    await waitFor(() => {
      expect(mockGetMoneyAccountAvailability).toHaveBeenCalledTimes(1);
    });

    expect(result.current).toStrictEqual({
      isMoneyAccountFeatureEnabled: true,
      hasMoneyAccount: false,
      primaryMoneyAccount: undefined,
    });
  });
});
