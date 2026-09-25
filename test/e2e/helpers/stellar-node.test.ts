import {
  formatXlmTokenListAmount,
  shouldAllowStellarQuickstartPull,
  specNeedsStellarQuickstartImage,
} from '../seeder/stellar/node';
import { extractHorizonPathFromInfuraUrl } from '../seeder/stellar/proxy';

describe('shouldAllowStellarQuickstartPull', () => {
  it('allows pull when STELLAR_LOCAL_DOCKER is set', () => {
    expect(
      shouldAllowStellarQuickstartPull({
        GITHUB_ACTIONS: 'true',
        STELLAR_LOCAL_DOCKER: '1',
      }),
    ).toBe(true);
  });

  it('forbids pull in GitHub Actions without STELLAR_LOCAL_DOCKER', () => {
    expect(shouldAllowStellarQuickstartPull({ GITHUB_ACTIONS: 'true' })).toBe(
      false,
    );
  });

  it('allows pull on a laptop when GitHub Actions is unset', () => {
    expect(shouldAllowStellarQuickstartPull({})).toBe(true);
  });

  it('forbids pull when STELLAR_LOCAL_DOCKER is explicitly disabled', () => {
    expect(
      shouldAllowStellarQuickstartPull({
        STELLAR_LOCAL_DOCKER: '0',
      }),
    ).toBe(false);
  });
});

describe('specNeedsStellarQuickstartImage', () => {
  it('matches Stellar Quickstart local-node specs', () => {
    expect(
      specNeedsStellarQuickstartImage(
        'test/e2e/tests/stellar/assets-local-node.spec.ts',
      ),
    ).toBe(true);
    expect(
      specNeedsStellarQuickstartImage(
        'test/e2e/tests/account/stellar/stellar-account-derivation-local-node.spec.ts',
      ),
    ).toBe(true);
  });

  it('ignores mocked Stellar specs and other local-node files', () => {
    expect(
      specNeedsStellarQuickstartImage('test/e2e/tests/stellar/assets.spec.ts'),
    ).toBe(false);
    expect(
      specNeedsStellarQuickstartImage(
        'test/e2e/tests/bitcoin/send-local-node.spec.ts',
      ),
    ).toBe(false);
  });
});

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
