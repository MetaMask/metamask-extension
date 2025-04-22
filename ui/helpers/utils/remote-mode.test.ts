import type { InternalAccount } from '@metamask/keyring-internal-api';
import { isRemoteModeSupported } from './remote-mode';

describe('Remote Mode Utils', () => {
  describe('isRemoteModeSupported', () => {
    it('returns true for supported hardware wallet types', () => {
      const ledgerAccount: InternalAccount = {
        address: '0x12C7e...q135f',
        type: 'eip155:eoa',
        id: '1',
        options: {},
        metadata: {
          name: 'Ledger Hardware',
          importTime: 1717334400,
          keyring: {
            type: 'Ledger Hardware',
          },
        },
        scopes: [],
        methods: [],
      };

      const latticeAccount: InternalAccount = {
        address: '0x12C7e...q135f',
        type: 'eip155:eoa',
        id: '2',
        options: {},
        metadata: {
          name: 'Lattice Hardware',
          importTime: 1717334400,
          keyring: {
            type: 'Lattice Hardware',
          },
        },
        scopes: [],
        methods: [],
      };

      expect(isRemoteModeSupported(ledgerAccount)).toBe(true);
      expect(isRemoteModeSupported(latticeAccount)).toBe(true);
    });

    it('returns false for unsupported hardware wallet types', () => {
      const unsupportedAccount: InternalAccount = {
        address: '0x12C7e...q135f',
        type: 'eip155:eoa',
        id: '3',
        options: {},
        metadata: {
          name: 'Some Other Wallet',
          importTime: 1717334400,
          keyring: {
            type: 'eip155',
          },
        },
        scopes: [],
        methods: [],
      };

      expect(isRemoteModeSupported(unsupportedAccount)).toBe(false);
    });
  });
});
