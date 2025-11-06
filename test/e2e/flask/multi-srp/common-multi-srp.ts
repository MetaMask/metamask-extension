import { Mockttp } from 'mockttp';
import { Driver } from '../../webdriver/driver';
import FixtureBuilder from '../../fixtures/fixture-builder';
import { withFixtures } from '../../helpers';
import AccountListPage from '../../page-objects/pages/account-list-page';
import HeaderNavbar from '../../page-objects/pages/header-navbar';
import HomePage from '../../page-objects/pages/home/homepage';
import { loginWithBalanceValidation } from '../../page-objects/flows/login.flow';
import { BIP44_STAGE_TWO } from '../../tests/multichain-accounts/feature-flag-mocks';

const FEATURE_FLAGS_URL = 'https://client-config.api.cx.metamask.io/v1/flags';

export const SECOND_TEST_E2E_SRP =
  'bench top weekend buyer spoon side resist become detect gauge eye feed';

export async function withMultiSrp(
  test: (driver: Driver, mockServer: Mockttp) => Promise<void>,
  title?: string,
  srpToUse: string = SECOND_TEST_E2E_SRP,
) {
  await withFixtures(
    {
      dappOptions: { numberOfTestDapps: 1 },
      fixtures: new FixtureBuilder()
        .withEnabledNetworks({
          eip155: {
            '0x539': true,
          },
        })
        .build(),
      title,
      testSpecificMock: async (mockServer: Mockttp) => [
        await mockBIP44FeatureFlag(mockServer),
        await mockActiveNetworks(mockServer),
      ],
    },
    async ({ driver, mockServer }: { driver: Driver; mockServer: Mockttp }) => {
      await loginWithBalanceValidation(driver);
      const homePage = new HomePage(driver);
      await homePage.checkPageIsLoaded();
      const headerNavbar = new HeaderNavbar(driver);
      await headerNavbar.openAccountMenu();
      const accountListPage = new AccountListPage(driver);
      await accountListPage.checkPageIsLoaded();
      await accountListPage.startImportSecretPhrase(srpToUse);
      await homePage.checkNewSrpAddedToastIsDisplayed();
      await test(driver, mockServer);
    },
  );
}

export async function mockActiveNetworks(mockServer: Mockttp) {
  return await mockServer
    .forGet('https://accounts.api.cx.metamask.io/v2/activeNetworks')
    .thenCallback(() => {
      return {
        statusCode: 200,
        json: {
          activeNetworks: [],
        },
      };
    });
}
export async function mockBIP44FeatureFlag(mockServer: Mockttp) {
  return await mockServer
    .forGet(FEATURE_FLAGS_URL)
    .withQuery({
      client: 'extension',
      distribution: 'flask',
      environment: 'dev',
    })
    .thenCallback(() => {
      return {
        ok: true,
        statusCode: 200,
        json: [
          {
            bitcoinAccounts: { enabled: true, minimumVersion: '13.6.0' },
            ...BIP44_STAGE_TWO,
          },
        ],
      };
    });
}
