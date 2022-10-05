/**
 * Accounts can be instantiated from simple, HD or the multiple hardware wallet
 * keyring types. Both simple and HD are treated as default but we do special
 * case accounts managed by a hardware wallet.
 */
export const KEYRING_TYPES = {
  LEDGER: 'Ledger Hardware',
  TREZOR: 'Trezor Hardware',
  LATTICE: 'Lattice Hardware',
  QR: 'QR Hardware Wallet Device',
  IMPORTED: 'Simple Key Pair',
};

export const DEVICE_NAMES = {
  LEDGER: 'ledger',
  TREZOR: 'trezor',
  QR: 'QR Hardware',
  LATTICE: 'lattice',
};

export const KEYRING_NAMES = {
  LEDGER: 'Ledger',
  TREZOR: 'Trezor',
  QR: 'QR',
  LATTICE: 'Lattice1',
};

/**
 * Used for setting the users preference for ledger transport type
 */
export const LEDGER_TRANSPORT_TYPES = {
  LIVE: 'ledgerLive',
  WEBHID: 'webhid',
  U2F: 'u2f',
};

export const LEDGER_USB_VENDOR_ID = '0x2c97';

export const WEBHID_CONNECTED_STATUSES = {
  CONNECTED: 'connected',
  NOT_CONNECTED: 'notConnected',
  UNKNOWN: 'unknown',
};

export const TRANSPORT_STATES = {
  NONE: 'NONE',
  VERIFIED: 'VERIFIED',
  DEVICE_OPEN_FAILURE: 'DEVICE_OPEN_FAILURE',
  UNKNOWN_FAILURE: 'UNKNOWN_FAILURE',
};

export const AFFILIATE_LINKS = {
  LEDGER: 'https://shop.ledger.com/?r=17c4991a03fa',
  GRIDPLUS: 'https://gridplus.io/?afmc=7p',
  TREZOR:
    'https://shop.trezor.io/product/trezor-one-black?offer_id=35&aff_id=11009',
  KEYSTONE:
    'https://shop.keyst.one/?rfsn=6088257.656b3e9&utm_source=refersion&utm_medium=affiliate&utm_campaign=6088257.656b3e9',
  AIRGAP: 'https://airgap.it/',
  COOLWALLET: 'https://www.coolwallet.io/',
  DCENT: 'https://dcentwallet.com/',
};

export const AFFILIATE_TUTORIAL_LINKS = {
  LEDGER:
    'https://support.ledger.com/hc/en-us/articles/4404366864657-Set-up-and-use-MetaMask-to-access-your-Ledger-Ethereum-ETH-account?docs=true',
  GRIDPLUS: 'https://docs.gridplus.io/setup/metamask',
  TREZOR: 'https://wiki.trezor.io/Apps:MetaMask',
  KEYSTONE:
    'https://support.keyst.one/3rd-party-wallets/eth-and-web3-wallets-keystone/bind-metamask-with-keystone',
  AIRGAP: 'https://support.airgap.it/guides/metamask/',
  COOLWALLET: 'https://www.coolwallet.io/metamask-step-by-step-guides/',
  DCENT:
    'https://medium.com/dcentwallet/dcent-wallet-now-supports-qr-based-protocol-to-link-with-metamask-57555f02603f',
};
