/**
 * Hardware wallets supported by MetaMask.
 */
export enum HardwareKeyringType {
  ledger = 'Ledger Hardware',
  trezor = 'Trezor Hardware',
  oneKey = 'OneKey Hardware',
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
  oneKey = 'oneKey',
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
  keystone = 'https://keyst.one/metamask?rfsn=6088257.656b3e9&utm_source=refersion&utm_medium=affiliate&utm_campaign=6088257.656b3e9',
  airgap = 'https://airgap.it/',
  coolwallet = 'https://www.coolwallet.io/',
  dcent = 'https://dcentwallet.com/',
  ngrave = 'https://shop.ngrave.io/',
  imtoken = 'https://token.im/',
  onekey = 'https://onekey.so/products/onekey-pro-hardware-wallet/',
}

export enum HardwareAffiliateTutorialLinks {
  ledger = 'https://support.ledger.com/hc/en-us/articles/4404366864657-Set-up-and-use-MetaMask-to-access-your-Ledger-Ethereum-ETH-account?docs=true',
  gridplus = 'https://docs.gridplus.io/setup/metamask',
  trezor = 'https://wiki.trezor.io/Apps:MetaMask',
  keystone = 'https://support.keyst.one/3rd-party-wallets/eth-and-web3-wallets-keystone/bind-metamask-with-keystone',
  airgap = 'https://support.airgap.it/guides/metamask/',
  coolwallet = 'https://www.coolwallet.io/metamask-step-by-step-guides/',
  dcent = 'https://medium.com/dcentwallet/dcent-wallet-now-supports-qr-based-protocol-to-link-with-metamask-57555f02603f',
  ngrave = 'https://ngrave.io/zero',
  imtoken = 'https://support.token.im/hc/en-us/articles/24652624775961/',
  onekey = 'https://help.onekey.so/hc/articles/9426592069903',
}

/**
 * Used for setting the users preference for ledger transport type
 */
export enum LedgerTransportTypes {
  webhid = 'webhid',
  u2f = 'u2f',
}

export enum WebHIDConnectedStatuses {
  connected = 'connected',
  notConnected = 'notConnected',
  unknown = 'unknown',
}

export const LEDGER_USB_VENDOR_ID = '0x2c97';
