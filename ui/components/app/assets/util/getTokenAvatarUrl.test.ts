import { getTokenAvatarUrl, ZERO_ADDRESS } from './getTokenAvatarUrl';

describe('getTokenAvatarUrl', () => {
  const customIconUrl = 'https://example.com/custom-token-icon.png';

  it('returns ETH logo URL when token address is zero address', () => {
    const token = {
      address: ZERO_ADDRESS,
      symbol: 'ETH',
      iconUrl: customIconUrl,
    };

    const result = getTokenAvatarUrl(token);

    expect(result).toBe(
      'https://raw.githubusercontent.com/MetaMask/metamask-extension/main/app/images/eth_logo.svg',
    );
  });

  it('returns token iconUrl when token address is not zero address', () => {
    const token = {
      address: '0x1234567890123456789012345678901234567890',
      symbol: 'USDC',
      iconUrl: customIconUrl,
    };

    const result = getTokenAvatarUrl(token);

    expect(result).toBe(customIconUrl);
  });

  it('returns token iconUrl when token address is zero address and symbol is not ETH', () => {
    const token = {
      address: ZERO_ADDRESS,
      symbol: 'BNB',
      iconUrl: customIconUrl,
    };

    const result = getTokenAvatarUrl(token);

    expect(result).toBe(customIconUrl);
  });

  it('returns token iconUrl when token address is not zero address and symbol is ETH', () => {
    const token = {
      address: '0x1234567890123456789012345678901234567890',
      symbol: 'ETH',
      iconUrl: customIconUrl,
    };

    const result = getTokenAvatarUrl(token);

    expect(result).toBe(customIconUrl);
  });
});
