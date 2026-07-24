import {
  hasEverConnectedToPortfolio,
  PORTFOLIO_ORIGINS,
} from './portfolioConnection';

describe('hasEverConnectedToPortfolio', () => {
  it('returns false when there are no subjects or history', () => {
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
    expect(
      hasEverConnectedToPortfolio({
        metamask: {
          subjects: {},
          permissionHistory: {
            [PORTFOLIO_ORIGINS[1]]: {
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
});
