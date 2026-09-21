import { resolveRampControllerAssetId } from './resolveRampControllerAssetId';

describe('resolveRampControllerAssetId', () => {
  const catalog = [
    {
      assetId: 'eip155:1/erc20:0x6B175474E89094C44Da98b954EedeAC495271d0F',
      chainId: 'eip155:1',
    },
    { assetId: 'eip155:1/slip44:60', chainId: 'eip155:1' },
    { assetId: 'eip155:137/slip44:966', chainId: 'eip155:137' },
  ];

  it('resolves a native placeholder assetId to the catalog spelling', () => {
    expect(resolveRampControllerAssetId('eip155:1/slip44:.', catalog)).toBe(
      'eip155:1/slip44:60',
    );
  });

  it('resolves a native placeholder on other chains', () => {
    expect(resolveRampControllerAssetId('eip155:137/slip44:.', catalog)).toBe(
      'eip155:137/slip44:966',
    );
  });

  it('resolves casing differences to the catalog spelling', () => {
    expect(
      resolveRampControllerAssetId(
        'eip155:1/erc20:0x6b175474e89094c44da98b954eedeac495271d0f',
        catalog,
      ),
    ).toBe('eip155:1/erc20:0x6B175474E89094C44Da98b954EedeAC495271d0F');
  });

  it('returns the input assetId when no catalog token matches', () => {
    expect(
      resolveRampControllerAssetId('eip155:1/erc20:0xunknown', catalog),
    ).toBe('eip155:1/erc20:0xunknown');
    expect(resolveRampControllerAssetId('eip155:999/slip44:.', catalog)).toBe(
      'eip155:999/slip44:.',
    );
  });

  it('ignores tokens without an assetId', () => {
    const catalogWithGaps = [
      { chainId: 'eip155:1' },
      { assetId: undefined, chainId: 'eip155:1' },
      ...catalog,
    ];
    expect(
      resolveRampControllerAssetId('eip155:1/slip44:.', catalogWithGaps),
    ).toBe('eip155:1/slip44:60');
  });
});
