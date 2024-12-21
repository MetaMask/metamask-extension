import { MockttpServer } from 'mockttp';
import { withFixtures } from '../../helpers';
import { EMPTY_E2E_TEST_PAGE_TITLE } from '../../constants';
import FixtureBuilder from '../../fixture-builder';
import { emptyHtmlPage } from '../../mock-e2e';
import HomePage from '../../page-objects/pages/home/homepage';
import { loginWithBalanceValidation } from '../../page-objects/flows/login.flow';

describe('Portfolio site', function () {
  async function mockPortfolioSite(mockServer: MockttpServer) {
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
        title: this.test?.fullTitle(),
        testSpecificMock: mockPortfolioSite,
      },
      async ({ driver }) => {
        await loginWithBalanceValidation(driver);
        await new HomePage(driver).openPortfolioPage();

        // Click Portfolio site
        await driver.switchToWindowWithTitle(EMPTY_E2E_TEST_PAGE_TITLE);

        // Verify site
        await driver.waitForUrl({
          url: 'https://portfolio.metamask.io/?metamaskEntry=ext_portfolio_button&metametricsId=null&metricsEnabled=false&marketingEnabled=false',
        });
      },
    );
  });
});
