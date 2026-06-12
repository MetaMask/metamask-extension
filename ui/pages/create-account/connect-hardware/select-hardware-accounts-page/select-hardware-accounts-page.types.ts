import type { HardwareWalletAccount } from '../../../../components/multichain-accounts/hardware-account-card';

export type { HardwareWalletAccount } from '../../../../components/multichain-accounts/hardware-account-card/hardware-account-card.types';
export type {
  HardwareWalletAccountAddress,
  HardwareWalletAddressIconType,
} from '../../../../components/multichain-accounts/hardware-account-address-row/hardware-account-address-row.types';

/** Props for {@link SelectHardwareAccountsPage}. */
export type SelectHardwareAccountsPageProps = {
  accounts: HardwareWalletAccount[];
  selectedAccountIds: string[];
  onAccountSelectionChange: (selectedAccountIds: string[]) => void;
  onBack: () => void;
  onShowMore: () => void;
  onContinue: (selectedAccountIds: string[]) => void;
  onForgetDevice: () => void;
  hasMoreAccounts?: boolean;
  isLoadingMore?: boolean;
  onSettingsClick?: () => void;
  showSettingsButton?: boolean;
};
