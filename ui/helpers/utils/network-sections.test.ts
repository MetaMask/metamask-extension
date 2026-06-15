import { getNetworkSections } from './network-sections';

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
      {
        chainId: 'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp',
        name: 'Solana',
      },
    ]);

    expect(sections).toHaveLength(2);
    expect(sections[0].titleKey).toBe('defaultNetworks');
    expect(sections[1].titleKey).toBe('customNetworks');
  });
});
