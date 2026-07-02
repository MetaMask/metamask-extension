import type { HardwareWalletAccount } from '../../../../components/multichain-accounts/hardware-account-card';
import type { AsyncVoidCallback } from '../types';

/** Props for SelectHardwareAccountsPage. */
export type SelectHardwareAccountsPageProps = {
  accounts: HardwareWalletAccount[];
  selectedAccountIds: string[];
  onAccountSelectionChange: (selectedAccountIds: string[]) => void;
  onBack: () => void;
  onShowMore: () => void;
  onContinue: AsyncVoidCallback;
  onForgetDevice: AsyncVoidCallback;
  hasMoreAccounts?: boolean;
  isLoadingMore?: boolean;
  isContinuing?: boolean;
  onSettingsClick?: () => void;
  showSettingsButton?: boolean;
};
