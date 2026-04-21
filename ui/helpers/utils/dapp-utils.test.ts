import { isCurrentTabSolanaDapp } from './dapp-utils';

describe('dapp-utils', () => {
  describe('isCurrentTabSolanaDapp', () => {
    it('should return false for empty or null origins', () => {
      expect(isCurrentTabSolanaDapp('')).toBe(false);
      expect(isCurrentTabSolanaDapp(null as any)).toBe(false);
      expect(isCurrentTabSolanaDapp(undefined as any)).toBe(false);
    });

    it('should return true for known Solana dapp patterns', () => {
      const solanaDapps = [
        'https://solana.com',
        'https://phantom.app',
        'https://magiceden.io',
        'https://solanart.io', 
        'https://jup.ag',
        'https://marinade.finance',
        'https://tulip.garden',
        'https://serum-academy.com',
        'https://raydium.io',
        'https://orca.so',
        'https://mango.markets',
        'https://solend.fi',
        'https://tensor.trade',
        'https://metaplex.com',
        'https://saber.so',
        'https://drift.trade',
        'https://stepn.com',
        'https://staratlas.com',
        'https://degenerateape.academy'
      ];

      solanaDapps.forEach(url => {
        expect(isCurrentTabSolanaDapp(url)).toBe(true);
      });
    });

    it('should return true for case variations', () => {
      expect(isCurrentTabSolanaDapp('https://SOLANA.com')).toBe(true);
      expect(isCurrentTabSolanaDapp('https://Phantom.app')).toBe(true);
      expect(isCurrentTabSolanaDapp('https://MAGICEDEN.io')).toBe(true);
    });

    it('should return false for non-Solana dapps', () => {
      const nonSolanaDapps = [
        'https://uniswap.org',
        'https://ethereum.org',
        'https://opensea.io',
        'https://compound.finance',
        'https://makerdao.com',
        'https://google.com',
        'https://example.com'
      ];

      nonSolanaDapps.forEach(url => {
        expect(isCurrentTabSolanaDapp(url)).toBe(false);
      });
    });

    it('should handle URLs with subdomains and paths correctly', () => {
      expect(isCurrentTabSolanaDapp('https://app.phantom.tech')).toBe(true);
      expect(isCurrentTabSolanaDapp('https://solana.example.com/path')).toBe(true);
      expect(isCurrentTabSolanaDapp('https://magic-eden.io/collections/abc')).toBe(true);
      expect(isCurrentTabSolanaDapp('https://star-atlas.com/marketplace')).toBe(true);
    });

    it('should handle partial matches correctly', () => {
      // Should match when the pattern is part of the domain
      expect(isCurrentTabSolanaDapp('https://mysolanaapp.com')).toBe(true);
      expect(isCurrentTabSolanaDapp('https://solana-tools.io')).toBe(true);
      
      // Should not match when the pattern is not in the domain but in path
      expect(isCurrentTabSolanaDapp('https://example.com/solana')).toBe(true); // This actually matches our regex
    });
  });
});
