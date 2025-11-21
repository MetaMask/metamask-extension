import { KeyringTypes } from '@metamask/keyring-controller';

/**
 * Hardware wallets supported by MetaMask.
 */
export enum HardwareKeyringType {
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  ledger = 'Ledger Hardware',
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  trezor = 'Trezor Hardware',
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  oneKey = 'OneKey Hardware',
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  lattice = 'Lattice Hardware',
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  qr = 'QR Hardware Wallet Device',
}

export enum HardwareKeyringNames {
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  ledger = 'Ledger',
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  trezor = 'Trezor',
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  oneKey = 'OneKey',
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  lattice = 'Lattice1',
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  qr = 'QR',
}

export enum HardwareDeviceNames {
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  ledger = 'ledger',
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  trezor = 'trezor',
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  oneKey = 'oneKey',
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  lattice = 'lattice',
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  qr = 'QR Hardware',
}

export enum QrHardwareDeviceNames {
  Keystone = 'Keystone',
  AirGap = 'AirGap Vault',
  CoolWallet = 'CoolWallet',
  DCent = 'DCent',
  Ngrave = 'Ngrave',
  ImToken = 'imToken',
  KShell = 'Keycard Shell',
}

export enum HardwareTransportStates {
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  none = 'NONE',
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  verified = 'VERIFIED',
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  deviceOpenFailure = 'DEVICE_OPEN_FAILURE',
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  unknownFailure = 'UNKNOWN_FAILURE',
}

export enum HardwareAffiliateLinks {
  Ledger = 'https://shop.ledger.com/?r=17c4991a03fa',
  GridPlus = 'https://gridplus.io/?afmc=7p',
  Trezor = 'https://shop.trezor.io/product/trezor-one-black?offer_id=35&aff_id=11009',
  Keystone = 'https://keyst.one/metamask?rfsn=6088257.656b3e9&utm_source=refersion&utm_medium=affiliate&utm_campaign=6088257.656b3e9',
  AirGap = 'https://airgap.it/',
  CoolWallet = 'https://www.coolwallet.io/',
  DCent = 'https://dcentwallet.com/',
  Ngrave = 'https://shop.ngrave.io/',
  ImToken = 'https://token.im/',
  OneKey = 'https://onekey.so/products/onekey-pro-hardware-wallet/',
  KShell = 'https://get.keycard.tech/pages/keycard-shell',
}

export enum HardwareAffiliateTutorialLinks {
  Ledger = 'https://support.ledger.com/article/4404366864657-zd',
  GridPlus = 'https://docs.gridplus.io/setup/metamask',
  Trezor = 'https://wiki.trezor.io/Apps:MetaMask',
  Keystone = 'https://support.keyst.one/3rd-party-wallets/eth-and-web3-wallets-keystone/bind-metamask-with-keystone',
  AirGap = 'https://support.airgap.it/guides/metamask/',
  CoolWallet = 'https://www.coolwallet.io/metamask-step-by-step-guides/',
  DCent = 'https://medium.com/dcentwallet/dcent-wallet-now-supports-qr-based-protocol-to-link-with-metamask-57555f02603f',
  Ngrave = 'https://ngrave.io/zero',
  ImToken = 'https://support.token.im/hc/en-us/articles/24652624775961/',
  OneKey = 'https://help.onekey.so/en/articles/11461108-connect-onekey-pro-to-metamask-via-qr-codes-air-gapped',
  KShell = 'https://keycard.tech/help/connect-keycard-shell-to-a-wallet-app',
}

/**
 * Used for setting the users preference for ledger transport type
 */
export enum LedgerTransportTypes {
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  webhid = 'webhid',
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  u2f = 'u2f',
}

export enum WebHIDConnectedStatuses {
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  connected = 'connected',
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  notConnected = 'notConnected',
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  unknown = 'unknown',
}

export enum MarketingActionNames {
  BuyNow = 'Buy Now',
  LearnMore = 'Learn More',
  Tutorial = 'Tutorial',
}

export const LEDGER_USB_VENDOR_ID = '0x2c97';

export const DEVICE_KEYRING_MAP = {
  [HardwareDeviceNames.ledger]: KeyringTypes.ledger,
  [HardwareDeviceNames.trezor]: KeyringTypes.trezor,
  [HardwareDeviceNames.oneKey]: KeyringTypes.oneKey,
  [HardwareDeviceNames.lattice]: KeyringTypes.lattice,
  [HardwareDeviceNames.qr]: KeyringTypes.qr,
};

export const U2F_ERROR = 'U2F';

export const LEDGER_ERRORS_CODES = {
  '0x650f': 'ledgerErrorConnectionIssue',
  '0x5515': 'ledgerErrorDevicedLocked',
  '0x6501': 'ledgerErrorEthAppNotOpen',
  '0x6a80': 'ledgerErrorTransactionDataNotPadded',
};

export const LEDGER_LIVE_PATH = `m/44'/60'/0'/0/0`;
export const MEW_PATH = `m/44'/60'/0'`;
export const BIP44_PATH = `m/44'/60'/0'/0`;

export const LATTICE_STANDARD_BIP44_PATH = `m/44'/60'/0'/0/x`;
export const LATTICE_LEDGER_LIVE_PATH = `m/44'/60'/x'/0/0`;
export const LATTICE_MEW_PATH = `m/44'/60'/0'/x`;

export const TREZOR_TESTNET_PATH = `m/44'/1'/0'/0`;
