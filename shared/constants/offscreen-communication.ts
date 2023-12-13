/**
 * Defines legal targets for offscreen communication. These values are used to
 * filter and route messages to the correct target.
 */
export enum OffscreenCommunicationTarget {
  trezorOffscreen = 'trezor-offscreen',
  extension = 'extension-offscreen',
}

/**
 * Offscreen events are actions that happen OFFSCREEN that will need to be
 * listened for on the background/service worker thread.
 */
export enum OffscreenCommunicationEvents {
  trezorDeviceConnect = 'trezor-device-connect',
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
