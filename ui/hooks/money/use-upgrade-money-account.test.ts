import { JsonRpcError } from '@metamask/rpc-errors';
import type { Hex } from '@metamask/utils';
import { renderHook } from '@testing-library/react';
import { captureException } from '../../../shared/lib/sentry';
import { submitRequestToBackground } from '../../store/background-connection';
import { useMoneyAccountAvailability } from './use-money-account-availability';
import { useUpgradeMoneyAccount } from './use-upgrade-money-account';

jest.mock('../../store/background-connection', () => ({
  submitRequestToBackground: jest.fn(),
}));

jest.mock('./use-money-account-availability', () => ({
  useMoneyAccountAvailability: jest.fn(),
}));

jest.mock('../../../shared/lib/sentry', () => ({
  ...jest.requireActual('../../../shared/lib/sentry'),
  captureException: jest.fn(),
}));

const mockSubmitRequestToBackground = jest.mocked(submitRequestToBackground);
const mockCaptureException = jest.mocked(captureException);
const mockUseMoneyAccountAvailability = jest.mocked(
  useMoneyAccountAvailability,
);

const ADDRESS = '0xD5FE9B0579443E7025CF3309BA420977710E7183' as Hex;
const ADDRESS_KEY = ADDRESS.toLowerCase();

const UPGRADE_CALL = [
  'messengerCall',
  ['MoneyAccountUpgradeController:upgradeAccount', [ADDRESS_KEY]],
] as const;

/**
 * Build the error the UI receives when the background's `upgradeAccount`
 * rejects with a `MoneyAccountUpgradeStepError`: the metaRPC layer serializes
 * it into a `JsonRpcError` carrying the original's own properties as
 * `data.cause`.
 *
 * @param step - The failed step.
 * @param terminal - Whether the step marked the failure terminal.
 * @returns The error as rebuilt by `metaRPCClientFactory`.
 */
function backgroundStepError(step: string, terminal = false) {
  const message = `Money Account upgrade failed at step "${step}": offline`;
  return new JsonRpcError(-32603, message, {
    cause: {
      name: 'MoneyAccountUpgradeStepError',
      message,
      stack: 'stack',
      step,
      terminal,
    },
  });
}

function mockAvailability(address: Hex | undefined): void {
  mockUseMoneyAccountAvailability.mockReturnValue({
    availability: address
      ? { isAvailable: true, address }
      : { isAvailable: false },
  } as unknown as ReturnType<typeof useMoneyAccountAvailability>);
}

async function flush(): Promise<void> {
  await jest.runAllTimersAsync();
}

