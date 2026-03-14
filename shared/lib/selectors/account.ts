import { getCurrentKeyringFromState } from './metamask-keyring';
import {
  isHardwareWalletFromKeyring,
  getHardwareWalletTypeFromKeyring,
} from './keyring-utils';

type MetamaskAccountsState = {
  metamask?: {
    internalAccounts?: {
      selectedAccount?: string;
      accounts?: Record<string, { metadata?: { keyring?: { type?: string } } }>;
    };
  };
};

/**
 * Returns true if the current wallet is a hardware wallet.
 * Implemented in shared to avoid circular dependency on ui/selectors.
 *
 * @param state - Redux state
 * @returns true if hardware wallet
 */
export function isHardwareWallet(state: MetamaskAccountsState): boolean {
  const keyring = getCurrentKeyringFromState(state);
  return isHardwareWalletFromKeyring(keyring);
}

/**
 * Returns the hardware wallet type string (e.g. "Ledger Hardware"), or undefined.
 * Implemented in shared to avoid circular dependency on ui/selectors.
 *
 * @param state - Redux state
 * @returns type string or undefined
 */
export function getHardwareWalletType(
  state: MetamaskAccountsState,
): string | undefined {
  const keyring = getCurrentKeyringFromState(state);
  return getHardwareWalletTypeFromKeyring(keyring);
}
