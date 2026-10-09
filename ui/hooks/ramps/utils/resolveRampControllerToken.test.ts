import { resolveRampControllerToken } from './resolveRampControllerToken';

const DAI = 'eip155:1/erc20:0x6B175474E89094C44Da98b954EedeAC495271d0F';

describe('resolveRampControllerToken', () => {
  const catalog = [
    { assetId: DAI, chainId: 'eip155:1' },
    { assetId: 'eip155:1/slip44:60', chainId: 'eip155:1' },
    { assetId: 'eip155:137/slip44:966', chainId: 'eip155:137' },
  ];

  const resolveCases: [string, string, object][] = [
    [
      'resolves a native placeholder assetId to the catalog token',
      'eip155:1/slip44:.',
      { assetId: 'eip155:1/slip44:60', chainId: 'eip155:1' },
    ],
    [
      'resolves a native placeholder on other chains',
      'eip155:137/slip44:.',
      { assetId: 'eip155:137/slip44:966', chainId: 'eip155:137' },
    ],
    [
      'resolves an explicit native coin type to the catalog token',
      'eip155:1/slip44:60',
      { assetId: 'eip155:1/slip44:60', chainId: 'eip155:1' },
    ],
    [
      'resolves casing differences to the catalog token',
      'eip155:1/erc20:0x6b175474e89094c44da98b954eedeac495271d0f',
      { assetId: DAI, chainId: 'eip155:1' },
    ],
  ];
  for (const [label, assetId, expected] of resolveCases) {
    it(label, () => {
      expect(resolveRampControllerToken(assetId, catalog)).toStrictEqual(
        expected,
      );
    });
  }

  it('does not match a different native coin type on the same chain', () => {
    expect(
      resolveRampControllerToken('eip155:1/slip44:999', catalog),
    ).toBeUndefined();
  });

  it('returns undefined when no catalog token matches', () => {
    expect(
      resolveRampControllerToken('eip155:1/erc20:0xunknown', catalog),
    ).toBeUndefined();
    expect(
      resolveRampControllerToken('eip155:999/slip44:.', catalog),
    ).toBeUndefined();
  });

  it('compares non-EVM namespaces case-sensitively', () => {
    // Solana base58 asset references are case-sensitive; EVM-style blanket
    // lowercasing must not fold two distinct ids together.
    const solanaCatalog = [
      {
        assetId:
          'solana:5eykt4UsFv8P8NJdTREpY1vzUMK2fF9q/token:EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
        chainId: 'solana:5eykt4UsFv8P8NJdTREpY1vzUMK2fF9q',
      },
    ];
    expect(
      resolveRampControllerToken(
        'solana:5eykt4UsFv8P8NJdTREpY1vzUMK2fF9q/token:EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1V',
        solanaCatalog,
      ),
    ).toBeUndefined();
    expect(
      resolveRampControllerToken(
        'solana:5eykt4UsFv8P8NJdTREpY1vzUMK2fF9q/token:EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
        solanaCatalog,
      ),
    ).toBe(solanaCatalog[0]);
  });
});
