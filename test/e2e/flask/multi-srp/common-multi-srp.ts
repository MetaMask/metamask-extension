import { Mockttp } from 'mockttp';
import { Driver } from '../../webdriver/driver';
import FixtureBuilder from '../../fixtures/fixture-builder';
import { WALLET_PASSWORD, withFixtures } from '../../helpers';
import AccountListPage from '../../page-objects/pages/account-list-page';
import HeaderNavbar from '../../page-objects/pages/header-navbar';
import PrivacySettings from '../../page-objects/pages/settings/privacy-settings';
import SettingsPage from '../../page-objects/pages/settings/settings-page';
import HomePage from '../../page-objects/pages/home/homepage';
import { loginWithBalanceValidation } from '../../page-objects/flows/login.flow';
import { MockedEndpoint } from '../../mock-e2e';
import { SECOND_TEST_E2E_SRP } from './constants';

export async function withMultiSrp(
  {
    title,
    testSpecificMock,
  }: {
    title?: string;
    testSpecificMock: (mockServer: Mockttp) => Promise<MockedEndpoint>;
  },
  test: (driver: Driver) => Promise<void>,
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
        await mockActiveNetworks(mockServer),
        await testSpecificMock(mockServer),
      ],
    },
    async ({ driver }) => {
      await loginWithBalanceValidation(driver);
      const homePage = new HomePage(driver);
      await homePage.checkPageIsLoaded();
      const headerNavbar = new HeaderNavbar(driver);
      await headerNavbar.openAccountMenu();
      const accountListPage = new AccountListPage(driver);
      await accountListPage.checkPageIsLoaded();
      await accountListPage.startImportSecretPhrase(srpToUse);
      await homePage.checkNewSrpAddedToastIsDisplayed();
      await test(driver);
    },
  );
}

export const verifySrp = async (
  driver: Driver,
  srp: string,
  srpIndex: number,
) => {
  await new HeaderNavbar(driver).openSettingsPage();
  const settingsPage = new SettingsPage(driver);
  await settingsPage.checkPageIsLoaded();
  await settingsPage.goToPrivacySettings();

  const privacySettings = new PrivacySettings(driver);
  await privacySettings.openRevealSrpQuiz(srpIndex);
  await privacySettings.completeRevealSrpQuiz();
  await privacySettings.fillPasswordToRevealSrp(WALLET_PASSWORD);
  await privacySettings.checkSrpTextIsDisplayed(srp);
};

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
