import type { AccountState } from '@metamask/perps-controller';
import {
  TransactionMeta,
  TransactionType,
} from '@metamask/transaction-controller';
import { waitFor } from '@testing-library/react';
import {
  getMockConfirmState,
  getMockConfirmStateForTransaction,
} from '../../../../../../test/data/confirmations/helper';
import { genUnapprovedContractInteractionConfirmation } from '../../../../../../test/data/confirmations/contract-interaction';
import { renderHookWithConfirmContextProvider } from '../../../../../../test/lib/confirmations/render-helpers';
import { resetCoalesceCacheForTests } from '../../../../../hooks/perps/coalesceBackgroundRequest';
import { usePerpsCacheKey } from '../../../../../hooks/perps/usePerpsCacheKey';
import { getPerpsStreamManager } from '../../../../../providers/perps';
import { submitRequestToBackground } from '../../../../../store/background-connection';
import { useTransactionPayPrimaryRequiredToken } from '../../pay/useTransactionPayData';
import { AlertsName } from '../constants';
import { RowAlertKey } from '../../../../../components/app/confirm/info/row/constants';
import { Severity } from '../../../../../helpers/constants/design-system';
import { usePerpsWithdrawInsufficientBalanceAlert } from './usePerpsWithdrawInsufficientBalanceAlert';

jest.mock('../../../../../providers/perps', () => ({
  ...jest.requireActual('../../../../../providers/perps'),
  getPerpsStreamManager: jest.fn(),
}));
jest.mock('../../../../../store/background-connection', () => ({
  ...jest.requireActual('../../../../../store/background-connection'),
  submitRequestToBackground: jest.fn(),
}));
jest.mock('../../../../../hooks/perps/usePerpsCacheKey');
jest.mock('../../pay/useTransactionPayData');

const PERPS_CACHE_KEY = 'hyperliquid:testnet:0x1';
const OTHER_PERPS_CACHE_KEY = 'hyperliquid:testnet:0x2';

const mockGetPerpsStreamManager = jest.mocked(getPerpsStreamManager);
const mockSubmitRequestToBackground = jest.mocked(submitRequestToBackground);
const mockUsePerpsCacheKey = jest.mocked(usePerpsCacheKey);
const mockUsePrimaryRequiredToken = jest.mocked(
  useTransactionPayPrimaryRequiredToken,
);

/**
 * Balance the streamed WebSocket cache would have reported. The Perps cases
 * seed it with a value that would produce the opposite decision and assert
 * the singleton is never consulted, which is what the pre-fix hook did.
 * @param withdrawableBalance
 */
function setStreamedBalance(withdrawableBalance: string | null) {
  mockGetPerpsStreamManager.mockReturnValue({
    account: {
      getCachedData: () =>
        withdrawableBalance === null
          ? null
          : ({ withdrawableBalance } as AccountState),
    },
  } as ReturnType<typeof getPerpsStreamManager>);
}

function setFreshAccount(account: Partial<AccountState> | null) {
  mockSubmitRequestToBackground.mockResolvedValue(account);
}

function setFreshAccountRejects(error: Error) {
  mockSubmitRequestToBackground.mockRejectedValue(error);
}

function setFreshBalance(withdrawableBalance: string) {
  setFreshAccount({ withdrawableBalance });
}

function setEnteredAmount(amountFiat: string) {
  mockUsePrimaryRequiredToken.mockReturnValue({
    amountFiat,
  } as ReturnType<typeof useTransactionPayPrimaryRequiredToken>);
}

const EXPECTED_ALERT = {
  field: RowAlertKey.EstimatedFee,
  isBlocking: true,
  key: AlertsName.InsufficientPayTokenBalance,
  message: 'Insufficient funds',
  reason: 'Insufficient funds',
  severity: Severity.Danger,
};

/**
 * Blocked because the balance could not be read — not because it is short, so
 * it carries its own alert key (telemetry) and its own copy. `reason` is the
 * confirm button label and stays short; `message` explains inline.
 */
const EXPECTED_UNAVAILABLE_ALERT = {
  ...EXPECTED_ALERT,
  key: AlertsName.PerpsWithdrawBalanceUnavailable,
  message: "Couldn't check your Perps balance. Try again.",
  reason: 'Balance unavailable',
};

function buildPerpsWithdrawState() {
  const transaction = {
    ...genUnapprovedContractInteractionConfirmation(),
    type: TransactionType.perpsWithdraw,
  } as TransactionMeta;
  return getMockConfirmStateForTransaction(transaction);
}

function runHook(state: ReturnType<typeof buildPerpsWithdrawState>) {
  return renderHookWithConfirmContextProvider(
    () => usePerpsWithdrawInsufficientBalanceAlert(),
    state,
  );
}

/**
 * Renders and waits for the fresh account-state read to settle.
 * @param state
 */
async function runSettledHook(
  state: ReturnType<typeof buildPerpsWithdrawState>,
) {
  const { result } = runHook(state);
  await waitFor(() => {
    expect(mockSubmitRequestToBackground).toHaveBeenCalledWith(
      'perpsGetAccountState',
      [],
    );
  });
  return result;
}

