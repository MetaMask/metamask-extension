import type { InternalAccount } from '@metamask/keyring-internal-api';
import { EthAccountType } from '@metamask/keyring-api';
import { HardwareKeyringType } from '../../constants/hardware-wallets';
import { isHardwareAccount } from './accounts';

const ACCOUNT_ADDRESS = '0x1234567890123456789012345678901234567890';

function createAccount(keyringType: string): InternalAccount {
  return {
    id: 'account-id',
    address: ACCOUNT_ADDRESS,
    type: EthAccountType.Eoa,
    scopes: ['eip155:1'],
    options: {},
    methods: [],
    metadata: {
      name: 'Account',
      keyring: { type: keyringType },
      importTime: 0,
    },
  };
}

describe('isHardwareAccount', () => {
  Object.values(HardwareKeyringType).forEach((keyringType) => {
    it(`returns true for hardware keyring type ${keyringType}`, () => {
      expect(isHardwareAccount(createAccount(keyringType))).toBe(true);
    });
  });

  it('returns false for a software keyring type', () => {
    expect(isHardwareAccount(createAccount('HD Key Tree'))).toBe(false);
  });
});
