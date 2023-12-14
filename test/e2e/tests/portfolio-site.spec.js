const { strict: assert } = require('assert');
const { convertToHexValue, withFixtures, unlockWallet } = require('../helpers');
const FixtureBuilder = require('../fixture-builder');
const { emptyHtmlPage } = require('../mock-e2e');

describe('Portfolio site', function () {
  const ganacheOptions = {
    accounts: [
      {
        secretKey:
          '0x7C9529A67102755B7E6102D6D950AC5D5863C98713805CEC576B945B15B71EAC',
        balance: convertToHexValue(25000000000000000000),
      },
    ],
  };

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

  it('should link to the portfolio site @no-mmi', async function () {
    await withFixtures(
      {
        dapp: true,
        fixtures: new FixtureBuilder().build(),
        ganacheOptions,
        title: this.test.fullTitle(),
        testSpecificMock: mockPortfolioSite,
      },
      async ({ driver }) => {
        await unlockWallet(driver);

        // Click Portfolio site
        if (process.env.MULTICHAIN) {
          await driver.clickElement('[data-testid="token-balance-portfolio"]');
        } else {
          await driver.clickElement('[data-testid="eth-overview-portfolio"]');
        }
        await driver.waitUntilXWindowHandles(2);
        const windowHandles = await driver.getAllWindowHandles();
        await driver.switchToWindowWithTitle('E2E Test Page', windowHandles);

        // Verify site
        assert.equal(
          await driver.getCurrentUrl(),
          'https://portfolio.metamask.io/?metamaskEntry=ext_portfolio_button&metametricsId=null',
        );
      },
    );
  });
});
