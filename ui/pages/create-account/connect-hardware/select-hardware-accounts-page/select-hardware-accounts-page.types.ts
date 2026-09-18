import type { HardwareWalletAccount } from '../../../../components/multichain-accounts/hardware-account-card';

/** Props for SelectHardwareAccountsPage. */
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
