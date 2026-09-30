import { createSelector } from 'reselect';
import { EthScope, isEvmAccountType } from '@metamask/keyring-api';
import type { InternalAccount } from '@metamask/keyring-internal-api';
import type { AccountsState } from '../../../shared/lib/selectors/accounts';
import { getMaybeSelectedInternalAccount } from '../../../shared/lib/selectors/accounts';
import { isHardwareAccount } from '../../components/app/rewards/utils/isHardwareAccount';
import { getInternalAccountBySelectedAccountGroupAndCaip } from '../multichain-accounts/account-tree';
import type { MultichainAccountsState } from '../multichain-accounts/account-tree.types';
import { EMPTY_OBJECT } from '../shared';

// Returns the accounts map itself, not `Object.values(...)`: a fresh array on
// every call would be a new reference each time, so reselect would treat the
// input as changed and recompute on every state change.
const getInternalAccountsMap = (
  state: AccountsState,
): Record<string, InternalAccount> =>
  state.metamask.internalAccounts?.accounts ?? EMPTY_OBJECT;

const getSelectedGroupEvmAccount = (state: MultichainAccountsState) =>
  getInternalAccountBySelectedAccountGroupAndCaip(state, EthScope.Eoa);

/**
 * Whether an account can fund or receive a Money Account transaction.
 *
 * Money Account deposits and withdrawals are executed as a batch by the Money
 * keyring, and a hardware device cannot sign for that batch — so hardware
 * accounts are not eligible, matching the account picker on the confirmation
 * and `usePayHardwareAccountAlert`.
 *
 * The Money Account itself is never a candidate: `AccountsController` filters
 * the Money keyring out of `internalAccounts` entirely, because it is owned by
 * `MoneyAccountController` rather than being a real user account.
 *
 * @param account - The account to test.
 * @returns Whether the account is a valid Money Account counterparty.
 */
function isEligibleMoneyFundingAccount(
  account: InternalAccount | null | undefined,
): account is InternalAccount {
  return Boolean(
    account && isEvmAccountType(account.type) && !isHardwareAccount(account),
  );
}

/**
 * The account used to fund a Money Account deposit, or to receive a Money
 * Account withdrawal.
 *
 * Prefers the globally selected account, which is what the user expects.
 *
 * When that account is not EVM, this uses the EVM account of the selected
 * account group instead. Selecting a non-EVM network in the network filter
 * switches the globally selected account to that namespace's account (for
 * example a Solana account), but the group it belongs to still has the EVM
 * account the user would expect to fund from.
 *
 * Falls back — most commonly because the group's account is a hardware
 * wallet, which cannot sign the batch — to the user's first eligible EVM
 * account, rather than failing.
 *
 * The final fallback reads `internalAccounts.accounts`, which
 * `AccountsController` rebuilds in keyring order, so "first" is the same
 * account the rest of the UI would call first. It deliberately avoids the
 * balance-joined ordered-accounts selector: this runs on entry points that
 * only need an address, and that selector pulls in keyring and balance state
 * those callers do not otherwise depend on.
 *
 * Returns `undefined` only when the user has no eligible account at all (for
 * example, a hardware-only wallet). Callers must treat that as "cannot
 * initiate" rather than substituting an address of their own.
 *
 * @returns The account to use, or `undefined` when none is eligible.
 */
export const selectMoneyFundingAccount = createSelector(
  getMaybeSelectedInternalAccount,
  getSelectedGroupEvmAccount,
  getInternalAccountsMap,
  (
    selectedAccount: InternalAccount | undefined,
    groupEvmAccount: InternalAccount | null,
    accounts: Record<string, InternalAccount>,
  ): InternalAccount | undefined => {
    if (isEligibleMoneyFundingAccount(selectedAccount)) {
      return selectedAccount;
    }

    if (isEligibleMoneyFundingAccount(groupEvmAccount)) {
      return groupEvmAccount;
    }

    return Object.values(accounts).find(isEligibleMoneyFundingAccount);
  },
);