describe('usePerpsWithdrawInsufficientBalanceAlert', () => {
  beforeEach(() => {
    jest.resetAllMocks();
    resetCoalesceCacheForTests();
    mockUsePerpsCacheKey.mockReturnValue(PERPS_CACHE_KEY);
    setStreamedBalance(null);
    setFreshBalance('100');
    setEnteredAmount('10');
  });

  it('returns no alert when entered amount is below the available balance', async () => {
    const result = await runSettledHook(buildPerpsWithdrawState());
    await waitFor(() => expect(result.current).toStrictEqual([]));
  });

  it('returns no alert when entered amount equals the available balance', async () => {
    setEnteredAmount('100');
    const result = await runSettledHook(buildPerpsWithdrawState());
    await waitFor(() => expect(result.current).toStrictEqual([]));
  });

  it('returns a blocking alert when entered amount exceeds the available balance', async () => {
    setEnteredAmount('150');
    const result = await runSettledHook(buildPerpsWithdrawState());
    await waitFor(() => expect(result.current).toStrictEqual([EXPECTED_ALERT]));
  });

  it('returns no alert when entered amount is zero', async () => {
    setEnteredAmount('0');
    const result = await runSettledHook(buildPerpsWithdrawState());
    await waitFor(() => expect(result.current).toStrictEqual([]));
  });

  it('returns no alert when there is no entered amount and no account', async () => {
    setFreshAccount(null);
    setEnteredAmount('0');
    const result = await runSettledHook(buildPerpsWithdrawState());
    await waitFor(() => expect(result.current).toStrictEqual([]));
  });

  it('returns no alert when there is no current confirmation', async () => {
    setEnteredAmount('150');
    const { result } = renderHookWithConfirmContextProvider(
      () => usePerpsWithdrawInsufficientBalanceAlert(),
      getMockConfirmState(),
    );
    await waitFor(() => expect(result.current).toStrictEqual([]));
  });

  it('uses `withdrawableBalance` over `spendableBalance` for the threshold', async () => {
    // Unified mode: `spendableBalance` is $0 (perps clearinghouse) but the
    // user actually has $50 of withdrawable balance.
    // Withdrawing $40 must NOT trigger the alert.
    setFreshAccount({ spendableBalance: '0', withdrawableBalance: '50' });
    setEnteredAmount('40');
    const result = await runSettledHook(buildPerpsWithdrawState());
    await waitFor(() => expect(result.current).toStrictEqual([]));
  });

  it('alerts when entered amount exceeds `withdrawableBalance`', async () => {
    setFreshAccount({ spendableBalance: '0', withdrawableBalance: '50' });
    setEnteredAmount('51');
    const result = await runSettledHook(buildPerpsWithdrawState());
    await waitFor(() => expect(result.current).toStrictEqual([EXPECTED_ALERT]));
  });

  it('returns no alert when Max only exceeds the balance below Perps precision', async () => {
    setFreshAccount({ spendableBalance: '0', withdrawableBalance: '7.863083' });
    setEnteredAmount('7.8630830000000005');
    const result = await runSettledHook(buildPerpsWithdrawState());
    await waitFor(() => expect(result.current).toStrictEqual([]));
  });

  it('alerts when entered amount exceeds the balance by one Perps precision unit', async () => {
    setFreshAccount({ spendableBalance: '0', withdrawableBalance: '7.863083' });
    setEnteredAmount('7.863084');
    const result = await runSettledHook(buildPerpsWithdrawState());
    await waitFor(() => expect(result.current).toStrictEqual([EXPECTED_ALERT]));
  });

  it('uses `amountFiat` (typed USD) over `amountUsd` (token count × $1) for the threshold', async () => {
    // For USDC at market rate ≈ 0.9998, the user typing $39.83 produces a
    // required token with `amountFiat` ≈ 39.83 (their real USD intent) but
    // `amountUsd` ≈ 39.84 (token count priced at $1). The HL balance is
    // 39.833436. Only `amountFiat` keeps the strict `>` semantic so a user
    // can withdraw exactly their available balance without a false-positive.
    setFreshAccount({
      spendableBalance: '0',
      withdrawableBalance: '39.833436',
    });
    mockUsePrimaryRequiredToken.mockReturnValue({
      amountFiat: '39.83000054846650769962',
      amountUsd: '39.838382',
    } as ReturnType<typeof useTransactionPayPrimaryRequiredToken>);

    const result = await runSettledHook(buildPerpsWithdrawState());

    await waitFor(() => expect(result.current).toStrictEqual([]));
  });

  describe('fresh balance source', () => {
    it('blocks a withdrawal the stale streamed cache would have allowed', async () => {
      // Stale-high: the WebSocket cache still reports the pre-trade balance,
      // while the account the provider validates against only holds $20.
      setStreamedBalance('500');
      setFreshBalance('20');
      setEnteredAmount('100');

      const result = await runSettledHook(buildPerpsWithdrawState());

      await waitFor(() =>
        expect(result.current).toStrictEqual([EXPECTED_ALERT]),
      );
      // The pre-fix hook read this cache on exactly this confirmation type;
      // the fresh read must not consult it at all.
      expect(mockGetPerpsStreamManager).not.toHaveBeenCalled();
    });

    it('allows a withdrawal the stale streamed cache would have blocked', async () => {
      // Stale-low: the singleton cache was rebuilt empty after an MV3
      // restart, but the account really does hold $763.276429.
      setStreamedBalance(null);
      setFreshBalance('763.276429');
      setEnteredAmount('381');

      const result = await runSettledHook(buildPerpsWithdrawState());

      await waitFor(() => expect(result.current).toStrictEqual([]));
    });

    it('allows a withdrawal equal to the fresh balance', async () => {
      setStreamedBalance('10');
      setFreshBalance('250.5');
      setEnteredAmount('250.5');

      const result = await runSettledHook(buildPerpsWithdrawState());

      await waitFor(() => expect(result.current).toStrictEqual([]));
    });

    it('returns no alert while the fresh read is still in flight', async () => {
      // Never resolves: the hook must not block on an unknown balance, which
      // is exactly what the empty streamed cache used to do.
      setStreamedBalance(null);
      mockSubmitRequestToBackground.mockReturnValue(
        new Promise(() => undefined),
      );
      setEnteredAmount('100');

      const { result } = runHook(buildPerpsWithdrawState());

      await waitFor(() => {
        expect(mockSubmitRequestToBackground).toHaveBeenCalledWith(
          'perpsGetAccountState',
          [],
        );
      });
      expect(result.current).toStrictEqual([]);
    });
  });

  describe('perps scope', () => {
    it('does not query the perps controller for non-perps confirmations', async () => {
      setStreamedBalance('500');
      setEnteredAmount('150');
      const contractInteraction =
        genUnapprovedContractInteractionConfirmation() as TransactionMeta;
      const state = getMockConfirmStateForTransaction(contractInteraction);

      const { result } = renderHookWithConfirmContextProvider(
        () => usePerpsWithdrawInsufficientBalanceAlert(),
        state,
      );

      await waitFor(() => expect(result.current).toStrictEqual([]));
      expect(mockSubmitRequestToBackground).not.toHaveBeenCalled();
    });

    it('falls back to loading rather than the previous scope balance when the account scope changes', async () => {
      // First scope holds $50, so $100 is blocked there.
      setStreamedBalance('500');
      setFreshAccount({ withdrawableBalance: '50' });
      setEnteredAmount('100');

      const { result, rerender } = runHook(buildPerpsWithdrawState());
      await waitFor(() =>
        expect(result.current).toStrictEqual([EXPECTED_ALERT]),
      );

      // Switching account/network/provider changes the scope key. Until the
      // new read settles the previous scope's balance says nothing about this
      // one, so the hook must go back to loading instead of reusing it.
      mockSubmitRequestToBackground.mockReturnValue(
        new Promise(() => undefined),
      );
      mockUsePerpsCacheKey.mockReturnValue(OTHER_PERPS_CACHE_KEY);
      rerender();

      await waitFor(() => expect(result.current).toStrictEqual([]));
    });

    it('reuses one background request when the confirmation remounts inside the coalescing window', async () => {
      // FRESH_BALANCE_TTL_MS exists so a re-mount does not add Hyperliquid
      // request weight; without the coalescing wrapper this is two calls.
      setEnteredAmount('10');

      await runSettledHook(buildPerpsWithdrawState());
      runHook(buildPerpsWithdrawState());

      await waitFor(() =>
        expect(mockSubmitRequestToBackground).toHaveBeenCalledTimes(1),
      );
    });
  });

  describe('degraded read', () => {
    it('blocks without inventing a balance when the fresh read fails', async () => {
      // Degraded read: the streamed cache still claims $500, but nothing
      // confirms the account can cover the withdrawal, so it is blocked —
      // and the copy says the balance is unknown, not that funds are short.
      const consoleError = jest
        .spyOn(console, 'error')
        .mockImplementation(() => undefined);
      setStreamedBalance('500');
      const error = new Error('perps provider unreachable');
      setFreshAccountRejects(error);
      setEnteredAmount('100');

      const result = await runSettledHook(buildPerpsWithdrawState());

      await waitFor(() =>
        expect(result.current).toStrictEqual([EXPECTED_UNAVAILABLE_ALERT]),
      );
      // A blocked withdrawal has to be diagnosable.
      expect(consoleError).toHaveBeenCalledWith(
        expect.stringContaining('Failed to fetch account'),
        error,
      );
      consoleError.mockRestore();
    });

    it('blocks without inventing a balance when the fresh read returns no account', async () => {
      // Treating a missing account as $0 would block with "Insufficient
      // funds", which claims a balance nothing confirmed.
      setStreamedBalance('500');
      setFreshAccount(null);
      setEnteredAmount('100');

      const result = await runSettledHook(buildPerpsWithdrawState());

      await waitFor(() =>
        expect(result.current).toStrictEqual([EXPECTED_UNAVAILABLE_ALERT]),
      );
    });
  });
});
