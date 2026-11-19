/**
 * Hardware wallet types normalized across background and UI.
 */
export enum HardwareWalletType {
  Ledger = 'ledger',
  Trezor = 'trezor',
  OneKey = 'oneKey',
  Lattice = 'lattice',
  Qr = 'qr',
  Unknown = 'unknown', // use for connection errors when wallet type is unknown
}
