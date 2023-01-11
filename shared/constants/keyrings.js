import { HARDWARE_KEYRING_TYPES } from './hardware-wallets';

export const KEYRING_TYPES = {
  HD_KEY_TREE: 'HD Key Tree',
  IMPORTED: 'Simple Key Pair',
  ...HARDWARE_KEYRING_TYPES,
};
