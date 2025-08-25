export const OFFSCREEN_LEDGER_INIT_TIMEOUT = 4000;
export const OFFSCREEN_LOAD_TIMEOUT = OFFSCREEN_LEDGER_INIT_TIMEOUT + 1000;

/**
 * Defines legal targets for offscreen communication. These values are used to
 * filter and route messages to the correct target.
 */
export enum OffscreenCommunicationTarget {
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  trezorOffscreen = 'trezor-offscreen',
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  ledgerOffscreen = 'ledger-offscreen',
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  latticeOffscreen = 'lattice-offscreen',
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  extension = 'extension-offscreen',
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  extensionMain = 'extension',
}

/**
 * Offscreen events are actions that happen OFFSCREEN that will need to be
 * listened for on the background/service worker thread.
 */
export enum OffscreenCommunicationEvents {
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  trezorDeviceConnect = 'trezor-device-connect',
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  ledgerDeviceConnect = 'ledger-device-connect',
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  metamaskBackgroundReady = 'metamask-background-ready',
}

/**
 * Defines actions intended to be sent to the Trezor Offscreen iframe.
 */
export enum TrezorAction {
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  init = 'trezor-init',
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  dispose = 'trezor-dispose',
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  getPublicKey = 'trezor-get-public-key',
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  signTransaction = 'trezor-sign-transaction',
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  signMessage = 'trezor-sign-message',
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  signTypedData = 'trezor-sign-typed-data',
}

/**
 * Defines actions intended to be sent to the Trezor Offscreen iframe.
 */
export enum LedgerAction {
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  makeApp = 'ledger-make-app',
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  updateTransport = 'ledger-update-transport',
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  unlock = 'ledger-unlock',
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  getPublicKey = 'ledger-unlock',
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  signTransaction = 'ledger-sign-transaction',
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  signPersonalMessage = 'ledger-sign-personal-message',
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  signTypedData = 'ledger-sign-typed-data',
}

/**
 * Defines domain origins that we expect to interface with in our offscreen
 * document. Any reference to a domain as an origin should use this enum
 * instead of constants or literals so that it can be managed and overviewed.
 */
export enum KnownOrigins {
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  lattice = 'https://lattice.gridplus.io',
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  ledger = 'https://metamask.github.io',
}
