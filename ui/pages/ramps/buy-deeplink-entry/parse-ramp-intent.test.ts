import { parseRampIntent } from './parse-ramp-intent';

const DAI = 'eip155:1/erc20:0x6B175474E89094C44Da98b954EedeAC495271d0F';

describe('parseRampIntent', () => {
  it('returns undefined when no intent params are present', () => {
    expect(parseRampIntent({})).toBeUndefined();
    expect(parseRampIntent({ utmSource: 'promo' })).toBeUndefined();
  });

  const cases: [string, Record<string, string>, object | undefined][] = [
    [
      'builds an erc20 assetId from address and decimal chainId',
      {
        address: '0x6b175474e89094c44da98b954eedeac495271d0f',
        chainId: '1',
      },
      { assetId: DAI, chainId: 'eip155:1' },
    ],
    [
      'defaults the chain to Ethereum mainnet when only an address is given',
      { address: '0x6b175474e89094c44da98b954eedeac495271d0f' },
      { assetId: DAI, chainId: 'eip155:1' },
    ],
    [
      'builds a native assetId for the zero address',
      {
        address: '0x0000000000000000000000000000000000000000',
        chainId: '137',
      },
      { assetId: 'eip155:137/slip44:.', chainId: 'eip155:137' },
    ],
    [
      'builds a native assetId when no address is given',
      { chainId: '137' },
      { assetId: 'eip155:137/slip44:.', chainId: 'eip155:137' },
    ],
    [
      'drops address and chainId when assetId takes precedence',
      {
        assetId: 'eip155:137/erc20:0xabc',
        address: '0xdef',
        chainId: '1',
      },
      { assetId: 'eip155:137/erc20:0xabc' },
    ],
    [
      'passes amount and currency through',
      {
        assetId: 'eip155:1/slip44:.',
        amount: '100',
        currency: 'usd',
      },
      {
        assetId: 'eip155:1/slip44:.',
        amount: '100',
        currency: 'usd',
      },
    ],
    [
      'keeps only the defaulted chain when the address is invalid',
      { address: 'not-an-address' },
      { chainId: 'eip155:1' },
    ],
    [
      'keeps the chain and remaining params when the address is invalid',
      { address: 'not-an-address', chainId: '137', amount: '50' },
      { chainId: 'eip155:137', amount: '50' },
    ],
    [
      'returns undefined when the chainId is invalid and nothing else resolves',
      { chainId: 'not-a-chain' },
      undefined,
    ],
    ['drops a malformed assetId param', { assetId: 'not-an-asset' }, undefined],
    [
      'falls back to the EVM params when the assetId is malformed',
      {
        assetId: 'eip155:1/',
        address: '0x6b175474e89094c44da98b954eedeac495271d0f',
        chainId: '1',
      },
      { assetId: DAI, chainId: 'eip155:1' },
    ],
  ];
  for (const [label, params, expected] of cases) {
    it(label, () => {
      expect(parseRampIntent(params)).toStrictEqual(expected);
    });
  }
});
