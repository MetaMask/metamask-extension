/**
 * @jest-environment node
 */
import type { InternalAccount } from '@metamask/keyring-internal-api';
import { EthAccountType } from '@metamask/keyring-api';
import { HardwareKeyringType } from '../../../../../shared/constants/hardware-wallets';
import { isHardwareAccount } from './isHardwareAccount';

// Test constants
const MOCK_ACCOUNT_ADDRESS = '0x1234567890123456789012345678901234567890';

const MOCK_INTERNAL_ACCOUNT: InternalAccount = {
  id: 'account-1',
  address: MOCK_ACCOUNT_ADDRESS,
  type: EthAccountType.Eoa,
  scopes: ['eip155:1'],
  options: {},
  methods: [],
  metadata: {
    name: 'Test Account',
    keyring: {
      type: 'HD Key Tree',
    },
    importTime: Date.now(),
  },
};

const MOCK_LEDGER_ACCOUNT: InternalAccount = {
  id: 'ledger-account-1',
  address: MOCK_ACCOUNT_ADDRESS,
  type: EthAccountType.Eoa,
  scopes: ['eip155:1'],
  options: {},
  methods: [],
  metadata: {
    name: 'Ledger Account',
    keyring: {
      type: HardwareKeyringType.ledger,
    },
    importTime: Date.now(),
  },
};

const MOCK_QR_ACCOUNT: InternalAccount = {
  id: 'qr-account-1',
  address: MOCK_ACCOUNT_ADDRESS,
  type: EthAccountType.Eoa,
  scopes: ['eip155:1'],
  options: {},
  methods: [],
  metadata: {
    name: 'QR Wallet Account',
    keyring: {
      type: HardwareKeyringType.qr,
    },
    importTime: Date.now(),
  },
};

describe('isHardwareAccount', () => {
  it('should return true for Ledger hardware wallet', () => {
    const result = isHardwareAccount(MOCK_LEDGER_ACCOUNT);
    expect(result).toBe(true);
  });

  it('should return true for QR hardware wallet', () => {
    const result = isHardwareAccount(MOCK_QR_ACCOUNT);
    expect(result).toBe(true);
  });

  it('should return false for software wallet', () => {
    const result = isHardwareAccount(MOCK_INTERNAL_ACCOUNT);
    expect(result).toBe(false);
  });

  it('should return false for account with missing keyring metadata', () => {
    const accountWithoutKeyring: InternalAccount = {
      ...MOCK_INTERNAL_ACCOUNT,
      metadata: {
        name: 'Test Account',
        importTime: Date.now(),
      } as InternalAccount['metadata'],
    };
    const result = isHardwareAccount(accountWithoutKeyring);
    expect(result).toBe(false);
  });

  it('should return false for account with null metadata', () => {
    const accountWithNullMetadata = {
      ...MOCK_INTERNAL_ACCOUNT,
      metadata: null,
    } as unknown as InternalAccount;
    const result = isHardwareAccount(accountWithNullMetadata);
    expect(result).toBe(false);
  });
});

