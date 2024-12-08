import {
  BtcAccountType,
  BtcMethod,
  InternalAccount,
} from '@metamask/keyring-api';
import { createMockInternalAccount } from '../../../test/jest/mocks';
import { containsEthPermissionsAndNonEvmAccount } from './permissions';

const mockAccount = createMockInternalAccount();
const mockNonEvmAccount = {
  ...mockAccount,
  id: '4b94987c-165c-4287-bbc6-bee9c440e82a',
  type: BtcAccountType.P2wpkh,
  methods: [BtcMethod.SendBitcoin],
  address: 'bc1qar0srrr7xfkvy5l643lydnw9re59gtzzwf5mdq',
};

describe('containsEthPermissionsAndNonEvmAccount', () => {
  it('return false if accounts array is empty', () => {
    const accounts: InternalAccount[] = [];
    const permissions = { eth_accounts: '' };

    const result = containsEthPermissionsAndNonEvmAccount(
      accounts,
      permissions,
    );

    expect(result).toBe(false);
  });

  it('return false if accounts array contains only EVM accounts', () => {
    const accounts: InternalAccount[] = [mockAccount, mockAccount];
    const permissions = { eth_accounts: '' };

    const result = containsEthPermissionsAndNonEvmAccount(
      accounts,
      permissions,
    );

    expect(result).toBe(false);
  });

  it('return false if permissions object does not contain eth_accounts permission', () => {
    const accounts: InternalAccount[] = [mockAccount, mockNonEvmAccount];
    const permissions = { some_other_permission: '' };

    const result = containsEthPermissionsAndNonEvmAccount(
      accounts,
      permissions,
    );

    expect(result).toBe(false);
  });

  it('return true if accounts array contains non-EVM account and permissions object contains eth_accounts permission', () => {
    const accounts: InternalAccount[] = [mockAccount, mockNonEvmAccount];
    const permissions = { eth_accounts: '' };

    const result = containsEthPermissionsAndNonEvmAccount(
      accounts,
      permissions,
    );

    expect(result).toBe(true);
  });
});
