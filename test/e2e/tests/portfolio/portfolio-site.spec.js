const { strict: assert } = require('assert');
const {
  withFixtures,
  unlockWallet,
  defaultGanacheOptions,
} = require('../../helpers');
const FixtureBuilder = require('../../fixture-builder');
const { emptyHtmlPage } = require('../../mock-e2e');

describe('Portfolio site', function () {
  async function mockPortfolioSite(mockServer) {
    return await mockServer
      .forGet('https://portfolio.metamask.io/')
      .withQuery({
        metamaskEntry: 'ext_portfolio_button',
        metametricsId: 'null',
      })
      .thenCallback(() => {
        return {
          statusCode: 200,
          body: emptyHtmlPage(),
        };
      });
  }
});
