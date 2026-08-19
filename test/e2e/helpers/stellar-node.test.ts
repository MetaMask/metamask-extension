import { formatXlmTokenListAmount } from '../seeder/stellar/node';
import { extractHorizonPathFromInfuraUrl } from '../seeder/stellar/proxy';

describe('formatXlmTokenListAmount', () => {
  it('strips Horizon stroop-scale zeros and groups thousands', () => {
    expect(formatXlmTokenListAmount('10000.0000000')).toBe('10,000');
  });

  it('keeps significant fractional digits', () => {
    expect(formatXlmTokenListAmount('10.5000000')).toBe('10.5');
  });

  it('throws on a non-numeric Horizon balance', () => {
    expect(() => formatXlmTokenListAmount('not-a-balance')).toThrow(
      'Invalid Horizon XLM balance: not-a-balance',
    );
  });
});

describe('extractHorizonPathFromInfuraUrl', () => {
  it('strips the Infura project prefix from an account path', () => {
    expect(
      extractHorizonPathFromInfuraUrl(
        'https://stellar-mainnet.infura.io/v3/abc123/horizon/accounts/GDEM2RN4QLPSSPGSPSKSEQ3XXFGM4X4BRH4X4EOPABHAXBVV6OQ6YE6K',
      ),
    ).toBe(
      '/accounts/GDEM2RN4QLPSSPGSPSKSEQ3XXFGM4X4BRH4X4EOPABHAXBVV6OQ6YE6K',
    );
  });

  it('preserves query parameters', () => {
    expect(
      extractHorizonPathFromInfuraUrl(
        'https://stellar-mainnet.infura.io/v3/abc123/horizon/accounts/GXXX/payments?cursor=1&limit=10',
      ),
    ).toBe('/accounts/GXXX/payments?cursor=1&limit=10');
  });

  it('maps the Horizon root to /', () => {
    expect(
      extractHorizonPathFromInfuraUrl(
        'https://stellar-mainnet.infura.io/v3/abc123/horizon',
      ),
    ).toBe('/');
  });
});
