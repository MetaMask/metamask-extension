import { Mockttp } from 'mockttp';
import { Driver } from '../../webdriver/driver';
import FixtureBuilder from '../../fixture-builder';
import { withFixtures } from '../../helpers';
import AccountListPage from '../../page-objects/pages/account-list-page';
import HeaderNavbar from '../../page-objects/pages/header-navbar';
import HomePage from '../../page-objects/pages/home/homepage';
import { loginWithBalanceValidation } from '../../page-objects/flows/login.flow';
import { MockedEndpoint } from '../../mock-e2e';

const FEATURE_FLAGS_URL = 'https://client-config.api.cx.metamask.io/v1/flags';

export const mockMultichainAccountsFeatureFlag = (mockServer: Mockttp) =>
  mockServer
    .forGet(FEATURE_FLAGS_URL)
    .withQuery({
      client: 'extension',
      distribution: 'main',
      environment: 'dev',
    })
    .thenCallback(() => {
      return {
        ok: true,
        statusCode: 200,
        json: [
          {
            enableMultichainAccounts: {
              enabled: true,
              featureVersion: '1',
              minimumVersion: '12.19.0',
            },
          },
        ],
      };
    });

export async function withMultichainAccountsDesignEnabled(
  {
    title,
    testSpecificMock = mockMultichainAccountsFeatureFlag,
  }: {
    title?: string;
    testSpecificMock?: (mockServer: Mockttp) => Promise<MockedEndpoint>;
  },
  test: (driver: Driver) => Promise<void>,
) {
  await withFixtures(
    {
      fixtures: new FixtureBuilder().withKeyringControllerMultiSRP().build(),
      testSpecificMock,
      title,
      dapp: true,
    },
    async ({ driver }: { driver: Driver; mockServer: Mockttp }) => {
      await loginWithBalanceValidation(driver);
      const homePage = new HomePage(driver);
      await homePage.check_pageIsLoaded();
      const headerNavbar = new HeaderNavbar(driver);
      await headerNavbar.openAccountMenu();
      const accountListPage = new AccountListPage(driver);
      await accountListPage.check_pageIsLoaded();
      await test(driver);
    },
  );
}
