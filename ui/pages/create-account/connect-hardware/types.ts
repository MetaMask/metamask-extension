/**
 * Raw account row returned from connectHardware before UI mapping.
 *
 * @property address - Ethereum address for the account.
 * @property index - Hardware account index from the device.
 */
export type RawHardwareAccount = {
  address: string;
  index: number;
};

/**
 * Hardware account row from connectHardware with balance display.
 *
 * @property address - Ethereum address for the account.
 * @property index - Hardware account index from the device.
 * @property balance - Formatted balance string for display.
 */
export type HardwareConnectAccount = RawHardwareAccount & {
  balance: string;
};

/**
 * HD path option for hardware wallet onboarding.
 *
 * @property name - Display label for the path.
 * @property value - BIP44 derivation path string.
 */
export type HardwareHdPathOptionData = {
  name: string;
  value: string;
};
