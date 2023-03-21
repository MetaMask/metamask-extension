/**
 * Hardware wallets supported by MetaMask.
 */
export enum HardwareKeyringType {
  ledger = 'Ledger Hardware',
  trezor = 'Trezor Hardware',
  lattice = 'Lattice Hardware',
  qr = 'QR Hardware Wallet Device',
}

export enum HardwareKeyringNames {
  ledger = 'Ledger',
  trezor = 'Trezor',
  lattice = 'Lattice1',
  qr = 'QR',
}

export enum HardwareDeviceNames {
  ledger = 'ledger',
  trezor = 'trezor',
  lattice = 'lattice',
  qr = 'QR Hardware',
}

export enum HardwareTransportStates {
  none = 'NONE',
  verified = 'VERIFIED',
  deviceOpenFailure = 'DEVICE_OPEN_FAILURE',
  unknownFailure = 'UNKNOWN_FAILURE',
}

export enum HardwareAffiliateLinks {
  ledger = 'https://shop.ledger.com/?r=17c4991a03fa',
  gridplus = 'https://gridplus.io/?afmc=7p',
  trezor = 'https://shop.trezor.io/product/trezor-one-black?offer_id=35&aff_id=11009',
  keystone = 'https://shop.keyst.one/?rfsn=6088257.656b3e9&utm_source=refersion&utm_medium=affiliate&utm_campaign=6088257.656b3e9',
  airgap = 'https://airgap.it/',
  coolwallet = 'https://www.coolwallet.io/',
  dcent = 'https://dcentwallet.com/',
}

export enum HardwareAffiliateTutorialLinks {
  ledger = 'https://support.ledger.com/hc/en-us/articles/4404366864657-Set-up-and-use-MetaMask-to-access-your-Ledger-Ethereum-ETH-account?docs=true',
  gridplus = 'https://docs.gridplus.io/setup/metamask',
  trezor = 'https://wiki.trezor.io/Apps:MetaMask',
  keystone = 'https://support.keyst.one/3rd-party-wallets/eth-and-web3-wallets-keystone/bind-metamask-with-keystone',
  airgap = 'https://support.airgap.it/guides/metamask/',
  coolwallet = 'https://www.coolwallet.io/metamask-step-by-step-guides/',
  dcent = 'https://medium.com/dcentwallet/dcent-wallet-now-supports-qr-based-protocol-to-link-with-metamask-57555f02603f',
}

/**
 * Used for setting the users preference for ledger transport type
 */
export enum LedgerTransportTypes {
  live = 'ledgerLive',
  webhid = 'webhid',
  u2f = 'u2f',
}

export enum WebHIDConnectedStatuses {
  connected = 'connected',
  notConnected = 'notConnected',
  unknown = 'unknown',
}

export const LEDGER_USB_VENDOR_ID = '0x2c97';

export const U2F_ERROR = 'U2F';

export const LEDGER_LIVE_PATH = `m/44'/60'/0'/0/0`;
export const MEW_PATH = `m/44'/60'/0'`;
export const BIP44_PATH = `m/44'/60'/0'/0`;
export const LEDGER_HD_PATHS = [
  { name: 'Ledger Live', value: LEDGER_LIVE_PATH },
  { name: 'Legacy (MEW / MyCrypto)', value: MEW_PATH },
  { name: `BIP44 Standard (e.g. MetaMask, Trezor)`, value: BIP44_PATH },
];

export const LATTICE_STANDARD_BIP44_PATH = `m/44'/60'/0'/0/x`;
export const LATTICE_LEDGER_LIVE_PATH = `m/44'/60'/x'/0/0`;
export const LATTICE_MEW_PATH = `m/44'/60'/0'/x`;
export const LATTICE_HD_PATHS = [
  {
    name: `Standard (${LATTICE_STANDARD_BIP44_PATH})`,
    value: LATTICE_STANDARD_BIP44_PATH,
  },
  {
    name: `Ledger Live (${LATTICE_LEDGER_LIVE_PATH})`,
    value: LATTICE_LEDGER_LIVE_PATH,
  },
  { name: `Ledger Legacy (${LATTICE_MEW_PATH})`, value: LATTICE_MEW_PATH },
];

export const TREZOR_TESTNET_PATH = `m/44'/1'/0'/0`;
export const TREZOR_HD_PATHS = [
  { name: `BIP44 Standard (e.g. MetaMask, Trezor)`, value: BIP44_PATH },
  { name: `Trezor Testnets`, value: TREZOR_TESTNET_PATH },
];

export const HD_PATHS = {
  ledger: LEDGER_HD_PATHS,
  lattice: LATTICE_HD_PATHS,
  trezor: TREZOR_HD_PATHS,
};

export const DEFAULT_HD_PATHS = {
  trezor: BIP44_PATH,
  ledger: LEDGER_LIVE_PATH,
  lattice: BIP44_PATH,
};
