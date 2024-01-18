/**
 * Defines legal targets for offscreen communication. These values are used to
 * filter and route messages to the correct target.
 */
export enum OffscreenCommunicationTarget {
  trezorOffscreen = 'trezor-offscreen',
  ledgerOffscreen = 'ledger-offscreen',
  latticeOffscreen = 'lattice-offscreen',
  extension = 'extension-offscreen',
}

/**
 * Offscreen events are actions that happen OFFSCREEN that will need to be
 * listened for on the background/service worker thread.
 */
export enum OffscreenCommunicationEvents {
  trezorDeviceConnect = 'trezor-device-connect',
  ledgerDeviceConnect = 'ledger-device-connect',
}

/**
 * Defines actions intended to be sent to the Trezor Offscreen iframe.
 */
export enum TrezorAction {
  init = 'trezor-init',
  dispose = 'trezor-dispose',
  getPublicKey = 'trezor-get-public-key',
  signTransaction = 'trezor-sign-transaction',
  signMessage = 'trezor-sign-message',
  signTypedData = 'trezor-sign-typed-data',
}

/**
 * Defines actions intended to be sent to the Trezor Offscreen iframe.
 */
export enum LedgerAction {
  makeApp = 'ledger-make-app',
  updateTransport = 'ledger-update-transport',
  unlock = 'ledger-unlock',
  getPublicKey = 'ledger-unlock',
  signTransaction = 'ledger-sign-transaction',
  signMessage = 'ledger-sign-message',
  signTypedData = 'ledger-sign-typed-data',
}

/**
 * Defines domain origins that we expect to interface with in our offscreen
 * document. Any reference to a domain as an origin should use this enum
 * instead of constants or literals so that it can be managed and overviewed.
 */
export enum KnownOrigins {
  lattice = 'https://lattice.gridplus.io',
  ledger = 'https://metamask.github.io',
}
