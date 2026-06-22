import { SolScope } from '@metamask/keyring-api';
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

  it('groups networks into multiple sections with titles', () => {
    const sections = getNetworkSections([
      { chainId: '0x1', name: 'Ethereum' },
      { chainId: '0xabc', name: 'Custom Network' },
    ]);

    expect(sections).toHaveLength(2);
    expect(sections[0].titleKey).toBe('defaultNetworks');
    expect(sections[1].titleKey).toBe('customNetworks');
  });

  it('keeps featured non-EVM mainnets in the default section', () => {
    const sections = getNetworkSections([
      {
        chainId: SolScope.Mainnet,
        name: 'Solana',
      },
    ]);

    expect(sections).toHaveLength(1);
    expect(sections[0].titleKey).toBe('defaultNetworks');
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
