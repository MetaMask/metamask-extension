import { HardwareKeyringTypes } from './hardware-wallets';

/**
 * These are the keyrings that are managed entirely by MetaMask.
 */
export enum InternalKeyringTypes {
  hdKeyTree = 'HD Key Tree',
  imported = 'Simple Key Pair',
}

/**
 * All keyrings supported by MetaMask.
 */
export const KeyringTypes = {
  ...HardwareKeyringTypes,
  ...InternalKeyringTypes,
};
