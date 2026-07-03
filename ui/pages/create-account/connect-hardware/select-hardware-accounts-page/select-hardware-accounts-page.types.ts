import type { HardwareConnectAccount } from '../types';
import type { HardwareDeviceNames } from '../../../../../shared/constants/hardware-wallets';

/** Available views in the hardware account selection page. */
export const HARDWARE_ACCOUNTS_PAGE_VIEWS = ['accounts', 'hd-path'] as const;

/** View state for the hardware account selection page. */
export type HardwareAccountsPageView =
  (typeof HARDWARE_ACCOUNTS_PAGE_VIEWS)[number];

/** Props for the hardware account selection page. */
export type SelectHardwareAccountsPageProps = {
  device: HardwareDeviceNames;
  accounts: HardwareConnectAccount[];
  connectedAccounts: string[];
  onBack: () => void;
  onError: (error: string | null) => void;
};
