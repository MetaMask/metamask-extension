import type { HardwareConnectAccount } from '../types';
import type { HardwareDeviceNames } from '../../../../../shared/constants/hardware-wallets';

/** Available views in the hardware account selection page. */
export const HARDWARE_ACCOUNTS_PAGE_VIEWS = ['accounts', 'hd-path'] as const;

/** View state for the hardware account selection page. */
export type HardwareAccountsPageView =
  (typeof HARDWARE_ACCOUNTS_PAGE_VIEWS)[number];

/**
 * Props for the hardware account selection page.
 * Rendered by index.tsx when the new hardware onboarding flag is enabled.
 *
 * @property device - Connected hardware device.
 * @property accounts - Initial connectHardware rows from index.tsx (balance is ignored).
 * @property connectedAccounts - Lowercase addresses already imported in MetaMask.
 * @property onBack - Called when the user leaves the account selector.
 * @property onError - Called when the parent should display an error.
 */
export type SelectHardwareAccountsPageProps = {
  device: HardwareDeviceNames;
  accounts: HardwareConnectAccount[];
  connectedAccounts: string[];
  onBack: () => void;
  onError: (error: string | null) => void;
};
