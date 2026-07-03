import type { HardwareWalletAccountAddress } from '../hardware-account-address-row';

/**
 * Hardware wallet account available for import during onboarding.
 *
 * @property id - Unique account card identifier.
 * @property name - Display name for the account.
 * @property totalBalance - Optional formatted total balance across networks.
 * @property addresses - Network address rows for this account.
 * @property isAlreadyConnected - Whether the account is already imported.
 */
export type HardwareWalletAccount = {
  id: string;
  name: string;
  totalBalance?: string;
  addresses: HardwareWalletAccountAddress[];
  isAlreadyConnected?: boolean;
};

/**
 * Props for HardwareAccountCard.
 *
 * @property account - Hardware wallet account to display.
 * @property isSelected - Whether the account is selected for import.
 * @property onToggleSelection - Called when the user toggles account selection.
 */
export type HardwareAccountCardProps = {
  account: HardwareWalletAccount;
  isSelected: boolean;
  onToggleSelection: (accountId: string) => void;
};
