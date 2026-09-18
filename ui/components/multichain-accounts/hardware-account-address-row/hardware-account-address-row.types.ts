/** Address data for a network row in a hardware wallet account card. */
export type HardwareWalletAccountAddress = {
  id: string;
  networkName: string;
  address: string;
  balance: string;
  iconUrl: string;
  addressType?: string;
};

/** Props for HardwareAccountAddressRow. */
export type HardwareAccountAddressRowProps = {
  address: HardwareWalletAccountAddress;
};
