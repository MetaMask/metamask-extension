import { InternalAccount } from '@metamask/keyring-internal-api';

/**
 * Checks if an account is EVM-compatible for send operations.
 * This includes regular EVM accounts, hardware wallets, and private key accounts.
 *
 * @param account - The internal account object to check
 * @returns true if the account can be used for EVM transactions
 */
export const isEVMAccountForSend = (account: InternalAccount): boolean => {
  if (!account) {
    return false;
  }

  if (account.type.startsWith('eip155:')) {
    return true;
  }

  if (account.scopes?.some((scope) => scope.startsWith('eip155:'))) {
    return true;
  }

  return false;
};

/**
 * Checks if an account is Solana-compatible for send operations.
 *
 * @param account - The internal account object to check
 * @returns true if the account can be used for Solana transactions
 */
export const isSolanaAccountForSend = (account: InternalAccount): boolean => {
  if (!account) {
    return false;
  }

  if (account.type.startsWith('solana:')) {
    return true;
  }

  if (account.scopes?.some((scope) => scope.startsWith('solana:'))) {
    return true;
  }

  return false;
};
