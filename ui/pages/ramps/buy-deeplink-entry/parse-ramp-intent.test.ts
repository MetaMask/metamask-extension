import { parseRampIntent } from './parse-ramp-intent';

describe('parseRampIntent', () => {
  it('returns undefined when no intent params are present', () => {
    expect(parseRampIntent({})).toBeUndefined();
    expect(parseRampIntent({ utmSource: 'promo' })).toBeUndefined();
  });

  it('prefers the assetId param and drops address and chainId', () => {
    expect(
      parseRampIntent({
        assetId: 'eip155:137/erc20:0xabc',
        address: '0xdef',
        chainId: '1',
      }),
    ).toStrictEqual({ assetId: 'eip155:137/erc20:0xabc' });
  });

  it('builds an erc20 assetId from address and decimal chainId', () => {
    expect(
      parseRampIntent({
        address: '0x6b175474e89094c44da98b954eedeac495271d0f',
        chainId: '1',
      }),
    ).toStrictEqual({
      assetId: 'eip155:1/erc20:0x6B175474E89094C44Da98b954EedeAC495271d0F',
    });
  });

  it('defaults the chain to Ethereum mainnet when only an address is given', () => {
    expect(
      parseRampIntent({
        address: '0x6b175474e89094c44da98b954eedeac495271d0f',
      }),
    ).toStrictEqual({
      assetId: 'eip155:1/erc20:0x6B175474E89094C44Da98b954EedeAC495271d0F',
    });
  });

  it('builds a native assetId for the zero address', () => {
    expect(
      parseRampIntent({
        address: '0x0000000000000000000000000000000000000000',
        chainId: '137',
      }),
    ).toStrictEqual({ assetId: 'eip155:137/slip44:.' });
  });

  it('builds a native assetId when no address is given', () => {
    expect(parseRampIntent({ chainId: '137' })).toStrictEqual({
      assetId: 'eip155:137/slip44:.',
    });
  });

  it('keeps remaining params when the address is invalid', () => {
    expect(
      parseRampIntent({
        address: 'not-an-address',
        chainId: '1',
        amount: '50',
      }),
    ).toStrictEqual({ amount: '50' });
  });

  it('passes amount and currency through', () => {
    expect(
      parseRampIntent({
        assetId: 'eip155:1/slip44:.',
        amount: '100',
        currency: 'usd',
      }),
    ).toStrictEqual({
      assetId: 'eip155:1/slip44:.',
      amount: '100',
      currency: 'usd',
    });
  });
});
