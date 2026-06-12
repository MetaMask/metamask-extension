/** Icon type for a hardware wallet address row avatar. */
export type HardwareWalletAddressIconType = 'network' | 'token';

/** Address data for a row in a hardware wallet account card. */
export type HardwareWalletAccountAddress = {
  id: string;
  networkName: string;
  address: string;
  balance: string;
  iconUrl: string;
  iconType?: HardwareWalletAddressIconType;
  addressType?: string;
};

/** Props for HardwareAccountAddressRow. */
export type HardwareAccountAddressRowProps = {
  address: HardwareWalletAccountAddress;
};
