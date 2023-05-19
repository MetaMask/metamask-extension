import { formatIconUrlWithProxy } from './format-icon-url';

describe('format icon url', () => {
  describe('formatIconUrlWithProxy', () => {
    it('formats an ethereum static icon url', () => {
      const ethereumWETHIconURL = formatIconUrlWithProxy({
        chainId: '0x1',
        tokenAddress: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
      });
      expect(
        'https://static.metafi.codefi.network/api/v1/tokenIcons/1/0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2.png',
      ).toStrictEqual(ethereumWETHIconURL);
    });

    it('formats a polygon static icon url', () => {
      const polygonWMATICIconURL = formatIconUrlWithProxy({
        chainId: '0x89',
        tokenAddress: '0x0d500b1d8e8ef31e21c99d1db9a6444d3adf1270',
      });
      expect(
        'https://static.metafi.codefi.network/api/v1/tokenIcons/137/0x0d500b1d8e8ef31e21c99d1db9a6444d3adf1270.png',
      ).toStrictEqual(polygonWMATICIconURL);
    });
  });
});
