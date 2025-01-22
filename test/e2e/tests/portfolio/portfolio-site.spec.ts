import { MockttpServer } from 'mockttp';
import { withFixtures } from '../../helpers';
import { PORTFOLIO_PAGE_TITLE, MOCK_META_METRICS_ID } from '../../constants';
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
        fixtures: new FixtureBuilder()
          .withMetaMetricsController({
            metaMetricsId: MOCK_META_METRICS_ID,
            participateInMetaMetrics: true,
          })
          .build(),
        title: this.test?.fullTitle(),
        testSpecificMock: mockPortfolioSite,
      },
      async ({ driver }) => {
        await loginWithBalanceValidation(driver);
        await new HomePage(driver).openPortfolioPage();
        await driver.switchToWindowWithTitle(PORTFOLIO_PAGE_TITLE);

        // Verify site
        await driver.waitForUrl({
          url: `https://portfolio.metamask.io/?metamaskEntry=ext_portfolio_button&metametricsId=${MOCK_META_METRICS_ID}&metricsEnabled=true&marketingEnabled=false`,
        });
      },
    );
  });
});
