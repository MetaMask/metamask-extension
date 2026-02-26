import type { InternalAccount } from '@metamask/keyring-internal-api';
import { EthAccountType } from '@metamask/keyring-api';
import { HardwareKeyringType } from '../../../../../shared/constants/hardware-wallets';
import { isHardwareAccount } from './isHardwareAccount';

const MOCK_ACCOUNT_ADDRESS = '0x1234567890123456789012345678901234567890';

const mockAccount = (keyringType: string): InternalAccount =>
  ({
    id: 'account-1',
    address: MOCK_ACCOUNT_ADDRESS,
    type: EthAccountType.Eoa,
    scopes: ['eip155:1'],
    options: {},
    methods: [],
    metadata: {
      name: 'Test Account',
      keyring: { type: keyringType },
      importTime: Date.now(),
    },
  }) as InternalAccount;

describe('isHardwareAccount', () => {
  it('returns true for a Ledger hardware wallet', () => {
    expect(isHardwareAccount(mockAccount(HardwareKeyringType.ledger))).toBe(
      true,
    );
  });

  it('returns true for a Trezor hardware wallet', () => {
    expect(isHardwareAccount(mockAccount(HardwareKeyringType.trezor))).toBe(
      true,
    );
  });

  it('returns true for a OneKey hardware wallet', () => {
    expect(isHardwareAccount(mockAccount(HardwareKeyringType.oneKey))).toBe(
      true,
    );
  });

  it('returns true for a Lattice hardware wallet', () => {
    expect(isHardwareAccount(mockAccount(HardwareKeyringType.lattice))).toBe(
      true,
    );
  });

  it('returns true for a QR hardware wallet', () => {
    expect(isHardwareAccount(mockAccount(HardwareKeyringType.qr))).toBe(true);
  });

  it('returns false for a software (HD Key Tree) account', () => {
    expect(isHardwareAccount(mockAccount('HD Key Tree'))).toBe(false);
  });

  it('returns false for an account with an unknown keyring type', () => {
    expect(isHardwareAccount(mockAccount('Simple Key Pair'))).toBe(false);
  });

  it('returns false when keyring metadata is missing', () => {
    const account = {
      ...mockAccount('HD Key Tree'),
      metadata: {
        name: 'Test Account',
        importTime: Date.now(),
      },
    } as unknown as InternalAccount;
    expect(isHardwareAccount(account)).toBe(false);
  });

  it('returns false when metadata is null', () => {
    const account = {
      ...mockAccount('HD Key Tree'),
      metadata: null,
    } as unknown as InternalAccount;
    expect(isHardwareAccount(account)).toBe(false);
  });
});
