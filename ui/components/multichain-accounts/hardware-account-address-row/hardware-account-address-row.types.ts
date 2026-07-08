/**
 * Address data for a network row in a hardware wallet account card.
 *
 * @property id - Unique row identifier.
 * @property networkName - Localized network name for display.
 * @property address - Ethereum address string.
 * @property balance - Optional formatted balance for display.
 * @property iconUrl - Network token icon URL.
 * @property addressType - Optional address type label.
 */
export type HardwareWalletAccountAddress = {
  id: string;
  networkName: string;
  address: string;
  balance?: string;
  iconUrl: string;
  addressType?: string;
};

/**
 * Props for HardwareAccountAddressRow.
 *
 * @property address - Address data to display in the row.
 */
export type HardwareAccountAddressRowProps = {
  address: HardwareWalletAccountAddress;
};
