/** Avatar style used for a hardware wallet address row. */
export type HardwareWalletAddressIconType = 'network' | 'token';

/** Blockchain address displayed within a hardware wallet account card. */
export type HardwareWalletAccountAddress = {
  id: string;
  networkName: string;
  address: string;
  balance: string;
  iconUrl: string;
  iconType?: HardwareWalletAddressIconType;
  addressType?: string;
};

/** Props for {@link HardwareAccountAddressRow}. */
export type HardwareAccountAddressRowProps = {
  address: HardwareWalletAccountAddress;
};
