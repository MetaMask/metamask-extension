import { SolScope, TrxScope } from '@metamask/keyring-api';
import { CHAIN_IDS } from '../../../shared/constants/network';
import {
  getNetworkSections,
  isDisableableDefaultNetwork,
} from './network-sections';

describe('getNetworkSections', () => {
  it('assigns section titles even when only one section is present', () => {
    const sections = getNetworkSections([
      { chainId: '0x1', name: 'Ethereum' },
      { chainId: '0xa', name: 'Optimism' },
    ]);

    expect(sections).toHaveLength(1);
    expect(sections[0].titleKey).toBe('defaultNetworks');
  });

  it('groups non-EVM mainnets into the default section', () => {
    const sections = getNetworkSections([
      { chainId: '0x1', name: 'Ethereum' },
      {
        chainId: 'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp',
        name: 'Solana',
      },
      {
        chainId: 'bip122:000000000019d6689c085ae165831e93',
        name: 'Bitcoin',
      },
      {
        chainId: TrxScope.Mainnet,
        name: 'Tron',
      },
    ]);

    expect(sections).toHaveLength(1);
    expect(sections[0].titleKey).toBe('defaultNetworks');
    expect(sections[0].items.map(({ chainId }) => chainId)).toStrictEqual([
      '0x1',
      'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp',
      'bip122:000000000019d6689c085ae165831e93',
      TrxScope.Mainnet,
    ]);
  });

  it('keeps non-EVM testnets out of the default section', () => {
    const sections = getNetworkSections([
      {
        chainId: 'solana:EtWTRABZaYq6iMfeYKouRu166VU2xqa1',
        name: 'Solana Devnet',
      },
      {
        chainId: '0x539',
        name: 'Localhost',
      },
    ]);

    expect(sections).toHaveLength(1);
    expect(sections[0].titleKey).toBe('testnets');
    expect(sections[0].items.map(({ chainId }) => chainId)).toStrictEqual([
      'solana:EtWTRABZaYq6iMfeYKouRu166VU2xqa1',
      '0x539',
    ]);
  });
});

describe('isDisableableDefaultNetwork', () => {
  it('returns true for featured EVM networks except mainnet', () => {
    expect(isDisableableDefaultNetwork('0xa')).toBe(true);
    expect(isDisableableDefaultNetwork('eip155:10')).toBe(true);
  });

  it('returns false for Ethereum mainnet', () => {
    expect(isDisableableDefaultNetwork('0x1')).toBe(false);
    expect(isDisableableDefaultNetwork('eip155:1')).toBe(false);
  });

  it('returns false for featured non-EVM mainnets', () => {
    expect(isDisableableDefaultNetwork(SolScope.Mainnet)).toBe(false);
  });

  it('returns false for custom networks', () => {
    expect(isDisableableDefaultNetwork('0xabc')).toBe(false);
  });

  it('returns false for testnets', () => {
    expect(isDisableableDefaultNetwork(CHAIN_IDS.SEPOLIA)).toBe(false);
  });
});
