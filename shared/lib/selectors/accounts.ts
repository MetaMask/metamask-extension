import type { AccountsControllerState } from '@metamask/accounts-controller';
import type { InternalAccount } from '@metamask/keyring-internal-api';

export type AccountsState = {
  metamask: AccountsControllerState;
};

export function getSelectedInternalAccount(
  state: AccountsState,
): InternalAccount {
  const accountId = state.metamask.internalAccounts.selectedAccount;
  return state.metamask.internalAccounts.accounts[accountId];
}

/**
 * Same as `getSelectedInternalAccount`, but might potentially be `undefined`:
 * - This might happen during the onboarding
 *
 * @param state - The accounts state
 * @returns The selected internal account or undefined
 */
export function getMaybeSelectedInternalAccount(
  state: AccountsState,
): InternalAccount | undefined {
  const accountId = state.metamask.internalAccounts?.selectedAccount;
  return accountId
    ? state.metamask.internalAccounts?.accounts[accountId]
    : undefined;
}
