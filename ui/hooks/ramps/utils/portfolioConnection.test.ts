import {
  hasEverConnectedToPortfolio,
  PORTFOLIO_ORIGINS,
} from './portfolioConnection';

describe('hasEverConnectedToPortfolio', () => {
  const originalPortfolioUrl = process.env.PORTFOLIO_URL;

  afterEach(() => {
    if (originalPortfolioUrl === undefined) {
      delete process.env.PORTFOLIO_URL;
    } else {
      process.env.PORTFOLIO_URL = originalPortfolioUrl;
    }
  });

  it('returns false when there are no subjects or history', () => {
    delete process.env.PORTFOLIO_URL;
    expect(
      hasEverConnectedToPortfolio({
        metamask: {
          subjects: {},
          permissionHistory: {},
        },
      }),
    ).toBe(false);
  });

  it('returns true for an active Portfolio subject', () => {
    delete process.env.PORTFOLIO_URL;
    expect(
      hasEverConnectedToPortfolio({
        metamask: {
          subjects: {
            [PORTFOLIO_ORIGINS[0]]: {
              permissions: { 'endowment:caip25': {} },
            },
          },
          permissionHistory: {},
        },
      }),
    ).toBe(true);
  });

  it('returns true for legacy portfolio.metamask.io history', () => {
    delete process.env.PORTFOLIO_URL;
    expect(
      hasEverConnectedToPortfolio({
        metamask: {
          subjects: {},
          permissionHistory: {
            [PORTFOLIO_ORIGINS[1]]: {
              // Permission controller history key (snake_case RPC method).
              // eslint-disable-next-line @typescript-eslint/naming-convention
              eth_accounts: {
                accounts: { '0xabc': 1 },
                lastApproved: 1,
              },
            },
          },
        },
      }),
    ).toBe(true);
  });

  it('returns true for a configured PORTFOLIO_URL origin subject', () => {
    process.env.PORTFOLIO_URL = 'http://localhost:3000/buy';
    expect(
      hasEverConnectedToPortfolio({
        metamask: {
          subjects: {
            'http://localhost:3000': {
              permissions: { 'endowment:caip25': {} },
            },
          },
          permissionHistory: {},
        },
      }),
    ).toBe(true);
  });

  it('ignores an invalid PORTFOLIO_URL and still matches known origins', () => {
    process.env.PORTFOLIO_URL = 'not a url';
    expect(
      hasEverConnectedToPortfolio({
        metamask: {
          subjects: {
            [PORTFOLIO_ORIGINS[0]]: {
              permissions: { 'endowment:caip25': {} },
            },
          },
          permissionHistory: {},
        },
      }),
    ).toBe(true);
  });

  it('returns false when only a non-Portfolio origin is connected', () => {
    delete process.env.PORTFOLIO_URL;
    expect(
      hasEverConnectedToPortfolio({
        metamask: {
          subjects: {
            'https://example.com': {
              permissions: { 'endowment:caip25': {} },
            },
          },
          permissionHistory: {},
        },
      }),
    ).toBe(false);
  });
});
