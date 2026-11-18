import { useEffect, useState } from 'react';
import type { TransactionMeta } from '@metamask/transaction-controller';
import { useConfirmContext } from '../../context/confirm';
import { useTransactionAccountOverride } from '../transactions/useTransactionAccountOverride';
import { useAccountTokensLoading } from '../send/useAccountTokensLoading';
import { ACCOUNT_RESELECT_EMPTY_TIMEOUT_MS } from './useAutomaticTransactionPayToken';

export { ACCOUNT_RESELECT_EMPTY_TIMEOUT_MS };

/**
 * Whether the funding account changed recently and its own balance has not
 * been resolved yet.
 *
 * Switching the "From" account makes the pay controller drop `paymentToken`
 * and re-quote, but the balance the UI reads settles over several commits.
 * First, `accountOverride` lands in Redux one commit before the effect that
 * requests the new account group's assets runs, so `isAccountTokensLoading` is
 * still false for a frame while the token list is already empty. Second, with
 * no matching token for the new account, `usePayTokenAccountBalance` falls
 * back to the controller snapshot, which can be a positive figure belonging to
 * the *previous* account.
 *
 * Consumers that would block on the balance must stay silent while this is
 * true, otherwise the stale figure is compared against the new account's
 * amount and briefly reports a false "Insufficient funds".
 *
 * Mirrors the render-time account-key guard in `useAccountNoFundsAlert`, and
 * settles after {@link ACCOUNT_RESELECT_EMPTY_TIMEOUT_MS} so an account that
 * never produces a live balance cannot suppress a real check forever.
 *
 * @param isLiveBalance - Whether the balance now comes from the funding
 * account's own token list rather than the controller snapshot.
 * @returns True while the newly selected account's balance is still settling.
 */
export function useIsFundingAccountBalanceSettling(
  isLiveBalance: boolean,
): boolean {
  const { currentConfirmation } = useConfirmContext<TransactionMeta>();
  const accountOverride = useTransactionAccountOverride();
  const isAccountTokensLoading = useAccountTokensLoading();

  const from = currentConfirmation?.txParams?.from;
  const accountKey = `${from ?? ''}:${accountOverride ?? ''}`;

  const [seenAccountKey, setSeenAccountKey] = useState(accountKey);
  const [waitingAccountKey, setWaitingAccountKey] = useState<string | null>(
    null,
  );

  // Updated during render, not in an effect, so an account switch cannot leave
  // one frame where the stale balance is still treated as authoritative.
  if (seenAccountKey !== accountKey) {
    setSeenAccountKey(accountKey);
    setWaitingAccountKey(accountKey);
  } else if (waitingAccountKey === accountKey && isLiveBalance) {
    setWaitingAccountKey(null);
  }

  const isWaiting = waitingAccountKey === accountKey && !isLiveBalance;

  useEffect(() => {
    // Hold without a deadline while the first asset fetch for this account is
    // genuinely in flight; the timer below only bounds the gap after it ends.
    if (!isWaiting || isAccountTokensLoading) {
      return undefined;
    }

    // Keyed on the account so switching again restarts the wait instead of an
    // earlier timer settling the newly selected account early.
    const timeoutAccountKey = accountKey;
    const timeoutId = setTimeout(() => {
      setWaitingAccountKey((current) =>
        current === timeoutAccountKey ? null : current,
      );
    }, ACCOUNT_RESELECT_EMPTY_TIMEOUT_MS);

    return () => {
      clearTimeout(timeoutId);
    };
  }, [accountKey, isAccountTokensLoading, isWaiting]);

  return isWaiting || (isAccountTokensLoading && !isLiveBalance);
}
