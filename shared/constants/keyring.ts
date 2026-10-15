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

export enum SnapKeyringType {
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  snap = 'Snap Keyring',
}

/**
 * All keyrings supported by MetaMask.
 */
export const KeyringType = {
  ...HardwareKeyringType,
  ...InternalKeyringType,
  ...SnapKeyringType,
};

/**
 * Keyring types that support EIP-7702 (Setup Smart Account).
 * Only HD (entropy) and simple (private key) accounts support this; hardware and snap do not.
 */
export const KEYRING_TYPES_SUPPORTING_7702 = [
  KeyringTypes.hd,
  KeyringTypes.simple,
];

/**
 * Keyring types whose transactions can publish via the EIP-7702 relay
 * (sentinel). Extends the Smart Account list with the Money keyring: sponsored
 * Money Account transactions (e.g. withdrawals on Monad) are marked
 * externally-signed and must publish through the relay — without the money
 * keyring here the relay hook is skipped and an unsigned payload reaches
 * `eth_sendRawTransaction` ("Transaction decoding error"). Mirrors mobile's
 * `KEYRING_TYPES_SUPPORTING_7702`, which includes `ExtendedKeyringTypes.money`
 * for its transaction publish gate only.
 */
export const KEYRING_TYPES_SUPPORTING_7702_RELAY = [
  KeyringTypes.hd,
  KeyringTypes.simple,
  KeyringTypes.money,
];
