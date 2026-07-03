import { it as jestIt } from '@jest/globals';
import type { KeyringObject } from '@metamask/keyring-controller';
import { KeyringType } from '../../../../../shared/constants/keyring';
import { getConnectedHardwareWalletKeyrings } from './get-connected-hardware-wallet-keyrings';

const createKeyring = (
  type: (typeof KeyringType)[keyof typeof KeyringType],
  accounts: string[] = [],
): KeyringObject =>
  ({
    type,
    accounts,
  }) as KeyringObject;

const HARDWARE_KEYRING_TYPES = [
  KeyringType.ledger,
  KeyringType.trezor,
  KeyringType.lattice,
  KeyringType.qr,
  KeyringType.oneKey,
] as const;

describe('getConnectedHardwareWalletKeyrings', () => {
  it('returns an empty array when no keyrings are provided', () => {
    expect(getConnectedHardwareWalletKeyrings([])).toStrictEqual([]);
  });

  it('returns only hardware keyrings with imported accounts', () => {
    const ledgerKeyring = createKeyring(KeyringType.ledger, ['0x1']);
    const trezorKeyring = createKeyring(KeyringType.trezor, ['0x2']);
    const hdKeyring = createKeyring(KeyringType.hdKeyTree, ['0x3']);

    expect(
      getConnectedHardwareWalletKeyrings([
        ledgerKeyring,
        trezorKeyring,
        hdKeyring,
      ]),
    ).toStrictEqual([ledgerKeyring, trezorKeyring]);
  });

  jestIt.each(HARDWARE_KEYRING_TYPES)(
    'includes connected %s keyrings with accounts',
    (keyringType: (typeof HARDWARE_KEYRING_TYPES)[number]) => {
      const keyring = createKeyring(keyringType, ['0xabc']);

      expect(getConnectedHardwareWalletKeyrings([keyring])).toStrictEqual([
        keyring,
      ]);
    },
  );

  jestIt.each(HARDWARE_KEYRING_TYPES)(
    'excludes empty %s keyrings without accounts',
    (keyringType: (typeof HARDWARE_KEYRING_TYPES)[number]) => {
      const keyring = createKeyring(keyringType);

      expect(getConnectedHardwareWalletKeyrings([keyring])).toStrictEqual([]);
    },
  );
});
