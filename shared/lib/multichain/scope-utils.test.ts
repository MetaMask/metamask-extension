import { EthScope } from '@metamask/keyring-api';
import { anyScopesMatch, scopeMatches } from './scope-utils';

describe('scope-utils', () => {
  describe('anyScopesMatch', () => {
    it('returns false for empty account scopes', () => {
      expect(anyScopesMatch([], 'eip155:1')).toBe(false);
      // @ts-expect-error - testing undefined scope
      expect(anyScopesMatch(undefined, 'eip155:1')).toBe(false);
    });

    it('returns true for direct scope match', () => {
      const accountScopes = ['eip155:1', 'solana:mainnet'];
      expect(anyScopesMatch(accountScopes, 'eip155:1')).toBe(true);
      expect(anyScopesMatch(accountScopes, 'solana:mainnet')).toBe(true);
    });

    it('returns false for non-matching scope', () => {
      const accountScopes = ['eip155:1', 'solana:mainnet'];
      expect(anyScopesMatch(accountScopes, 'eip155:137')).toBe(false);
      expect(
        anyScopesMatch(
          accountScopes,
          'bip122:000000000019d6689c085ae165831e93',
        ),
      ).toBe(false);
    });

    describe('eip155:0 wildcard handling', () => {
      it('returns true when requesting eip155:0 and account has any EVM scope', () => {
        const accountScopes = ['eip155:1', 'eip155:137'];
        expect(anyScopesMatch(accountScopes, 'eip155:0')).toBe(true);
      });

      it('returns true when requesting eip155:0 and account has eip155:0 scope', () => {
        const accountScopes = ['eip155:0'];
        expect(anyScopesMatch(accountScopes, 'eip155:0')).toBe(true);
      });

      it('returns false when requesting eip155:0 and account has no EVM scopes', () => {
        const accountScopes = [
          'solana:mainnet',
          'bip122:000000000019d6689c085ae165831e93',
        ];
        expect(anyScopesMatch(accountScopes, 'eip155:0')).toBe(false);
      });
    });

    describe('specific EVM chain handling', () => {
      it('returns true when requesting specific EVM chain and account has eip155:0 scope', () => {
        const accountScopes = [EthScope.Eoa]; // eip155:0
        expect(anyScopesMatch(accountScopes, 'eip155:1')).toBe(true);
        expect(anyScopesMatch(accountScopes, 'eip155:137')).toBe(true);
      });

      it('returns true when requesting specific EVM chain and account has exact match', () => {
        const accountScopes = ['eip155:1'];
        expect(anyScopesMatch(accountScopes, 'eip155:1')).toBe(true);
      });

      it('returns false when requesting specific EVM chain and account has different EVM chain', () => {
        const accountScopes = ['eip155:137'];
        expect(anyScopesMatch(accountScopes, 'eip155:1')).toBe(false);
      });
    });

    describe('non-EVM scope handling', () => {
      it('returns true for exact non-EVM scope match', () => {
        const accountScopes = [
          'solana:mainnet',
          'bip122:000000000019d6689c085ae165831e93',
        ];
        expect(anyScopesMatch(accountScopes, 'solana:mainnet')).toBe(true);
        expect(
          anyScopesMatch(
            accountScopes,
            'bip122:000000000019d6689c085ae165831e93',
          ),
        ).toBe(true);
      });

      it('returns false for non-matching non-EVM scope', () => {
        const accountScopes = ['solana:mainnet'];
        expect(
          anyScopesMatch(
            accountScopes,
            'bip122:000000000019d6689c085ae165831e93',
          ),
        ).toBe(false);
      });
    });

    describe('malformed scope handling', () => {
      it('returns false for malformed target scope', () => {
        const accountScopes = ['eip155:1'];
        expect(anyScopesMatch(accountScopes, 'invalid-scope')).toBe(false);
        expect(anyScopesMatch(accountScopes, 'eip155')).toBe(false);
        expect(anyScopesMatch(accountScopes, '')).toBe(false);
      });
    });
  });

  describe('scopeMatches', () => {
    it('returns true for matching single scope', () => {
      expect(scopeMatches('eip155:1', 'eip155:1')).toBe(true);
      expect(scopeMatches('solana:mainnet', 'solana:mainnet')).toBe(true);
    });

    it('returns false for non-matching single scope', () => {
      expect(scopeMatches('eip155:1', 'eip155:137')).toBe(false);
      expect(scopeMatches('solana:mainnet', 'eip155:1')).toBe(false);
    });

    it('handles eip155:0 wildcard correctly', () => {
      expect(scopeMatches('eip155:1', 'eip155:0')).toBe(true);
      expect(scopeMatches('eip155:0', 'eip155:1')).toBe(true);
      expect(scopeMatches('solana:mainnet', 'eip155:0')).toBe(false);
    });
  });
});
