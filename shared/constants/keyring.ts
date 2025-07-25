import { KeyringTypes } from '@metamask/keyring-controller';

import { HardwareKeyringType } from './hardware-wallets';

/**
 * These are the keyrings that are managed entirely by MetaMask.
 */
export enum InternalKeyringType {
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  hdKeyTree = 'HD Key Tree',
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  imported = 'Simple Key Pair',
}

///: BEGIN:ONLY_INCLUDE_IF(keyring-snaps)
export enum SnapKeyringType {
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
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
