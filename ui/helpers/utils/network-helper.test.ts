import { getMatchedChain, getMatchedSymbols } from './network-helper';

describe('netwotkHelper', () => {
  describe('getMatchedChain', () => {
    it('should return the matched chain for a given decimalChainId', () => {
      const chains = [
        {
          chainId: '1',
          name: 'Ethereum Mainnet',
          nativeCurrency: { symbol: 'ETH' },
        },
        {
          chainId: '3',
          name: 'Ropsten Testnet',
          nativeCurrency: { symbol: 'ETH' },
        },
      ];
      const decimalChainId = '3';
      const expected = {
        chainId: '3',
        name: 'Ropsten Testnet',
        nativeCurrency: { symbol: 'ETH' },
      };

      const result = getMatchedChain(decimalChainId, chains);

      expect(result).toEqual(expected);
    });

    it('should return undefined if no chain matches the given decimalChainId', () => {
      const chains = [
        {
          chainId: '1',
          name: 'Ethereum Mainnet',
          nativeCurrency: { symbol: 'ETH' },
        },
        {
          chainId: '3',
          name: 'Ropsten Testnet',
          nativeCurrency: { symbol: 'ETH' },
        },
      ];
      const decimalChainId = '4'; // No matching chainId

      const result = getMatchedChain(decimalChainId, chains);

      expect(result).toBeUndefined();
    });
  });

  describe('getMatchedSymbols', () => {
    it('should return an array of symbols that match the given decimalChainId', () => {
      const chains = [
        { chainId: '1', name: 'test', nativeCurrency: { symbol: 'ETH' } },
        { chainId: '3', name: 'test', nativeCurrency: { symbol: 'tETH' } },
        { chainId: '1', name: 'test', nativeCurrency: { symbol: 'WETH' } },
      ];
      const decimalChainId = '1';
      const expected = ['ETH', 'WETH'];

      const result = getMatchedSymbols(decimalChainId, chains);

      expect(result).toEqual(expect.arrayContaining(expected));
      expect(result.length).toBe(expected.length);
    });

    it('should return an empty array if no symbols match the given decimalChainId', () => {
      const chains = [
        { chainId: '1', name: 'test', nativeCurrency: { symbol: 'ETH' } },
        { chainId: '3', name: 'test', nativeCurrency: { symbol: 'tETH' } },
      ];
      const decimalChainId = '2'; // No matching chainId

      const result = getMatchedSymbols(decimalChainId, chains);

      expect(result).toEqual([]);
    });
  });
});
