import {
  EthAccountType,
  BtcAccountType,
  SolAccountType,
  CaipChainId,
  EthScope,
} from '@metamask/keyring-api';
import { InternalAccount } from '@metamask/keyring-internal-api';
import { AccountsControllerState } from '@metamask/accounts-controller';
import { createSelector } from 'reselect';
import { KnownCaipNamespace, parseCaipChainId } from '@metamask/utils';
import { createDeepEqualSelector } from '../../shared/modules/selectors/util';
import { isEqualCaseInsensitive } from '../../shared/modules/string-utils';

export type AccountsState = {
  metamask: AccountsControllerState;
};

export function isSolanaAccount(account: InternalAccount) {
  const { DataAccount } = SolAccountType;

  return Boolean(account && account.type === DataAccount);
}

export function isNonEvmAccount(account: InternalAccount) {
  const { DataAccount } = SolAccountType;

  return Boolean(
    account &&
      (Object.values(BtcAccountType).includes(account.type as BtcAccountType) ||
        account.type === DataAccount),
  );
}

export const getInternalAccounts = createSelector(
  (state: AccountsState) =>
    Object.values(state.metamask.internalAccounts.accounts),
  (accounts) => accounts,
);

export const getInternalAccountsObject = createSelector(
  (state: AccountsState) => state.metamask.internalAccounts.accounts,
  (internalAccounts) => internalAccounts,
);

export const getMemoizedInternalAccountByAddress = createDeepEqualSelector(
  [getInternalAccounts, (_state, address) => address],
  (internalAccounts, address) => {
    return internalAccounts.find((account) =>
      isEqualCaseInsensitive(account.address, address),
    );
  },
);

export function getSelectedInternalAccount(state: AccountsState) {
  const accountId = state.metamask.internalAccounts.selectedAccount;
  return state.metamask.internalAccounts.accounts[accountId];
}

export function isSelectedInternalAccountEth(state: AccountsState) {
  const account = getSelectedInternalAccount(state);
  const { Eoa, Erc4337 } = EthAccountType;

  return Boolean(account && (account.type === Eoa || account.type === Erc4337));
}

export function isSelectedInternalAccountSolana(state: AccountsState) {
  return isSolanaAccount(getSelectedInternalAccount(state));
}

export function hasCreatedSolanaAccount(state: AccountsState) {
  const accounts = getInternalAccounts(state);
  return accounts.some((account) => isSolanaAccount(account));
}

/**
 * Returns all internal accounts that declare support for the provided CAIP scope.
 * The scope should be a CAIP-2 scope string (e.g., 'eip155:0', 'bip122:...').
 *
 * @param _state - Redux state (unused; required for selector signature)
 * @param scope - The CAIP scope string to filter accounts by
 */
export const getInternalAccountsByScope = createDeepEqualSelector(
  [getInternalAccounts, (_state: AccountsState, scope: CaipChainId) => scope],
  (accounts, scope): InternalAccount[] => {
    if (!Array.isArray(accounts) || accounts.length === 0) {
      return [];
    }

    let namespace: string;
    let reference: string;
    try {
      const parsed = parseCaipChainId(scope);
      namespace = parsed.namespace;
      reference = parsed.reference;
    } catch {
      return [];
    }

    if (namespace === KnownCaipNamespace.Eip155) {
      // If requesting eip155:0 (wildcard), include any account that has any EVM scope
      if (reference === '0') {
        return accounts.filter(
          (account) =>
            Array.isArray(account.scopes) &&
            account.scopes.some((s) =>
              s.startsWith(`${KnownCaipNamespace.Eip155}:`),
            ),
        );
      }

      // For a specific EVM chain, include accounts that either have the exact scope or the wildcard
      return accounts.filter(
        (account) =>
          Array.isArray(account.scopes) &&
          (account.scopes.includes(scope) ||
            account.scopes.includes(EthScope.Eoa)),
      );
    }

    // Non-EVM: exact scope match only
    return accounts.filter(
      (account) =>
        Array.isArray(account.scopes) && account.scopes.includes(scope),
    );
  },
);
