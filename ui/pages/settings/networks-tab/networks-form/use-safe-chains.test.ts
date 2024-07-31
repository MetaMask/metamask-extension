import { rpcIdentifierUtility, SafeChain } from './use-safe-chains';

describe('rpcIdentifierUtility', () => {
  let safeChains: SafeChain[];

  beforeEach(() => {
    safeChains = [
      {
        chainId: '1',
        name: 'Ethereum Mainnet',
        nativeCurrency: { symbol: 'ETH' },
        rpc: ['https://example.com/rpc', 'https://another-example.com/rpc'],
      },
      {
        chainId: '2',
        name: 'Another Chain',
        nativeCurrency: { symbol: 'ANC' },
        rpc: ['https://known-rpc.com', 'https://rpc.example.com'],
      },
    ];
  });

  it('should return the host if the rpcUrl host is known', () => {
    const rpcUrl = 'https://example.com/rpc';
    const result = rpcIdentifierUtility(rpcUrl, safeChains);
    expect(result).toBe('example.com');
  });

  it('should return "Unknown rpcUrl" if the rpcUrl host is not in safeChains', () => {
    const rpcUrl = 'https://unknown.com/rpc';
    const result = rpcIdentifierUtility(rpcUrl, safeChains);
    expect(result).toBe('Unknown rpcUrl');
  });

  it('should sanitize rpcUrls by removing placeholders and compare by host', () => {
    const rpcUrlWithEnvVar = 'https://example.com/rpc/{API_KEY}';
    const result = rpcIdentifierUtility(rpcUrlWithEnvVar, safeChains);
    expect(result).toBe('example.com');
  });

  it('should correctly identify rpcUrls by host even with special characters', () => {
    safeChains.push({
      chainId: '3',
      name: 'Special Chain',
      nativeCurrency: { symbol: 'SPC' },
      rpc: ['https://example.com/rpc?token=1234'],
    });
    const rpcUrlWithSpecialChar = 'https://example.com/rpc';
    const result = rpcIdentifierUtility(rpcUrlWithSpecialChar, safeChains);
    expect(result).toBe('example.com');
  });

  it('should handle cases where rpcUrls contain mixed case characters', () => {
    safeChains.push({
      chainId: '4',
      name: 'Mixed Case Chain',
      nativeCurrency: { symbol: 'MCC' },
      rpc: ['https://Example.com/rpc'],
    });
    const rpcUrlMixedCase = 'https://example.com/rpc';
    const result = rpcIdentifierUtility(rpcUrlMixedCase, safeChains);
    expect(result).toBe('example.com');
  });

  it('should handle rpcUrls with trailing slashes', () => {
    const rpcUrlWithTrailingSlash = 'https://example.com/rpc/';
    const rpcUrlWithoutTrailingSlash = 'https://example.com/rpc';
    const resultWithSlash = rpcIdentifierUtility(
      rpcUrlWithTrailingSlash,
      safeChains,
    );
    const resultWithoutSlash = rpcIdentifierUtility(
      rpcUrlWithoutTrailingSlash,
      safeChains,
    );

    expect(resultWithSlash).toBe('example.com');
    expect(resultWithoutSlash).toBe('example.com');
  });

  it('should return "Unknown rpcUrl" for unknown rpcUrls with trailing slashes', () => {
    const rpcUrl = 'https://unknown.com/rpc/';
    const result = rpcIdentifierUtility(rpcUrl, safeChains);
    expect(result).toBe('Unknown rpcUrl');
  });
});
