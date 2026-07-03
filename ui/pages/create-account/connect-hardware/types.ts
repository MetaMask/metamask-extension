/**
 * Minimal account row for the new hardware selector state and pagination.
 * Excludes balance because the selector UI only needs address and index for
 * selection, deduplication, and unlock calls.
 *
 * @property address - Ethereum address for the account.
 * @property index - Hardware account index from the device.
 */
export type RawHardwareAccount = {
  address: string;
  index: number;
};

/**
 * Account row used by the legacy AccountList flow in index.tsx, which displays
 * formatted balances alongside each address.
 *
 * @property address - Ethereum address for the account.
 * @property index - Hardware account index from the device.
 * @property balance - Formatted balance string for display.
 */
export type HardwareConnectAccount = RawHardwareAccount & {
  balance: string;
};

/**
 * Single row from a connectHardware(page) response before index normalization.
 * Some keyring bridges omit index on paginated rows; callers normalize before
 * storing selector state.
 *
 * @property address - Ethereum address for the account.
 * @property index - Optional hardware account index from the device.
 */
export type ConnectHardwarePageAccount = {
  address: string;
  index?: number;
};

/**
 * HD path option for hardware wallet onboarding.
 * Shared by getDeviceHdPaths and the SelectHdPathPage settings view.
 *
 * @property name - Display label for the path.
 * @property value - BIP44 derivation path string.
 */
export type HardwareHdPathOptionData = {
  name: string;
  value: string;
};
