import { providerSupportsAsset } from './providerSupportsAsset';

describe('providerSupportsAsset', () => {
  it('returns false when asset id is missing', () => {
    expect(
      providerSupportsAsset(
        { supportedCryptoCurrencies: { 'eip155:1/slip44:60': true } },
        undefined,
      ),
    ).toBe(false);
    expect(
      providerSupportsAsset(
        { supportedCryptoCurrencies: { 'eip155:1/slip44:60': true } },
        null,
      ),
    ).toBe(false);
  });

  it('returns false when supportedCryptoCurrencies is missing', () => {
    expect(providerSupportsAsset({}, 'eip155:1/slip44:60')).toBe(false);
  });

  it('matches exact and lowercase asset ids', () => {
    const provider = {
      supportedCryptoCurrencies: {
        'eip155:1/erc20:0xabc': true,
      },
    };

    expect(providerSupportsAsset(provider, 'eip155:1/erc20:0xabc')).toBe(true);
    expect(providerSupportsAsset(provider, 'eip155:1/erc20:0xABC')).toBe(true);
    expect(providerSupportsAsset(provider, 'eip155:1/slip44:60')).toBe(false);
  });
});
