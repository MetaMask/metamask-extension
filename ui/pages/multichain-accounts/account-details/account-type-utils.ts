import { SolAccountType, isEvmAccountType } from '@metamask/keyring-api';
import { KeyringTypes } from '@metamask/keyring-controller';
import { InternalAccount } from '@metamask/keyring-internal-api';

export type AccountTypeCategory =
  | 'evm'
  | 'solana'
  | 'hardware'
  | 'private-key'
  | 'institutional-evm'
  | 'unknown';

/**
 * Determines the account type category based on the account's type and keyring information
 */
export const getAccountTypeCategory = (
  account: InternalAccount,
): AccountTypeCategory => {
  if (!account) return 'unknown';

  const { type, metadata } = account;
  const keyringType = metadata?.keyring?.type as KeyringTypes;
  const snapId = metadata?.snap?.id;

  // Hardware accounts (must be checked before EVM check)
  if (
    keyringType &&
    [
      KeyringTypes.ledger,
      KeyringTypes.trezor,
      KeyringTypes.oneKey,
      KeyringTypes.lattice,
      KeyringTypes.qr,
    ].includes(keyringType)
  ) {
    return 'hardware';
  }

  // Private key accounts (must be checked before EVM check)
  if (keyringType === KeyringTypes.simple) {
    return 'private-key';
  }

  // Institutional-EVM accounts (must be checked before EVM check)
  if (
    keyringType === KeyringTypes.snap &&
    snapId === 'npm:@metamask/institutional-wallet-snap'
  ) {
    return 'institutional-evm';
  }

  // EVM accounts (EOA and ERC-4337) - general fallback
  if (isEvmAccountType(type)) {
    return 'evm';
  }

  // Solana accounts
  if (type === SolAccountType.DataAccount) {
    return 'solana';
  }

  return 'unknown';
};

/**
 * Checks if an account is an EVM account (EOA or ERC-4337)
 */
export const isEVMAccount = (account: InternalAccount): boolean => {
  return getAccountTypeCategory(account) === 'evm';
};

/**
 * Checks if an account is a Solana account
 */
export const isSolanaAccount = (account: InternalAccount): boolean => {
  return getAccountTypeCategory(account) === 'solana';
};

/**
 * Checks if an account is a hardware wallet account
 */
export const isHardwareAccount = (account: InternalAccount): boolean => {
  return getAccountTypeCategory(account) === 'hardware';
};

/**
 * Checks if an account is a private key account
 */
export const isPrivateKeyAccount = (account: InternalAccount): boolean => {
  return getAccountTypeCategory(account) === 'private-key';
};

/**
 * Checks if an account is an institutional EVM account
 */
export const isInstitutionalEVMAccount = (
  account: InternalAccount,
): boolean => {
  return getAccountTypeCategory(account) === 'institutional-evm';
};
