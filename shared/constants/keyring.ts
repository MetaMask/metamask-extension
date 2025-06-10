import { KeyringTypes } from '@metamask/keyring-controller';

import { HardwareKeyringType } from './hardware-wallets';

/**
 * These are the keyrings that are managed entirely by MetaMask.
 */
export enum InternalKeyringType {
  hdKeyTree = 'HD Key Tree',
  imported = 'Simple Key Pair',
}

///: BEGIN:ONLY_INCLUDE_IF(keyring-snaps)
export enum SnapKeyringType {
  snap = 'Snap Keyring',
}
///: END:ONLY_INCLUDE_IF

/**
 * All keyrings supported by MetaMask.
 */
export const KeyringType = {
  ...HardwareKeyringType,
  ...InternalKeyringType,
  ///: BEGIN:ONLY_INCLUDE_IF(keyring-snaps)
  ...SnapKeyringType,
  ///: END:ONLY_INCLUDE_IF
};

export const KEYRING_TYPES_SUPPORTING_7702 = [
  KeyringTypes.hd,
  KeyringTypes.simple,
];
