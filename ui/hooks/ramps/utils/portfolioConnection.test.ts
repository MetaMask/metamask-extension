import {
  hasEverConnectedToPortfolio,
  PORTFOLIO_ORIGINS,
} from './portfolioConnection';

// A CAIP-25 permission granting one EVM account, as stored after a dapp connects.
const connectedSubject = (origin: string) => ({
  [origin]: {
    permissions: {
      'endowment:caip25': {
        caveats: [
          {
            type: 'authorizedScopes',
            value: {
              requiredScopes: {},
              optionalScopes: {
                'eip155:1': {
                  accounts: [
                    'eip155:1:0x8e5d75d60224ea0c33d0041e75de68b1c3cb6dd5',
                  ],
                },
              },
              isMultichainOrigin: false,
            },
          },
        ],
        parentCapability: 'endowment:caip25',
      },
    },
  },
});

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

  it('returns true for a Portfolio subject with permitted accounts', () => {
    delete process.env.PORTFOLIO_URL;
    expect(
      hasEverConnectedToPortfolio({
        metamask: {
          subjects: connectedSubject(PORTFOLIO_ORIGINS[0]),
          permissionHistory: {},
        },
      }),
    ).toBe(true);
  });

  it('returns false for a Portfolio subject pre-approved by a preinstalled snap', () => {
    delete process.env.PORTFOLIO_URL;
    expect(
      hasEverConnectedToPortfolio({
        metamask: {
          subjects: {
            // `initialConnections` seeds this on a fresh install: a subject
            // entry with snap access but no account permission.
            [PORTFOLIO_ORIGINS[0]]: {
              permissions: {
                // Snap permission key is snake_case by protocol.
                // eslint-disable-next-line @typescript-eslint/naming-convention
                wallet_snap: {
                  caveats: [
                    {
                      type: 'snapIds',
                      value: { 'npm:@metamask/example-snap': {} },
                    },
                  ],
                  parentCapability: 'wallet_snap',
                },
              },
            },
          },
          permissionHistory: {},
        },
      }),
    ).toBe(false);
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
          subjects: connectedSubject('http://localhost:3000'),
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
          subjects: connectedSubject(PORTFOLIO_ORIGINS[0]),
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
          subjects: connectedSubject('https://example.com'),
          permissionHistory: {},
        },
      }),
    ).toBe(false);
  });
});
