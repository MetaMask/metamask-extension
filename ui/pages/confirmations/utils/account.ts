import { InternalAccount } from '@metamask/keyring-internal-api';

const startsWithNamespace = (value: unknown, namespacePrefix: string): boolean =>
  typeof value === 'string' && value.startsWith(namespacePrefix);

const hasNamespaceInScopes = (
  scopes: unknown,
  namespacePrefix: string,
): boolean => {
  if (!Array.isArray(scopes)) {
    return false;
  }

  return scopes.some((scope) => startsWithNamespace(scope, namespacePrefix));
};

const isAccountCompatibleForSend = (
  account: InternalAccount,
  namespace: string,
): boolean => {
  if (!account) {
    return false;
  }

  const namespacePrefix = `${namespace}:`;

  return (
    startsWithNamespace(account.type, namespacePrefix) ||
    hasNamespaceInScopes(account.scopes, namespacePrefix)
  );
};

/**
 * Checks if an account is EVM-compatible for send operations.
 * This includes regular EVM accounts, hardware wallets, and private key accounts.
 *
 * @param account - The internal account object to check
 * @returns true if the account can be used for EVM transactions
 */
export const isEVMAccountForSend = (account: InternalAccount): boolean => {
  return isAccountCompatibleForSend(account, 'eip155');
};

/**
 * Checks if an account is Solana-compatible for send operations.
 *
 * @param account - The internal account object to check
 * @returns true if the account can be used for Solana transactions
 */
export const isSolanaAccountForSend = (account: InternalAccount): boolean => {
  return isAccountCompatibleForSend(account, 'solana');
};

/**
 * Checks if an account is Bitcoin-compatible for send operations.
 *
 * @param account - The internal account object to check
 * @returns true if the account can be used for Bitcoin transactions
 */
export const isBitcoinAccountForSend = (account: InternalAccount): boolean => {
  return isAccountCompatibleForSend(account, 'bip122');
};

/**
 * Checks if an account is Tron-compatible for send operations.
 *
 * @param account - The internal account object to check
 * @returns true if the account can be used for Tron transactions
 */
export const isTronAccountForSend = (account: InternalAccount): boolean => {
  return isAccountCompatibleForSend(account, 'tron');
};
