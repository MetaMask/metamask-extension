import { Hex } from 'viem';
import type { InternalAccount } from '@metamask/keyring-internal-api';

import { CHAIN_IDS } from '../../../shared/constants/network';
import {
  getChainNamesForDisplayByIds,
  isRemoteModeSupported,
} from './remote-mode';

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

describe('getChainNamesForDisplayByIds', () => {
  it('returns the correct chain name for a single known chain', () => {
    expect(getChainNamesForDisplayByIds([CHAIN_IDS.MAINNET])).toBe(
      'Ethereum Mainnet',
    );
  });

  it('returns multiple chain names separated by commas', () => {
    expect(
      getChainNamesForDisplayByIds([CHAIN_IDS.MAINNET, CHAIN_IDS.SEPOLIA]),
    ).toBe('Ethereum Mainnet, Sepolia');
  });

  it('returns "Unknown" for unrecognized chain IDs', () => {
    expect(getChainNamesForDisplayByIds(['0x1234' as Hex])).toBe(
      'Unknown(0x1234)',
    );
  });

  it('handles a mix of known and unknown chain IDs', () => {
    expect(
      getChainNamesForDisplayByIds([CHAIN_IDS.MAINNET, '0x1234' as Hex]),
    ).toBe('Ethereum Mainnet, Unknown(0x1234)');
  });

  it('returns an empty string for empty input', () => {
    expect(getChainNamesForDisplayByIds([])).toBe('');
  });
});
