import { resolveRampControllerAssetId } from './resolveRampControllerAssetId';

const DAI = 'eip155:1/erc20:0x6B175474E89094C44Da98b954EedeAC495271d0F';

describe('resolveRampControllerAssetId', () => {
  const catalog = [
    { assetId: DAI, chainId: 'eip155:1' },
    { assetId: 'eip155:1/slip44:60', chainId: 'eip155:1' },
    { assetId: 'eip155:137/slip44:966', chainId: 'eip155:137' },
  ];

  const resolveCases: [string, string, string][] = [
    [
      'resolves a native placeholder assetId to the catalog spelling',
      'eip155:1/slip44:.',
      'eip155:1/slip44:60',
    ],
    [
      'resolves a native placeholder on other chains',
      'eip155:137/slip44:.',
      'eip155:137/slip44:966',
    ],
    [
      'resolves casing differences to the catalog spelling',
      'eip155:1/erc20:0x6b175474e89094c44da98b954eedeac495271d0f',
      DAI,
    ],
  ];
  for (const [label, assetId, expected] of resolveCases) {
    it(label, () => {
      expect(resolveRampControllerAssetId(assetId, catalog)).toBe(expected);
    });
  }

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
