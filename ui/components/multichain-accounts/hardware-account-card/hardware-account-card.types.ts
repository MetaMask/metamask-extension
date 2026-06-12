import type { HardwareWalletAccountAddress } from '../hardware-account-address-row';

/** Multichain account option shown during hardware wallet onboarding. */
export type HardwareWalletAccount = {
  id: string;
  name: string;
  totalBalance: string;
  addresses: HardwareWalletAccountAddress[];
  isAlreadyConnected?: boolean;
};

/** Props for {@link HardwareAccountCard}. */
export type HardwareAccountCardProps = {
  account: HardwareWalletAccount;
  isSelected: boolean;
  onToggleSelection: (accountId: string) => void;
};
