import { InternalAccount } from "@metamask/keyring-internal-api";
import { createDeepEqualSelector } from "../../../../shared/modules/selectors/util";
import { getAccountByAddress } from "../../../helpers/utils/util";
import { getAccountGroupsByAddress } from "../../../selectors/multichain-accounts/account-tree";
import { AccountGroupWithInternalAccounts, MultichainAccountsState } from "../../../selectors/multichain-accounts/account-tree.types";

/**
 * Selector to get the account group name by an internal account address.
 * Used when multichain accounts state 2 is enabled.
 *
 * @param state - Redux state.
 * @param _state
 * @param addresses - Array of account addresses to filter account groups by.
 * @param _addresses
 * @param internalAccount - The internal account address to find the group name for.
 * @returns The name of the account group that contains the internal account, or null if not found.
 */
export const selectAccountGroupNameByInternalAccount = createDeepEqualSelector(
  [
    (state: MultichainAccountsState) => state,
    (_state: MultichainAccountsState, addresses: string[]) => addresses,
    (
      _state: MultichainAccountsState,
      _addresses: string[],
      internalAccount: string | undefined,
    ) => internalAccount,
  ],
  (
    state: MultichainAccountsState,
    addresses: string[],
    internalAccount: string | undefined,
  ): string | null => {
    if (!internalAccount || !addresses?.length) {
      return null;
    }

    const allAccountGroups = getAccountGroupsByAddress(state, addresses);

    const group = allAccountGroups.find((g: AccountGroupWithInternalAccounts) =>
      g.accounts.some(
        (a: InternalAccount) =>
          a.address?.toLowerCase() === internalAccount.toLowerCase(),
      ),
    );

    return group?.metadata?.name ?? null;
  },
);

/**
 * Selector to get the internal account name by address.
 * Used when multichain accounts state 2 is disabled (legacy mode).
 *
 * @param state - Redux state.
 * @param _state
 * @param addresses - Array of account addresses to filter account groups by.
 * @param _addresses
 * @param address - The account address to find the account name for.
 * @returns The metadata name of the internal account, or null if not found.
 */
export const selectInternalAccountNameByAddress = createDeepEqualSelector(
  [
    (state: MultichainAccountsState) => state,
    (_state: MultichainAccountsState, addresses: string[]) => addresses,
    (
      _state: MultichainAccountsState,
      _addresses: string[],
      address: string | undefined,
    ) => address,
  ],
  (
    state: MultichainAccountsState,
    addresses: string[],
    address: string | undefined,
  ): string | null => {
    if (!address || !addresses?.length) {
      return null;
    }

    const allAccountGroups = getAccountGroupsByAddress(state, addresses);
    const allInternalAccounts = allAccountGroups.flatMap(
      (g: AccountGroupWithInternalAccounts) => g.accounts,
    );
    const fromAccount = getAccountByAddress(allInternalAccounts, address);

    return fromAccount?.metadata?.name ?? null;
  },
);
