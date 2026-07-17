import type { HardwareWalletAccountAddress } from '../hardware-account-address-row';

/** Hardware wallet account available for import during onboarding. */
export type HardwareWalletAccount = {
  id: string;
  name: string;
  totalBalance: string;
  addresses: HardwareWalletAccountAddress[];
  isAlreadyConnected?: boolean;
};

/** Props for HardwareAccountCard. */
export type HardwareAccountCardProps = {
  account: HardwareWalletAccount;
  isSelected: boolean;
  onToggleSelection: (accountId: string) => void;
};
