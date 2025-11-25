import { Mockttp } from 'mockttp';
import { withFixtures } from '../../helpers';
import FixtureBuilder from '../../fixture-builder';
import { loginWithBalanceValidation } from '../../page-objects/flows/login.flow';
import ShieldPlanPage from '../../page-objects/pages/settings/shield/shield-plan-page';
import HomePage from '../../page-objects/pages/home/homepage';
import ShieldDetailPage from '../../page-objects/pages/settings/shield/shield-detail-page';
import SettingsPage from '../../page-objects/pages/settings/settings-page';
import { ShieldMockttpService } from '../../helpers/shield/mocks';

// Local fixture for this spec file
function createShieldFixture() {
  return new FixtureBuilder()
    .withNetworkControllerOnMainnet()
    .withEnabledNetworks({
      eip155: {
        '0x1': true,
      },
    })
    .withTokensController({
      allTokens: {
        '0x1': {
          '0x5cfe73b6021e818b776b421b1c4db2474086a7e1': [
            {
              address: '0x5cfe73b6021e818b776b421b1c4db2474086a7e1',
              symbol: 'WETH',
              decimals: 18,
              isERC721: false,
              aggregators: [],
            },
          ],
        },
      },
    })
    .withAppStateController({
      showShieldEntryModalOnce: null, // set the initial state to null so that the modal is shown
    });
}

describe('Shield Subscription Tests', function () {
  describe('Shield Entry Modal', function () {
    it('should subscribe to the shield plan from the entry modal - annual plan', async function () {
      await withFixtures(
        {
          fixtures: createShieldFixture().build(),
          title: this.test?.fullTitle(),
          testSpecificMock: (server: Mockttp) => {
            const shieldMockttpService = new ShieldMockttpService();
            return shieldMockttpService.setup(server);
          },
        },
        async ({ driver }) => {
          await loginWithBalanceValidation(driver);

          const homePage = new HomePage(driver);

          await homePage.checkShieldEntryModalIsDisplayed();
          await homePage.clickOnShieldEntryModalGetStarted();

          const shieldPlanPage = new ShieldPlanPage(driver);
          await shieldPlanPage.completeShieldPlanSubscriptionFlow('annual');

          const shieldDetailPage = new ShieldDetailPage(driver);
          await shieldDetailPage.validateShieldDetailPage();
        },
      );
    });

    it('should subscribe to the shield plan from the entry modal - monthly plan', async function () {
      await withFixtures(
        {
          fixtures: createShieldFixture().build(),
          title: this.test?.fullTitle(),
          testSpecificMock: (server: Mockttp) => {
            const shieldMockttpService = new ShieldMockttpService();
            return shieldMockttpService.setup(server);
          },
        },
        async ({ driver }) => {
          await loginWithBalanceValidation(driver);

          const homePage = new HomePage(driver);

          await homePage.checkShieldEntryModalIsDisplayed();
          await homePage.clickOnShieldEntryModalGetStarted();

          const shieldPlanPage = new ShieldPlanPage(driver);
          await shieldPlanPage.completeShieldPlanSubscriptionFlow('monthly');

          const shieldDetailPage = new ShieldDetailPage(driver);
          await shieldDetailPage.validateShieldDetailPage();
        },
      );
    });
  });

  describe('Shield Settings Subscription', function () {
    it('should subscribe to the shield plan from the settings > shield - annual plan', async function () {
      await withFixtures(
        {
          fixtures: createShieldFixture().build(),
          title: this.test?.fullTitle(),
          testSpecificMock: (server: Mockttp) => {
            const shieldMockttpService = new ShieldMockttpService();
            return shieldMockttpService.setup(server);
          },
        },
        async ({ driver }) => {
          await loginWithBalanceValidation(driver);

          const homePage = new HomePage(driver);
          await homePage.checkShieldEntryModalIsDisplayed();
          await homePage.clickOnShieldEntryModalGetStarted();

          const shieldPlanPage = new ShieldPlanPage(driver);
          await shieldPlanPage.checkPageIsLoaded();
          await shieldPlanPage.clickBackButton();

          const settingsPage = new SettingsPage(driver);
          await settingsPage.checkPageIsLoaded();
          await settingsPage.goToTransactionShieldPage();

          await homePage.checkShieldEntryModalIsDisplayed();
          await homePage.clickOnShieldEntryModalGetStarted();

          await shieldPlanPage.completeShieldPlanSubscriptionFlow('annual');

          const shieldDetailPage = new ShieldDetailPage(driver);
          await shieldDetailPage.validateShieldDetailPage();
        },
      );
    });

    it('should subscribe to the shield plan from the settings > shield - monthly plan', async function () {
      await withFixtures(
        {
          fixtures: createShieldFixture().build(),
          title: this.test?.fullTitle(),
          testSpecificMock: (server: Mockttp) => {
            const shieldMockttpService = new ShieldMockttpService();
            return shieldMockttpService.setup(server);
          },
        },
        async ({ driver }) => {
          await loginWithBalanceValidation(driver);

          const homePage = new HomePage(driver);
          await homePage.checkShieldEntryModalIsDisplayed();
          await homePage.clickOnShieldEntryModalGetStarted();

          const shieldPlanPage = new ShieldPlanPage(driver);
          await shieldPlanPage.checkPageIsLoaded();
          await shieldPlanPage.clickBackButton();

          const settingsPage = new SettingsPage(driver);
          await settingsPage.checkPageIsLoaded();
          await settingsPage.goToTransactionShieldPage();

          await homePage.clickOnShieldEntryModalGetStarted();
          await shieldPlanPage.completeShieldPlanSubscriptionFlow('monthly');

          const shieldDetailPage = new ShieldDetailPage(driver);
          await shieldDetailPage.validateShieldDetailPage();
        },
      );
    });
  });
});
