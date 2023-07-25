import { HardwareKeyringType } from './hardware-wallets';

/**
 * These are the keyrings that are managed entirely by MetaMask.
 */
export enum InternalKeyringType {
  hdKeyTree = 'HD Key Tree',
  imported = 'Simple Key Pair',
}

///: BEGIN:ONLY_INCLUDE_IN(keyring-snaps)
export enum SnapKeyringType {
  snap = 'Snap Keyring',
}
///: END:ONLY_INCLUDE_IN

/**
 * All keyrings supported by MetaMask.
 */
export const KeyringType = {
  ...HardwareKeyringType,
  ...InternalKeyringType,
  ///: BEGIN:ONLY_INCLUDE_IN(keyring-snaps)
  ...SnapKeyringType,
  ///: END:ONLY_INCLUDE_IN
};
