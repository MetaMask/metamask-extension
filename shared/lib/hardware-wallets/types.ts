/**
 * Hardware wallet types normalized for connection and error handling.
 *
 * Shared between background and UI so RPC/error reconstruction does not
 * depend on the React hardware-wallet context.
 */
export enum HardwareWalletType {
  Ledger = 'ledger',
  Trezor = 'trezor',
  OneKey = 'oneKey',
  Lattice = 'lattice',
  Qr = 'qr',
  Unknown = 'unknown', // use for connection errors when wallet type is unknown
}