describe('useUpgradeMoneyAccount', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    mockSubmitRequestToBackground.mockResolvedValue(undefined);
    mockAvailability(ADDRESS);
  });

  afterEach(async () => {
    await flush();
    jest.useRealTimers();
  });

  it('upgrades the lowercased address once per mount', async () => {
    const { rerender, unmount } = renderHook(() => useUpgradeMoneyAccount());

    rerender();
    await flush();

    expect(mockSubmitRequestToBackground).toHaveBeenCalledTimes(1);
    expect(mockSubmitRequestToBackground).toHaveBeenCalledWith(...UPGRADE_CALL);
    unmount();
  });

  it('does nothing while unavailable, then starts once the account is available', async () => {
    mockAvailability(undefined);
    const { rerender, unmount } = renderHook(() => useUpgradeMoneyAccount());

    await flush();
    expect(mockSubmitRequestToBackground).not.toHaveBeenCalled();

    mockAvailability(ADDRESS);
    rerender();
    await flush();

    expect(mockSubmitRequestToBackground).toHaveBeenCalledTimes(1);
    unmount();
  });

  it('retries a step failure and reports it to Sentry with the step tag', async () => {
    mockSubmitRequestToBackground
      .mockRejectedValueOnce(backgroundStepError('associate-address'))
      .mockResolvedValue(undefined);

    const { unmount } = renderHook(() => useUpgradeMoneyAccount());
    await flush();

    expect(mockSubmitRequestToBackground).toHaveBeenCalledTimes(2);
    expect(mockCaptureException).toHaveBeenCalledTimes(1);
    expect(mockCaptureException).toHaveBeenCalledWith(
      expect.objectContaining({ step: 'associate-address' }),
      {
        tags: { feature: 'money-account-upgrade', step: 'associate-address' },
        extra: {
          attempt: 1,
          willRetry: true,
          furtherRetryReportsSuppressed: false,
        },
      },
    );
    unmount();
  });

  it('gives up on a terminal failure and reports it once', async () => {
    mockSubmitRequestToBackground.mockRejectedValue(
      backgroundStepError('eip-7702-authorization', true),
    );

    const { unmount } = renderHook(() => useUpgradeMoneyAccount());
    await flush();

    expect(mockSubmitRequestToBackground).toHaveBeenCalledTimes(1);
    expect(mockCaptureException).toHaveBeenCalledTimes(1);
    expect(mockCaptureException).toHaveBeenCalledWith(expect.anything(), {
      tags: {
        feature: 'money-account-upgrade',
        step: 'eip-7702-authorization',
      },
      extra: { willRetry: false },
    });
    unmount();
  });

  it('skips quietly when the controller is not bootstrapped', async () => {
    mockSubmitRequestToBackground.mockRejectedValue(
      new JsonRpcError(
        -32603,
        'MoneyAccountUpgradeController is not bootstrapped',
        {
          cause: {
            message: 'MoneyAccountUpgradeController is not bootstrapped',
          },
        },
      ),
    );

    const { unmount } = renderHook(() => useUpgradeMoneyAccount());
    await flush();

    expect(mockSubmitRequestToBackground).toHaveBeenCalledTimes(1);
    expect(mockCaptureException).not.toHaveBeenCalled();
    unmount();
  });

  it('stops retrying on unmount', async () => {
    mockSubmitRequestToBackground.mockRejectedValue(
      backgroundStepError('associate-address'),
    );

    const { unmount } = renderHook(() => useUpgradeMoneyAccount());
    await jest.advanceTimersByTimeAsync(0);
    expect(mockSubmitRequestToBackground).toHaveBeenCalledTimes(1);

    unmount();
    await flush();

    expect(mockSubmitRequestToBackground).toHaveBeenCalledTimes(1);
    expect(mockCaptureException).toHaveBeenCalledTimes(1);
  });

  it('caps retried failure reports at three per run', async () => {
    mockSubmitRequestToBackground.mockRejectedValue(
      backgroundStepError('associate-address'),
    );

    const { unmount } = renderHook(() => useUpgradeMoneyAccount());
    await jest.advanceTimersByTimeAsync(10 * 60_000);

    expect(mockSubmitRequestToBackground.mock.calls.length).toBeGreaterThan(4);
    expect(mockCaptureException).toHaveBeenCalledTimes(3);
    expect(mockCaptureException).toHaveBeenLastCalledWith(
      expect.anything(),
      expect.objectContaining({
        extra: expect.objectContaining({
          furtherRetryReportsSuppressed: true,
        }),
      }),
    );
    unmount();
  });

  it('hands a run over to a second mounted surface when the first unmounts', async () => {
    mockSubmitRequestToBackground.mockRejectedValue(
      backgroundStepError('associate-address'),
    );

    const first = renderHook(() => useUpgradeMoneyAccount());
    const second = renderHook(() => useUpgradeMoneyAccount());
    await jest.advanceTimersByTimeAsync(0);
    expect(mockSubmitRequestToBackground).toHaveBeenCalledTimes(1);

    first.unmount();
    await jest.advanceTimersByTimeAsync(0);
    expect(mockSubmitRequestToBackground).toHaveBeenCalledTimes(2);

    await jest.advanceTimersByTimeAsync(10_000);
    expect(mockSubmitRequestToBackground).toHaveBeenCalledTimes(3);

    second.unmount();
    await flush();
    expect(mockSubmitRequestToBackground).toHaveBeenCalledTimes(3);
  });
});
