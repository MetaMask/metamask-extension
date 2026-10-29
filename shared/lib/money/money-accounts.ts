import type { KeyringAccountEntropyMnemonicOptions } from '@metamask/keyring-api';
import type { MoneyAccount } from '@metamask/money-account-controller';

/**
 * A Money account backed by a BIP-44 mnemonic (SRP) entropy source — the SFA
 * (single-factor authentication) account.
 */
export type MnemonicMoneyAccount = MoneyAccount & {
  options: { entropy: KeyringAccountEntropyMnemonicOptions };
};

/**
 * Check whether the given Money account is mnemonic-backed (SFA).
 *
 * @param account - The Money account to check.
 * @returns Whether the account is mnemonic-backed.
 */
export function isMnemonicMoneyAccount(
  account: MoneyAccount,
): account is MnemonicMoneyAccount {
  return account.options?.entropy?.type === 'mnemonic';
}
