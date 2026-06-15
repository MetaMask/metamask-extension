/** Icon type values for a hardware wallet address row avatar. */
export const HardwareWalletAddressIconTypes = {
  Network: 'network',
  Token: 'token',
} as const;

/** Icon type for a hardware wallet address row avatar. */
export type HardwareWalletAddressIconType =
  (typeof HardwareWalletAddressIconTypes)[keyof typeof HardwareWalletAddressIconTypes];

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
