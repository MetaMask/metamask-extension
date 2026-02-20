import {
  BtcAccountType,
  SolAccountType,
  TrxAccountType,
  isEvmAccountType,
} from '@metamask/keyring-api';
import { KeyringTypes } from '@metamask/keyring-controller';
import { InternalAccount } from '@metamask/keyring-internal-api';

export type AccountTypeCategory =
  | 'evm'
  | 'solana'
  | 'hardware'
  | 'private-key'
  | 'institutional-evm'
  | 'bitcoin'
  | 'tron'
  | 'unknown';

/**
 * Determines the account type category based on the account's type and keyring information
 *
 * @param account
 */
export const getAccountTypeCategory = (
  account: InternalAccount,
): AccountTypeCategory => {
  if (!account) {
    return 'unknown';
  }

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

  // Bitcoin accounts
  if (Object.values(BtcAccountType).includes(type as BtcAccountType)) {
    return 'bitcoin';
  }

  // TRON accounts
  if (type === TrxAccountType.Eoa) {
    return 'tron';
  }

  return 'unknown';
};

/**
 * Checks if an account is a hardware wallet account
 *
 * @param account - The internal account object to check.
 */
export const isHardwareAccount = (account: InternalAccount): boolean => {
  return getAccountTypeCategory(account) === 'hardware';
};

/**
 * Checks if an account is a Tron account
 *
 * @param account - The internal account object to check.
 */
export const isTronAccount = (account: InternalAccount): boolean => {
  return getAccountTypeCategory(account) === 'tron';
};
