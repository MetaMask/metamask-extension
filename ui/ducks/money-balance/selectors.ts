import type { Hex } from '@metamask/utils';
import type { MetaMaskReduxState } from '../../store/store';
import { isEqualCaseInsensitive } from '../../../shared/lib/string-utils';
import type { PersistedMoneyBalance } from '.';

export const selectLastKnownMoneyBalance = (
  state: MetaMaskReduxState,
): PersistedMoneyBalance | null => state.moneyBalance.lastKnownBalance;

/**
 * A persisted balance is only safe to show as the "last known" figure when it
 * belongs to the account currently in view and was formatted in the currency
 * currently selected — otherwise the figure would be misleadingly stale (wrong
 * account) or numerically wrong (a different currency conversion).
 *
 * Age is deliberately not part of this check: the alternative to showing an old
 * last-known figure is showing nothing, and the caller is expected to label the
 * value as last known. `updatedAt` is persisted so a caller that wants to
 * present the age, or gate on it, can.
 *
 * @param persisted - The persisted balance, if any.
 * @param inView - The money account address and currency currently in view.
 * @param inView.address - Money account address in view, if it is known yet.
 * @param inView.currency - Currency code currently selected.
 * @returns True when `persisted` matches the account and currency in view.
 */
export const isPersistedMoneyBalanceUsable = (
  persisted: PersistedMoneyBalance | null | undefined,
  { address, currency }: { address?: Hex; currency: string },
): persisted is PersistedMoneyBalance =>
  Boolean(persisted) &&
  Boolean(address) &&
  isEqualCaseInsensitive(persisted?.address ?? '', address ?? '') &&
  persisted?.currency === currency;
