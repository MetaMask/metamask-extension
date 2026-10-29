import type { WildcardTokenList } from '../../../../pages/musd/types';
import { isTokenInWildcardList, checkTokenAllowed } from './token-allowlist';

describe('isTokenInWildcardList', () => {
  describe('global wildcard "*"', () => {
    it('matches any token when global list contains "*"', () => {
      const list: WildcardTokenList = { '*': ['*'] };
      expect(isTokenInWildcardList('USDC', list)).toBe(true);
      expect(isTokenInWildcardList('DAI', list)).toBe(true);
    });

    it('matches a specific symbol in the global list', () => {
      const list: WildcardTokenList = { '*': ['USDC', 'USDT'] };
      expect(isTokenInWildcardList('USDC', list)).toBe(true);
      expect(isTokenInWildcardList('USDT', list)).toBe(true);
    });

    it('rejects a symbol not in the global list', () => {
      const list: WildcardTokenList = { '*': ['USDC'] };
      expect(isTokenInWildcardList('DAI', list)).toBe(false);
    });

    it('is case-insensitive for symbols', () => {
      const list: WildcardTokenList = { '*': ['usdc'] };
      expect(isTokenInWildcardList('USDC', list)).toBe(true);
      expect(isTokenInWildcardList('Usdc', list)).toBe(true);
    });
  });

  describe('chain-specific rules', () => {
    it('matches a symbol listed for a specific chain', () => {
      const list: WildcardTokenList = { '0x1': ['USDC'] };
      expect(isTokenInWildcardList('USDC', list, '0x1')).toBe(true);
    });

    it('rejects a symbol not listed for that chain', () => {
      const list: WildcardTokenList = { '0x1': ['USDC'] };
      expect(isTokenInWildcardList('DAI', list, '0x1')).toBe(false);
    });

    it('rejects when chainId is provided but not in list', () => {
      const list: WildcardTokenList = { '0x1': ['USDC'] };
      expect(isTokenInWildcardList('USDC', list, '0xa')).toBe(false);
    });

    it('matches any token when chain list contains "*"', () => {
      const list: WildcardTokenList = { '0x1': ['*'] };
      expect(isTokenInWildcardList('ANYTHING', list, '0x1')).toBe(true);
    });

    it('is case-insensitive for chain-specific symbols', () => {
      const list: WildcardTokenList = { '0x1': ['usdt'] };
      expect(isTokenInWildcardList('USDT', list, '0x1')).toBe(true);
    });
  });

  describe('combined global + chain-specific', () => {
    it('matches via global even if chain-specific does not match', () => {
      const list: WildcardTokenList = {
        '*': ['DAI'],
        '0x1': ['USDC'],
      };
      expect(isTokenInWildcardList('DAI', list, '0x1')).toBe(true);
    });

    it('matches via chain-specific even if global does not match', () => {
      const list: WildcardTokenList = {
        '*': ['USDC'],
        '0x1': ['DAI'],
      };
      expect(isTokenInWildcardList('DAI', list, '0x1')).toBe(true);
    });
  });

  describe('edge cases', () => {
    it('returns false for empty wildcard list', () => {
      expect(isTokenInWildcardList('USDC', {})).toBe(false);
    });

    it('returns false for undefined wildcard list', () => {
      expect(isTokenInWildcardList('USDC')).toBe(false);
    });

    it('returns false when chainId is not provided and no global match', () => {
      const list: WildcardTokenList = { '0x1': ['USDC'] };
      expect(isTokenInWildcardList('USDC', list)).toBe(false);
    });
  });
});

describe('checkTokenAllowed', () => {
  describe('with empty lists', () => {
    it('allows any token when both lists are empty', () => {
      expect(checkTokenAllowed('USDC', {}, {}, '0x1')).toBe(true);
    });
  });

  describe('with allowlist only', () => {
    it('allows a token in the allowlist', () => {
      const allowlist: WildcardTokenList = { '*': ['USDC', 'USDT'] };
      expect(checkTokenAllowed('USDC', allowlist, {}, '0x1')).toBe(true);
    });

    it('rejects a token not in the allowlist', () => {
      const allowlist: WildcardTokenList = { '*': ['USDC'] };
      expect(checkTokenAllowed('DAI', allowlist, {}, '0x1')).toBe(false);
    });

    it('allows all tokens when allowlist uses wildcard', () => {
      const allowlist: WildcardTokenList = { '*': ['*'] };
      expect(checkTokenAllowed('ANYTHING', allowlist, {}, '0x1')).toBe(true);
    });
  });

  describe('with blocklist only', () => {
    it('blocks a token in the blocklist', () => {
      const blocklist: WildcardTokenList = { '*': ['USDC'] };
      expect(checkTokenAllowed('USDC', {}, blocklist, '0x1')).toBe(false);
    });

    it('allows a token not in the blocklist', () => {
      const blocklist: WildcardTokenList = { '*': ['USDC'] };
      expect(checkTokenAllowed('DAI', {}, blocklist, '0x1')).toBe(true);
    });
  });

  describe('with both allowlist and blocklist', () => {
    it('blocks a token that is in both allowlist and blocklist', () => {
      const allowlist: WildcardTokenList = { '*': ['USDC', 'USDT'] };
      const blocklist: WildcardTokenList = { '*': ['USDC'] };
      expect(checkTokenAllowed('USDC', allowlist, blocklist, '0x1')).toBe(
        false,
      );
    });

    it('allows a token in allowlist but not blocklist', () => {
      const allowlist: WildcardTokenList = { '*': ['USDC', 'USDT'] };
      const blocklist: WildcardTokenList = { '*': ['DAI'] };
      expect(checkTokenAllowed('USDC', allowlist, blocklist, '0x1')).toBe(true);
    });

    it('rejects a token not in allowlist regardless of blocklist', () => {
      const allowlist: WildcardTokenList = { '*': ['USDC'] };
      const blocklist: WildcardTokenList = {};
      expect(checkTokenAllowed('DAI', allowlist, blocklist, '0x1')).toBe(false);
    });
  });

  describe('chain-specific filtering', () => {
    it('allows when token matches chain-specific allowlist', () => {
      const allowlist: WildcardTokenList = { '0x1': ['USDC'] };
      expect(checkTokenAllowed('USDC', allowlist, {}, '0x1')).toBe(true);
    });

    it('rejects when token is not in chain-specific allowlist', () => {
      const allowlist: WildcardTokenList = { '0xa': ['USDC'] };
      expect(checkTokenAllowed('USDC', allowlist, {}, '0x1')).toBe(false);
    });

    it('blocks via chain-specific blocklist', () => {
      const blocklist: WildcardTokenList = { '0x1': ['USDC'] };
      expect(checkTokenAllowed('USDC', {}, blocklist, '0x1')).toBe(false);
    });
  });

  describe('invalid inputs', () => {
    it('returns false when chainId is missing', () => {
      expect(checkTokenAllowed('USDC', {}, {})).toBe(false);
    });

    it('returns false when chainId is empty string', () => {
      expect(checkTokenAllowed('USDC', {}, {}, '')).toBe(false);
    });

    it('returns false when tokenSymbol is empty string', () => {
      expect(checkTokenAllowed('', {}, {}, '0x1')).toBe(false);
    });
  });
});
